using llcar.Models;
using Core.Logger;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace llcar.Services;

/// <summary>
/// Service for querying aggregated statistics from server
/// Used for comparing current vehicle data with similar vehicles
/// </summary>
public interface IAggregationService
{
    /// <summary>
    /// Query aggregated statistics for current parameters
    /// </summary>
    Task<AggregationResponse?> GetAggregatedStatsAsync(
        Dictionary<string, object> parametersJson,
        AggregationContext context,
        CancellationToken ct = default);
}

/// <summary>
/// Client for aggregation API
/// </summary>
public class AggregationService : IAggregationService
{
    private readonly HttpClient _httpClient;
    private readonly string _serverUrl;
    private readonly ServiceLogger _logger;
    
    public AggregationService(
        string serverUrl,
        ServiceLogger logger)
    {
        _serverUrl = serverUrl?.TrimEnd('/') ?? "http://device.llcar.ru";
        _logger = logger;
        
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(10)
        };
    }
    
    public async Task<AggregationResponse?> GetAggregatedStatsAsync(
        Dictionary<string, object> parametersJson,
        AggregationContext context,
        CancellationToken ct = default)
    {
        try
        {
            _logger.Debug("[AGGREGATION] Querying statistics from server");
            
            var request = new AggregationQueryRequest
            {
                ParametersJson = parametersJson,
                VehicleBrand = context.VehicleBrand,
                VehicleModel = context.VehicleModel,
                GeoHash = context.GeoHash,
                RoadType = context.RoadType,
                Season = context.Season,
                AccelerationState = context.AccelerationState,
                OutsideTempRange = context.OutsideTempRange,
                HumidityRange = context.HumidityRange,
                WindRange = context.WindRange
            };
            
            var url = $"{_serverUrl}/api/v1/aggregations/query";
            var response = await _httpClient.PostAsJsonAsync(url, request, ct);
            
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<AggregationResponse>(ct);
                
                if (result?.Status == "success")
                {
                    _logger.Debug($"[AGGREGATION] Found {result.SimilarRecordsFound} similar records");
                    return result;
                }
                else
                {
                    _logger.Debug("[AGGREGATION] No similar records found");
                    return null;
                }
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync(ct);
                _logger.Warning($"[AGGREGATION] Query failed: {response.StatusCode} - {error}");
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "[AGGREGATION] Error querying statistics");
            return null;
        }
    }
}

/// <summary>
/// Request for aggregation query
/// </summary>
public class AggregationQueryRequest
{
    [JsonPropertyName("parameters_json")]
    public Dictionary<string, object> ParametersJson { get; set; } = new();
    
    [JsonPropertyName("vehicle_brand")]
    public string? VehicleBrand { get; set; }
    
    [JsonPropertyName("vehicle_model")]
    public string? VehicleModel { get; set; }
    
    [JsonPropertyName("geo_hash")]
    public string? GeoHash { get; set; }
    
    [JsonPropertyName("road_type")]
    public string? RoadType { get; set; }
    
    [JsonPropertyName("season")]
    public string? Season { get; set; }
    
    [JsonPropertyName("acceleration_state")]
    public string? AccelerationState { get; set; }
    
    [JsonPropertyName("outside_temp_range")]
    public string? OutsideTempRange { get; set; }
    
    [JsonPropertyName("humidity_range")]
    public string? HumidityRange { get; set; }
    
    [JsonPropertyName("wind_range")]
    public string? WindRange { get; set; }
}

/// <summary>
/// Context for aggregation query
/// </summary>
public class AggregationContext
{
    public string? VehicleBrand { get; set; }
    public string? VehicleModel { get; set; }
    public string? GeoHash { get; set; }
    public string? RoadType { get; set; }
    public string? Season { get; set; }
    public string? AccelerationState { get; set; }
    public string? OutsideTempRange { get; set; }
    public string? HumidityRange { get; set; }
    public string? WindRange { get; set; }
}

/// <summary>
/// Response from aggregation query
/// </summary>
public class AggregationResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = "";
    
    [JsonPropertyName("similar_records_found")]
    public int SimilarRecordsFound { get; set; }
    
    [JsonPropertyName("parameters")]
    public Dictionary<string, object>? Parameters { get; set; }
    
    [JsonPropertyName("similar_data")]
    public List<SimilarDataRecord>? SimilarData { get; set; }
    
    [JsonPropertyName("filters_applied")]
    public Dictionary<string, object>? FiltersApplied { get; set; }
    
    [JsonPropertyName("message")]
    public string? Message { get; set; }
}

/// <summary>
/// Type of PID metrics storage based on change frequency
/// </summary>
public enum PidMetricType
{
    FastChanging,   // min, max, avg, std (RPM, Load, MAF)
    MediumChanging, // min, max, avg (Speed, Throttle)
    SlowChanging    // avg only (Temperatures, Fuel trims)
}

/// <summary>
/// Similar data record from server
/// </summary>
public class SimilarDataRecord
{
    [JsonPropertyName("parameters_json")]
    public Dictionary<string, object>? ParametersJson { get; set; }
    
    [JsonPropertyName("calculated_at")]
    public DateTime CalculatedAt { get; set; }
}

/// <summary>
/// Extension methods for building flat parameters JSON from AggregatedDataPacket
/// Format: pid_010C_min, pid_010C_max, pid_010C_avg, pid_010C_std, etc.
/// </summary>
public static class AggregationParameterBuilder
{
    /// <summary>
    /// Build flat parameters dictionary for TimescaleDB
    /// One row = 2-5 seconds with ~200 parameters
    /// Metrics depend on parameter type (fast/slow changing)
    /// </summary>
    public static Dictionary<string, object> BuildFlatParameters(AggregatedDataPacket packet)
    {
        var parameters = new Dictionary<string, object>();
        
        // OBD2 parameters - metrics depend on PID characteristics
        foreach (var kvp in packet.OBD2Stats)
        {
            var pid = kvp.Key.ToUpper();
            var stats = kvp.Value;
            
            // Determine metrics based on PID type
            var metricType = GetPidMetricType(pid);
            
            switch (metricType)
            {
                case PidMetricType.FastChanging:  // RPM - all metrics
                    parameters[$"pid_{pid}_min"] = stats.Min / 1000.0;
                    parameters[$"pid_{pid}_max"] = stats.Max / 1000.0;
                    parameters[$"pid_{pid}_avg"] = stats.Avg / 1000.0;
                    parameters[$"pid_{pid}_std"] = stats.StdDev / 1000.0;
                    break;
                    
                case PidMetricType.MediumChanging:  // Speed - min, max, avg
                    parameters[$"pid_{pid}_min"] = stats.Min / 1000.0;
                    parameters[$"pid_{pid}_max"] = stats.Max / 1000.0;
                    parameters[$"pid_{pid}_avg"] = stats.Avg / 1000.0;
                    break;
                    
                case PidMetricType.SlowChanging:  // Temperature - avg only
                default:
                    parameters[$"pid_{pid}_avg"] = stats.Avg / 1000.0;
                    break;
            }
        }
        
        // Accelerometer - all metrics for vibration analysis
        foreach (var kvp in packet.AccelerometerStats)
        {
            var axis = kvp.Key;
            var stats = kvp.Value;
            
            parameters[$"accel_{axis}_min"] = stats.Min / 1000.0;
            parameters[$"accel_{axis}_max"] = stats.Max / 1000.0;
            parameters[$"accel_{axis}_avg"] = stats.Avg / 1000.0;
            parameters[$"accel_{axis}_std"] = stats.StdDev / 1000.0;
        }
        
        // Audio - avg and peak
        foreach (var kvp in packet.AudioStats)
        {
            var metric = kvp.Key;
            var stats = kvp.Value;
            
            parameters[$"audio_{metric}_avg"] = stats.Avg / 1000.0;
            parameters[$"audio_{metric}_max"] = stats.Max / 1000.0;
        }
        
        // GPS - last values (not statistics)
        if (packet.GPS != null)
        {
            parameters["gps_speed"] = packet.GPS.Speed / 100.0;
            parameters["gps_heading"] = packet.GPS.Heading / 10.0;
            parameters["gps_lat"] = packet.GPS.Latitude / 1_000_000.0;
            parameters["gps_lon"] = packet.GPS.Longitude / 1_000_000.0;
            parameters["gps_geohash"] = packet.GPS.GeoHash;
        }
        
        // Weather - last values
        if (packet.Weather != null)
        {
            parameters["weather_temp"] = packet.Weather.Temperature / 10.0;
            parameters["weather_humidity"] = packet.Weather.Humidity / 10.0;
            parameters["weather_wind"] = packet.Weather.WindSpeed / 10.0;
            parameters["weather_pressure"] = packet.Weather.Pressure / 10.0;
            parameters["weather_condition"] = packet.Weather.Condition;
        }
        
        // Context
        parameters["context_season"] = packet.Context.Season;
        parameters["context_road_type"] = packet.Context.RoadType;
        parameters["context_acceleration_state"] = packet.Context.AccelerationState;
        parameters["context_time_of_day"] = packet.Context.TimeOfDay;
        
        return parameters;
    }
    
    /// <summary>
    /// Determine which metrics to store based on PID type
    /// </summary>
    private static PidMetricType GetPidMetricType(string pid)
    {
        // Fast changing: RPM (010C), Load (0104), MAF (0110)
        if (pid is "010C" or "0104" or "0110")
            return PidMetricType.FastChanging;
        
        // Medium changing: Speed (010D), Throttle (0111)
        if (pid is "010D" or "0111")
            return PidMetricType.MediumChanging;
        
        // Slow changing: Temperatures (0105, 010F), Fuel trims (0106-0109)
        if (pid.StartsWith("0105") || pid.StartsWith("010F") || 
            pid.StartsWith("0106") || pid.StartsWith("0107") ||
            pid.StartsWith("0108") || pid.StartsWith("0109"))
            return PidMetricType.SlowChanging;
        
        // Default: store avg only
        return PidMetricType.SlowChanging;
    }
    
    /// <summary>
    /// Extract specific parameter value from aggregated stats
    /// </summary>
    public static double? GetParameterValue(
        this AggregatedDataPacket packet, 
        string category, 
        string parameter,
        string metric = "avg")
    {
        ParameterStatistics? stats = category.ToLower() switch
        {
            "obd2" => packet.OBD2Stats.GetValueOrDefault(parameter),
            "obd" => packet.OBD2Stats.GetValueOrDefault(parameter),
            "accel" => packet.AccelerometerStats.GetValueOrDefault(parameter),
            "accelerometer" => packet.AccelerometerStats.GetValueOrDefault(parameter),
            "audio" => packet.AudioStats.GetValueOrDefault(parameter),
            _ => null
        };
        
        if (stats == null) return null;
        
        return metric.ToLower() switch
        {
            "min" => stats.Min / 1000.0,
            "avg" or "mean" => stats.Avg / 1000.0,
            "max" => stats.Max / 1000.0,
            "std" or "stddev" => stats.StdDev / 1000.0,
            "p5" => stats.Quantiles?[0] / 1000.0 ?? stats.Avg / 1000.0,
            "p25" => stats.Quantiles?[2] / 1000.0 ?? stats.Avg / 1000.0,
            "p50" or "median" => stats.Quantiles?[4] / 1000.0 ?? stats.Avg / 1000.0,
            "p75" => stats.Quantiles?[6] / 1000.0 ?? stats.Avg / 1000.0,
            "p95" => stats.Quantiles?[8] / 1000.0 ?? stats.Avg / 1000.0,
            _ => stats.Avg / 1000.0
        };
    }
}
