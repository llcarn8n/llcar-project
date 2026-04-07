using llcar.Models;
using llcar.Models.QtpCompression;

namespace llcar.Services;

/// <summary>
/// Converts QTP packets to BackgroundDataPacket for UI compatibility
/// </summary>
public static class QtpToBackgroundDataConverter
{
    /// <summary>
    /// Converts QTP packet to BackgroundDataPacket for UI display
    /// </summary>
    public static BackgroundDataPacket Convert(QtpPacket qtpPacket)
    {
        var packet = new BackgroundDataPacket
        {
            Timestamp = DateTimeOffset.FromUnixTimeMilliseconds(qtpPacket.WindowStart).DateTime
        };
        
        // Convert OBD2 data from QTP format
        if (qtpPacket.Data != null)
        {
            foreach (var kvp in qtpPacket.Data)
            {
                var pidKey = kvp.Key;
                var value = kvp.Value;
                
                // Skip non-OBD2 keys
                if (!pidKey.StartsWith("p"))
                    continue;
                
                // Parse PID from key (e.g., "p0C_0" -> "0x0C")
                var pidParts = pidKey.Split('_');
                if (pidParts.Length < 1)
                    continue;
                
                var pidHex = pidParts[0].Substring(1); // Remove 'p' prefix
                var pid = $"0x{pidHex}";
                
                // Extract value
                double convertedValue = 0;
                int rawValue = 0;
                
                if (value is List<int> qtpArray && qtpArray.Count >= 3)
                {
                    // QTP format: [min, max, avg, sd, ...] - use avg (index 2)
                    // Convert from byte 0-255 back to approximate value
                    rawValue = qtpArray[2];
                    convertedValue = rawValue; // Simplified - actual conversion needs min/max
                }
                else if (value is int singleValue)
                {
                    // Single value (for slow PIDs) - apply correct formula based on PID
                    rawValue = singleValue;
                    convertedValue = ApplyPidFormula(pidHex, singleValue);
                    
                    // Debug logging for RPM
                    if (pidHex.ToUpper() == "0C")
                    {
                        Log.Debug($"[QTP_CONVERT] RPM: raw={singleValue}, converted={convertedValue}");
                    }
                }
                else if (value is List<byte[]>)
                {
                    // Skip complex types (accelerometer QTP blocks)
                    continue;
                }
                
                packet.PidReadings.Add(new PidReading
                {
                    Pid = pid,
                    Mnemonic = pid,
                    Label = pid,
                    RawValue = rawValue,
                    ConvertedValue = convertedValue,
                    Unit = "",
                    Timestamp = packet.Timestamp,
                    EcuAddress = pidParts.Length > 1 ? pidParts[1] : "0"
                });
            }
        }
        
        // Convert audio data if present
        if (qtpPacket.Data?.TryGetValue("s", out var audioValue) == true)
        {
            if (audioValue is List<int> audioList && audioList.Count >= 6)
            {
                packet.AudioData = new AudioData
                {
                    DurationMs = audioList[0],
                    AvgDecibels = audioList[1] / 100.0,
                    PeakDecibels = audioList[2] / 100.0,
                    FrequencyData = new FrequencyAnalysis
                    {
                        LowFreqEnergy = audioList[3] / 1000.0,
                        MidFreqEnergy = audioList[4] / 1000.0,
                        HighFreqEnergy = audioList[5] / 1000.0
                    }
                };
            }
        }
        
        return packet;
    }
    
    /// <summary>
    /// Applies the correct conversion formula based on PID type
    /// </summary>
    private static double ApplyPidFormula(string pidHex, double rawValue)
    {
        return pidHex.ToUpper() switch
        {
            // RPM - divide by 4
            "0C" => rawValue / 4.0,
            
            // Speed - no conversion (already km/h)
            "0D" => rawValue,
            
            // Temperatures - subtract 40
            "05" or "0F" or "46" => rawValue - 40,
            
            // Engine Load - percentage
            "04" => rawValue * 100.0 / 255.0,
            
            // Throttle Position - percentage  
            "11" => rawValue * 100.0 / 255.0,
            
            // Fuel Trim - percentage with offset
            "06" or "07" or "08" or "09" => (rawValue - 128) * 100.0 / 128.0,
            
            // Intake Manifold Pressure - kPa
            "0B" => rawValue,
            
            // MAF Air Flow - g/s
            "10" => rawValue * 0.01,
            
            // Timing Advance - degrees
            "0E" => rawValue / 2.0 - 64,
            
            // Odometer/Distance - km
            "31" or "21" => rawValue,
            
            // Fuel Level - percentage
            "2F" => rawValue * 100.0 / 255.0,
            
            // Control Module Voltage - volts
            "42" => rawValue * 0.001,
            
            // Barometric Pressure - kPa
            "33" => rawValue,
            
            // O2 Sensor Voltage - volts
            "14" or "15" or "16" or "17" or "18" or "19" or "1A" or "1B" => rawValue * 0.005,
            
            // Default - no conversion
            _ => rawValue
        };
    }
}
