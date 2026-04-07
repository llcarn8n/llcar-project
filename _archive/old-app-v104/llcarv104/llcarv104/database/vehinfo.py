from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime
from uuid import UUID

app = FastAPI()


@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Create vehicle_data_packets table if not exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS vehicle_data_packets (
                time TIMESTAMPTZ NOT NULL,
                client_hash VARCHAR(64),
                geo_hash VARCHAR(8),
                road_type TEXT,
                season TEXT,
                acceleration_state TEXT,
                outside_temp_range TEXT,
                humidity_range TEXT,
                wind_range TEXT,
                weather_condition TEXT,
                data JSONB,
                duration_ms INTEGER,
                dtc_codes INTEGER[]
            )
        """)

        # Try to convert to hypertable (TimescaleDB)
        try:
            cur.execute("""
                SELECT create_hypertable('vehicle_data_packets', 'time', 
                                         chunk_time_interval => INTERVAL '1 day', 
                                         if_not_exists => TRUE)
            """)
        except Exception as e:
            print(f"Note: TimescaleDB extension may not be available: {e}")

        # Create indexes
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_packets_client_time 
            ON vehicle_data_packets(client_hash, time DESC)
        """)

        conn.commit()
        cur.close()
        conn.close()
        print("✓ Database initialized successfully")

    except Exception as e:
        print(f"✗ Database initialization error: {e}")
        # Don't raise - let the app start even if DB has issues
        # The endpoint will return errors for DB operations


# ============================================================================
# DATA MODELS
# ============================================================================


class UnifiedPacket(BaseModel):
    """Unified data packet for TimescaleDB (all sensors in one row)"""

    v: int = Field(..., description="Protocol version")
    h: str = Field(..., description="Client hash (VIN + mobile)")
    t0: int = Field(..., description="Window start (Unix ms)")
    t1: int = Field(..., description="Window end (Unix ms)")
    dur: int = Field(..., description="Duration ms")
    data: Dict[str, Any] = Field(..., description="All parameters as flat JSON")
    gps: Optional[Dict[str, Any]] = None
    dev: Optional[Dict[str, Any]] = None
    w: Optional[Dict[str, Any]] = None  # Weather
    gh: Optional[str] = None  # Geohash (computed on client)
    dtc: Optional[List[int]] = None
    ecu_mask: Optional[int] = Field(
        0, description="ECU bitmask (bit 0=7E8, bit 1=7E9, etc.)"
    )
    packet_srcid: Optional[int] = Field(
        None, description="Source packet ID from client local database"
    )
    packet_srctimest: Optional[int] = Field(
        None, description="Source packet timestamp from client (Unix ms)"
    )
    road_type: Optional[str] = None
    season: Optional[str] = None
    accel_state: Optional[str] = Field(None, alias="accel_state")


class ClItem(BaseModel):
    """Client registration"""

    changedt: str
    thash: str
    mobile: str
    email: str
    vin: str


class QueryRequest(BaseModel):
    """Query for similar vehicles data"""

    parameters: Dict[str, Any]  # Current parameters snapshot
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    geo_hash: Optional[str] = None
    road_type: Optional[str] = None
    season: Optional[str] = None
    acceleration_state: Optional[str] = None


class DiagnosticFeature(BaseModel):
    """Diagnostic feature/rule"""

    name: str
    description: Optional[str] = None
    category: str = Field(
        ..., pattern="^(engine|suspension|brakes|transmission|electrical|other)$"
    )
    rule_json: Dict[str, Any]
    use_ai: bool = False
    ai_prompt: Optional[str] = None


class FeatureEvaluation(BaseModel):
    """Feature evaluation result"""

    feature_id: str
    computed_value: float
    expected_min: Optional[float] = None
    expected_max: Optional[float] = None
    deviation_percent: Optional[float] = None
    status: int  # 0=normal, 1=warning, 2=critical
    confidence: float
    message: Optional[str] = None


class KnowledgeBaseItem(BaseModel):
    """Knowledge base article"""

    title: str
    content: str
    category: str  # engine, suspension, etc.
    component_id: Optional[str] = None
    tags: List[str] = []
    is_public: bool = False


# ============================================================================
# DATABASE
# ============================================================================


def get_db_connection():
    try:
        conn = psycopg2.connect(
            host="127.0.0.1",
            database="vehinfo",
            user="postgres",
            password="postgres",
            port="5432",
        )
        return conn
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")


# ============================================================================
# CLIENT REGISTRATION
# ============================================================================


@app.post("/addcl")
async def create_cl(item: ClItem):
    """Register new client"""
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO clhash (changedt, hash, mobile, email, vin, lastsms, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (item.changedt, item.thash, item.mobile, item.email, item.vin, "0000", 0),
        )
        conn.commit()
        return {"message": "Client registered", "status": "success"}
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=400, detail=f"Registration error: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# ============================================================================
# NORMALIZED DATABASE OPERATIONS (v2 schema)
# ============================================================================


def process_fastpids(
    cur,
    packet: UnifiedPacket,
    packet_time,
    packet_id: int,
    ecu_table: str,
    ecu_idx: str,
) -> dict:
    """
    Process QTP data and assign to fastpid slots (1-9)
    Returns dict: fastpid_num -> {'orig_pid': ..., 'qtp_data': [...]}
    """
    # 1. Find all QTP arrays for this ECU
    qtp_pids = []
    for key, value in packet.data.items():
        if not (key.startswith("p") and "_" in key):
            continue
        parts = key.split("_")
        if len(parts) != 2 or parts[1] != ecu_idx:
            continue
        if not (isinstance(value, list) and len(value) == 8):
            continue  # Not QTP, skip

        qtp_pids.append({"orig_pid": key, "qtp_data": value})

    if not qtp_pids:
        return {}

    # 2. Assign fastpid_num to each QTP
    assignments = {}

    for qtp_info in qtp_pids:
        orig_pid = qtp_info["orig_pid"]

        # Check existing assignment
        cur.execute(
            """
            SELECT fastpid_num, last_qtp_at 
            FROM linkfastpid_history 
            WHERE client_hash = %s AND ecu_table = %s AND orig_pid = %s 
            AND replaced_at IS NULL
        """,
            (packet.h, ecu_table, orig_pid),
        )

        result = cur.fetchone()

        if result:
            # Use existing assignment
            fastpid_num = result[0]
        else:
            # Find free slot (1-9)
            cur.execute(
                """
                SELECT generate_series(1, 9) AS slot
                EXCEPT
                SELECT fastpid_num FROM linkfastpid_history 
                WHERE client_hash = %s AND ecu_table = %s 
                AND replaced_at IS NULL
                ORDER BY slot LIMIT 1
            """,
                (packet.h, ecu_table),
            )

            free_slot = cur.fetchone()

            if free_slot:
                fastpid_num = free_slot[0]
            else:
                # All slots occupied - find oldest (by last_qtp_at)
                cur.execute(
                    """
                    SELECT fastpid_num, orig_pid 
                    FROM linkfastpid_history 
                    WHERE client_hash = %s AND ecu_table = %s 
                    AND replaced_at IS NULL
                    ORDER BY last_qtp_at ASC LIMIT 1
                """,
                    (packet.h, ecu_table),
                )

                old = cur.fetchone()
                fastpid_num = old[0]
                old_pid = old[1]

                # Mark old as replaced
                cur.execute(
                    """
                    UPDATE linkfastpid_history 
                    SET replaced_at = NOW(), replaced_by_pid = %s
                    WHERE client_hash = %s AND ecu_table = %s 
                    AND orig_pid = %s AND replaced_at IS NULL
                """,
                    (orig_pid, packet.h, ecu_table, old_pid),
                )

            # Create new assignment record
            cur.execute(
                """
                INSERT INTO linkfastpid_history 
                (client_hash, ecu_table, orig_pid, fastpid_num, assigned_at, last_qtp_at)
                VALUES (%s, %s, %s, NOW(), NOW())
            """,
                (packet.h, ecu_table, orig_pid, fastpid_num),
            )

        # Update last_qtp_at
        cur.execute(
            """
            UPDATE linkfastpid_history 
            SET last_qtp_at = NOW()
            WHERE client_hash = %s AND ecu_table = %s 
            AND orig_pid = %s AND replaced_at IS NULL
        """,
            (packet.h, ecu_table, orig_pid),
        )

        assignments[fastpid_num] = qtp_info

    return assignments


def insert_normalized_packet(cur, packet: UnifiedPacket) -> int:
    """
    Insert packet into normalized schema (11 tables)
    Returns packet_id
    """
    packet_time = datetime.fromtimestamp(packet.t0 / 1000)
    weather = packet.w or {}
    device = packet.dev or {}

    # Determine context
    road_type = infer_road_type(packet.data)
    season = infer_season(packet_time)
    accel_state = infer_acceleration_state(packet.data)

    # Use ECU mask from packet (provided by client), or calculate from data as fallback
    ecu_mask = 0
    if hasattr(packet, "ecu_mask") and packet.ecu_mask is not None:
        if isinstance(packet.ecu_mask, int):
            ecu_mask = packet.ecu_mask
        elif isinstance(packet.ecu_mask, (list, tuple)) and len(packet.ecu_mask) > 0:
            # If it's a list, take first element
            ecu_mask = int(packet.ecu_mask[0])
        else:
            try:
                ecu_mask = int(packet.ecu_mask)
            except (ValueError, TypeError):
                ecu_mask = 0

    # Fallback: calculate from data keys if mask not provided
    if ecu_mask == 0:
        ecu_map = {
            "0": 1,  # 7E8 - bit 0
            "1": 2,  # 7E9 - bit 1
            "2": 4,  # 7EA - bit 2
            "3": 8,  # 7EB - bit 3
            "4": 16,  # 7EC - bit 4
            "5": 32,  # 7ED - bit 5
            "6": 64,  # 7EE - bit 6
            "7": 128,  # 7EF - bit 7
        }

        for key in packet.data.keys():
            if key.startswith("p") and "_" in key:
                parts = key.split("_")
                if len(parts) == 2:
                    ecu_idx = parts[1]
                    if ecu_idx in ecu_map:
                        ecu_mask |= ecu_map[ecu_idx]

    # Prepare values for SQL
    weather_temp = (
        float(weather.get("temp", 0)) if weather.get("temp") is not None else None
    )
    weather_hum = int(weather.get("hum", 0)) if weather.get("hum") is not None else None
    weather_wind = (
        float(weather.get("wind", 0)) if weather.get("wind") is not None else None
    )
    weather_cond = str(weather.get("cond", "")) if weather.get("cond") else None
    device_bat = float(device.get("bat", 0)) if device.get("bat") is not None else None
    device_chg = (
        bool(device.get("chg", False)) if device.get("chg") is not None else None
    )

    # Insert main packet record
    cur.execute(
        """
        INSERT INTO qtp_packets 
        (time, client_hash, geo_hash, road_type, season, acceleration_state,
         weather_temp, weather_humidity, weather_wind, weather_condition,
         device_battery, device_charging, duration_ms, ecu_mask,
         packet_srcid, packet_srctimest)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING packet_id
        """,
        (
            packet_time,
            packet.h,
            packet.gh,
            road_type,
            season,
            accel_state,
            weather_temp,
            weather_hum,
            weather_wind,
            weather_cond,
            device_bat,
            device_chg,
            packet.dur,
            ecu_mask,
            packet.packet_srcid,
            packet.packet_srctimest,
        ),
    )

    result = cur.fetchone()
    packet_id = result[0] if result else None

    if not packet_id:
        raise Exception("Failed to get packet_id")

    # Distribute PIDs to ECU tables
    ecu_data = {}

    # Map ecu_idx to table name (defined outside loop for reuse)
    ecu_map = {
        "0": "ecu_7e8",
        "1": "ecu_7e9",
        "2": "ecu_7ea",
        "3": "ecu_7eb",
        "4": "ecu_7ec",
        "5": "ecu_7ed",
        "6": "ecu_7ee",
        "7": "ecu_7ef",
    }

    for key, value in packet.data.items():
        if key.startswith("p") and "_" in key:
            # Parse pid_ecu format: p010C_0
            parts = key.split("_")
            if len(parts) == 2:
                pid = parts[0][1:]  # Remove 'p' prefix
                ecu_idx = parts[1]

                table = ecu_map.get(ecu_idx)
                if table:
                    if table not in ecu_data:
                        ecu_data[table] = {}
                    # Normalize PID to 4 characters (service 01 + PID)
                    # "42" -> "0142", "123" -> "0123", "0C" -> "010c"
                    if len(pid) == 2:
                        normalized_pid = f"01{pid}".lower()
                    elif len(pid) == 3:
                        normalized_pid = f"0{pid}".lower()
                    else:
                        normalized_pid = pid.lower()

                    # Handle QTP data (list of 8 ints) vs regular numeric values
                    if isinstance(value, list) and len(value) == 8:
                        # This is QTP data - store avg (3rd element) in regular field
                        # Full QTP will be stored in fastpid field later
                        avg_value = int(value[2])
                        ecu_data[table][f"p{normalized_pid}"] = avg_value
                    elif isinstance(value, (int, float)):
                        ecu_data[table][f"p{normalized_pid}"] = int(value)
                    else:
                        # Skip non-numeric values (including Base64 strings)
                        print(f"Skipping non-numeric PID value: {key}={value}")

    # Process FastPID assignments for each ECU table
    # Map table name back to ecu_idx
    table_to_idx = {v: k for k, v in ecu_map.items()}
    fastpid_assignments = {}

    for table, data in ecu_data.items():
        ecu_idx = table_to_idx.get(table)
        if ecu_idx:
            assignments = process_fastpids(
                cur, packet, packet_time, packet_id, table, ecu_idx
            )
            if assignments:
                fastpid_assignments[table] = assignments

    # Insert into ECU tables with savepoint to prevent transaction abort
    for table, data in ecu_data.items():
        if not data:
            continue
        try:
            # Create savepoint for this ECU insert
            cur.execute("SAVEPOINT ecu_insert")

            columns = ["time", "packet_id", "client_hash"] + list(data.keys())
            placeholders = ["%s"] * len(columns)
            values = [packet_time, packet_id, packet.h] + list(data.values())

            # Add FastPID QTP fields if present
            if table in fastpid_assignments:
                for num, qtp_info in fastpid_assignments[table].items():
                    columns.append(f"fastpid_{num:02d}_qtp")
                    placeholders.append("%s")
                    # Convert Python list to PostgreSQL array format: [1,2,3] -> '{1,2,3}'
                    qtp_array = qtp_info["qtp_data"]
                    if isinstance(qtp_array, list):
                        pg_array = "{" + ",".join(str(x) for x in qtp_array) + "}"
                        values.append(pg_array)
                    else:
                        values.append(qtp_array)

            sql = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
            cur.execute(sql, values)

            # Release savepoint on success
            cur.execute("RELEASE SAVEPOINT ecu_insert")
        except Exception as e:
            print(f"Error inserting into {table}: {e}")
            # Rollback to savepoint to prevent transaction abort
            try:
                cur.execute("ROLLBACK TO SAVEPOINT ecu_insert")
            except:
                pass
            continue

    # Insert accelerometer windows
    if "ax" in packet.data and isinstance(packet.data["ax"], list):
        ay_list = packet.data.get("ay", [])
        az_list = packet.data.get("az", [])

        for idx, window in enumerate(packet.data["ax"]):
            try:
                # Check all three axes have valid 8-element windows
                if not (isinstance(window, (list, tuple)) and len(window) == 8):
                    continue

                ay_window = (
                    ay_list[idx]
                    if idx < len(ay_list) and isinstance(ay_list[idx], (list, tuple))
                    else None
                )
                az_window = (
                    az_list[idx]
                    if idx < len(az_list) and isinstance(az_list[idx], (list, tuple))
                    else None
                )

                if not (
                    ay_window
                    and len(ay_window) == 8
                    and az_window
                    and len(az_window) == 8
                ):
                    continue

                cur.execute(
                    """
                    INSERT INTO accel_windows 
                    (time, packet_id, client_hash, window_index,
                     ax_min, ax_max, ax_avg, ax_std, ax_shape1, ax_shape2, ax_shape3, ax_shape4,
                     ay_min, ay_max, ay_avg, ay_std, ay_shape1, ay_shape2, ay_shape3, ay_shape4,
                     az_min, az_max, az_avg, az_std, az_shape1, az_shape2, az_shape3, az_shape4)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        packet_time,
                        packet_id,
                        packet.h,
                        idx,
                        window[0],
                        window[1],
                        window[2],
                        window[3],
                        window[4],
                        window[5],
                        window[6],
                        window[7],
                        ay_window[0],
                        ay_window[1],
                        ay_window[2],
                        ay_window[3],
                        ay_window[4],
                        ay_window[5],
                        ay_window[6],
                        ay_window[7],
                        az_window[0],
                        az_window[1],
                        az_window[2],
                        az_window[3],
                        az_window[4],
                        az_window[5],
                        az_window[6],
                        az_window[7],
                    ),
                )
            except Exception as e:
                print(f"Error inserting accel window {idx}: {e}")
                continue

    # Insert audio windows
    if "s" in packet.data and isinstance(packet.data["s"], list):
        # Get quality scores from separate field if available
        quality_scores = packet.data.get("quality_audio", [])

        for idx, window in enumerate(packet.data["s"]):
            try:
                if isinstance(window, list) and len(window) >= 40:
                    # Get quality from quality_audio array or default to 50
                    quality = 50
                    if isinstance(quality_scores, list) and idx < len(quality_scores):
                        quality = int(quality_scores[idx])
                    elif len(window) > 40:
                        # Fallback: quality in window array (backward compatibility)
                        quality = int(window[40])

                    cur.execute(
                        """
                        INSERT INTO audio_windows 
                        (time, packet_id, client_hash, window_index,
                         freq_1, amp_1, freq_2, amp_2, freq_3, amp_3, freq_4, amp_4,
                         freq_5, amp_5, freq_6, amp_6, freq_7, amp_7, freq_8, amp_8,
                         freq_9, amp_9, freq_10, amp_10,
                         peak_1_offset, peak_1_amp, peak_2_offset, peak_2_amp,
                         peak_3_offset, peak_3_amp, peak_4_offset, peak_4_amp,
                         peak_5_offset, peak_5_amp, peak_6_offset, peak_6_amp,
                         peak_7_offset, peak_7_amp, peak_8_offset, peak_8_amp,
                         peak_9_offset, peak_9_amp, peak_10_offset, peak_10_amp,
                         quality)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                                %s, %s, %s, %s, %s)
                        """,
                        (
                            packet_time,
                            packet_id,
                            packet.h,
                            idx,
                            window[0],
                            window[1],
                            window[2],
                            window[3],
                            window[4],
                            window[5],
                            window[6],
                            window[7],
                            window[8],
                            window[9],
                            window[10],
                            window[11],
                            window[12],
                            window[13],
                            window[14],
                            window[15],
                            window[16],
                            window[17],
                            window[18],
                            window[19],
                            window[20],
                            window[21],
                            window[22],
                            window[23],
                            window[24],
                            window[25],
                            window[26],
                            window[27],
                            window[28],
                            window[29],
                            window[30],
                            window[31],
                            window[32],
                            window[33],
                            window[34],
                            window[35],
                            window[36],
                            window[37],
                            window[38],
                            window[39],
                            quality,
                        ),
                    )
            except Exception as e:
                print(f"Error inserting audio window {idx}: {e}")
                continue

    return packet_id


# ============================================================================
# DATA UPLOAD
# ============================================================================


@app.post("/add")
async def receive_data(packets: List[UnifiedPacket]):
    """
    Receive QTP data packets batch
    Stores in TimescaleDB with geohash and weather metadata
    Accepts list of packets for batch upload
    """
    conn = None
    cur = None
    total_inserted = 0

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        for packet in packets:
            # Insert using normalized schema (11 tables)
            packet_id = insert_normalized_packet(cur, packet)
            total_inserted += 1

        conn.commit()

        return {
            "status": "success",
            "packets_stored": total_inserted,
            "total_params": sum(len(p.data) for p in packets),
        }

    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def infer_road_type(data: Dict[str, Any]) -> Optional[str]:
    """Infer road type from speed and acceleration patterns"""
    speed_key = next((k for k in data.keys() if k.startswith("p0D_")), None)
    if speed_key:
        try:
            speed = float(data[speed_key]) / 1000  # Convert from x1000
        except (ValueError, TypeError):
            return None
        if speed < 5:
            return "standstill"
        elif speed < 30:
            return "city"
        elif speed < 60:
            return "suburban"
        elif speed < 90:
            return "highway"
        else:
            return "highway_fast"
    return None


def infer_season(dt: datetime) -> str:
    """Infer season from date"""
    month = dt.month
    if month in [12, 1, 2]:
        return "winter"
    elif month in [3, 4, 5]:
        return "spring"
    elif month in [6, 7, 8]:
        return "summer"
    else:
        return "autumn"


def infer_acceleration_state(data: Dict[str, Any]) -> str:
    """Infer acceleration state from accelerometer"""
    if "ax_avg" in data:
        try:
            ax = float(data["ax_avg"]) / 1000
            if ax > 0.5:
                return "accelerating"
            elif ax < -0.5:
                return "braking"
        except (ValueError, TypeError):
            pass
    return "cruising"


def get_humidity_range(humidity: Optional[float]) -> Optional[str]:
    if humidity is None:
        return None
    if humidity < 30:
        return "dry"
    elif humidity < 60:
        return "normal"
    else:
        return "humid"


def get_wind_range(wind: Optional[float]) -> Optional[str]:
    if wind is None:
        return None
    if wind < 5:
        return "calm"
    elif wind < 15:
        return "moderate"
    else:
        return "strong"


# ============================================================================
# QUERY SIMILAR VEHICLES
# ============================================================================


@app.post("/query")
async def query_similar_data(query: QueryRequest):
    """
    Query similar vehicles for parameter comparison
    Returns statistics from TimescaleDB
    """
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Build WHERE clause
        conditions = ["time > NOW() - INTERVAL '30 days'"]
        params = []

        if query.geo_hash:
            conditions.append("geo_hash = %s")
            params.append(query.geo_hash)
        if query.road_type:
            conditions.append("road_type = %s")
            params.append(query.road_type)
        if query.season:
            conditions.append("season = %s")
            params.append(query.season)
        if query.acceleration_state:
            conditions.append("acceleration_state = %s")
            params.append(query.acceleration_state)

        where_clause = " AND ".join(conditions)

        # For each requested parameter, calculate statistics
        results = {}

        for param_name in query.parameters.keys():
            json_path = f"data->>'{param_name}'"

            cur.execute(
                f"""
                SELECT 
                    COUNT(*) as count,
                    MIN(({json_path})::float) as min_val,
                    MAX(({json_path})::float) as max_val,
                    AVG(({json_path})::float) as avg_val,
                    STDDEV(({json_path})::float) as std_val,
                    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY ({json_path})::float) as p50,
                    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ({json_path})::float) as p95
                FROM vehicle_data_packets
                WHERE {where_clause}
                    AND {json_path} IS NOT NULL
                """,
                params,
            )

            row = cur.fetchone()
            if row and row["count"] > 0:
                results[param_name] = {
                    "count": row["count"],
                    "min": float(row["min_val"]) if row["min_val"] else None,
                    "max": float(row["max_val"]) if row["max_val"] else None,
                    "avg": float(row["avg_val"]) if row["avg_val"] else None,
                    "std": float(row["std_val"]) if row["std_val"] else None,
                    "median": float(row["p50"]) if row["p50"] else None,
                    "percentile_95": float(row["p95"]) if row["p95"] else None,
                }

        return {
            "status": "success",
            "parameters_analyzed": len(results),
            "statistics": results,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query error: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# ============================================================================
# DIAGNOSTIC FEATURES
# ============================================================================


@app.get("/features")
async def get_features(
    since: Optional[datetime] = None, include_unverified: bool = True
):
    """Get diagnostic features (community rules)"""
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        conditions = ["is_enabled = true"]
        params = []

        if not include_unverified:
            conditions.append("is_verified = true")
        if since:
            conditions.append("updated_at > %s")
            params.append(since)

        where_clause = " AND ".join(conditions)

        cur.execute(
            f"""
            SELECT id, name, description, category, rule_json,
                   is_verified, author_hash, version, created_at, updated_at
            FROM diagnostic_features
            WHERE {where_clause}
            ORDER BY updated_at DESC
            """,
            params,
        )

        features = cur.fetchall()
        return {"status": "success", "count": len(features), "features": features}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.post("/features")
async def create_feature(feature: DiagnosticFeature, author_hash: str):
    """Create new diagnostic feature"""
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            INSERT INTO diagnostic_features 
            (name, description, category, rule_json, author_hash, use_ai_analysis, ai_prompt_template)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                feature.name,
                feature.description,
                feature.category,
                json.dumps(feature.rule_json),
                author_hash,
                feature.use_ai,
                feature.ai_prompt,
            ),
        )

        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create feature")
        feature_id = result[0]
        conn.commit()

        return {
            "status": "success",
            "id": str(feature_id),
            "message": "Feature created",
        }

    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.post("/features/evaluate")
async def record_evaluation(evaluation: FeatureEvaluation, client_hash: str):
    """Record feature evaluation result"""
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            INSERT INTO feature_evaluations 
            (feature_id, client_hash, computed_value, expected_range, 
             deviation_percent, status, confidence, message)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                evaluation.feature_id,
                client_hash,
                evaluation.computed_value,
                json.dumps(
                    {"min": evaluation.expected_min, "max": evaluation.expected_max}
                ),
                evaluation.deviation_percent,
                evaluation.status,
                evaluation.confidence,
                evaluation.message,
            ),
        )

        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to record evaluation")
        eval_id = result[0]
        conn.commit()

        return {"status": "success", "id": eval_id}

    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# ============================================================================
# KNOWLEDGE BASE
# ============================================================================


@app.post("/kb/add")
async def add_kb_article(article: KnowledgeBaseItem, author_hash: str):
    """Add new knowledge base article"""
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            INSERT INTO knowledge_base 
            (title, content, category, component_id, tags, is_public, author_hash)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                article.title,
                article.content,
                article.category,
                article.component_id,
                article.tags,
                article.is_public,
                author_hash,
            ),
        )

        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to add article")
        article_id = result[0]
        conn.commit()

        return {"status": "success", "id": article_id, "message": "Article added"}

    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.put("/kb/{article_id}")
async def update_kb_article(
    article_id: UUID, article: KnowledgeBaseItem, author_hash: str
):
    """Update existing article"""
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            UPDATE knowledge_base 
            SET title = %s, content = %s, category = %s, 
                component_id = %s, tags = %s, is_public = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND (author_hash = %s OR is_public = true)
            RETURNING id
            """,
            (
                article.title,
                article.content,
                article.category,
                article.component_id,
                article.tags,
                article.is_public,
                str(article_id),
                author_hash,
            ),
        )

        if cur.rowcount == 0:
            raise HTTPException(
                status_code=403, detail="Not authorized to edit this article"
            )

        conn.commit()
        return {"status": "success", "message": "Article updated"}

    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.get("/kb")
async def get_kb_articles(
    category: Optional[str] = None,
    component_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
):
    """Get knowledge base articles"""
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        conditions = ["(is_public = true OR author_hash IS NOT NULL)"]
        params = []

        if category:
            conditions.append("category = %s")
            params.append(category)
        if component_id:
            conditions.append("component_id = %s")
            params.append(component_id)
        if search:
            conditions.append("(title ILIKE %s OR content ILIKE %s)")
            params.extend([f"%{search}%", f"%{search}%"])

        where_clause = " AND ".join(conditions)

        cur.execute(
            f"""
            SELECT id, title, content, category, component_id, tags, 
                   is_public, author_hash, created_at, updated_at
            FROM knowledge_base
            WHERE {where_clause}
            ORDER BY updated_at DESC
            LIMIT %s
            """,
            params + [limit],
        )

        articles = cur.fetchall()
        return {"status": "success", "count": len(articles), "articles": articles}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

INIT_SQL = """
-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Main hypertable for all vehicle data
CREATE TABLE IF NOT EXISTS vehicle_data_packets (
    time TIMESTAMPTZ NOT NULL,
    client_hash VARCHAR(64) NOT NULL,
    geo_hash CHAR(8),
    road_type TEXT,
    season TEXT,
    acceleration_state TEXT,
    outside_temp_range TEXT,
    humidity_range TEXT,
    wind_range TEXT,
    weather_condition TEXT,
    data JSONB NOT NULL DEFAULT '{}',
    duration_ms INTEGER DEFAULT 2000,
    dtc_codes INTEGER[] DEFAULT '{}'
);

SELECT create_hypertable('vehicle_data_packets', 'time', 
                         chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE);

CREATE INDEX idx_packets_client_time ON vehicle_data_packets(client_hash, time DESC);
CREATE INDEX idx_packets_geo ON vehicle_data_packets(geo_hash, time DESC) WHERE geo_hash IS NOT NULL;
CREATE INDEX idx_packets_context ON vehicle_data_packets(road_type, season, acceleration_state, time DESC);
CREATE INDEX idx_packets_data_gin ON vehicle_data_packets USING GIN (data);

-- Clients table
CREATE TABLE IF NOT EXISTS clhash (
    id SERIAL PRIMARY KEY,
    changedt TIMESTAMP NOT NULL,
    hash VARCHAR(64) NOT NULL,
    mobile VARCHAR(16),
    email VARCHAR(32),
    vin VARCHAR(18),
    lastsms VARCHAR(4),
    status INTEGER
);
CREATE INDEX idx_clhash_hash ON clhash(hash);

-- Diagnostic features
CREATE TABLE IF NOT EXISTS diagnostic_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('engine', 'suspension', 'brakes', 'transmission', 'electrical', 'other')),
    rule_json JSONB NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    author_hash TEXT,
    use_ai_analysis BOOLEAN DEFAULT false,
    ai_prompt_template TEXT,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_features_category ON diagnostic_features(category);
CREATE INDEX idx_features_verified ON diagnostic_features(is_verified);

-- Feature evaluations
CREATE TABLE IF NOT EXISTS feature_evaluations (
    id BIGSERIAL PRIMARY KEY,
    feature_id UUID REFERENCES diagnostic_features(id),
    client_hash TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    computed_value DOUBLE PRECISION,
    expected_range JSONB,
    deviation_percent DOUBLE PRECISION,
    status INTEGER,
    confidence DOUBLE PRECISION,
    message TEXT
);
CREATE INDEX idx_eval_feature ON feature_evaluations(feature_id, timestamp DESC);
CREATE INDEX idx_eval_client ON feature_evaluations(client_hash, timestamp DESC);

-- Knowledge base
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    component_id TEXT,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    author_hash TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_kb_category ON knowledge_base(category);
CREATE INDEX idx_kb_component ON knowledge_base(component_id);
CREATE INDEX idx_kb_public ON knowledge_base(is_public, updated_at DESC);

-- Compression
SELECT add_compression_policy('vehicle_data_packets', INTERVAL '7 days', if_not_exists => TRUE);
"""
