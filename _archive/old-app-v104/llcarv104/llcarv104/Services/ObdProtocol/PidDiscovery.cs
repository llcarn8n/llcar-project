using System.Collections.ObjectModel;

namespace llcar.Services.ObdProtocol;

/// <summary>
/// Represents a discovered OBD PID
/// </summary>
public class DiscoveredPid
{
    /// <summary>PID number (0x00 - 0xFF)</summary>
    public byte Pid { get; set; }
    
    /// <summary>OBD Service mode</summary>
    public ObdService Service { get; set; }
    
    /// <summary>Human-readable description</summary>
    public string Description { get; set; } = "";
    
    /// <summary>True if PID is currently supported by the vehicle</summary>
    public bool IsSupported { get; set; }
    
    /// <summary>Last request timestamp</summary>
    public long LastRequestTime { get; set; }
    
    /// <summary>Update interval in milliseconds</summary>
    public int UpdateIntervalMs { get; set; } = 1000;

    public DiscoveredPid(byte pid, ObdService service)
    {
        Pid = pid;
        Service = service;
        Description = $"PID 0x{pid:X2}";
    }

    /// <summary>
    /// Gets the next expected request time
    /// </summary>
    public long GetNextRequestTime()
    {
        return LastRequestTime + UpdateIntervalMs;
    }
}

/// <summary>
/// Handles PID discovery and management based on AndrOBD's approach
/// </summary>
public class PidDiscovery
{
    private readonly List<DiscoveredPid> _supportedPids = new();
    private readonly object _lock = new();

    /// <summary>
    /// Gets all discovered PIDs
    /// </summary>
    public IReadOnlyList<DiscoveredPid> SupportedPids
    {
        get
        {
            lock (_lock)
            {
                return _supportedPids.ToList().AsReadOnly();
            }
        }
    }

    /// <summary>
    /// Event raised when PIDs are discovered
    /// </summary>
    public event EventHandler<PidDiscoveredEventArgs>? PidsDiscovered;

    /// <summary>
    /// Clears all discovered PIDs
    /// </summary>
    public void Clear()
    {
        lock (_lock)
        {
            _supportedPids.Clear();
        }
    }

    /// <summary>
    /// Parses a bitmask response to discover supported PIDs
    /// </summary>
    /// <param name="service">OBD Service mode</param>
    /// <param name="startPid">Starting PID (0x00, 0x20, 0x40, etc.)</param>
    /// <param name="bitmaskResponse">Hex response string (8 chars = 32 bits)</param>
    /// <returns>Number of newly discovered PIDs</returns>
    public int ParseBitmaskResponse(ObdService service, byte startPid, string bitmaskResponse)
    {
        int discovered = 0;
        
        // Clean response - remove spaces and headers
        var cleanResponse = bitmaskResponse.Replace(" ", "").Replace("\r", "").Replace("\n", "");
        
        // Find the data payload after service and PID
        // Response format: 41PPDDDDDDDD where 41 = service+0x40, PP = PID, DDDDDDDD = bitmask
        var match = System.Text.RegularExpressions.Regex.Match(cleanResponse, @"41[0-9A-Fa-f]{2}([0-9A-Fa-f]{8})");
        if (!match.Success)
        {
            // Try alternative format with spaces
            match = System.Text.RegularExpressions.Regex.Match(cleanResponse, @"41 [0-9A-Fa-f]{2} ([0-9A-Fa-f]{2} [0-9A-Fa-f]{2} [0-9A-Fa-f]{2} [0-9A-Fa-f]{2})");
            if (match.Success)
            {
                cleanResponse = match.Groups[1].Value.Replace(" ", "");
            }
            else
            {
                Log.Debug($"PidDiscovery: Could not parse bitmask from '{bitmaskResponse}'");
                return 0;
            }
        }
        else
        {
            cleanResponse = match.Groups[1].Value;
        }

        if (!long.TryParse(cleanResponse, System.Globalization.NumberStyles.HexNumber, null, out long bitmask))
        {
            Log.Debug($"PidDiscovery: Failed to parse hex '{cleanResponse}'");
            return 0;
        }

        lock (_lock)
        {
            // Clear list if this is the first bitmask (0x00)
            if (startPid == 0x00)
            {
                _supportedPids.Clear();
            }

            // Parse 32 bits - each bit represents support for PID startPid + bit_position + 1
            for (int i = 0; i < 32; i++)
            {
                if ((bitmask & (0x80000000L >> i)) != 0)
                {
                    byte pid = (byte)(startPid + i + 1);
                    
                    // Check if already exists
                    if (!_supportedPids.Any(p => p.Pid == pid && p.Service == service))
                    {
                        var discoveredPid = new DiscoveredPid(pid, service)
                        {
                            IsSupported = true,
                            Description = GetPidDescription(service, pid)
                        };
                        _supportedPids.Add(discoveredPid);
                        discovered++;
                    }
                }
            }

            Log.Debug($"PidDiscovery: Discovered {discovered} PIDs at offset 0x{startPid:X2}, total: {_supportedPids.Count}");
        }

        if (discovered > 0)
        {
            PidsDiscovered?.Invoke(this, new PidDiscoveredEventArgs 
            { 
                Service = service, 
                StartPid = startPid,
                NewPids = discovered,
                TotalPids = _supportedPids.Count
            });
        }

        // Return whether more PIDs might be available (bit 31 set)
        return discovered;
    }

    /// <summary>
    /// Checks if more PID ranges should be queried
    /// </summary>
    public static bool HasMorePids(byte startPid, string bitmaskResponse)
    {
        var cleanResponse = bitmaskResponse.Replace(" ", "").Replace("\r", "").Replace("\n", "");
        var match = System.Text.RegularExpressions.Regex.Match(cleanResponse, @"41[0-9A-Fa-f]{2}([0-9A-Fa-f]{8})");
        
        if (match.Success && long.TryParse(match.Groups[1].Value, System.Globalization.NumberStyles.HexNumber, null, out long bitmask))
        {
            // Bit 0 (LSB in the last byte) indicates if next range is supported
            return (bitmask & 0x01) != 0;
        }
        
        return false;
    }

    /// <summary>
    /// Gets the next PID to request based on update intervals
    /// </summary>
    public DiscoveredPid? GetNextPidToRequest()
    {
        lock (_lock)
        {
            if (_supportedPids.Count == 0) return null;

            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            
            // Sort by next expected request time
            var sorted = _supportedPids
                .Where(p => p.IsSupported)
                .OrderBy(p => p.GetNextRequestTime())
                .ToList();

            if (sorted.Count == 0) return null;

            var nextPid = sorted[0];
            nextPid.LastRequestTime = now;
            
            return nextPid;
        }
    }

    /// <summary>
    /// Sets fixed PIDs for faster data updates (limits to specific PIDs)
    /// </summary>
    public void SetFixedPids(IEnumerable<byte> pidList)
    {
        lock (_lock)
        {
            var pidSet = new HashSet<byte>(pidList);
            
            foreach (var pid in _supportedPids)
            {
                pid.IsSupported = pidSet.Contains(pid.Pid);
            }
            
            Log.Debug($"PidDiscovery: Set {pidSet.Count} fixed PIDs");
        }
    }

    /// <summary>
    /// Resets fixed PID filtering
    /// </summary>
    public void ResetFixedPids()
    {
        lock (_lock)
        {
            foreach (var pid in _supportedPids)
            {
                pid.IsSupported = true;
            }
        }
    }

    /// <summary>
    /// Gets a description for a PID
    /// </summary>
    private static string GetPidDescription(ObdService service, byte pid)
    {
        // Common PID descriptions
        if (service == ObdService.CurrentData || service == ObdService.FreezeFrame)
        {
            return pid switch
            {
                0x00 => "PIDs Supported [01-20]",
                0x01 => "Monitor Status",
                0x02 => "Freeze DTC",
                0x03 => "Fuel System Status",
                0x04 => "Calculated Load",
                0x05 => "Coolant Temperature",
                0x06 => "Short Term Fuel Trim (Bank 1)",
                0x07 => "Long Term Fuel Trim (Bank 1)",
                0x08 => "Short Term Fuel Trim (Bank 2)",
                0x09 => "Long Term Fuel Trim (Bank 2)",
                0x0A => "Fuel Pressure",
                0x0B => "Intake Manifold Pressure",
                0x0C => "Engine RPM",
                0x0D => "Vehicle Speed",
                0x0E => "Timing Advance",
                0x0F => "Intake Air Temperature",
                0x10 => "MAF Air Flow Rate",
                0x11 => "Throttle Position",
                0x12 => "Commanded Secondary Air Status",
                0x13 => "O2 Sensors Present",
                0x14 => "O2 Sensor 1 Voltage",
                0x15 => "O2 Sensor 2 Voltage",
                0x1C => "OBD Standards",
                0x1F => "Run Time Since Start",
                0x20 => "PIDs Supported [21-40]",
                0x21 => "Distance with MIL",
                0x22 => "Fuel Rail Pressure",
                0x23 => "Fuel Rail Gauge Pressure",
                0x24 => "O2 Sensor 1 Lambda",
                0x2F => "Fuel Level Input",
                0x31 => "Distance Since Clear",
                0x33 => "Barometric Pressure",
                0x40 => "PIDs Supported [41-60]",
                0x42 => "Control Module Voltage",
                0x43 => "Absolute Load Value",
                0x44 => "Commanded Equivalence Ratio",
                0x45 => "Relative Throttle Position",
                0x46 => "Ambient Air Temperature",
                0x47 => "Throttle Position B",
                0x48 => "Throttle Position C",
                0x49 => "Accelerator Position D",
                0x4A => "Accelerator Position E",
                0x4B => "Accelerator Position F",
                0x4C => "Commanded Throttle Actuator",
                0x60 => "PIDs Supported [61-80]",
                _ => $"PID 0x{pid:X2}"
            };
        }

        return $"PID 0x{pid:X2}";
    }
}

/// <summary>
/// Event args for PID discovery
/// </summary>
public class PidDiscoveredEventArgs : EventArgs
{
    public ObdService Service { get; set; }
    public byte StartPid { get; set; }
    public int NewPids { get; set; }
    public int TotalPids { get; set; }
}
