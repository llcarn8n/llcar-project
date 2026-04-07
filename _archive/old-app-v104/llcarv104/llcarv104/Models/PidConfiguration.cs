using CommunityToolkit.Mvvm.ComponentModel;

namespace llcar.Models
{
    /// <summary>
    /// Represents a single PID configuration from pids.csv
    /// </summary>
    public class PidConfiguration
    {
        /// <summary>Service modes (e.g., "0x01,0x02")</summary>
        public string Service { get; set; } = "";
        
        /// <summary>PID in hex (e.g., "0x0C")</summary>
        public string Pid { get; set; } = "";
        
        /// <summary>Byte offset in response</summary>
        public int Offset { get; set; }
        
        /// <summary>Byte length in response</summary>
        public int Length { get; set; }
        
        /// <summary>Bit offset for bit-level extraction</summary>
        public int BitOffset { get; set; }
        
        /// <summary>Bit length for bit-level extraction</summary>
        public int BitLength { get; set; }
        
        /// <summary>Bit mask for value extraction</summary>
        public string BitMask { get; set; } = "";
        
        /// <summary>Formula name for value conversion</summary>
        public string Formula { get; set; } = "";
        
        /// <summary>Display format string</summary>
        public string Format { get; set; } = "";
        
        /// <summary>Minimum value</summary>
        public double? Min { get; set; }
        
        /// <summary>Maximum value</summary>
        public double? Max { get; set; }
        
        /// <summary>Update cycle in milliseconds</summary>
        public int UpdateCycleMs { get; set; }
        
        /// <summary>Mnemonic identifier</summary>
        public string Mnemonic { get; set; } = "";
        
        /// <summary>Human-readable label</summary>A
        public string Label { get; set; } = "";
        
        /// <summary>Description of the PID</summary>
        public string Description { get; set; } = "";
        
        /// <summary>Formula remarks/notes</summary>
        public string FormulaRemark { get; set; } = "";
        
        /// <summary>Additional options</summary>
        public string Options { get; set; } = "";
        
        /// <summary>Additional remarks</summary>
        public string Remarks { get; set; } = "";
        
        /// <summary>
        /// Gets the numeric PID value for server communication
        /// </summary>
        public int PidNumeric 
        { 
            get 
            {
                try
                {
                    if (string.IsNullOrEmpty(Pid))
                        return 0;
                    var pidHex = Pid.Replace("0x", "").Replace("0X", "");
                    if (int.TryParse(pidHex, System.Globalization.NumberStyles.HexNumber, null, out int result))
                        return result;
                    return 0;
                }
                catch
                {
                    return 0;
                }
            }
        }
        
        /// <summary>
        /// Converts raw bytes to value using the formula
        /// </summary>
        public double ConvertValue(byte[] data)
        {
            if (data == null || data.Length == 0)
                return 0;

            double rawValue = 0;
            
            // Extract value based on length and offset
            if (Length == 1)
            {
                rawValue = data[Offset];
                
                // Apply bit mask if specified
                if (!string.IsNullOrEmpty(BitMask))
                {
                    try
                    {
                        var maskHex = BitMask.Replace("0x", "").Replace("0X", "");
                        if (int.TryParse(maskHex, System.Globalization.NumberStyles.HexNumber, null, out int mask))
                        {
                            rawValue = ((int)rawValue & mask) >> BitOffset;
                        }
                    }
                    catch
                    {
                        // Ignore bit mask errors
                    }
                }
            }
            else if (Length == 2 && Offset + 1 < data.Length)
            {
                rawValue = (data[Offset] << 8) | data[Offset + 1];
            }
            
            return ApplyFormula(rawValue);
        }
        
        /// <summary>
        /// Applies the conversion formula to raw value
        /// </summary>
        private double ApplyFormula(double rawValue)
        {
            return Formula?.ToUpper() switch
            {
                "RPM" => rawValue / 4.0,                          // RPM = (A * 256 + B) / 4
                "TEMPERATURE" => rawValue - 40,                   // °C = A - 40
                "TEMP_WIDERANGE" => rawValue * 0.1 - 40,          // °C = A * 0.1 - 40
                "PERCENT" => rawValue * 100.0 / 255.0,            // % = A * 100 / 255
                "PERCENT7_REL" => (rawValue - 128) * 100.0 / 128.0, // % = (A - 128) * 100 / 128
                "PERCENT_REL" => (rawValue - 128) * 100.0 / 128.0,
                "VEHSPEED" => rawValue,                           // km/h = A
                "PRESS" => rawValue * 3,                          // kPa = A * 3
                "PRESS_AIR" => rawValue,                          // kPa = A
                "PRESS_REL" => rawValue * 0.079,                  // kPa = A * 0.079
                "PRESS_WIDERANGE" => rawValue * 10,               // kPa = A * 10
                "PRESS_VAPOR" => (rawValue - 32767) * 0.00125,    // Pa = (A - 32767) * 0.00125
                "AIRFLOW" => rawValue * 0.01,                     // g/s = (A * 256 + B) * 0.01
                "ANGLE" => rawValue / 2.0 - 64,                   // ° = A / 2 - 64
                "DISTANCE" => rawValue,                           // km = (A * 256 + B)
                "HOURS" => rawValue * 0.05,                       // hours = (A * 256 + B) * 0.05
                "O2_VOLTAGE" => rawValue * 0.005,                 // V = A * 0.005
                "O2_VOLT_WIDE" => rawValue * 0.000122,            // V = (A * 256 + B) * 0.000122
                "O2_CURRENT" => (rawValue - 32768) * 0.00390625,  // mA = (A * 256 + B - 32768) * 0.00390625
                "LAMBDA" => rawValue * 0.0000305,                 // λ = (A * 256 + B) * 0.0000305
                "FUEL_SYS_STATUS" => rawValue,
                "SEC_AIR_STATUS" => rawValue,
                "O2_PRESENT13" => rawValue,
                "O2_PRESENT_MAP" => rawValue,
                "OBD_TYPE" => rawValue,
                "OBD_CODELIST" => rawValue,
                "GEN_SWITCH" => rawValue,
                "TEST_STATUS_4" => rawValue,
                "TEST_STATUS_8" => rawValue,
                "IGN_MON_STATUS" => rawValue,
                "STATE_BIT" => rawValue,
                "ONETOONE" => rawValue,
                _ => rawValue
            };
        }
        
        /// <summary>
        /// Gets the command string to request this PID
        /// </summary>
        public string GetCommand()
        {
            // Service 0x01 -> "01", PID 0x0C -> "0C"
            var svc = Service.Split(',')[0].Replace("0x", "").Trim();
            var pidHex = Pid.Replace("0x", "").Trim();
            return $"{svc} {pidHex}";
        }
    }
    
    /// <summary>
    /// Represents a data point for server transmission
    /// </summary>
    public class PidDataPoint
    {
        /// <summary>Timestamp in format "yyyy-MM-dd HH:mm:ss"</summary>
        public string dt { get; set; } = "";

        /// <summary>PID numeric value</summary>
        public int pid { get; set; }

        /// <summary>Value (multiplied by 1000 for precision and sent as int)</summary>
        public int val { get; set; }

        /// <summary>ECU address that provided this data (e.g., "7EB", "7EC")</summary>
        public string? ecu { get; set; }
    }
    
    /// <summary>
    /// Batch data for server transmission
    /// </summary>
    public class PidDataBatch
    {
        /// <summary>Hash of VIN + mobile number</summary>
        public string thash { get; set; } = "";
        
        /// <summary>List of data points</summary>
        public List<PidDataPoint> data { get; set; } = new();
    }
    
    /// <summary>
    /// Client registration data
    /// </summary>
    public class ClientRegistration
    {
        public string changedt { get; set; } = "";
        public string thash { get; set; } = "";
        public string mobile { get; set; } = "";
        public string email { get; set; } = "";
        public string vin { get; set; } = "";
        public string brand { get; set; } = "";
        public string model { get; set; } = "";
        public int? year { get; set; }
        public string smartphone { get; set; } = "";
        public string obd2_device { get; set; } = "";
    }

    /// <summary>
    /// Display item for PID data in the vehicle monitor table
    /// </summary>
    public partial class PidDisplayItem : ObservableObject
    {
        [ObservableProperty]
        private string _name = "";
        
        [ObservableProperty]
        private string _value = "";
        
        [ObservableProperty]
        private string _pid = "";
        
        [ObservableProperty]
        private DateTime _timestamp;
    }
}
