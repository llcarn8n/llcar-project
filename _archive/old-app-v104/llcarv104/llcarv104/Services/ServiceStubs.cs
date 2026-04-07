using llcar.Models;
using llcar.Models.QtpCompression;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace llcar.Services;

// Interfaces for aggregation services
public interface IWeatherService
{
    Task<WeatherData?> GetWeatherAsync(double latitude, double longitude, CancellationToken ct = default);
    Task<WeatherData?> GetWeatherCachedAsync(double latitude, double longitude, CancellationToken ct = default);
    void ClearCache();
}

public interface IRoadTypeService
{
    Task<string> DetermineRoadTypeAsync(LocationData location, AccelerometerCompressedData? accel);
}

public interface IAccelerationStateService
{
    string DetermineStateFromStats(ParameterStatistics xStats);
}

/// <summary>
/// Severity levels for feature evaluation
/// </summary>
public enum FeatureSeverity
{
    Info = 0,
    Warning = 1,
    Critical = 2
}

// Result of feature evaluation
public class FeatureEvaluationResult
{
    public string FeatureId { get; set; } = "";
    public double? ComputedValue { get; set; }
    public double? ExpectedValue { get; set; }
    public double? DeviationPercent { get; set; }
    public int Status { get; set; } // 0=Normal, 1=Warning, 2=Critical
    public FeatureSeverity Severity => (FeatureSeverity)Status;
    public bool IsTriggered => Status > 0;
    public double Confidence { get; set; }
    public string? Message { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public AIAnalysis? AIAnalysis { get; set; }
}

// Result of rule evaluation
public class RuleEvaluationResult
{
    public string FeatureId { get; set; } = "";
    public double? ComputedValue { get; set; }
    public double? ExpectedValue { get; set; }
    public double? DeviationPercent { get; set; }
    public int Status { get; set; } // 0=Normal, 1=Warning, 2=Critical
    public double Confidence { get; set; }
    public string? Message { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public List<string> TriggeredRules { get; set; } = new();
}

/// <summary>
/// Open-Meteo weather service implementation
/// Free API, no key required, unlimited calls
/// </summary>
public class WeatherService : IWeatherService
{
    private readonly HttpClient _httpClient;
    private WeatherCache? _cache;
    private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(10);
    
    public WeatherService()
    {
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    }
    
    public async Task<WeatherData?> GetWeatherAsync(double latitude, double longitude, CancellationToken ct = default)
    {
        try
        {
            // Use invariant culture to ensure dot as decimal separator (not comma in ru-RU)
            var latStr = latitude.ToString("F4", System.Globalization.CultureInfo.InvariantCulture);
            var lonStr = longitude.ToString("F4", System.Globalization.CultureInfo.InvariantCulture);
            
            Log.Debug($"[WEATHER] Fetching weather for {latStr}, {lonStr}");
            
            var url = $"https://api.open-meteo.com/v1/forecast?" +
                     $"latitude={latStr}&longitude={lonStr}&" +
                     $"current=temperature_2m,relative_humidity_2m,precipitation,weather_code,pressure_msl,wind_speed_10m&" +
                     $"timezone=auto";
            
            Log.Debug($"[WEATHER] URL: {url}");
            
            var response = await _httpClient.GetAsync(url, ct);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Log.Debug($"[WEATHER] Failed: {response.StatusCode}, Error: {errorContent.Substring(0, Math.Min(200, errorContent.Length))}");
                return null;
            }
            
            var json = await response.Content.ReadAsStringAsync(ct);
            var data = JsonSerializer.Deserialize<OpenMeteoResponse>(json);
            
            if (data?.Current == null)
            {
                Log.Debug("[WEATHER] No data in response");
                return null;
            }
            
            var weather = new WeatherData
            {
                Temperature = data.Current.Temperature2m,
                Humidity = data.Current.RelativeHumidity2m,
                WindSpeed = data.Current.WindSpeed10m,
                Precipitation = data.Current.Precipitation,
                Pressure = data.Current.PressureMsl,
                Condition = MapWeatherCode(data.Current.WeatherCode)
            };
            
            Log.Debug($"[WEATHER] Got: {weather.Temperature}°C, {weather.Condition}");
            return weather;
        }
        catch (Exception ex)
        {
            Log.Debug($"[WEATHER] Error: {ex.Message}");
            return null;
        }
    }
    
    public async Task<WeatherData?> GetWeatherCachedAsync(double latitude, double longitude, CancellationToken ct = default)
    {
        if (_cache != null && 
            (DateTime.UtcNow - _cache.Timestamp) < _cacheDuration &&
            Math.Abs(_cache.Latitude - latitude) < 0.01 &&
            Math.Abs(_cache.Longitude - longitude) < 0.01)
        {
            Log.Debug("[WEATHER] Using cached data");
            return _cache.Data;
        }
        
        var weather = await GetWeatherAsync(latitude, longitude, ct);
        
        if (weather != null)
        {
            _cache = new WeatherCache
            {
                Latitude = latitude,
                Longitude = longitude,
                Data = weather,
                Timestamp = DateTime.UtcNow
            };
        }
        
        return weather;
    }
    
    public void ClearCache()
    {
        _cache = null;
    }
    
    private static string MapWeatherCode(int code)
    {
        return code switch
        {
            0 => "clear",
            1 => "mainly_clear",
            2 => "partly_cloudy",
            3 => "overcast",
            45 => "fog",
            48 => "depositing_rime_fog",
            51 => "light_drizzle",
            53 => "moderate_drizzle",
            55 => "dense_drizzle",
            61 => "slight_rain",
            63 => "moderate_rain",
            65 => "heavy_rain",
            71 => "slight_snow",
            73 => "moderate_snow",
            75 => "heavy_snow",
            95 => "thunderstorm",
            96 => "thunderstorm_with_hail",
            _ => "unknown"
        };
    }
    
    private class WeatherCache
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public WeatherData Data { get; set; } = null!;
        public DateTime Timestamp { get; set; }
    }
}

public class OpenMeteoResponse
{
    [JsonPropertyName("latitude")]
    public double Latitude { get; set; }
    
    [JsonPropertyName("longitude")]
    public double Longitude { get; set; }
    
    [JsonPropertyName("current")]
    public CurrentWeather? Current { get; set; }
}

public class CurrentWeather
{
    [JsonPropertyName("temperature_2m")]
    public double Temperature2m { get; set; }
    
    [JsonPropertyName("relative_humidity_2m")]
    public int RelativeHumidity2m { get; set; }
    
    [JsonPropertyName("precipitation")]
    public double Precipitation { get; set; }
    
    [JsonPropertyName("weather_code")]
    public int WeatherCode { get; set; }
    
    [JsonPropertyName("pressure_msl")]
    public double PressureMsl { get; set; }
    
    [JsonPropertyName("wind_speed_10m")]
    public double WindSpeed10m { get; set; }
}

/// <summary>
/// Stub implementation for road type service
/// </summary>
public class RoadTypeServiceStub : IRoadTypeService
{
    public Task<string> DetermineRoadTypeAsync(LocationData location, AccelerometerCompressedData? accel)
    {
        // Simple logic based on GPS or return default
        return Task.FromResult("highway");
    }
}

/// <summary>
/// Stub implementation for acceleration state service
/// </summary>
public class AccelerationStateServiceStub : IAccelerationStateService
{
    public string DetermineStateFromStats(ParameterStatistics xStats)
    {
        var avg = xStats.Avg / 1000.0;
        if (avg > 0.3)
            return "decelerating";
        if (avg < -0.2)
            return "accelerating";
        return "cruising";
    }
}
