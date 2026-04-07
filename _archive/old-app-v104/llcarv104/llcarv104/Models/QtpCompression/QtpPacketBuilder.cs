using System;
using System.Collections.Generic;
using System.Linq;
using llcar.Models;
using llcar.Models.QtpCompression;

namespace llcar.Services;

/// <summary>
/// Builds QTP packets from aggregated data
/// </summary>
public class QtpPacketBuilder
{
    private readonly IWeatherService _weatherService;
    
    public QtpPacketBuilder(IWeatherService weatherService)
    {
        _weatherService = weatherService;
    }
    
    /// <summary>
    /// Builds QTP packet from OBD2 data and sensor aggregations
    /// </summary>
    public async Task<QtpPacket> BuildPacketAsync(
        Dictionary<string, object> obd2Data,
        DateTime windowStart,
        DateTime windowEnd,
        string clientHash,
        Location? location,
        global::llcar.Models.DeviceStatus? deviceStatus,
        List<int>? dtcCodes)
    {
        var packet = new QtpPacket
        {
            Version = 1,
            ClientHash = clientHash,
            WindowStart = new DateTimeOffset(windowStart).ToUnixTimeMilliseconds(),
            WindowEnd = new DateTimeOffset(windowEnd).ToUnixTimeMilliseconds(),
            DurationMs = (int)(windowEnd - windowStart).TotalMilliseconds,
            Data = new Dictionary<string, object>(obd2Data),
            Device = deviceStatus,
            DtcCodes = dtcCodes
        };
        
        // Add geohash and weather (coordinates NOT sent - privacy protection)
        if (location != null)
        {
            packet.GeoHash = ComputeGeoHash(location.Latitude, location.Longitude);
            
            // GPS field required by server API, but we send empty/null for privacy
            // Only geohash (8 chars) is used for location - NOT precise coordinates
            packet.Gps = null;  // Intentionally null - coordinates never leave device
            
            // Get cached weather (fetched once per packet)
            Log.Debug($"[QTP_BUILDER] Fetching weather for {location.Latitude}, {location.Longitude}");
            var weather = await _weatherService.GetWeatherCachedAsync(
                location.Latitude, location.Longitude);
            
            if (weather != null)
            {
                packet.Weather = weather;
                Log.Debug($"[QTP_BUILDER] Weather added: {weather.Temperature}°C, {weather.Condition}");
            }
            else
            {
                Log.Debug("[QTP_BUILDER] Weather is null");
            }
        }
        
        // Add audio data only if not already provided
        // Note: Audio data should be provided in obd2Data["s"] by caller
        // This block is kept for backward compatibility only
        if (!packet.Data.ContainsKey("s"))
        {
            // Audio not provided - will be empty
            Log.Debug("[QTP_BUILDER] Warning: No audio data in packet");
        }
        
        // Add accelerometer QTP blocks only if not already provided
        // Note: Accelerometer data should be provided in obd2Data["ax"], ["ay"], ["az"] by caller
        // This block is kept for backward compatibility only
        if (!packet.Data.ContainsKey("ax"))
        {
            // Accel not provided - will be empty
            Log.Debug("[QTP_BUILDER] Warning: No accelerometer data in packet");
        }
        
        return packet;
    }
    
    /// <summary>
    /// Converts list of byte[8] to list of int[8] for JSON serialization
    /// </summary>
    private List<int[]> ConvertQtpBlocksToIntArrays(List<byte[]> blocks)
    {
        return blocks.Select(block => block.Select(b => (int)b).ToArray()).ToList();
    }
    
    /// <summary>
    /// Computes 8-character geohash from coordinates
    /// </summary>
    private string ComputeGeoHash(double latitude, double longitude)
    {
        const string base32 = "0123456789bcdefghjkmnpqrstuvwxyz";
        const int precision = 8;
        
        double latMin = -90, latMax = 90;
        double lonMin = -180, lonMax = 180;
        
        var result = new char[precision];
        int bit = 0;
        int ch = 0;
        int resultIndex = 0;
        bool evenBit = true;
        
        while (resultIndex < precision)
        {
            if (evenBit)
            {
                // Longitude
                var lonMid = (lonMin + lonMax) / 2;
                if (longitude >= lonMid)
                {
                    ch = (ch << 1) | 1;
                    lonMin = lonMid;
                }
                else
                {
                    ch = ch << 1;
                    lonMax = lonMid;
                }
            }
            else
            {
                // Latitude
                var latMid = (latMin + latMax) / 2;
                if (latitude >= latMid)
                {
                    ch = (ch << 1) | 1;
                    latMin = latMid;
                }
                else
                {
                    ch = ch << 1;
                    latMax = latMid;
                }
            }
            
            evenBit = !evenBit;
            bit++;
            
            if (bit == 5)
            {
                result[resultIndex] = base32[ch];
                resultIndex++;
                bit = 0;
                ch = 0;
            }
        }
        
        return new string(result);
    }
}
