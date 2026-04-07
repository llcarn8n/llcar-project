using System.Text.Json;
using System.Text.Json.Serialization;

namespace llcar.Models;

/// <summary>
/// Highly compressed background data packet for efficient server upload
/// Uses short field names, integer encoding, and array structures
/// </summary>
public class CompressedBackgroundData
{
    /// <summary>Client hash (VIN + mobile)</summary>
    [JsonPropertyName("h")]
    public string H { get; set; } = "";
    
    /// <summary>Base timestamp (Unix milliseconds)</summary>
    [JsonPropertyName("t")]
    public long T { get; set; }
    
    /// <summary>PID readings [pid, offset_ms, value_x1000]</summary>
    [JsonPropertyName("p")]
    public List<int[]>? P { get; set; }
    
    /// <summary>Accelerometer [offset_ms, avgX_x1000, avgY_x1000, avgZ_x1000, maxMag_x1000, stdDev_x1000, level]</summary>
    [JsonPropertyName("a")]
    public int[]? A { get; set; }
    
    /// <summary>Audio [offset_ms, avgDb_x100, peakDb_x100, lowFreq_x1000, midFreq_x1000, highFreq_x1000]</summary>
    [JsonPropertyName("s")]
    public int[]? S { get; set; }
    
    /// <summary>GPS [lat_x1M, lon_x1M, alt_x10, speed_x100, heading_x10, accuracy_x10]</summary>
    [JsonPropertyName("g")]
    public int[]? G { get; set; }
    
    /// <summary>Device status [battery_x10, charging, signal_dbm, storage_gb, cpu_x10]</summary>
    [JsonPropertyName("d")]
    public int[]? D { get; set; }
    
    /// <summary>Sequence number for packet ordering</summary>
    [JsonPropertyName("n")]
    public int N { get; set; }
    
    /// <summary>Diagnostic Trouble Codes [offset_ms, code_int] - optional, max 10</summary>
    /// <remarks>
    /// Each DTC is encoded as: [offset_ms, code_int]
    /// code_int format: P=0, B=1, C=2, U=3 in first digit
    /// Example: "P0301" -> category=0, digits=0301 -> 00301
    /// </remarks>
    [JsonPropertyName("c")]
    public int[]? C { get; set; }
}

/// <summary>
/// Extension methods for compressing background data
/// </summary>
public static class BackgroundDataCompression
{
    /// <summary>
    /// Converts BackgroundDataPacket to highly compressed format
    /// </summary>
    public static CompressedBackgroundData Compress(
        this BackgroundDataPacket packet, 
        string clientHash,
        int sequenceNumber)
    {
        var baseTime = new DateTimeOffset(packet.Timestamp).ToUnixTimeMilliseconds();
        
        var compressed = new CompressedBackgroundData
        {
            H = clientHash,
            T = baseTime,
            N = sequenceNumber
        };
        
        // Compress PID readings into arrays [ecu_pid, offset_ms, value_x1000]
        // ecu_pid format: (ecu_code << 8) | pid
        //   ecu_code: 0-7 = 7E8-7EF (8 possible ECUs), 15 = unknown
        //   pid: 0-255 (standard OBD2 PID)
        // Examples:
        //   7E8_0C (RPM) -> (0 << 8) | 12 = 12
        //   7EC_0D (Speed) -> (4 << 8) | 13 = 1037
        if (packet.PidReadings?.Count > 0)
        {
            compressed.P = new List<int[]>(packet.PidReadings.Count);
            foreach (var reading in packet.PidReadings)
            {
                int pidNum = 0;
                try
                {
                    if (!string.IsNullOrEmpty(reading.Pid))
                    {
                        var pidHex = reading.Pid.Replace("0x", "").Replace("0X", "");
                        if (!int.TryParse(pidHex, System.Globalization.NumberStyles.HexNumber, null, out pidNum))
                        {
                            pidNum = 0;
                        }
                    }
                }
                catch
                {
                    pidNum = 0;
                }
                var offsetMs = (int)(reading.Timestamp - packet.Timestamp).TotalMilliseconds;
                var value = (int)(reading.ConvertedValue * 1000);
                
                // Convert ECU address to code: 7E8=0, 7E9=1, 7EA=2, ..., 7EF=7, unknown=15
                var ecuCode = 15; // default: unknown (15)
                if (!string.IsNullOrEmpty(reading.EcuAddress) && reading.EcuAddress.Length >= 3)
                {
                    var ecuNibble = reading.EcuAddress[2]; // '8'-'F' for 7E8-7EF
                    if (byte.TryParse(ecuNibble.ToString(), System.Globalization.NumberStyles.HexNumber, null, out byte ecuId))
                    {
                        // Map 7E8-7EF (8-15) to 0-7, others to 15
                        if (ecuId >= 8 && ecuId <= 15)
                            ecuCode = ecuId - 8; // 7E8->0, 7E9->1, ..., 7EF->7
                    }
                }
                
                // Pack ECU and PID: high 4 bits = ECU (0-7), low 8 bits = PID (0-255)
                // Actually: (ecu_code << 8) | pid gives us 12-bit value (0-4095)
                var ecuPid = (ecuCode << 8) | pidNum;
                
                compressed.P.Add(new[] { ecuPid, offsetMs, value });
            }
        }
        
        // Compress accelerometer:
        //   [offset_ms, avgX_x1000, avgY_x1000, avgZ_x1000, maxMag_x1000, stdDev_x1000, level,
        //    // X-axis: 10 frequencies [freq_hz, amp_x1000] (20 values)
        //    x_freq1_hz, x_freq1_amp, x_freq2_hz, x_freq2_amp, ..., x_freq10_hz, x_freq10_amp,
        //    // Y-axis: 10 frequencies [freq_hz, amp_x1000] (20 values)
        //    y_freq1_hz, y_freq1_amp, y_freq2_hz, y_freq2_amp, ..., y_freq10_hz, y_freq10_amp,
        //    // Z-axis: 10 frequencies [freq_hz, amp_x1000] (20 values)
        //    z_freq1_hz, z_freq1_amp, z_freq2_hz, z_freq2_amp, ..., z_freq10_hz, z_freq10_amp,
        //    // X-axis: 10 peaks per second [offset_ms, value_x1000] (20 values)
        //    x_peak1_offset, x_peak1_val, ..., x_peak10_offset, x_peak10_val,
        //    // Y-axis: 10 peaks per second [offset_ms, value_x1000] (20 values)
        //    y_peak1_offset, y_peak1_val, ..., y_peak10_offset, y_peak10_val,
        //    // Z-axis: 10 peaks per second [offset_ms, value_x1000] (20 values)
        //    z_peak1_offset, z_peak1_val, ..., z_peak10_offset, z_peak10_val]
        // Total: 7 + 60 + 60 = 127 values
        if (packet.AccelerometerData?.SampleCount > 0)
        {
            var accel = packet.AccelerometerData;
            var offsetMs = (int)(accel.StartTime - packet.Timestamp).TotalMilliseconds;
            
            // Build array: [base data...]
            var accelData = new List<int>
            {
                offsetMs,
                (int)(accel.AvgX * 1000),
                (int)(accel.AvgY * 1000),
                (int)(accel.AvgZ * 1000),
                (int)(Math.Max(accel.MaxX, Math.Max(accel.MaxY, accel.MaxZ)) * 1000),
                (int)(Math.Max(accel.StdDevX, Math.Max(accel.StdDevY, accel.StdDevZ)) * 1000),
                (int)accel.VibrationLevel
            };
            
            // Add 10 X-axis frequencies [freq_hz, amplitude_x1000]
            var xFreqs = accel.XFrequencies?.Take(10).ToList() ?? new List<VibrationFrequency>();
            for (int i = 0; i < 10; i++)
            {
                if (i < xFreqs.Count)
                {
                    accelData.Add((int)xFreqs[i].Frequency);
                    accelData.Add((int)(xFreqs[i].Amplitude * 1000));
                }
                else
                {
                    accelData.Add(0);
                    accelData.Add(0);
                }
            }
            
            // Add 10 Y-axis frequencies [freq_hz, amplitude_x1000]
            var yFreqs = accel.YFrequencies?.Take(10).ToList() ?? new List<VibrationFrequency>();
            for (int i = 0; i < 10; i++)
            {
                if (i < yFreqs.Count)
                {
                    accelData.Add((int)yFreqs[i].Frequency);
                    accelData.Add((int)(yFreqs[i].Amplitude * 1000));
                }
                else
                {
                    accelData.Add(0);
                    accelData.Add(0);
                }
            }
            
            // Add 10 Z-axis frequencies [freq_hz, amplitude_x1000]
            var zFreqs = accel.ZFrequencies?.Take(10).ToList() ?? new List<VibrationFrequency>();
            for (int i = 0; i < 10; i++)
            {
                if (i < zFreqs.Count)
                {
                    accelData.Add((int)zFreqs[i].Frequency);
                    accelData.Add((int)(zFreqs[i].Amplitude * 1000));
                }
                else
                {
                    accelData.Add(0);
                    accelData.Add(0);
                }
            }
            
            // Add 10 X-axis peaks per second in chronological order [offset_ms, value_x1000]
            var xPeaks = accel.XPeaks?.Take(10).OrderBy(p => p.OffsetMs).ToList() ?? new List<AxisPeak>();
            for (int i = 0; i < 10; i++)
            {
                if (i < xPeaks.Count)
                {
                    accelData.Add(xPeaks[i].OffsetMs);
                    accelData.Add((int)(xPeaks[i].Value * 1000));
                }
                else
                {
                    accelData.Add(0);
                    accelData.Add(0);
                }
            }
            
            // Add 10 Y-axis peaks per second in chronological order [offset_ms, value_x1000]
            var yPeaks = accel.YPeaks?.Take(10).OrderBy(p => p.OffsetMs).ToList() ?? new List<AxisPeak>();
            for (int i = 0; i < 10; i++)
            {
                if (i < yPeaks.Count)
                {
                    accelData.Add(yPeaks[i].OffsetMs);
                    accelData.Add((int)(yPeaks[i].Value * 1000));
                }
                else
                {
                    accelData.Add(0);
                    accelData.Add(0);
                }
            }
            
            // Add 10 Z-axis peaks per second in chronological order [offset_ms, value_x1000]
            var zPeaks = accel.ZPeaks?.Take(10).OrderBy(p => p.OffsetMs).ToList() ?? new List<AxisPeak>();
            for (int i = 0; i < 10; i++)
            {
                if (i < zPeaks.Count)
                {
                    accelData.Add(zPeaks[i].OffsetMs);
                    accelData.Add((int)(zPeaks[i].Value * 1000));
                }
                else
                {
                    accelData.Add(0);
                    accelData.Add(0);
                }
            }
            
            compressed.A = accelData.ToArray();
        }
        
        // Compress audio [offset_ms, avgDb_x100, peakDb_x100, lowFreq_x1000, midFreq_x1000, highFreq_x1000]
        Log.Debug($"[COMPRESS] AudioData is {(packet.AudioData == null ? "NULL" : "NOT NULL")}");
        if (packet.AudioData != null)
        {
            var audio = packet.AudioData;
            var offsetMs = (int)(audio.Timestamp - packet.Timestamp).TotalMilliseconds;
            
            compressed.S = new[]
            {
                offsetMs,
                (int)(audio.AvgDecibels * 100),
                (int)(audio.PeakDecibels * 100)
            };
            
            if (audio.FrequencyData != null)
            {
                compressed.S = compressed.S.Concat(new[]
                {
                    (int)(audio.FrequencyData.LowFreqEnergy * 1000),
                    (int)(audio.FrequencyData.MidFreqEnergy * 1000),
                    (int)(audio.FrequencyData.HighFreqEnergy * 1000)
                }).ToArray();
            }
        }
        
        // Compress GPS [simhash_lo, simhash_hi, speed_x100, heading_x10, accuracy_x10]
        // SimHash encodes lat/lon/alt into two 32-bit integers for privacy/efficiency
        if (packet.Location != null)
        {
            var loc = packet.Location;
            var (simHashLo, simHashHi) = ComputeLocationSimHash(loc.Latitude, loc.Longitude, loc.Altitude ?? 0);
            
            compressed.G = new[]
            {
                simHashLo,
                simHashHi,
                loc.Speed.HasValue ? (int)(loc.Speed.Value * 100) : 0,
                loc.Heading.HasValue ? (int)(loc.Heading.Value * 10) : 0,
                loc.Accuracy.HasValue ? (int)(loc.Accuracy.Value * 10) : 0
            };
        }
        
        // Compress device status [battery_x10, charging_0/1]
        if (packet.DeviceStatus != null)
        {
            var dev = packet.DeviceStatus;
            compressed.D = new[]
            {
                (int)(dev.BatteryLevel * 10),
                dev.IsCharging ? 1 : 0
            };
        }
        
        // Compress DTCs [offset_ms, code_int] - optional, max 10
        if (packet.DtcCodes?.Count > 0)
        {
            var dtcData = new List<int>();
            foreach (var dtc in packet.DtcCodes.Take(10))
            {
                var offsetMs = (int)(dtc.Timestamp - packet.Timestamp).TotalMilliseconds;
                var codeInt = DtcToInt(dtc.Code);
                dtcData.Add(offsetMs);
                dtcData.Add(codeInt);
            }
            compressed.C = dtcData.ToArray();
        }
        
        return compressed;
    }
    
    /// <summary>
    /// Gets size comparison between original and compressed format
    /// </summary>
    public static (int originalSize, int compressedSize, double ratio) GetSizeComparison(
        BackgroundDataPacket original, 
        string clientHash)
    {
        var compressed = original.Compress(clientHash, 1);
        
        var originalJson = JsonSerializer.Serialize(original);
        var compressedJson = JsonSerializer.Serialize(compressed, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = null 
        });
        
        var ratio = (double)compressedJson.Length / originalJson.Length;
        return (originalJson.Length, compressedJson.Length, ratio);
    }
    
    /// <summary>
    /// Converts DTC string code to integer for efficient transmission
    /// Format: category * 10000 + digits
    /// P=0, B=1, C=2, U=3
    /// Example: "P0301" -> 0*10000 + 301 = 301
    /// Example: "B1234" -> 1*10000 + 1234 = 11234
    /// Example: "C0045" -> 2*10000 + 45 = 20045
    /// Example: "U0100" -> 3*10000 + 100 = 30100
    /// </summary>
    private static int DtcToInt(string code)
    {
        if (string.IsNullOrEmpty(code) || code.Length < 5)
            return 0;
        
        // First character determines category
        int category = code[0] switch
        {
            'P' => 0,  // Powertrain
            'B' => 1,  // Body
            'C' => 2,  // Chassis
            'U' => 3,  // Network
            _ => 0
        };
        
        // Extract digits (skip first character)
        if (int.TryParse(code.Substring(1), out int digits))
        {
            return category * 10000 + digits;
        }
        
        return category * 10000;
    }
    
    /// <summary>
    /// Computes SimHash for GPS location (lat, lon, alt)
    /// Creates a locality-sensitive hash that preserves spatial relationships
    /// Similar locations will have similar hash values
    /// </summary>
    /// <param name="latitude">Latitude in degrees</param>
    /// <param name="longitude">Longitude in degrees</param>
    /// <param name="altitude">Altitude in meters</param>
    /// <returns>Tuple of (simHashLo, simHashHi) - two 32-bit integers</returns>
    private static (int simHashLo, int simHashHi) ComputeLocationSimHash(double latitude, double longitude, double altitude)
    {
        // Normalize coordinates to 0-1 range
        // Latitude: -90 to +90 -> 0 to 1
        // Longitude: -180 to +180 -> 0 to 1
        double normLat = (latitude + 90.0) / 180.0;
        double normLon = (longitude + 180.0) / 360.0;
        
        // Normalize altitude: assume range -500 to 9000 meters -> 0 to 1
        double normAlt = Math.Clamp((altitude + 500.0) / 9500.0, 0.0, 1.0);
        
        // Create 64-bit hash using interleaved bits (similar to geohash)
        // This preserves locality - nearby points have similar hashes
        ulong hash = 0;
        
        for (int i = 0; i < 21; i++)
        {
            // Interleave bits from lat, lon, and alt
            int bitPos = 62 - (i * 3);
            
            // Latitude bit
            normLat *= 2;
            if (normLat >= 1.0)
            {
                hash |= (1UL << (bitPos));
                normLat -= 1.0;
            }
            
            // Longitude bit
            normLon *= 2;
            if (normLon >= 1.0)
            {
                hash |= (1UL << (bitPos - 1));
                normLon -= 1.0;
            }
            
            // Altitude bit (every 3rd bit)
            if (i % 3 == 0)
            {
                normAlt *= 2;
                if (normAlt >= 1.0)
                {
                    hash |= (1UL << (bitPos - 2));
                    normAlt -= 1.0;
                }
            }
        }
        
        // Split into two 32-bit integers
        int lo = (int)(hash & 0xFFFFFFFF);
        int hi = (int)(hash >> 32);
        
        return (lo, hi);
    }
}

/// <summary>
/// Batch format for multiple compressed packets (bulk upload)
/// </summary>
public class CompressedBatch
{
    /// <summary>Protocol version</summary>
    [JsonPropertyName("v")]
    public int V { get; set; } = 1;
    
    /// <summary>Client hash</summary>
    [JsonPropertyName("h")]
    public string H { get; set; } = "";
    
    /// <summary>Packets [timestamp, pid_array, accel_array, audio_array, gps_array, device_array]</summary>
    [JsonPropertyName("d")]
    public List<object[]> D { get; set; } = new();
}

/// <summary>
/// Audio frequency analysis with top 10 dominant frequencies
/// Format: [offset_ms, avg_db_x100, peak_db_x100, freq1_hz, amp1_db_x100, freq2_hz, amp2_db_x100, ...]
/// 
/// Frequency bands:
/// - 20-85 Hz: Road noise, tire rumble (KEEP for vehicle diagnostics)
/// - 85-255 Hz: Human voice fundamental (FILTER OUT)
/// - 255-4000 Hz: Music and voice harmonics (FILTER OUT)
/// - 4000-8000 Hz: Mechanical squeaks, rattles (KEEP for diagnostics)
/// 
/// How to filter voice/music:
/// 1. Calculate spectral flatness (0.0-1.0)
///    - < 0.3: Tonal sound (music/voice) → Discard or reduce amplitude
///    - > 0.3: Noisy sound (mechanical) → Keep
/// 
/// 2. Band-stop filter: Remove frequencies 85-4000 Hz
///    - Male voice: 85-180 Hz
///    - Female voice: 165-255 Hz  
///    - Music fundamentals: 250-4000 Hz
/// 
/// 3. Keep only vehicle-relevant frequencies:
///    - 20-85 Hz: Road noise, suspension
///    - 100-200 Hz: Engine vibrations
///    - 4000-8000 Hz: Squeaks, rattles
/// </summary>

/// <summary>
/// Helper method to filter out voice and music from frequency data
/// </summary>
public static class AudioFilter
{
    /// <summary>
    /// Filters frequency data to remove voice and music, keeping only vehicle noise
    /// </summary>
    public static List<double[]> FilterVehicleNoise(List<double[]> dominantFreqs, AudioFilterSettings settings)
    {
        var filtered = new List<double[]>();
        
        foreach (var freqAmp in dominantFreqs)
        {
            var freq = freqAmp[0];
            var amp = freqAmp[1];
            
            // Skip if below minimum amplitude
            if (amp < settings.MinAmplitudeDb)
                continue;
            
            // Check if frequency is in mechanical noise bands
            var isMechanical = false;
            for (int i = 0; i < settings.MechanicalFreqBands.Length; i += 2)
            {
                if (freq >= settings.MechanicalFreqBands[i] && freq <= settings.MechanicalFreqBands[i + 1])
                {
                    isMechanical = true;
                    break;
                }
            }
            
            // Keep only mechanical frequencies
            if (isMechanical)
            {
                filtered.Add(freqAmp);
            }
        }
        
        return filtered;
    }
    
    /// <summary>
    /// Calculates spectral flatness (0.0-1.0)
    /// High flatness (>0.3) = noise, Low flatness (<0.3) = tonal (music/voice)
    /// </summary>
    public static double CalculateSpectralFlatness(List<double[]> frequencies)
    {
        if (frequencies.Count == 0) return 0;
        
        var amplitudes = frequencies.Select(f => f[1]).ToList();
        var geometricMean = Math.Exp(amplitudes.Average(a => Math.Log(Math.Abs(a) + 1e-10)));
        var arithmeticMean = amplitudes.Average();
        
        return geometricMean / (arithmeticMean + 1e-10);
    }
}

/* 
COMPRESSION EXAMPLE:

Original format (~1.5KB for 10 PIDs):
{
  "Id": "guid",
  "Timestamp": "2026-02-24T14:30:15Z",
  "PidReadings": [
    {
      "Pid": "0x0C",
      "Mnemonic": "RPM",
      "Label": "Engine RPM",
      "RawValue": 2500.5,
      "ConvertedValue": 1500.3,
      "Unit": "rpm",
      "Timestamp": "2026-02-24T14:30:15Z"
    }
  ],
  "AccelerometerData": { ... },
  "AudioData": { ... },
  "Location": { ... }
}

Compressed format (~200 bytes for 10 PIDs):
{
  "h": "abc123",
  "t": 1708787415000,
  "n": 42,
  "p": [
    [12, 0, 1500300],
    [13, 50, 85000],
    [5, 100, 90500]
  ],
  "a": [
        // Base data (7 values)
        0,              // offset_ms from base timestamp
        100,            // avgX_x1000 (m/s²)
        -200,           // avgY_x1000 (m/s²)  
        9800,           // avgZ_x1000 (m/s²)
        10500,          // maxMag_x1000
        300,            // stdDev_x1000
        1,              // vibration_level (0-4)
        
        // X-axis: 10 dominant frequencies [freq_hz, amplitude_x1000]
        8, 5000,        // 8 Hz, 5.0 m/s² - very low freq
        15, 12000,      // 15 Hz, 12.0 m/s² - suspension
        25, 18000,      // 25 Hz, 18.0 m/s² - body bounce
        35, 22000,      // 35 Hz, 22.0 m/s² - road noise
        45, 25000,      // 45 Hz, 25.0 m/s² - road main
        60, 15000,      // 60 Hz, 15.0 m/s² - drivetrain
        80, 8000,       // 80 Hz, 8.0 m/s² - drivetrain
        100, 6000,      // 100 Hz, 6.0 m/s² - engine low
        120, 5000,      // 120 Hz, 5.0 m/s² - engine
        150, 4000,      // 150 Hz, 4.0 m/s² - engine high
        
        // Y-axis: 10 dominant frequencies [freq_hz, amplitude_x1000]
        6, 4000,        // 6 Hz, 4.0 m/s² - sway
        12, 8000,       // 12 Hz, 8.0 m/s² - body roll
        20, 12000,      // 20 Hz, 12.0 m/s² - lateral bounce
        28, 18000,      // 28 Hz, 18.0 m/s² - lateral road
        35, 15000,      // 35 Hz, 15.0 m/s² - lateral main
        50, 10000,      // 50 Hz, 10.0 m/s² - suspension
        70, 6000,       // 70 Hz, 6.0 m/s² - suspension
        90, 4500,       // 90 Hz, 4.5 m/s² - tire
        110, 4000,      // 110 Hz, 4.0 m/s² - tire
        140, 3000,      // 140 Hz, 3.0 m/s² - high freq
        
        // Z-axis: 10 dominant frequencies [freq_hz, amplitude_x1000]
        10, 8000,       // 10 Hz, 8.0 m/s² - heave
        18, 15000,      // 18 Hz, 15.0 m/s² - vertical oscillation
        25, 22000,      // 25 Hz, 22.0 m/s² - vertical road
        32, 28000,      // 32 Hz, 28.0 m/s² - pothole main
        40, 20000,      // 40 Hz, 20.0 m/s² - vertical main
        55, 12000,      // 55 Hz, 12.0 m/s² - suspension
        75, 7000,       // 75 Hz, 7.0 m/s² - suspension
        95, 5000,       // 95 Hz, 5.0 m/s² - chassis
        115, 4000,      // 115 Hz, 4.0 m/s² - engine vertical
        135, 3500,      // 135 Hz, 3.5 m/s² - high freq
        
        // 10 X-axis peaks per second (longitudinal) [offset_ms, value_x1000]
        // X+: braking, X-: acceleration
        50, 12000,      // 50ms, +12.0 m/s² (hard braking)
        120, -5000,     // 120ms, -5.0 m/s² (acceleration)
        200, -8000,     // 200ms, -8.0 m/s² (strong acceleration)
        280, 3000,      // 280ms, +3.0 m/s² (light braking)
        350, -4000,     // 350ms, -4.0 m/s² (acceleration)
        420, 15000,     // 420ms, +15.0 m/s² (emergency braking)
        500, -2000,     // 500ms, -2.0 m/s² (cruise)
        600, 6000,      // 600ms, +6.0 m/s² (braking)
        750, -3000,     // 750ms, -3.0 m/s² (acceleration)
        800, 5000,      // 800ms, +5.0 m/s² (braking)
        
        // 10 Y-axis peaks per second (lateral) [offset_ms, value_x1000]
        // Y+: left turn, Y-: right turn
        80, 8000,       // 80ms, +8.0 m/s² (left)
        150, -6000,     // 150ms, -6.0 m/s² (right)
        220, 12000,     // 220ms, +12.0 m/s² (left turn)
        300, -9000,     // 300ms, -9.0 m/s² (right turn)
        380, 15000,     // 380ms, +15.0 m/s² (sharp left)
        450, -12000,    // 450ms, -12.0 m/s² (sharp right)
        520, 5000,      // 520ms, +5.0 m/s² (lane change)
        650, -7000,     // 650ms, -7.0 m/s² (correction)
        720, 4000,      // 720ms, +4.0 m/s² (drift left)
        950, 8000,      // 950ms, +8.0 m/s² (lane change left)
        
        // 10 Z-axis peaks per second (vertical) [offset_ms, value_x1000]
        // Z+: bump up, Z-: bump down
        60, 6000,       // 60ms, +6.0 m/s² (small bump)
        130, -5000,     // 130ms, -5.0 m/s² (dip)
        180, 10000,     // 180ms, +10.0 m/s² (speed bump)
        250, -12000,    // 250ms, -12.0 m/s² (pothole)
        320, 8000,      // 320ms, +8.0 m/s² (rough road)
        400, -6000,     // 400ms, -6.0 m/s² (dip)
        480, 15000,     // 480ms, +15.0 m/s² (big bump)
        580, -8000,     // 580ms, -8.0 m/s² (pothole down)
        700, 4000,      // 700ms, +4.0 m/s² (vibration)
        880, 6000       // 880ms, +6.0 m/s² (small bump)
      ],
  "s": [500, 6550, 7820, 300, 500, 200],
  "g": [-1412584498, -1070391526, 6050, 900, 50],
  "d": [850, 1],
  "c": [0, 301, 500, 420, 1000, 10301, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
}

Size reduction: ~80-85%
Field mapping:
- h = thash (client hash)
- t = base timestamp (Unix ms)
- n = sequence number
- p = PIDs [pid_hex, offset_ms, value_x1000]
- a = accelerometer [offset_ms, avgX, avgY, avgZ, maxMag, stdDev, level,
     *    // X-axis frequencies: 10 × [freq_hz, amp_x1000] (20 values)
     *    x_freq1_hz, x_freq1_amp, x_freq2_hz, x_freq2_amp, ..., x_freq10_hz, x_freq10_amp,
     *    // Y-axis frequencies: 10 × [freq_hz, amp_x1000] (20 values)
     *    y_freq1_hz, y_freq1_amp, y_freq2_hz, y_freq2_amp, ..., y_freq10_hz, y_freq10_amp,
     *    // Z-axis frequencies: 10 × [freq_hz, amp_x1000] (20 values)
     *    z_freq1_hz, z_freq1_amp, z_freq2_hz, z_freq2_amp, ..., z_freq10_hz, z_freq10_amp,
     *    // X peaks: 10 per second × [offset_ms, value_x1000] (20 values)
     *    x_peak1_offset, x_peak1_val, ..., x_peak10_offset, x_peak10_val,
     *    // Y peaks: 10 per second × [offset_ms, value_x1000] (20 values)
     *    y_peak1_offset, y_peak1_val, ..., y_peak10_offset, y_peak10_val,
     *    // Z peaks: 10 per second × [offset_ms, value_x1000] (20 values)
     *    z_peak1_offset, z_peak1_val, ..., z_peak10_offset, z_peak10_val]
     * Total: 7 + 60 + 60 = 127 values
     * X: longitudinal (+braking, -acceleration)
     * Y: lateral (+left turn, -right turn)
     * Z: vertical (+bump up, -bump down)
     * Peaks are in chronological order (by time), top 18 largest magnitude events
- s = sound/audio [offset_ms, avg_db_x100, peak_db_x100, flatness_x1000, 
        freq1_hz, amp1_db_x100, freq2_hz, amp2_db_x100, ..., freq10_hz, amp10_db_x100]
     * Top 10 dominant frequencies with amplitudes
     * Spectral flatness: 0.0-1.0 (×1000), <0.3=tonal(music/voice), >0.3=noise
- g = GPS [simhash_lo, simhash_hi, speed_x100, heading_x10, acc_x10]
     * SimHash encodes lat/lon/alt into two 32-bit integers
     * Locality-preserving: nearby locations have similar hash values
- d = device [battery_x10, charging_0/1]
- c = DTCs [offset_ms1, code1_int, offset_ms2, code2_int, ...] (optional, max 10 codes)
     * DTC integer encoding: P=0, B=1, C=2, U=3 in first digit
     * Format: category * 10000 + digits
     * Example: "P0301" -> 0*10000 + 301 = 301
     * Example: "P0420" -> 0*10000 + 420 = 420
     * Example: "B0301" -> 1*10000 + 301 = 10301
     * Example: "B1234" -> 1*10000 + 1234 = 11234
     * Example: "C0045" -> 2*10000 + 45 = 20045
     * Example: "U0100" -> 3*10000 + 100 = 30100
     * Null if no DTCs present

Scaling factors:
- Values: ×1000 (3 decimal precision)
- Decibels: ×100 (2 decimal precision)
- Coordinates: ×1000000 (6 decimal precision)
- Speed: ×100 (2 decimal precision)
- Percentages: ×10 (1 decimal precision)
- Altitude/Heading/Accuracy: ×10 (1 decimal precision)
*/
