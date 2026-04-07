using llcar.Models;
using llcar.Services.ObdProtocol;
using Plugin.BLE.Abstractions.Contracts;

namespace llcar.Services;

/// <summary>
/// Result of OBD command execution including ECU masks for all observed PIDs
/// </summary>
public class ObdCommandResult
{
    /// <summary>
    /// Response data for the requested PID only
    /// </summary>
    public string Response { get; set; } = "";
    
    /// <summary>
    /// ECU masks organized by PID (Key = PID like 0x0C, Value = ECU mask with bits for 7E8-7EF)
    /// </summary>
    public Dictionary<byte, byte> EcuMasksByPid { get; set; } = new();
    
    /// <summary>
    /// Total time elapsed for command execution
    /// </summary>
    public TimeSpan Elapsed { get; set; }
}

/// <summary>
/// Operating mode for Bluetooth OBD2 service
/// </summary>
public enum ObdServiceMode
{
    /// <summary>Interactive setup mode - data goes to UI</summary>
    Setup,
    /// <summary>Background data collection mode - data isolated</summary>
    Background
}

/// <summary>
/// Improved Bluetooth OBD2 service interface based on AndrOBD architecture
/// </summary>
public interface IBluetoothOBD2Service
{
    // Connection Properties
    bool IsConnected { get; }
    bool IsInitialized { get; }
    /// <summary>
    /// Returns true if a connection attempt is currently in progress
    /// </summary>
    bool IsConnecting { get; }
    string? DeviceName { get; }
    ObdState State { get; }
    IAdapter? Adapter { get; }
    IDevice? Device { get; }
    
    /// <summary>
    /// Current operating mode - affects where data is routed
    /// </summary>
    ObdServiceMode CurrentMode { get; set; }

    // Protocol Handlers
    ElmProtocolHandler? ProtocolHandler { get; }
    AdaptiveTiming? AdaptiveTiming { get; }
    PidDiscovery? PidDiscovery { get; }
    DiagnosticTroubleCodeHandler? DtcHandler { get; }

    // Events
    event EventHandler<OBD2Data>? DataReceived;
    event EventHandler<ObdStateChangedEventArgs>? StateChanged;
    event EventHandler<PidDataReceivedEventArgs>? PidDataReceived;
    event EventHandler<string>? RawDataReceived;
    /// <summary>
    /// Fired when a command is transmitted to ELM327
    /// </summary>
    event EventHandler<string>? CommandSent;
    event EventHandler? ConnectionLost;
    /// <summary>
    /// Fired when Bluetooth adapter is successfully connected and initialized
    /// </summary>
    event EventHandler? Connected;

    // Connection Management
    Task<bool> ConnectAsync(string adapterName);
    Task<bool> DisconnectAsync();
    Task<bool> InitializeAsync(ElmProtocol preferredProtocol = ElmProtocol.Automatic);
    Task<(bool success, string message)> InitializeAdapterAsync(List<InitializationCommand>? brandCommands = null);
    Task<string[]> GetAvailableAdaptersAsync();
    Task<string[]> GetELM327AdaptersAsync(bool fullScan = false, bool showAllDevices = false, Action<string>? onDeviceDiscovered = null);

    // Data Reading
    Task<OBD2Data> GetOBD2DataAsync();
    Task<double?> ReadPidValueAsync(byte service, byte pid, CancellationToken ct = default);
    Task<(byte[]? Data, string EcuAddress)> ReadPidRawAsync(byte service, byte pid, CancellationToken ct = default);
    
    /// <summary>
    /// Reads PID raw data from ALL responding ECUs
    /// </summary>
    /// <param name="expectedEcuMask">Expected ECU bitmask for early exit (bit 0=7E8, bit 1=7E9, etc.)</param>
    /// <returns>Tuple with list of (Data, EcuAddress) for each ECU that responded, and dictionary of ECU masks by PID</returns>
    Task<(List<(byte[] Data, string EcuAddress)> Responses, Dictionary<byte, byte> EcuMasksByPid)> ReadPidRawFromAllEcusAsync(byte service, byte pid, byte expectedEcuMask = 0, CancellationToken ct = default);
    
    /// <summary>
    /// Reads Vehicle Identification Number (VIN) from ECU using Service 09 PID 02
    /// </summary>
    /// <returns>VIN string or null if not available</returns>
    Task<string?> ReadVinAsync(CancellationToken ct = default);

    /// <summary>
    /// Test command to measure ELM327 response latency
    /// Sends ATI command and measures round-trip time
    /// </summary>
    /// <returns>Tuple with success status and latency in milliseconds</returns>
    Task<(bool success, double latencyMs)> TestLatencyAsync(CancellationToken ct = default);

    // Command Interface
    Task<string> SendCommandAsync(string command, CancellationToken ct = default);
    Task<string> SendCommandAsync(ObdCommand command, CancellationToken ct = default);
    
    /// <summary>
    /// Sends a command and assembles multi-frame ISO-TP responses automatically
    /// Returns both response data and ECU masks for all observed PIDs
    /// </summary>
    /// <param name="expectedEcuMask">Expected ECU bitmask for early exit (bit 0=7E8, bit 1=7E9, etc.)</param>
    Task<ObdCommandResult> SendCommandWithMultiFrameSupportAsync(ObdCommand command, byte expectedEcuMask = 0, CancellationToken ct = default);

    // PID Discovery
    Task<bool> StartPidDiscoveryAsync(ObdService service = ObdService.CurrentData);
    void SetFixedPids(IEnumerable<byte> pids);
    void ResetFixedPids();

    // DTC Operations
    Task ReadTroubleCodesAsync();
    Task ClearTroubleCodesAsync();
    Task<List<DiagnosticTroubleCode>> GetDiagnosticTroubleCodesAsync(CancellationToken ct = default);

    // Cache Management
    void InvalidateCache();
    
    /// <summary>
    /// Acquires the command lock to serialize access to ELM327
    /// This prevents "STOPPED" responses when commands overlap
    /// </summary>
    /// <param name="ct">Cancellation token</param>
    /// <returns>Task that completes when lock is acquired</returns>
    Task AcquireCommandLockAsync(CancellationToken ct = default);
    
    /// <summary>
    /// Tries to acquire the command lock without waiting
    /// </summary>
    /// <param name="ct">Cancellation token</param>
    /// <returns>True if lock was acquired, false if lock is already held</returns>
    Task<bool> TryAcquireCommandLockAsync(CancellationToken ct = default);
    
    /// <summary>
    /// Releases the command lock
    /// </summary>
    void ReleaseCommandLock();

    // Data Streaming
    Task<bool> StartDataStreamAsync(CancellationToken ct = default);
    void StopDataStream();
    Task<bool> StartListeningAsync();  // Legacy, use StartDataStreamAsync
    void StopListening();              // Legacy, use StopDataStream
}

/// <summary>
/// Configuration for OBD2 connection
/// </summary>
public class ObdConnectionConfig
{
    /// <summary>Preferred ELM protocol</summary>
    public ElmProtocol PreferredProtocol { get; set; } = ElmProtocol.Automatic;
    
    /// <summary>Adaptive timing mode</summary>
    public AdaptiveTimingMode AdaptiveTimingMode { get; set; } = AdaptiveTimingMode.Software;
    
    /// <summary>Initial timeout for responses</summary>
    public int InitialTimeoutMs { get; set; } = 500;
    
    /// <summary>Maximum timeout for responses</summary>
    public int MaxTimeoutMs { get; set; } = 2000;
    
    /// <summary>Delay after connection before initialization</summary>
    public int ConnectionDelayMs { get; set; } = 500;
    
    /// <summary>Enable automatic PID discovery</summary>
    public bool AutoDiscoverPids { get; set; } = true;
    
    /// <summary>Data polling interval in milliseconds</summary>
    public int PollingIntervalMs { get; set; } = 100;
}
