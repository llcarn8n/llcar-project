namespace llcar.Services.ObdProtocol;

/// <summary>
/// Represents a Diagnostic Trouble Code
/// </summary>
public class TroubleCode
{
    /// <summary>DTC code (e.g., "P0101")</summary>
    public string Code { get; set; } = "";
    
    /// <summary>Description of the code</summary>
    public string Description { get; set; } = "";
    
    /// <summary>Category: P=Powertrain, B=Body, C=Chassis, U=Network</summary>
    public char Category { get; set; }
    
    /// <summary>Type: 0=Generic, 1=Manufacturer</summary>
    public int Type { get; set; }
    
    /// <summary>Service that reported this code</summary>
    public ObdService Source { get; set; }
    
    /// <summary>True if MIL is on for this code</summary>
    public bool IsMilOn { get; set; }

    public override string ToString() => Code;
}

/// <summary>
/// Handles Diagnostic Trouble Code parsing and management
/// </summary>
public class DiagnosticTroubleCodeHandler
{
    private readonly List<TroubleCode> _troubleCodes = new();
    private readonly object _lock = new();

    /// <summary>
    /// Gets all stored trouble codes
    /// </summary>
    public IReadOnlyList<TroubleCode> TroubleCodes
    {
        get
        {
            lock (_lock)
            {
                return _troubleCodes.ToList().AsReadOnly();
            }
        }
    }

    /// <summary>
    /// Number of trouble codes stored
    /// </summary>
    public int Count
    {
        get
        {
            lock (_lock)
            {
                return _troubleCodes.Count;
            }
        }
    }

    /// <summary>
    /// True if MIL (Check Engine Light) is on
    /// </summary>
    public bool IsMilOn => _troubleCodes.Any(tc => tc.IsMilOn);

    /// <summary>
    /// Event raised when trouble codes are updated
    /// </summary>
    public event EventHandler? TroubleCodesUpdated;

    /// <summary>
    /// Clears all trouble codes
    /// </summary>
    public void Clear()
    {
        lock (_lock)
        {
            _troubleCodes.Clear();
        }
        TroubleCodesUpdated?.Invoke(this, EventArgs.Empty);
    }

    /// <summary>
    /// Parses DTC response from mode 03, 07, or 0A
    /// </summary>
    /// <param name="response">Response string from adapter</param>
    /// <param name="service">Service mode that was requested</param>
    public void ParseDtcResponse(string response, ObdService service)
    {
        lock (_lock)
        {
            // Clear existing codes if this is mode 03 (current codes)
            if (service == ObdService.ReadTroubleCodes)
            {
                _troubleCodes.RemoveAll(tc => tc.Source == ObdService.ReadTroubleCodes);
            }
            else if (service == ObdService.PendingTroubleCodes)
            {
                _troubleCodes.RemoveAll(tc => tc.Source == ObdService.PendingTroubleCodes);
            }
            else if (service == ObdService.PermanentTroubleCodes)
            {
                _troubleCodes.RemoveAll(tc => tc.Source == ObdService.PermanentTroubleCodes);
            }
        }

        // Clean response
        var cleanResponse = response.Replace(" ", "").Replace("\r", "").Replace("\n", "");
        
        // Parse response based on service
        // Response format for mode 03: 43XXDDDDCCCC...
        // Where XX = number of codes, DDDD = DTC codes in 16-bit hex
        
        string pattern = service switch
        {
            ObdService.ReadTroubleCodes => @"43([0-9A-Fa-f]{2})([0-9A-Fa-f]*)",
            ObdService.PendingTroubleCodes => @"47([0-9A-Fa-f]{2})([0-9A-Fa-f]*)",
            ObdService.PermanentTroubleCodes => @"4A([0-9A-Fa-f]{2})([0-9A-Fa-f]*)",
            _ => @"43([0-9A-Fa-f]{2})([0-9A-Fa-f]*)"
        };

        var match = System.Text.RegularExpressions.Regex.Match(cleanResponse, pattern);
        if (!match.Success)
        {
            Log.Debug($"DTC: Failed to parse response: {response}");
            return;
        }

        // Parse number of codes (upper byte = MIL + number of codes)
        if (int.TryParse(match.Groups[1].Value, System.Globalization.NumberStyles.HexNumber, null, out int numCodesInfo))
        {
            bool milOn = (numCodesInfo & 0x80) != 0;
            int numCodes = numCodesInfo & 0x7F;
            
            Log.Debug($"DTC: MIL={(milOn ? "ON" : "OFF")}, Count={numCodes}");
        }

        // Parse DTC codes
        var dtcData = match.Groups[2].Value;
        int newCodes = 0;

        for (int i = 0; i + 4 <= dtcData.Length; i += 4)
        {
            var dtcHex = dtcData.Substring(i, 4);
            var dtc = ParseDtcHex(dtcHex, service);
            
            if (dtc != null && !string.IsNullOrEmpty(dtc.Code) && dtc.Code != "P0000")
            {
                lock (_lock)
                {
                    // Check for duplicates
                    if (!_troubleCodes.Any(tc => tc.Code == dtc.Code && tc.Source == dtc.Source))
                    {
                        _troubleCodes.Add(dtc);
                        newCodes++;
                    }
                }
            }
        }

        Log.Debug($"DTC: Parsed {newCodes} new codes from {service}");
        
        if (newCodes > 0)
        {
            TroubleCodesUpdated?.Invoke(this, EventArgs.Empty);
        }
    }

    /// <summary>
    /// Parses a 2-byte DTC hex string to TroubleCode
    /// </summary>
    private static TroubleCode? ParseDtcHex(string hex, ObdService source)
    {
        if (hex.Length != 4 || !ushort.TryParse(hex, System.Globalization.NumberStyles.HexNumber, null, out ushort dtcValue))
        {
            return null;
        }

        if (dtcValue == 0) return null;

        // First byte: category and first digit
        // 00-03 = P0xxx, 04-07 = C0xxx, 08-0B = B0xxx, 0C-0F = U0xxx
        // 40-43 = P1xxx, 44-47 = C1xxx, 48-4B = B1xxx, 4C-4F = U1xxx
        // 80-83 = P2xxx, ...
        // C0-C3 = P3xxx, ...
        
        var category = (dtcValue >> 14) & 0x03;
        char categoryChar = category switch
        {
            0 => 'P',  // Powertrain
            1 => 'C',  // Chassis
            2 => 'B',  // Body
            3 => 'U',  // Network
            _ => 'P'
        };

        // Type (0 = generic, 1 = manufacturer)
        int type = (dtcValue >> 12) & 0x03;
        
        // Remaining 12 bits are the code
        int codeNum = dtcValue & 0x0FFF;
        
        var code = $"{categoryChar}{type}{codeNum:X3}";
        
        return new TroubleCode
        {
            Code = code,
            Category = categoryChar,
            Type = type,
            Source = source,
            Description = GetDtcDescription(code)
        };
    }

    /// <summary>
    /// Gets a description for a DTC code
    /// </summary>
    private static string GetDtcDescription(string code)
    {
        // Common OBD-II codes
        return code switch
        {
            "P0000" => "No trouble codes",
            "P0100" => "Mass Airflow Sensor Circuit",
            "P0101" => "Mass Airflow Sensor Range/Performance",
            "P0102" => "Mass Airflow Sensor Low Input",
            "P0103" => "Mass Airflow Sensor High Input",
            "P0104" => "Mass Airflow Sensor Intermittent",
            "P0105" => "Manifold Absolute Pressure Circuit",
            "P0106" => "Manifold Absolute Pressure Range/Performance",
            "P0107" => "Manifold Absolute Pressure Low Input",
            "P0108" => "Manifold Absolute Pressure High Input",
            "P0110" => "Intake Air Temperature Circuit",
            "P0111" => "Intake Air Temperature Range/Performance",
            "P0112" => "Intake Air Temperature Low Input",
            "P0113" => "Intake Air Temperature High Input",
            "P0115" => "Engine Coolant Temperature Circuit",
            "P0116" => "Engine Coolant Temperature Range/Performance",
            "P0117" => "Engine Coolant Temperature Low Input",
            "P0118" => "Engine Coolant Temperature High Input",
            "P0120" => "Throttle Position Sensor Circuit",
            "P0121" => "Throttle Position Sensor Range/Performance",
            "P0122" => "Throttle Position Sensor Low Input",
            "P0123" => "Throttle Position Sensor High Input",
            "P0130" => "O2 Sensor Circuit (Bank 1, Sensor 1)",
            "P0131" => "O2 Sensor Low Voltage (Bank 1, Sensor 1)",
            "P0132" => "O2 Sensor High Voltage (Bank 1, Sensor 1)",
            "P0133" => "O2 Sensor Slow Response (Bank 1, Sensor 1)",
            "P0134" => "O2 Sensor No Activity (Bank 1, Sensor 1)",
            "P0135" => "O2 Sensor Heater Circuit (Bank 1, Sensor 1)",
            "P0171" => "System Too Lean (Bank 1)",
            "P0172" => "System Too Rich (Bank 1)",
            "P0300" => "Random/Multiple Cylinder Misfire",
            "P0301" => "Cylinder 1 Misfire",
            "P0302" => "Cylinder 2 Misfire",
            "P0303" => "Cylinder 3 Misfire",
            "P0304" => "Cylinder 4 Misfire",
            "P0305" => "Cylinder 5 Misfire",
            "P0306" => "Cylinder 6 Misfire",
            "P0307" => "Cylinder 7 Misfire",
            "P0308" => "Cylinder 8 Misfire",
            "P0420" => "Catalyst System Efficiency Below Threshold",
            "P0440" => "Evaporative Emission Control System",
            "P0442" => "Evaporative Emission Control System Leak (Small)",
            "P0455" => "Evaporative Emission Control System Leak (Large)",
            "P0500" => "Vehicle Speed Sensor",
            "P0505" => "Idle Control System",
            "P0600" => "Serial Communication Link",
            "P0601" => "Internal Control Module Memory Checksum Error",
            "P0602" => "Control Module Programming Error",
            "P0700" => "Transmission Control System Malfunction",
            _ => "Unknown/Custom Code"
        };
    }

    /// <summary>
    /// Gets commands to read all trouble code types
    /// </summary>
    public static List<ObdCommand> GetReadDtcCommands()
    {
        return new List<ObdCommand>
        {
            new ObdCommand("03", "Read stored trouble codes", TimeSpan.FromMilliseconds(2000)),
            new ObdCommand("07", "Read pending trouble codes", TimeSpan.FromMilliseconds(2000)),
            new ObdCommand("0A", "Read permanent trouble codes", TimeSpan.FromMilliseconds(2000))
        };
    }

    /// <summary>
    /// Gets command to clear trouble codes
    /// </summary>
    public static ObdCommand GetClearDtcCommand()
    {
        return new ObdCommand("04", "Clear trouble codes", TimeSpan.FromMilliseconds(5000))
        {
            ExpectedResponses = new[] { "OK", ">" }
        };
    }
}
