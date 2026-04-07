using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using llcar.Models;
using llcar.Models.QtpCompression;
using Core.Logger;

#if ANDROID
using Android.Util;
#endif

namespace llcar.Services
{
    /// <summary>
    /// Repository for storing QTP packets in normalized SQLite schema
    /// 11 tables: 1 main + 8 ECU + 2 sensor tables
    /// </summary>
    public class NormalizedVehicleDataRepository
    {
        private readonly string _connectionString;
        private readonly string _dbPath;
        private readonly ServiceLogger _logger = new ServiceLogger("NormalizedVehicleDataRepository");
        


        public NormalizedVehicleDataRepository(string dbPath)
        {
            _dbPath = dbPath;
            _connectionString = $"Data Source={dbPath};Foreign Keys=True;";
            InitializeDatabase();
        }

        private void InitializeDatabase()
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            // Read schema from embedded resource
            var assembly = typeof(NormalizedVehicleDataRepository).Assembly;
            var resourceName = assembly.GetManifestResourceNames()
                .FirstOrDefault(n => n.EndsWith("sqlite_schema_v2.sql"));
            
            if (resourceName == null)
            {
                throw new FileNotFoundException("SQLite schema resource not found");
            }

            using var stream = assembly.GetManifestResourceStream(resourceName);
            using var reader = new StreamReader(stream);
            var schemaSql = reader.ReadToEnd();
            
            using var command = new SqliteCommand(schemaSql, connection);
            command.ExecuteNonQuery();
            
            _logger.Debug("[DB] SQLite schema initialized successfully");
        }

        /// <summary>
        /// Stores complete QTP packet across all tables in a transaction
        /// </summary>
        public async Task<long> StorePacketAsync(QtpPacket packet)
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            using var transaction = connection.BeginTransaction();
            try
            {
                // Count data types before saving
                int pidCount = packet.Data.Keys.Count(k => k.StartsWith("p") && k.Contains("_"));
                bool hasAx = packet.Data.ContainsKey("ax");
                bool hasS = packet.Data.ContainsKey("s");
                
                _logger.Debug($"[DB] Storing packet with {pidCount} PIDs, ax={hasAx}, s={hasS}");
                
                // Calculate ECU mask from packet data
                int ecuMask = CalculateEcuMask(packet);
                
                // 1. Insert main packet record
                var packetId = await InsertMainPacketAsync(connection, transaction, packet, ecuMask);

                // 2. Insert ECU data
                await InsertEcuDataAsync(connection, transaction, packetId, packet);

                // 3. Insert accelerometer windows
                await InsertAccelWindowsAsync(connection, transaction, packetId, packet);

                // 4. Insert audio windows
                await InsertAudioWindowsAsync(connection, transaction, packetId, packet);

                transaction.Commit();
                _logger.Debug($"[DB] Packet {packetId} saved successfully");
                return packetId;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        /// <summary>
        /// Calculates bitmask of active ECUs from packet data
        /// Bit 0 = 7E8, Bit 1 = 7E9, etc.
        /// </summary>
        private int CalculateEcuMask(QtpPacket packet)
        {
            int mask = 0;
            var ecuMap = new Dictionary<string, int>
            {
                ["0"] = 1,    // 7E8 - bit 0
                ["1"] = 2,    // 7E9 - bit 1
                ["2"] = 4,    // 7EA - bit 2
                ["3"] = 8,    // 7EB - bit 3
                ["4"] = 16,   // 7EC - bit 4
                ["5"] = 32,   // 7ED - bit 5
                ["6"] = 64,   // 7EE - bit 6
                ["7"] = 128,  // 7EF - bit 7
            };

            foreach (var key in packet.Data.Keys)
            {
                if (key.StartsWith("p") && key.Contains("_"))
                {
                    var parts = key.Split('_');
                    if (parts.Length == 2 && ecuMap.TryGetValue(parts[1], out int bit))
                    {
                        mask |= bit;
                    }
                }
            }

            return mask;
        }

    private async Task<long> InsertMainPacketAsync(SqliteConnection conn, SqliteTransaction trans, QtpPacket packet, int ecuMask)
    {
        var sql = @"
            INSERT INTO qtp_packets 
            (time, client_hash, geo_hash, road_type, season, acceleration_state,
             weather_temp, weather_humidity, weather_wind, weather_condition,
             device_battery, device_charging, duration_ms, ecu_mask, upload_status, retry_count, created_at)
             VALUES 
             (@time, @client_hash, @geo_hash, @road_type, @season, @acceleration_state,
              @weather_temp, @weather_humidity, @weather_wind, @weather_condition,
              @device_battery, @device_charging, @duration_ms, @ecu_mask, 'queued', 0, @created_at);
            SELECT last_insert_rowid();";

        using var cmd = new SqliteCommand(sql, conn, trans);
        cmd.Parameters.AddWithValue("@time", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
        cmd.Parameters.AddWithValue("@client_hash", packet.ClientHash ?? "");
        cmd.Parameters.AddWithValue("@geo_hash", packet.GeoHash ?? "");
        cmd.Parameters.AddWithValue("@road_type", packet.RoadType ?? "");
        cmd.Parameters.AddWithValue("@season", packet.Season ?? "");
        cmd.Parameters.AddWithValue("@acceleration_state", packet.AccelerationState ?? "");
        cmd.Parameters.AddWithValue("@weather_temp", packet.Weather?.Temperature ?? 0);
        cmd.Parameters.AddWithValue("@weather_humidity", packet.Weather?.Humidity ?? 0);
        cmd.Parameters.AddWithValue("@weather_wind", packet.Weather?.WindSpeed ?? 0);
        cmd.Parameters.AddWithValue("@weather_condition", packet.Weather?.Condition ?? "");
        cmd.Parameters.AddWithValue("@device_battery", packet.Device?.BatteryLevel ?? 0);
        cmd.Parameters.AddWithValue("@device_charging", packet.Device?.IsCharging ?? false);
        cmd.Parameters.AddWithValue("@duration_ms", packet.DurationMs);
        cmd.Parameters.AddWithValue("@ecu_mask", ecuMask);
        cmd.Parameters.AddWithValue("@created_at", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());

        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt64(result);
    }

        private async Task InsertEcuDataAsync(SqliteConnection conn, SqliteTransaction trans, long packetId, QtpPacket packet)
        {
            // Group PIDs by ECU
            var ecuData = new Dictionary<string, Dictionary<string, object>>();
            
            // Log all keys in packet
            var allKeys = string.Join(", ", packet.Data.Keys);
            _logger.Debug($"[DB] Packet {packetId} has {packet.Data.Count} keys: {allKeys}");
            
            // LOG: Check for critical PIDs in DB storage
            bool has0C_0 = packet.Data.ContainsKey("p0C_0");
            bool has0D_0 = packet.Data.ContainsKey("p0D_0");
            if (!has0C_0 || !has0D_0)
            {
                _logger.Debug($"[PID_TRACK] DB STORAGE WARNING - Missing critical PIDs: 0C_0={has0C_0}, 0D_0={has0D_0}");
            }
            
            int skippedCount = 0;
            int processedCount = 0;

            foreach (var kvp in packet.Data)
            {
                // Skip sensor data (audio/accel)
                if (kvp.Key == "s" || kvp.Key == "ax" || kvp.Key == "ay" || kvp.Key == "az")
                {
                    skippedCount++;
                    continue;
                }

                if (kvp.Key.StartsWith("p") && kvp.Key.Contains("_"))
                {
                    var parts = kvp.Key.Split('_');
                    if (parts.Length == 2)
                    {
                        processedCount++;
                        _logger.Debug($"[DB] Processing PID: {kvp.Key} = {kvp.Value}");
                        var pid = parts[0]; // e.g., "p010C"
                        var ecuIdx = parts[1]; // e.g., "0"

                        // Map ecu index to table name
                        var ecuMap = new Dictionary<string, string>
                        {
                            ["0"] = "ecu_7e8", ["1"] = "ecu_7e9", ["2"] = "ecu_7ea", ["3"] = "ecu_7eb",
                            ["4"] = "ecu_7ec", ["5"] = "ecu_7ed", ["6"] = "ecu_7ee", ["7"] = "ecu_7ef"
                        };

                        if (ecuMap.TryGetValue(ecuIdx, out var tableName))
                        {
                            if (!ecuData.ContainsKey(tableName))
                                ecuData[tableName] = new Dictionary<string, object>();

                            // Convert pid name to column name (lowercase with leading zero)
                            // pid format: "p0C" -> "p010c", "p10" -> "p0110"
                            var pidPart = pid.Substring(1); // Remove 'p' prefix
                            var normalizedPid = pidPart.Length == 2 ? $"01{pidPart}" : $"0{pidPart}";
                            var columnName = $"p{normalizedPid}" .ToLower(); // "p010c"
                            
                            // Handle QTP array data - store average value (index 2)
                            if (kvp.Value is object[] qtpArray && qtpArray.Length > 2)
                            {
                                ecuData[tableName][columnName] = Convert.ToInt32(qtpArray[2]);
                            }
                            else if (kvp.Value is List<object> qtpList && qtpList.Count > 2)
                            {
                                ecuData[tableName][columnName] = Convert.ToInt32(qtpList[2]);
                            }
                            else
                            {
                                // Fallback to direct value
                                ecuData[tableName][columnName] = kvp.Value ?? 0;
                            }
                        }
                    }
                    else
                    {
                        _logger.Debug($"[DB] SKIPPED (wrong format): {kvp.Key}");
                        skippedCount++;
                    }
                }
                else
                {
                    _logger.Debug($"[DB] SKIPPED (no underscore): {kvp.Key}");
                    skippedCount++;
                }
            }
            
            _logger.Debug($"[DB] Summary: {processedCount} processed, {skippedCount} skipped, {ecuData.Count} ECU tables");

            // Insert into each ECU table
            foreach (var (tableName, data) in ecuData)
            {
                if (data.Count == 0) continue;

                try
                {
                    var columns = new List<string> { "packet_id" };
                    var placeholders = new List<string> { "@packet_id" };
                    var parameters = new List<SqliteParameter>
                    {
                        new SqliteParameter("@packet_id", packetId)
                    };

                    foreach (var (col, val) in data)
                    {
                        columns.Add(col);
                        placeholders.Add($"@{col}");
                        parameters.Add(new SqliteParameter($"@{col}", val));
                    }

                    var sql = $"INSERT INTO {tableName} ({string.Join(", ", columns)}) VALUES ({string.Join(", ", placeholders)})";
                    using var cmd = new SqliteCommand(sql, conn, trans);
                    cmd.Parameters.AddRange(parameters.ToArray());
                    await cmd.ExecuteNonQueryAsync();
                }
                catch (Exception ex)
                {
                    _logger.Debug($"[DB] Error inserting into {tableName}: {ex.Message}");
                    // Continue with other ECUs, don't fail the whole transaction
                }
            }
        }

        private async Task InsertAccelWindowsAsync(SqliteConnection conn, SqliteTransaction trans, long packetId, QtpPacket packet)
        {
            // Handle both List<int[]> and List<object>
            if (!packet.Data.TryGetValue("ax", out var axObj))
                return;

            var axList = axObj as IEnumerable;
            if (axList == null)
                return;

            var ayList = packet.Data.TryGetValue("ay", out var ayObj) ? ayObj as IEnumerable : null;
            var azList = packet.Data.TryGetValue("az", out var azObj) ? azObj as IEnumerable : null;

            int i = 0;
            foreach (var axWindowRaw in axList)
            {
                // Convert window to List<int> (handles int[], int[], List<object>)
                var axWindow = ConvertToIntList(axWindowRaw);
                var ayWindow = ayList?.Cast<object>().ElementAtOrDefault(i) is object ayRaw ? ConvertToIntList(ayRaw) : null;
                var azWindow = azList?.Cast<object>().ElementAtOrDefault(i) is object azRaw ? ConvertToIntList(azRaw) : null;

                if (axWindow?.Count >= 8)
                {
                    var sql = @"
                        INSERT INTO accel_windows 
                        (packet_id, window_index, ax_min, ax_max, ax_avg, ax_std, ax_shape1, ax_shape2, ax_shape3, ax_shape4,
                         ay_min, ay_max, ay_avg, ay_std, ay_shape1, ay_shape2, ay_shape3, ay_shape4,
                         az_min, az_max, az_avg, az_std, az_shape1, az_shape2, az_shape3, az_shape4)
                        VALUES 
                        (@packet_id, @window_index, @ax_min, @ax_max, @ax_avg, @ax_std, @ax_shape1, @ax_shape2, @ax_shape3, @ax_shape4,
                         @ay_min, @ay_max, @ay_avg, @ay_std, @ay_shape1, @ay_shape2, @ay_shape3, @ay_shape4,
                         @az_min, @az_max, @az_avg, @az_std, @az_shape1, @az_shape2, @az_shape3, @az_shape4)";

                    using var cmd = new SqliteCommand(sql, conn, trans);
                    cmd.Parameters.AddWithValue("@packet_id", packetId);
                    cmd.Parameters.AddWithValue("@window_index", i);

                    // X axis
                    for (int j = 0; j < 8; j++)
                        cmd.Parameters.AddWithValue($"@ax_{GetAxisColumnName(j)}", axWindow[j]);

                    // Y axis
                    for (int j = 0; j < 8; j++)
                        cmd.Parameters.AddWithValue($"@ay_{GetAxisColumnName(j)}", ayWindow?.Count > j ? ayWindow[j] : 0);

                    // Z axis
                    for (int j = 0; j < 8; j++)
                        cmd.Parameters.AddWithValue($"@az_{GetAxisColumnName(j)}", azWindow?.Count > j ? azWindow[j] : 0);

                    await cmd.ExecuteNonQueryAsync();
                }
                i++;
            }

            if (i > 0)
                _logger.Debug($"[DB] Inserted {i} accel windows for packet {packetId}");
        }

        private List<int> ConvertToIntList(object raw)
        {
            if (raw is int[] intArray)
                return intArray.ToList();
            if (raw is List<int> intList)
                return intList;
            if (raw is IEnumerable enumerable)
                return enumerable.Cast<object>().Select(o => Convert.ToInt32(o)).ToList();
            return null;
        }

        private string GetAxisColumnName(int index) => index switch
        {
            0 => "min", 1 => "max", 2 => "avg", 3 => "std",
            4 => "shape1", 5 => "shape2", 6 => "shape3", 7 => "shape4",
            _ => throw new ArgumentOutOfRangeException()
        };

        private async Task InsertAudioWindowsAsync(SqliteConnection conn, SqliteTransaction trans, long packetId, QtpPacket packet)
        {
            // Handle both List<int[]> and List<object>
            if (!packet.Data.TryGetValue("s", out var sObj))
                return;

            var sList = sObj as IEnumerable;
            if (sList == null)
                return;

            int i = 0;
            foreach (var windowRaw in sList)
            {
                var window = ConvertToIntList(windowRaw);
                if (window?.Count >= 40)
                {
                // Get quality score from packet data if available (for this specific window)
                int qualityScore = 50; // Default mid-quality
                if (packet.Data.TryGetValue("quality_audio", out var qObj) && qObj != null)
                {
                    try
                    {
                        var qList = qObj as System.Collections.IList;
                        if (qList != null && i < qList.Count)
                        {
                            qualityScore = Convert.ToInt32(qList[i]);
                        }
                    }
                    catch 
                    { 
                        // Ignore conversion errors, use default
                    }
                }

                var sql = @"
                    INSERT INTO audio_windows 
                    (packet_id, window_index, freq_1, amp_1, freq_2, amp_2, freq_3, amp_3, freq_4, amp_4,
                     freq_5, amp_5, freq_6, amp_6, freq_7, amp_7, freq_8, amp_8, freq_9, amp_9, freq_10, amp_10,
                     peak_1_offset, peak_1_amp, peak_2_offset, peak_2_amp, peak_3_offset, peak_3_amp, peak_4_offset, peak_4_amp,
                     peak_5_offset, peak_5_amp, peak_6_offset, peak_6_amp, peak_7_offset, peak_7_amp, peak_8_offset, peak_8_amp,
                     peak_9_offset, peak_9_amp, peak_10_offset, peak_10_amp, quality)
                    VALUES 
                    (@packet_id, @window_index, @freq_1, @amp_1, @freq_2, @amp_2, @freq_3, @amp_3, @freq_4, @amp_4,
                     @freq_5, @amp_5, @freq_6, @amp_6, @freq_7, @amp_7, @freq_8, @amp_8, @freq_9, @amp_9, @freq_10, @amp_10,
                     @peak_1_offset, @peak_1_amp, @peak_2_offset, @peak_2_amp, @peak_3_offset, @peak_3_amp, @peak_4_offset, @peak_4_amp,
                     @peak_5_offset, @peak_5_amp, @peak_6_offset, @peak_6_amp, @peak_7_offset, @peak_7_amp, @peak_8_offset, @peak_8_amp,
                     @peak_9_offset, @peak_9_amp, @peak_10_offset, @peak_10_amp, @quality)";

                using var cmd = new SqliteCommand(sql, conn, trans);
                cmd.Parameters.AddWithValue("@packet_id", packetId);
                cmd.Parameters.AddWithValue("@window_index", i);

                // Frequencies (20 values)
                for (int j = 0; j < 20; j++)
                {
                    var paramName = j % 2 == 0 ? $"@freq_{j / 2 + 1}" : $"@amp_{j / 2 + 1}";
                    cmd.Parameters.AddWithValue(paramName, Convert.ToInt32(window[j]));
                }

                // Peaks (20 values)
                for (int j = 20; j < 40; j++)
                {
                    var paramName = j % 2 == 0 ? $"@peak_{(j - 20) / 2 + 1}_offset" : $"@peak_{(j - 20) / 2 + 1}_amp";
                    cmd.Parameters.AddWithValue(paramName, Convert.ToInt32(window[j]));
                }

                // Quality score (1 value)
                cmd.Parameters.AddWithValue("@quality", qualityScore);

                await cmd.ExecuteNonQueryAsync();
                }
                i++;
            }

            if (i > 0)
                _logger.Debug($"[DB] Inserted {i} audio windows for packet {packetId}");
        }

        public async Task<List<QtpPacket>> GetPendingPacketsAsync(int limit = 100)
        {
            var packets = new List<QtpPacket>();
            
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            // Get queued main packets (waiting for first upload)
            var sql = "SELECT * FROM qtp_packets WHERE upload_status = 'queued' ORDER BY time LIMIT @limit";
            using var cmd = new SqliteCommand(sql, connection);
            cmd.Parameters.AddWithValue("@limit", limit);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var packetId = reader.GetInt32(0);
                var packet = await LoadCompletePacketAsync(connection, packetId, reader);
                packets.Add(packet);
            }

            return packets;
        }

        private async Task<QtpPacket> LoadCompletePacketAsync(SqliteConnection conn, long packetId, SqliteDataReader mainReader)
        {
            // This method reconstructs QtpPacket from all tables
            // Implementation depends on QtpPacket structure
            throw new NotImplementedException("LoadCompletePacketAsync needs to be implemented based on QtpPacket structure");
        }

        public async Task<long> GetDatabaseSizeAsync()
        {
            var fileInfo = new FileInfo(_dbPath);
            if (fileInfo.Exists)
            {
                await Task.Yield(); // Make async
                return fileInfo.Length;
            }
            return 0;
        }

        public async Task CleanupOldDataAsync(long maxSizeBytes = 10L * 1024 * 1024 * 1024) // 10 GB
        {
            var currentSize = await GetDatabaseSizeAsync();
            if (currentSize <= maxSizeBytes) return;

            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            // Calculate how much to delete (100 MB)
            var bytesToDelete = 100L * 1024 * 1024;
            
            // Get oldest packets to delete
            var sql = @"
                SELECT id FROM qtp_packets 
                ORDER BY time 
                LIMIT (SELECT COUNT(*) / 10 FROM qtp_packets)";
            
            using var cmd = new SqliteCommand(sql, connection);
            var idsToDelete = new List<int>();
            
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                idsToDelete.Add(reader.GetInt32(0));
            }

            // Delete in batches (cascade delete will handle child tables)
            foreach (var id in idsToDelete)
            {
                using var deleteCmd = new SqliteCommand("DELETE FROM qtp_packets WHERE id = @id", connection);
                deleteCmd.Parameters.AddWithValue("@id", id);
                await deleteCmd.ExecuteNonQueryAsync();
            }

            // Vacuum to reclaim space
            using var vacuumCmd = new SqliteCommand("VACUUM", connection);
            await vacuumCmd.ExecuteNonQueryAsync();
        }

        /// <summary>
        /// Stores packet with error message (for retry service)
        /// </summary>
        public async Task<long> StorePacketAsync(QtpPacket packet, string errorMessage)
        {
            // Store the packet normally - error message is not stored in the new schema
            // but we could add an error_message column if needed
            return await StorePacketAsync(packet);
        }

        /// <summary>
        /// Gets pending packets with their IDs for retry service
        /// </summary>
        public async Task<List<(long Id, QtpPacket Packet)>> GetPendingPacketsWithIdsAsync(int limit = 100)
        {
            var packets = new List<(long Id, QtpPacket Packet)>();
            
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            var sql = @"SELECT id, client_hash, geo_hash, duration_ms, time, 
                        weather_temp, weather_humidity, weather_wind, weather_condition,
                        device_battery, device_charging, road_type, season, acceleration_state, ecu_mask
                        FROM qtp_packets WHERE upload_status IN ('queued', 'failed') ORDER BY time LIMIT @limit";
            using var cmd = new SqliteCommand(sql, connection);
            cmd.Parameters.AddWithValue("@limit", limit);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var packetId = reader.GetInt64(0);
                var packet = new QtpPacket
                {
                    PacketSrcId = packetId,
                    PacketSrcTimestamp = reader.GetInt64(4),
                    ClientHash = reader.GetString(1),
                    GeoHash = reader.IsDBNull(2) ? null : reader.GetString(2),
                    DurationMs = reader.GetInt32(3),
                    WindowStart = reader.GetInt64(4),
                    Weather = reader.IsDBNull(5) ? null : new WeatherData
                    {
                        Temperature = reader.GetDouble(5),
                        Humidity = reader.GetInt32(6),
                        WindSpeed = reader.GetDouble(7),
                        Condition = reader.IsDBNull(8) ? "" : reader.GetString(8)
                    },
                    Device = reader.IsDBNull(9) ? null : new global::llcar.Models.DeviceStatus
                    {
                        BatteryLevel = reader.GetDouble(9),
                        IsCharging = !reader.IsDBNull(10) && reader.GetBoolean(10)
                    },
                    RoadType = reader.IsDBNull(11) ? null : reader.GetString(11),
                    Season = reader.IsDBNull(12) ? null : reader.GetString(12),
                    AccelerationState = reader.IsDBNull(13) ? null : reader.GetString(13),
                    EcuMask = reader.IsDBNull(14) ? 0 : reader.GetInt32(14)
                };
                packets.Add((packetId, packet));
            }

            return packets;
        }

        /// <summary>
        /// Overload for long packet ID
        /// </summary>
        public async Task MarkAsSentAsync(long packetId)
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            var sql = "UPDATE qtp_packets SET upload_status = 'sent' WHERE id = @id";
            using var cmd = new SqliteCommand(sql, connection);
            cmd.Parameters.AddWithValue("@id", packetId);
            await cmd.ExecuteNonQueryAsync();
        }

        /// <summary>
        /// Marks packet as failed for retry
        /// </summary>
        public async Task MarkAsFailedAsync(long packetId)
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            var sql = "UPDATE qtp_packets SET upload_status = 'failed' WHERE id = @id";
            using var cmd = new SqliteCommand(sql, connection);
            cmd.Parameters.AddWithValue("@id", packetId);
            await cmd.ExecuteNonQueryAsync();
        }

        /// <summary>
        /// Gets count of pending packets
        /// </summary>
        public async Task<int> GetPendingCountAsync()
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            var sql = "SELECT COUNT(*) FROM qtp_packets WHERE upload_status IN ('queued', 'failed')";
            using var cmd = new SqliteCommand(sql, connection);
            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result);
        }

        /// <summary>
        /// Cleans up old sent packets
        /// </summary>
        public async Task<int> CleanupOldPacketsAsync(int days)
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            var cutoffTime = DateTimeOffset.UtcNow.AddDays(-days).ToUnixTimeMilliseconds();
            
            var sql = "DELETE FROM qtp_packets WHERE upload_status = 'sent' AND time < @cutoff";
            using var cmd = new SqliteCommand(sql, connection);
            cmd.Parameters.AddWithValue("@cutoff", cutoffTime);
            return await cmd.ExecuteNonQueryAsync();
        }

        #region Histogram Data (Retro Tab)

        /// <summary>
        /// Get histogram data directly from normalized tables
        /// </summary>
        public async Task<List<VehicleDataPoint>> GetHistogramDataAsync(DateTime start, DateTime end, string parameterId)
        {
            var result = new List<VehicleDataPoint>();
            
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();
            
            var startUnix = new DateTimeOffset(start).ToUnixTimeMilliseconds();
            var endUnix = new DateTimeOffset(end).ToUnixTimeMilliseconds();
            
            switch (parameterId)
            {
                case "avg_x":
                case "avg_y":
                case "avg_z":
                    await GetAccelerometerDataAsync(connection, startUnix, endUnix, parameterId, result);
                    break;
                    
                case "avg_db":
                    await GetAudioDataAsync(connection, startUnix, endUnix, result);
                    break;
                    
                default:
                    // OBD2 PIDs - try to get from ecu tables
                    if (parameterId.StartsWith("p") || parameterId.Length == 2)
                    {
                        await GetObd2DataAsync(connection, startUnix, endUnix, parameterId, result);
                    }
                    break;
            }
            
            return result;
        }

        private async Task GetAccelerometerDataAsync(SqliteConnection connection, long startUnix, long endUnix, string axis, List<VehicleDataPoint> result)
        {
            var column = axis switch
            {
                "avg_x" => "ax_avg",
                "avg_y" => "ay_avg",
                "avg_z" => "az_avg",
                _ => "ax_avg"
            };
            
            var query = $@"
                SELECT qp.time, aw.{column}
                FROM qtp_packets qp
                JOIN accel_windows aw ON qp.id = aw.packet_id
                WHERE qp.time >= @Start AND qp.time <= @End AND aw.{column} IS NOT NULL
                ORDER BY qp.time, aw.window_index
            ";
            
            using var cmd = new SqliteCommand(query, connection);
            cmd.Parameters.AddWithValue("@Start", startUnix);
            cmd.Parameters.AddWithValue("@End", endUnix);
            
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var time = reader.GetInt64(0);
                var value = reader.GetInt32(1);
                
                // Decode 8-bit to m/s²
                const double minRange = -0.98;
                const double maxRange = 0.98;
                var normalized = value / 255.0;
                var decodedValue = normalized * (maxRange - minRange) + minRange;
                
                result.Add(new VehicleDataPoint
                {
                    Timestamp = DateTimeOffset.FromUnixTimeMilliseconds(time).DateTime,
                    DataType = "accel",
                    Parameter = axis,
                    Value = decodedValue,
                    Unit = "m/s²",
                    Quality = 1
                });
            }
        }

        private async Task GetAudioDataAsync(SqliteConnection connection, long startUnix, long endUnix, List<VehicleDataPoint> result)
        {
            var query = @"
                SELECT qp.time, 
                       (aw.amp_1 + aw.amp_2 + aw.amp_3 + aw.amp_4 + aw.amp_5 + 
                        aw.amp_6 + aw.amp_7 + aw.amp_8 + aw.amp_9 + aw.amp_10) / 10.0 / 100.0 as avg_db
                FROM qtp_packets qp
                JOIN audio_windows aw ON qp.id = aw.packet_id
                WHERE qp.time >= @Start AND qp.time <= @End
                ORDER BY qp.time, aw.window_index
            ";
            
            using var cmd = new SqliteCommand(query, connection);
            cmd.Parameters.AddWithValue("@Start", startUnix);
            cmd.Parameters.AddWithValue("@End", endUnix);
            
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var time = reader.GetInt64(0);
                var avgDb = reader.GetDouble(1);
                
                result.Add(new VehicleDataPoint
                {
                    Timestamp = DateTimeOffset.FromUnixTimeMilliseconds(time).DateTime,
                    DataType = "audio",
                    Parameter = "avg_db",
                    Value = avgDb,
                    Unit = "dB",
                    Quality = 1
                });
            }
        }

        private async Task GetObd2DataAsync(SqliteConnection connection, long startUnix, long endUnix, string paramId, List<VehicleDataPoint> result)
        {
            _logger.Debug($"[DB] GetObd2DataAsync called for {paramId}, time range: {startUnix} - {endUnix}");
            
            // Handle both formats: "0C" and "p0C_0"
            string pidPart;
            if (paramId.StartsWith("p") && paramId.Contains("_"))
            {
                pidPart = paramId.Substring(1).Split('_')[0];
            }
            else
            {
                pidPart = paramId;
            }
            
            // Schema uses p010c format (4 hex digits with leading zero)
            var columnName = $"p01{pidPart.ToLower()}";
            
            _logger.Debug($"[DB] Looking for column {columnName} in ECU tables");
            
            // Try all ECU tables
            for (int ecu = 0; ecu <= 7; ecu++)
            {
                var tableName = $"ecu_{0x7E8 + ecu:x}";
                
                var checkCmd = new SqliteCommand(
                    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=@TableName", 
                    connection);
                checkCmd.Parameters.AddWithValue("@TableName", tableName);
                var tableExists = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());
                
                _logger.Debug($"[DB] Checking table {tableName}: exists={tableExists}");
                
                if (tableExists == 0) continue;
                
                try
                {
                    var query = $@"
                        SELECT qp.time, ecu.{columnName}
                        FROM qtp_packets qp
                        JOIN {tableName} ecu ON qp.id = ecu.packet_id
                        WHERE qp.time >= @Start AND qp.time <= @End AND ecu.{columnName} IS NOT NULL
                        ORDER BY qp.time
                    ";
                    
                    using var cmd = new SqliteCommand(query, connection);
                    cmd.Parameters.AddWithValue("@Start", startUnix);
                    cmd.Parameters.AddWithValue("@End", endUnix);
                    
                    using var reader = await cmd.ExecuteReaderAsync();
                    int rowCount = 0;
                    while (await reader.ReadAsync())
                    {
                        var time = reader.GetInt64(0);
                        var rawValue = reader.GetInt32(1);
                        
                        // Apply formula
                        var (convertedValue, unit) = ApplyPidFormula(pidPart, rawValue);
                        
                        result.Add(new VehicleDataPoint
                        {
                            Timestamp = DateTimeOffset.FromUnixTimeMilliseconds(time).DateTime,
                            DataType = "obd2",
                            Parameter = paramId,
                            Value = convertedValue,
                            Unit = unit,
                            Quality = 1
                        });
                        rowCount++;
                    }
                    if (rowCount > 0)
                    {
                        _logger.Debug($"[DB] Added {rowCount} rows from {tableName}.{columnName}");
                    }
                }
                catch (Exception ex)
                {
                    // Column might not exist, skip
                    _logger.Debug($"[DB] Error querying {tableName}.{columnName}: {ex.Message}");
                }
            }
        }

        private (double value, string unit) ApplyPidFormula(string pid, int rawValue)
        {
            return pid.ToUpper() switch
            {
                "0C" => (rawValue / 4.0, "об/мин"),
                "0D" => (rawValue, "км/ч"),
                "05" or "0F" or "46" => (rawValue - 40, "°C"),
                "04" => (rawValue * 100.0 / 255.0, "%"),
                "11" => (rawValue * 100.0 / 255.0, "%"),
                "06" or "07" or "08" or "09" => ((rawValue - 128) * 100.0 / 128.0, "%"),
                "0B" => (rawValue, "кПа"),
                "10" => (rawValue * 0.01, "г/с"),
                _ => (rawValue, "")
            };
        }

        #endregion

        #region Retro Tab Compatibility

        /// <summary>
        /// Get historical data for Retro tab (compatibility method)
        /// Aggregates data from normalized tables into QtpPacket format
        /// </summary>
        public async Task<List<QtpPacket>> GetHistoricalDataAsync(DateTime start, DateTime end, string? clientHash = null)
        {
            var packets = new List<QtpPacket>();
            
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();
                
                var startUnix = new DateTimeOffset(start).ToUnixTimeMilliseconds();
                var endUnix = new DateTimeOffset(end).ToUnixTimeMilliseconds();
                
                // Get all packets in time range
                var query = @"
                    SELECT id, time, client_hash, ecu_mask, upload_status
                    FROM qtp_packets
                    WHERE time >= @Start AND time <= @End
                    ORDER BY time";
                
                using var cmd = new SqliteCommand(query, connection);
                cmd.Parameters.AddWithValue("@Start", startUnix);
                cmd.Parameters.AddWithValue("@End", endUnix);
                
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var packetId = reader.GetInt64(0);
                    var packetTime = reader.GetInt64(1);
                    var packetClientHash = reader.GetString(2);
                    var ecuMask = reader.GetInt32(3);
                    
                    // Create QTP packet with data from normalized tables
                    var packet = await BuildQtpPacketFromNormalizedTables(connection, packetId, packetTime, packetClientHash, ecuMask);
                    if (packet != null)
                    {
                        packets.Add(packet);
                    }
                }
                
                _logger.Debug($"[DB] Loaded {packets.Count} historical packets from {start:HH:mm:ss} to {end:HH:mm:ss}");
            }
            catch (Exception ex)
            {
                _logger.Debug($"[DB] Error loading historical data: {ex.Message}");
            }
            
            return packets;
        }
        
        private async Task<QtpPacket?> BuildQtpPacketFromNormalizedTables(SqliteConnection connection, long packetId, long packetTime, string clientHash, int ecuMask)
        {
            var packet = new QtpPacket
            {
                PacketSrcId = packetId,
                WindowStart = packetTime,
                WindowEnd = packetTime + 3000, // 3 second default window
                ClientHash = clientHash,
                Data = new Dictionary<string, object>()
            };
            
            // Load OBD2 data from ECU tables
            for (int i = 0; i < 8; i++)
            {
                var ecuAddress = 0x7E8 + i;
                var tableName = $"ecu_{ecuAddress:x}";
                
                try
                {
                    var query = $@"SELECT * FROM {tableName} WHERE packet_id = @PacketId";
                    using var cmd = new SqliteCommand(query, connection);
                    cmd.Parameters.AddWithValue("@PacketId", packetId);
                    
                    using var reader = await cmd.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        // Read all PID columns (p0100_0, p0101_0, etc.)
                        for (int j = 0; j < reader.FieldCount; j++)
                        {
                            var columnName = reader.GetName(j);
                            if (columnName.StartsWith("p") && !reader.IsDBNull(j))
                            {
                                var value = reader.GetInt32(j);
                                var pidKey = columnName.Replace("_", "_"); // Format: p0C_0
                                if (!packet.Data.ContainsKey(pidKey))
                                {
                                    packet.Data[pidKey] = value;
                                }
                            }
                        }
                    }
                }
                catch
                {
                    // Table might not exist, skip
                }
            }
            
            // Load accelerometer data
            try
            {
                var query = "SELECT ax_avg, ay_avg, az_avg FROM accel_windows WHERE packet_id = @PacketId";
                using var cmd = new SqliteCommand(query, connection);
                cmd.Parameters.AddWithValue("@PacketId", packetId);
                
                using var reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    if (!reader.IsDBNull(0)) packet.Data["avg_x"] = reader.GetDouble(0);
                    if (!reader.IsDBNull(1)) packet.Data["avg_y"] = reader.GetDouble(1);
                    if (!reader.IsDBNull(2)) packet.Data["avg_z"] = reader.GetDouble(2);
                }
            }
            catch { }
            
            // Load audio data
            try
            {
                var query = @"SELECT amp_1, amp_2, amp_3, amp_4, amp_5, amp_6, amp_7, amp_8, amp_9, amp_10 
                             FROM audio_windows WHERE packet_id = @PacketId";
                using var cmd = new SqliteCommand(query, connection);
                cmd.Parameters.AddWithValue("@PacketId", packetId);
                
                using var reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    var amplitudes = new List<int>();
                    for (int i = 0; i < 10; i++)
                    {
                        if (!reader.IsDBNull(i))
                        {
                            amplitudes.Add(reader.GetInt32(i));
                        }
                    }
                    if (amplitudes.Count > 0)
                    {
                        var avgDb = amplitudes.Average() / 100.0;
                        packet.Data["avg_db"] = avgDb;
                    }
                }
            }
            catch { }
            
            return packet.Data.Count > 0 ? packet : null;
        }

        #endregion
    }
}
