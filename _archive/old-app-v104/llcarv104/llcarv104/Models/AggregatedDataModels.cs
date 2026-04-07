using System.Text.Json.Serialization;

namespace llcar.Models;

/// <summary>
/// Aggregated statistics for a single parameter over a time window
/// Includes min/avg/max and intermediate points for curve approximation
/// </summary>
public class ParameterStatistics
{
    /// <summary>Parameter ID (PID hex or sensor name)</summary>
    [JsonPropertyName("p")]
    public string ParameterId { get; set; } = "";
    
    /// <summary>Number of samples collected</summary>
    [JsonPropertyName("n")]
    public int SampleCount { get; set; }
    
    /// <summary>Minimum value (×1000)</summary>
    [JsonPropertyName("min")]
    public int Min { get; set; }
    
    /// <summary>Average/mean value (×1000)</summary>
    [JsonPropertyName("avg")]
    public int Avg { get; set; }
    
    /// <summary>Maximum value (×1000)</summary>
    [JsonPropertyName("max")]
    public int Max { get; set; }
    
    /// <summary>Standard deviation (×1000)</summary>
    [JsonPropertyName("std")]
    public int StdDev { get; set; }
    
    /// <summary>
    /// Intermediate points for curve approximation
    /// Format: [percentile_10, percentile_20, ..., percentile_90] (×1000)
    /// Represents the distribution curve - 9 points for smooth approximation
    /// </summary>
    [JsonPropertyName("q")]
    public int[]? Quantiles { get; set; }
    
    /// <summary>
    /// Time-series samples at regular intervals (optional, for detailed reconstruction)
    /// Format: [[offset_ms, value_x1000], ...]
    /// Only included if sample count is small or value changes significantly
    /// </summary>
    [JsonPropertyName("ts")]
    public int[][]? TimeSeries { get; set; }
}

/// <summary>
/// Complete aggregated data packet for a time window
/// Sent as one large string every X seconds
/// </summary>
public class AggregatedDataPacket
{
    /// <summary>Protocol version</summary>
    [JsonPropertyName("v")]
    public int Version { get; set; } = 1;
    
    /// <summary>Client hash (VIN + mobile MD5)</summary>
    [JsonPropertyName("h")]
    public string ClientHash { get; set; } = "";
    
    /// <summary>Window start timestamp (Unix milliseconds)</summary>
    [JsonPropertyName("t0")]
    public long StartTime { get; set; }
    
    /// <summary>Window end timestamp (Unix milliseconds)</summary>
    [JsonPropertyName("t1")]
    public long EndTime { get; set; }
    
    /// <summary>Window duration in milliseconds</summary>
    [JsonPropertyName("dur")]
    public int DurationMs { get; set; }
    
    /// <summary>
    /// OBD2 parameters statistics
    /// Key: PID (e.g., "010C" for RPM), Value: statistics
    /// </summary>
    [JsonPropertyName("obd")]
    public Dictionary<string, ParameterStatistics> OBD2Stats { get; set; } = new();
    
    /// <summary>
    /// Accelerometer statistics
    /// Keys: "x", "y", "z", "mag" for each axis and magnitude
    /// </summary>
    [JsonPropertyName("acc")]
    public Dictionary<string, ParameterStatistics> AccelerometerStats { get; set; } = new();
    
    /// <summary>
    /// Audio statistics
    /// Keys: "db_avg", "db_peak", "flatness"
    /// </summary>
    [JsonPropertyName("aud")]
    public Dictionary<string, ParameterStatistics> AudioStats { get; set; } = new();
    
    /// <summary>GPS data (single point - last in window)</summary>
    [JsonPropertyName("gps")]
    public AggregatedGpsData? GPS { get; set; }
    
    /// <summary>Device status (last in window)</summary>
    [JsonPropertyName("dev")]
    public AggregatedDeviceStatus? Device { get; set; }
    
    /// <summary>
    /// Weather data at window start
    /// </summary>
    [JsonPropertyName("w")]
    public AggregatedWeatherData? Weather { get; set; }
    
    /// <summary>
    /// Context information
    /// </summary>
    [JsonPropertyName("ctx")]
    public AggregatedContext Context { get; set; } = new();
    
    /// <summary>Diagnostic Trouble Codes detected in window</summary>
    [JsonPropertyName("dtc")]
    public int[]? DtcCodes { get; set; }
}

/// <summary>
/// GPS data (single snapshot or aggregated)
/// </summary>
public class AggregatedGpsData
{
    /// <summary>Geohash (8 characters = ~19m precision)</summary>
    [JsonPropertyName("gh")]
    public string GeoHash { get; set; } = "";
    
    /// <summary>Latitude (×1,000,000)</summary>
    [JsonPropertyName("lat")]
    public int Latitude { get; set; }
    
    /// <summary>Longitude (×1,000,000)</summary>
    [JsonPropertyName("lon")]
    public int Longitude { get; set; }
    
    /// <summary>Speed km/h (×100)</summary>
    [JsonPropertyName("spd")]
    public int Speed { get; set; }
    
    /// <summary>Heading degrees (×10)</summary>
    [JsonPropertyName("hdg")]
    public int Heading { get; set; }
    
    /// <summary>Accuracy meters (×10)</summary>
    [JsonPropertyName("acc")]
    public int Accuracy { get; set; }
    
    /// <summary>Altitude meters (×10)</summary>
    [JsonPropertyName("alt")]
    public int Altitude { get; set; }
}

/// <summary>
/// Device status
/// </summary>
public class AggregatedDeviceStatus
{
    /// <summary>Battery level % (×10)</summary>
    [JsonPropertyName("bat")]
    public int Battery { get; set; }
    
    /// <summary>Is charging (0/1)</summary>
    [JsonPropertyName("chrg")]
    public int IsCharging { get; set; }
    
    /// <summary>Signal strength dBm (negative value)</summary>
    [JsonPropertyName("sig")]
    public int SignalDbm { get; set; }
}

/// <summary>
/// Weather data
/// </summary>
public class AggregatedWeatherData
{
    /// <summary>Temperature Celsius (×10)</summary>
    [JsonPropertyName("temp")]
    public int Temperature { get; set; }
    
    /// <summary>Humidity % (×10)</summary>
    [JsonPropertyName("hum")]
    public int Humidity { get; set; }
    
    /// <summary>Wind speed m/s (×10)</summary>
    [JsonPropertyName("wind")]
    public int WindSpeed { get; set; }
    
    /// <summary>Pressure hPa (×10)</summary>
    [JsonPropertyName("pres")]
    public int Pressure { get; set; }
    
    /// <summary>Weather condition code</summary>
    [JsonPropertyName("cond")]
    public string Condition { get; set; } = "";
}

/// <summary>
/// Context information for the time window
/// </summary>
public class AggregatedContext
{
    /// <summary>Season: "winter", "spring", "summer", "autumn"</summary>
    [JsonPropertyName("season")]
    public string Season { get; set; } = "";
    
    /// <summary>Time of day: "morning", "day", "evening", "night"</summary>
    [JsonPropertyName("tod")]
    public string TimeOfDay { get; set; } = "";
    
    /// <summary>Acceleration state: "accelerating", "decelerating", "cruising"</summary>
    [JsonPropertyName("accel")]
    public string AccelerationState { get; set; } = "";
    
    /// <summary>Road type: "highway", "city", "country"</summary>
    [JsonPropertyName("road")]
    public string RoadType { get; set; } = "";
}

/// <summary>
/// Buffer for collecting statistics during a time window
/// </summary>
public class StatisticsBuffer
{
    private readonly List<double> _values = new();
    private readonly List<(int OffsetMs, double Value)> _timeSeries = new();
    private readonly object _lock = new();
    
    public string ParameterId { get; }
    public int MaxTimeSeriesPoints { get; set; } = 20;
    
    public StatisticsBuffer(string parameterId)
    {
        ParameterId = parameterId;
    }
    
    public void AddValue(double value, int offsetMs)
    {
        lock (_lock)
        {
            _values.Add(value);
            
            // Keep time series for significant changes or small sample count
            if (_values.Count <= MaxTimeSeriesPoints || IsSignificantChange(value))
            {
                _timeSeries.Add((offsetMs, value));
                
                // Limit time series size
                if (_timeSeries.Count > MaxTimeSeriesPoints)
                {
                    // Keep first, last, and evenly spaced middle points
                    CompressTimeSeries();
                }
            }
        }
    }
    
    private bool IsSignificantChange(double newValue)
    {
        if (_values.Count < 2) return true;
        
        var lastValue = _values[^1];
        var change = Math.Abs(newValue - lastValue);
        var relativeChange = change / (Math.Abs(lastValue) + 0.001);
        
        // Significant if change > 5% relative or > 1 unit absolute
        return relativeChange > 0.05 || change > 1.0;
    }
    
    private void CompressTimeSeries()
    {
        // Keep representative points: first, last, and evenly distributed
        var compressed = new List<(int OffsetMs, double Value)>
        {
            _timeSeries.First(),
            _timeSeries.Last()
        };
        
        // Add middle points evenly spaced
        var step = _timeSeries.Count / (MaxTimeSeriesPoints - 2);
        for (int i = step; i < _timeSeries.Count - 1; i += step)
        {
            compressed.Insert(compressed.Count - 1, _timeSeries[i]);
        }
        
        _timeSeries.Clear();
        _timeSeries.AddRange(compressed.Take(MaxTimeSeriesPoints));
    }
    
    public ParameterStatistics CalculateStatistics()
    {
        lock (_lock)
        {
            if (_values.Count == 0)
                return new ParameterStatistics { ParameterId = ParameterId };
            
            var sorted = _values.OrderBy(v => v).ToList();
            var count = sorted.Count;
            
            // Calculate quantiles (percentiles 10-90)
            var quantiles = new int[9];
            for (int i = 0; i < 9; i++)
            {
                var percentile = (i + 1) * 10;
                var index = (int)((percentile / 100.0) * (count - 1));
                quantiles[i] = (int)(sorted[index] * 1000);
            }
            
            // Calculate standard deviation
            var mean = _values.Average();
            var variance = _values.Average(v => Math.Pow(v - mean, 2));
            var stdDev = Math.Sqrt(variance);
            
            var stats = new ParameterStatistics
            {
                ParameterId = ParameterId,
                SampleCount = count,
                Min = (int)(sorted.First() * 1000),
                Avg = (int)(mean * 1000),
                Max = (int)(sorted.Last() * 1000),
                StdDev = (int)(stdDev * 1000),
                Quantiles = quantiles,
                TimeSeries = _timeSeries.Count > 0 
                    ? _timeSeries.Select(t => new[] { t.OffsetMs, (int)(t.Value * 1000) }).ToArray()
                    : null
            };
            
            return stats;
        }
    }
    
    public void Clear()
    {
        lock (_lock)
        {
            _values.Clear();
            _timeSeries.Clear();
        }
    }
}

/// <summary>
/// Main buffer for collecting all data during a time window
/// </summary>
public class AggregatedDataBuffer
{
    private readonly Dictionary<string, StatisticsBuffer> _obdBuffers = new();
    private readonly Dictionary<string, StatisticsBuffer> _accelBuffers = new();
    private readonly Dictionary<string, StatisticsBuffer> _audioBuffers = new();
    private readonly object _lock = new();
    
    public DateTime WindowStart { get; private set; }
    public DateTime WindowEnd { get; private set; }
    public string ClientHash { get; set; } = "";
    
    private AggregatedGpsData? _lastGps;
    private AggregatedDeviceStatus? _lastDevice;
    private AggregatedWeatherData? _lastWeather;
    private AggregatedContext _context = new();
    private readonly HashSet<int> _dtcCodes = new();
    
    public void StartWindow(DateTime startTime)
    {
        WindowStart = startTime;
        ClearBuffers();
    }
    
    public void EndWindow(DateTime endTime)
    {
        WindowEnd = endTime;
    }
    
    public void AddOBD2Value(string pid, double value, int offsetMs)
    {
        lock (_lock)
        {
            if (!_obdBuffers.TryGetValue(pid, out var buffer))
            {
                buffer = new StatisticsBuffer(pid);
                _obdBuffers[pid] = buffer;
            }
            buffer.AddValue(value, offsetMs);
        }
    }
    
    public void AddAccelerometerValue(string axis, double value, int offsetMs)
    {
        lock (_lock)
        {
            if (!_accelBuffers.TryGetValue(axis, out var buffer))
            {
                buffer = new StatisticsBuffer(axis);
                _accelBuffers[axis] = buffer;
            }
            buffer.AddValue(value, offsetMs);
        }
    }
    
    public void AddAudioValue(string metric, double value, int offsetMs)
    {
        lock (_lock)
        {
            if (!_audioBuffers.TryGetValue(metric, out var buffer))
            {
                buffer = new StatisticsBuffer(metric);
                _audioBuffers[metric] = buffer;
            }
            buffer.AddValue(value, offsetMs);
        }
    }
    
    public void SetGPS(AggregatedGpsData gps)
    {
        _lastGps = gps;
    }
    
    public void SetDevice(AggregatedDeviceStatus device)
    {
        _lastDevice = device;
    }
    
    public void SetWeather(AggregatedWeatherData weather)
    {
        _lastWeather = weather;
    }
    
    public void SetContext(AggregatedContext context)
    {
        _context = context;
    }
    
    public void AddDtcCode(int code)
    {
        _dtcCodes.Add(code);
    }
    
    public AggregatedDataPacket BuildPacket()
    {
        lock (_lock)
        {
            var packet = new AggregatedDataPacket
            {
                Version = 1,
                ClientHash = ClientHash,
                StartTime = new DateTimeOffset(WindowStart).ToUnixTimeMilliseconds(),
                EndTime = new DateTimeOffset(WindowEnd).ToUnixTimeMilliseconds(),
                DurationMs = (int)(WindowEnd - WindowStart).TotalMilliseconds,
                OBD2Stats = _obdBuffers.ToDictionary(
                    kvp => kvp.Key, 
                    kvp => kvp.Value.CalculateStatistics()),
                AccelerometerStats = _accelBuffers.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value.CalculateStatistics()),
                AudioStats = _audioBuffers.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value.CalculateStatistics()),
                GPS = _lastGps,
                Device = _lastDevice,
                Weather = _lastWeather,
                Context = _context,
                DtcCodes = _dtcCodes.Count > 0 ? _dtcCodes.ToArray() : null
            };
            
            return packet;
        }
    }
    
    public void ClearBuffers()
    {
        lock (_lock)
        {
            foreach (var buffer in _obdBuffers.Values)
                buffer.Clear();
            foreach (var buffer in _accelBuffers.Values)
                buffer.Clear();
            foreach (var buffer in _audioBuffers.Values)
                buffer.Clear();
            
            _dtcCodes.Clear();
        }
    }
    
    public string SerializeToString()
    {
        var packet = BuildPacket();
        // Use compact JSON with no indentation
        return System.Text.Json.JsonSerializer.Serialize(packet, new System.Text.Json.JsonSerializerOptions
        {
            PropertyNamingPolicy = null,
            WriteIndented = false,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        });
    }
}

/// <summary>
/// Weather data for aggregation
/// </summary>
public class WeatherData
{
    /// <summary>Temperature in Celsius</summary>
    [JsonPropertyName("temp")]
    public double Temperature { get; set; }
    
    /// <summary>Humidity percentage</summary>
    [JsonPropertyName("hum")]
    public int Humidity { get; set; }
    
    /// <summary>Wind speed in km/h</summary>
    [JsonPropertyName("wind")]
    public double WindSpeed { get; set; }
    
    /// <summary>Precipitation in mm</summary>
    [JsonPropertyName("rain")]
    public double Precipitation { get; set; }
    
    /// <summary>Pressure in hPa</summary>
    [JsonPropertyName("pres")]
    public double Pressure { get; set; }
    
    /// <summary>Weather condition (clear, cloudy, rain, etc.)</summary>
    [JsonPropertyName("cond")]
    public string Condition { get; set; } = "";
}
