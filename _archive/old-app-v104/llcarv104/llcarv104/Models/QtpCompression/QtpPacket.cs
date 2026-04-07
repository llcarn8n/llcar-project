using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using llcar.Models;

namespace llcar.Models.QtpCompression;

/// <summary>
/// QTP compressed data packet for server transmission
/// Replaces UnifiedDataPacket with efficient QTP compression
/// </summary>
public class QtpPacket
{
    /// <summary>Protocol version</summary>
    [JsonPropertyName("v")]
    public int Version { get; set; } = 1;
    
    /// <summary>Client hash (VIN + mobile MD5)</summary>
    [JsonPropertyName("h")]
    public string ClientHash { get; set; } = "";
    
    /// <summary>Window start timestamp (Unix milliseconds)</summary>
    [JsonPropertyName("t0")]
    public long WindowStart { get; set; }
    
    /// <summary>Window end timestamp (Unix milliseconds)</summary>
    [JsonPropertyName("t1")]
    public long WindowEnd { get; set; }
    
    /// <summary>Duration in milliseconds</summary>
    [JsonPropertyName("dur")]
    public int DurationMs { get; set; }
    
    /// <summary>Geohash (8 characters)</summary>
    [JsonPropertyName("gh")]
    public string? GeoHash { get; set; }
    
    /// <summary>Weather data</summary>
    [JsonPropertyName("w")]
    public WeatherData? Weather { get; set; }
    
    /// <summary>All sensor data: OBD2, Audio, Accelerometer
    /// Values are either: 8-byte QTP array OR single average integer</summary>
    [JsonPropertyName("data")]
    public Dictionary<string, object> Data { get; set; } = new();
    
    /// <summary>Device status</summary>
    [JsonPropertyName("dev")]
    public global::llcar.Models.DeviceStatus? Device { get; set; }
    
    /// <summary>GPS coordinates (lat, lon, altitude, speed)</summary>
    [JsonPropertyName("gps")]
    public Dictionary<string, object>? Gps { get; set; }
    
    /// <summary>DTC codes</summary>
    [JsonPropertyName("dtc")]
    public List<int>? DtcCodes { get; set; }
    
    /// <summary>Road type (highway, city, rural, etc.)</summary>
    [JsonPropertyName("road_type")]
    public string? RoadType { get; set; }
    
    /// <summary>Season (spring, summer, autumn, winter)</summary>
    [JsonPropertyName("season")]
    public string? Season { get; set; }
    
    /// <summary>Acceleration state (accelerating, braking, cruising, stationary)</summary>
    [JsonPropertyName("accel_state")]
    public string? AccelerationState { get; set; }
    
    /// <summary>ECU mask - bitmask of responding ECUs (bit 0=7E8, bit 1=7E9, etc.)</summary>
    [JsonPropertyName("ecu_mask")]
    public int EcuMask { get; set; }
    
    /// <summary>Source packet ID from local database</summary>
    [JsonPropertyName("packet_srcid")]
    public long? PacketSrcId { get; set; }
    
    /// <summary>Source packet timestamp from local database (Unix milliseconds)</summary>
    [JsonPropertyName("packet_srctimest")]
    public long? PacketSrcTimestamp { get; set; }
}

/// <summary>
/// Audio data structure for 2-second window
/// 2 intervals × (10 frequencies + 10 peaks) = 80 values
/// </summary>
public class AudioIntervalData
{
    /// <summary>
    /// Creates audio array for QTP packet
    /// Format: [freq1, amp1, ..., freq10, amp10, offset1, amp1, ..., offset10, amp10]
    /// 40 values per 1000ms interval, 80 values total for 2 seconds
    /// </summary>
    public static List<int> CreateAudioArray(
        List<(FrequencyInfo freq, PeakInfo peak)> interval1,
        List<(FrequencyInfo freq, PeakInfo peak)> interval2)
    {
        var result = new List<int>();
        
        // Interval 1
        AddIntervalData(result, interval1);
        
        // Interval 2
        AddIntervalData(result, interval2);
        
        return result;
    }
    
    private static void AddIntervalData(List<int> result, List<(FrequencyInfo freq, PeakInfo peak)> data)
    {
        // Add 10 frequencies
        foreach (var (freq, _) in data.Take(10))
        {
            result.Add((int)freq.FrequencyHz);
            result.Add((int)(freq.AmplitudeDb * 100)); // Store dB × 100
        }
        
        // Add 10 peaks
        foreach (var (_, peak) in data.Take(10))
        {
            result.Add(peak.OffsetMs);
            result.Add((int)(peak.AmplitudeDb * 100)); // Store dB × 100
        }
    }
}

public record FrequencyInfo(double FrequencyHz, double AmplitudeDb);
public record PeakInfo(int OffsetMs, double AmplitudeDb);
