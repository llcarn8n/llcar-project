#if WINDOWS
using llcar.Models;
using llcar.Services.ObdProtocol;
using Plugin.BLE;
using Plugin.BLE.Abstractions;
using Plugin.BLE.Abstractions.Contracts;
using Plugin.BLE.Abstractions.EventArgs;
using System.Collections.Concurrent;
using System.IO;
using System.Linq;
using System.Text;

namespace llcar.Services;

/// <summary>
/// Improved Windows Bluetooth OBD2 service using ElmProtocolHandler
/// Based on AndrOBD's architecture
/// </summary>
public class WindowsBluetoothOBD2Service : IBluetoothOBD2Service
{
    // Static reference to current instance (for cache invalidation)
    public static IBluetoothOBD2Service? Current { get; private set; }
    
    // Logging
    private static void LogToFile(string message)
    {
        try
        {
            string logDir = FileSystem.Current.AppDataDirectory;
            Directory.CreateDirectory(logDir);
            string logPath = Path.Combine(logDir, "bt_debug.log");
            File.AppendAllText(logPath, $"{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff} - {message}{Environment.NewLine}");
        }
        catch { }
    }

    // Bluetooth components
    private IAdapter? _adapter;
    private IDevice? _device;
    private IService? _service;
    private ICharacteristic? _txCharacteristic;
    private ICharacteristic? _rxCharacteristic;

    // Protocol handling
    private readonly ElmProtocolHandler _protocolHandler = new();
    private ObdConnectionConfig _config = new();

    // Streaming
    private CancellationTokenSource? _streamCts;
    private Task? _streamTask;
    private readonly StringBuilder _receiveBuffer = new();
    
    // Command/Response correlation for background service
    private readonly ConcurrentQueue<(string command, TaskCompletionSource<string> tcs)> _pendingCommands = new();
    private readonly SemaphoreSlim _commandLock = new(1, 1);

    // Configuration
    private readonly string[] _obdServiceUuids = new[]
    {
        "00001101-0000-1000-8000-00805F9B34FB",
        "0000fff0-0000-1000-8000-00805f9b34fb",
        "0000FFF0-0000-1000-8000-00805F9B34FB",
        "0000ae00-0000-1000-8000-00805f9b34fb"
    };

    private readonly string[] _txCharacteristicUuids = new[]
    {
        "0000110A-0000-1000-8000-00805F9B34FB",
        "0000fff1-0000-1000-8000-00805f9b34fb",
        "0000FFF1-0000-1000-8000-00805F9B34FB",
        "0000ae01-0000-1000-8000-00805f9b34fb"
    };

    private readonly string[] _rxCharacteristicUuids = new[]
    {
        "0000110B-0000-1000-8000-00805F9B34FB",
        "0000fff2-0000-1000-8000-00805f9b34fb",
        "0000FFF2-0000-1000-8000-00805F9B34FB",
        "0000ae02-0000-1000-8000-00805f9b34fb"
    };

    // Properties
    public bool IsConnected => _device != null && _device.State == DeviceState.Connected;
    public bool IsInitialized => _protocolHandler.State >= ObdState.Initialized;
    public bool IsConnecting => false; // TODO: Implement for Windows if needed
    public string? DeviceName => _device?.Name;
    public ObdState State => _protocolHandler.State;
    public IAdapter? Adapter => _adapter;
    public IDevice? Device => _device;
    
    /// <summary>
    /// Current operating mode - affects where data is routed
    /// </summary>
    public ObdServiceMode CurrentMode { get; set; } = ObdServiceMode.Setup;

    public ElmProtocolHandler? ProtocolHandler => _protocolHandler;
    public AdaptiveTiming? AdaptiveTiming => _protocolHandler.AdaptiveTiming;
    public PidDiscovery? PidDiscovery => _protocolHandler.PidDiscovery;
    public DiagnosticTroubleCodeHandler? DtcHandler => _protocolHandler.DtcHandler;

    // Events
    public event EventHandler<OBD2Data>? DataReceived;
    public event EventHandler<ObdStateChangedEventArgs>? StateChanged;
    public event EventHandler<PidDataReceivedEventArgs>? PidDataReceived;
    public event EventHandler<string>? RawDataReceived;
    public event EventHandler<string>? CommandSent;  // NEW: Fired when command is transmitted
    public event EventHandler? ConnectionLost;

    public WindowsBluetoothOBD2Service()
    {
        // Set static reference
        Current = this;
        
        _protocolHandler.StateChanged += (s, e) => StateChanged?.Invoke(this, e);
        _protocolHandler.PidDataReceived += (s, e) => PidDataReceived?.Invoke(this, e);
        _protocolHandler.RawDataReceived += (s, e) =>
        {
            // In Background mode, only forward data from the protocol handler itself
            // This prevents Settings page from receiving background service data
            if (CurrentMode == ObdServiceMode.Background && s is not ElmProtocolHandler)
            {
                return; // Ignore events from external sources in background mode
            }
            RawDataReceived?.Invoke(this, e.Data);
        };
    }

    #region Connection Management

    public async Task<bool> ConnectAsync(string adapterName)
    {
        try
        {
            LogToFile($"Connecting to {adapterName}");

            // Check Bluetooth availability
            if (!CrossBluetoothLE.Current.IsAvailable)
            {
                LogToFile("ERROR: Bluetooth not available");
                return false;
            }

            if (!CrossBluetoothLE.Current.IsOn)
            {
                LogToFile("ERROR: Bluetooth is off");
                return false;
            }

            _adapter = CrossBluetoothLE.Current.Adapter;
            if (_adapter == null)
            {
                LogToFile("ERROR: Adapter is null");
                return false;
            }

            // Find device
            var device = await FindDeviceAsync(adapterName);
            if (device == null)
            {
                LogToFile($"ERROR: Device '{adapterName}' not found");
                return false;
            }

            _device = device;

            // Connect
            LogToFile("Connecting to device...");
            await _adapter.ConnectToDeviceAsync(_device);
            LogToFile("Device connected");

            // AndrOBD: Delay connection for 500ms (Fix issue #233)
            await Task.Delay(500);

            // Discover services
            if (!await DiscoverServicesAndCharacteristicsAsync())
            {
                LogToFile("ERROR: Service discovery failed");
                await DisconnectAsync();
                return false;
            }

            // Start notifications
            if (_rxCharacteristic != null)
            {
                _rxCharacteristic.ValueUpdated += OnCharacteristicValueChanged;
                await _rxCharacteristic.StartUpdatesAsync();
                LogToFile("Started receiving notifications");
            }

            LogToFile("Connection successful");
            return true;
        }
        catch (Exception ex)
        {
            LogToFile($"ERROR: Connection failed - {ex.Message}");
            await DisconnectAsync();
            return false;
        }
    }

    public async Task<bool> DisconnectAsync()
    {
        try
        {
            StopDataStream();

            if (_rxCharacteristic != null)
            {
                _rxCharacteristic.ValueUpdated -= OnCharacteristicValueChanged;
                await _rxCharacteristic.StopUpdatesAsync();
            }

            if (_device != null && _adapter != null)
            {
                await _adapter.DisconnectDeviceAsync(_device);
            }

            _protocolHandler.Reset();

            _device = null;
            _service = null;
            _txCharacteristic = null;
            _rxCharacteristic = null;

            return true;
        }
        catch (Exception ex)
        {
            LogToFile($"ERROR: Disconnect failed - {ex.Message}");
            return false;
        }
    }

    public async Task<bool> InitializeAsync(ElmProtocol preferredProtocol = ElmProtocol.Automatic)
    {
        if (!IsConnected)
        {
            LogToFile("ERROR: Cannot initialize - not connected");
            return false;
        }

        try
        {
            _config.PreferredProtocol = preferredProtocol;
            _protocolHandler.Initialize(preferredProtocol);

            LogToFile($"Initializing with protocol {preferredProtocol}...");

            // Process initialization commands
            var timeout = DateTime.Now.AddSeconds(30);
            while (_protocolHandler.State < ObdState.EcuDetected && DateTime.Now < timeout)
            {
                var command = _protocolHandler.GetNextCommand();
                if (command != null)
                {
                    LogToFile($"Sending: {command.Command} - {command.Description}");
                    await SendCommandInternalAsync(command.Command);
                    
                    // Wait for response
                    var cmdTimeout = DateTime.Now.Add(command.Timeout);
                    while (_protocolHandler.CommandQueue.CurrentCommand == command && DateTime.Now < cmdTimeout)
                    {
                        await Task.Delay(10);
                    }
                }
                else
                {
                    await Task.Delay(50);
                }
            }

            bool success = _protocolHandler.State >= ObdState.EcuDetected;
            LogToFile($"Initialization {(success ? "successful" : "failed")} - State: {_protocolHandler.State}");
            
            return success;
        }
        catch (Exception ex)
        {
            LogToFile($"ERROR: Initialization failed - {ex.Message}");
            return false;
        }
    }
    
    public async Task<(bool success, string message)> InitializeAdapterAsync(List<InitializationCommand>? brandCommands = null)
    {
        if (!IsConnected)
        {
            return (false, "Not connected to adapter");
        }

        try
        {
            LogToFile("=== Starting OBD2 Adapter Initialization ===");
            string response;

            // If brand-specific commands are provided, use them
            if (brandCommands != null && brandCommands.Count > 0)
            {
                LogToFile($"Using brand-specific initialization with {brandCommands.Count} commands");
                
                foreach (var cmd in brandCommands.OrderBy(c => c.step))
                {
                    LogToFile($"Step {cmd.step}: {cmd.description} ({cmd.command})");
                    
                    // Send command
                    await SendCommandAsync(cmd.command);
                    await Task.Delay(100);
                    
                    // Wait for response with timeout
                    var timeout = TimeSpan.FromMilliseconds(cmd.timeoutMs);
                    response = await WaitForResponseAsync(timeout);
                    LogToFile($"Response: {response}");
                    
                    // Validate response for critical commands
                    if (cmd.step == 1) // ATZ - Reset
                    {
                        if (string.IsNullOrWhiteSpace(response) || response.Trim() == ".")
                        {
                            LogToFile("ERROR: ATZ received no response or invalid response (.)");
                            return (false, "Failed to reset adapter (ATZ): No response or invalid response");
                        }
                        
                        if (!response.Contains("ELM") && !response.Contains("OK") && !response.Contains(">"))
                        {
                            LogToFile("ERROR: ATZ did not receive expected response (ELM, OK, or >)");
                            return (false, "Failed to reset adapter (ATZ): Unexpected response");
                        }
                    }
                    else if (cmd.command == "0100") // Query PIDs
                    {
                        if (string.IsNullOrWhiteSpace(response))
                        {
                            LogToFile("ERROR: No response from ECU (0100)");
                            return (false, "No response from ECU (0100)");
                        }
                    }
                    
                    // Small delay between commands
                    if (cmd.step < brandCommands.Count)
                    {
                        await Task.Delay(50);
                    }
                }
                
                LogToFile("=== Brand-specific OBD2 Adapter Initialization Complete ===");
                return (true, "Adapter initialized successfully with brand-specific settings");
            }
            
            // Fallback to default initialization
            LogToFile("Using default initialization (no brand specified)");

            // Step 1: Send ATZ and wait for OK (shorter timeout)
            LogToFile("Step 1: Sending ATZ (Reset)...");
            await SendCommandAsync("ATZ");
            await Task.Delay(500); // Wait for adapter to process
            response = await WaitForResponseAsync(TimeSpan.FromSeconds(2));
            LogToFile($"ATZ Response: {response}");
            
            if (string.IsNullOrWhiteSpace(response) || response.Trim() == ".")
            {
                LogToFile("ERROR: ATZ received no response or invalid response (.)");
                return (false, "Failed to reset adapter (ATZ): No response or invalid response");
            }
            
            if (!response.Contains("ELM") && !response.Contains("OK") && !response.Contains(">"))
            {
                LogToFile("ERROR: ATZ did not receive expected response (ELM, OK, or >)");
                return (false, "Failed to reset adapter (ATZ): Unexpected response");
            }

            // Step 2: Configure adapter (send all commands without waiting for each response)
            LogToFile("Step 2: Sending configuration commands...");
            
            // Echo Off
            await SendCommandAsync("ATE0");
            await Task.Delay(50);
            
            // Linefeeds Off
            await SendCommandAsync("ATL0");
            await Task.Delay(50);
            
            // Spaces Off
            await SendCommandAsync("ATS0");
            await Task.Delay(50);
            
            // Adaptive Timing Off
            await SendCommandAsync("ATAT0");
            await Task.Delay(50);
            
            // Auto Protocol
            await SendCommandAsync("ATSP0");
            await Task.Delay(50);
            
            // Headers On
            await SendCommandAsync("ATH1");
            await Task.Delay(200); // Give time for all config commands to process
            
            // Clear any pending responses
            await WaitForResponseAsync(TimeSpan.FromMilliseconds(500));

            // Step 3: Query ECU with 0100
            LogToFile("Step 3: Querying ECU with 0100...");
            await SendCommandAsync("0100");
            await Task.Delay(200);
            response = await WaitForResponseAsync(TimeSpan.FromSeconds(3));
            LogToFile($"0100 Response: {response}");
            
            if (string.IsNullOrWhiteSpace(response))
            {
                LogToFile("ERROR: No response from ECU (0100)");
                return (false, "No response from ECU (0100)");
            }

            // Step 4: Wait for prompt character '>'
            LogToFile("Step 4: Waiting for prompt (>))...");
            var promptReceived = await WaitForPromptAsync(TimeSpan.FromSeconds(2));
            
            if (!promptReceived)
            {
                LogToFile("WARNING: Prompt character '>' not received, but continuing...");
                // Don't fail here, some adapters work without explicit prompt
            }

            LogToFile("=== OBD2 Adapter Initialization Complete ===");
            return (true, "Adapter initialized successfully");
        }
        catch (Exception ex)
        {
            LogToFile($"Initialization error: {ex.Message}");
            return (false, $"Initialization error: {ex.Message}");
        }
    }

    #endregion

    #region Device Discovery

    public async Task<string[]> GetAvailableAdaptersAsync()
    {
        var adapters = new List<string>();
        
        try
        {
            _adapter = CrossBluetoothLE.Current.Adapter;
            if (_adapter == null) return Array.Empty<string>();

            var devices = _adapter.GetSystemConnectedOrPairedDevices();
            adapters.AddRange(devices
                .Where(d => d.Name?.Contains("OBD", StringComparison.OrdinalIgnoreCase) == true ||
                           d.Name?.Contains("ELM", StringComparison.OrdinalIgnoreCase) == true)
                .Select(d => d.Name ?? "Unknown"));
        }
        catch (Exception ex)
        {
            LogToFile($"GetAvailableAdapters error: {ex.Message}");
        }

        return adapters.ToArray();
    }

    // Cache for discovered adapters (valid for 30 seconds)
    private List<string>? _cachedAdapters;
    private DateTime _cacheTimestamp;
    private const int CacheDurationMs = 300000; // 5 minutes (was 30 seconds)

    /// <summary>
    /// Invalidate the adapter cache to force a new scan
    /// </summary>
    public static void InvalidateAdapterCache()
    {
        if (Current is WindowsBluetoothOBD2Service service)
        {
            service._cachedAdapters = null;
            Log.Debug("[BT_SERVICE] Adapter cache invalidated");
        }
    }

    /// <summary>
    /// Instance method to invalidate cache (called from interface)
    /// </summary>
    public void InvalidateCache()
    {
        _cachedAdapters = null;
        Log.Debug("[BT_SERVICE] Adapter cache invalidated (instance method)");
    }

    public async Task<string[]> GetELM327AdaptersAsync(bool fullScan = false, bool showAllDevices = false, Action<string>? onDeviceDiscovered = null)
    {
        // Cache disabled to ensure fresh scan every time - prevents showing disconnected devices
        // and ensures newly connected devices appear immediately
        Log.Debug($"[BT_SERVICE] Scanning for ELM327 adapters... Full scan: {fullScan}, ShowAll: {showAllDevices}");
        var adapters = new List<string>();

        try
        {
            _adapter = CrossBluetoothLE.Current.Adapter;
            if (_adapter == null) return Array.Empty<string>();

            var discovered = new List<IDevice>();
            var allDevices = _adapter.GetSystemConnectedOrPairedDevices().ToList();

            Log.Debug($"[BT_SERVICE] Found {allDevices.Count} paired devices");

            // Scan for new devices (shorter scan time for faster response)
            void OnDeviceDiscovered(object? s, DeviceEventArgs e)
            {
                if (e.Device != null && !discovered.Any(d => d.Id == e.Device.Id))
                {
                    var displayName = !string.IsNullOrEmpty(e.Device.Name) ? e.Device.Name : $"Unknown ({e.Device.Id.ToString().Substring(0, 8)}...)";
                    discovered.Add(e.Device);
                    Log.Debug($"[BT_SERVICE] Discovered: {displayName}");
                    
                    // Notify callback immediately for real-time UI updates
                    onDeviceDiscovered?.Invoke(displayName);
                }
            }

            _adapter.DeviceDiscovered += OnDeviceDiscovered;

            try
            {
                // Reduced scan time from 5s to 2s for faster response
                await _adapter.StartScanningForDevicesAsync();
                Log.Debug("[BT_SERVICE] Scanning started (2 seconds)...");
                await Task.Delay(2000);
                await _adapter.StopScanningForDevicesAsync();
                Log.Debug("[BT_SERVICE] Scanning stopped");
            }
            finally
            {
                _adapter.DeviceDiscovered -= OnDeviceDiscovered;
            }

            allDevices.AddRange(discovered.Where(d => !allDevices.Any(existing => existing.Id == d.Id)));

            // Show all discovered BLE devices (including unnamed with MAC addresses)
            adapters.AddRange(allDevices
                .Select(d => !string.IsNullOrEmpty(d.Name) ? d.Name! : $"Unknown ({d.Id.ToString().Substring(0, 8)}...)")
                .Distinct());

            // Cache disabled - always return fresh results
            Log.Debug($"[BT_SERVICE] Found {adapters.Count} ELM327 adapters");
        }
        catch (Exception ex)
        {
            LogToFile($"GetELM327Adapters error: {ex.Message}");
        }

        return adapters.ToArray();
    }

    private async Task<IDevice?> FindDeviceAsync(string adapterName)
    {
        // Check paired devices first
        var pairedDevices = _adapter?.GetSystemConnectedOrPairedDevices().ToList() ?? new List<IDevice>();
        
        var device = pairedDevices.FirstOrDefault(d =>
            d.Name?.Equals(adapterName, StringComparison.OrdinalIgnoreCase) == true) ??
            pairedDevices.FirstOrDefault(d =>
                d.Name?.Contains(adapterName, StringComparison.OrdinalIgnoreCase) == true) ??
            pairedDevices.FirstOrDefault(d =>
                d.Name?.Contains("OBD", StringComparison.OrdinalIgnoreCase) == true ||
                d.Name?.Contains("ELM", StringComparison.OrdinalIgnoreCase) == true);

        if (device != null) return device;

        // Scan for it
        var discovered = new List<IDevice>();
        
        void OnDiscovered(object? s, DeviceEventArgs e)
        {
            if (e.Device?.Name?.Contains(adapterName, StringComparison.OrdinalIgnoreCase) == true ||
                e.Device?.Name?.Contains("OBD", StringComparison.OrdinalIgnoreCase) == true)
            {
                discovered.Add(e.Device);
            }
        }

        _adapter!.DeviceDiscovered += OnDiscovered;
        
        try
        {
            await _adapter.StartScanningForDevicesAsync();
            await Task.Delay(6000);
            await _adapter.StopScanningForDevicesAsync();
        }
        finally
        {
            _adapter.DeviceDiscovered -= OnDiscovered;
        }

        return discovered.FirstOrDefault(d => 
            d.Name?.Contains(adapterName, StringComparison.OrdinalIgnoreCase) == true) ??
            discovered.FirstOrDefault();
    }

    private async Task<bool> DiscoverServicesAndCharacteristicsAsync()
    {
        if (_device == null) return false;

        try
        {
            // Get services with timeout
            var servicesTask = _device.GetServicesAsync();
            var timeoutTask = Task.Delay(TimeSpan.FromSeconds(10));
            var completed = await Task.WhenAny(servicesTask, timeoutTask);
            
            if (completed == timeoutTask)
            {
                LogToFile("ERROR: GetServicesAsync timed out");
                return false;
            }

            var services = await servicesTask;

            // Find OBD service
            _service = services.FirstOrDefault(s => 
                _obdServiceUuids.Any(uuid => s.Id.ToString().Equals(uuid, StringComparison.OrdinalIgnoreCase)));

            if (_service == null)
            {
                _service = services.FirstOrDefault(s => 
                    !s.Id.ToString().StartsWith("00001800", StringComparison.OrdinalIgnoreCase));
            }

            if (_service == null)
            {
                LogToFile("ERROR: No suitable service found");
                return false;
            }

            LogToFile($"Found service: {_service.Id}");

            // Get characteristics with timeout
            var charTask = _service.GetCharacteristicsAsync();
            timeoutTask = Task.Delay(TimeSpan.FromSeconds(10));
            completed = await Task.WhenAny(charTask, timeoutTask);
            
            if (completed == timeoutTask)
            {
                LogToFile("ERROR: GetCharacteristicsAsync timed out");
                return false;
            }

            var characteristics = await charTask;
            LogToFile($"Found {characteristics.Count} characteristics");

            // Find TX/RX characteristics
            _txCharacteristic = characteristics.FirstOrDefault(c => c.CanWrite);
            _rxCharacteristic = characteristics.FirstOrDefault(c => 
                c.CanRead && c.CanUpdate && c != _txCharacteristic);

            // Fallback to same characteristic
            if (_txCharacteristic == null && _rxCharacteristic == null)
            {
                var rwChar = characteristics.FirstOrDefault(c => c.CanRead && c.CanWrite);
                if (rwChar != null)
                {
                    _txCharacteristic = rwChar;
                    _rxCharacteristic = rwChar;
                }
            }

            LogToFile($"TX: {_txCharacteristic?.Id.ToString() ?? "null"}, RX: {_rxCharacteristic?.Id.ToString() ?? "null"}");

            return _txCharacteristic != null && _rxCharacteristic != null;
        }
        catch (Exception ex)
        {
            LogToFile($"ERROR: Service discovery failed - {ex.Message}");
            return false;
        }
    }

    #endregion

    #region Data Reading

    public async Task<OBD2Data> GetOBD2DataAsync()
    {
        if (!IsInitialized)
        {
            return CreateMockData();
        }

        try
        {
            var data = new OBD2Data
            {
                RPM = await ReadPidValueAsync(0x01, 0x0C) ?? 0,
                Speed = await ReadPidValueAsync(0x01, 0x0D) ?? 0,
                EngineTemperature = await ReadPidValueAsync(0x01, 0x05) ?? 0,
                ThrottlePosition = await ReadPidValueAsync(0x01, 0x11) ?? 0,
                FuelLevel = await ReadPidValueAsync(0x01, 0x2F) ?? 0,
                EngineStatus = false,
                CheckEngineLight = DtcHandler?.IsMilOn == true ? "On" : "Off"
            };

            data.EngineStatus = data.RPM > 0;
            return data;
        }
        catch (Exception ex)
        {
            LogToFile($"GetOBD2Data error: {ex.Message}");
            return CreateMockData();
        }
    }

    public async Task<double?> ReadPidValueAsync(byte service, byte pid, CancellationToken ct = default)
    {
        var (rawData, _) = await ReadPidRawAsync(service, pid, ct);
        if (rawData == null || rawData.Length == 0) return null;

        return pid switch
        {
            0x0C => ((rawData[0] * 256.0 + rawData[1]) / 4.0),
            0x0D => rawData[0],
            0x05 => rawData[0] - 40,
            0x0F => rawData[0] - 40,
            0x11 => (rawData[0] * 100.0 / 255.0),
            0x2F => (rawData[0] * 100.0 / 255.0),
            _ => rawData[0]
        };
    }

    public async Task<(byte[]? Data, string EcuAddress)> ReadPidRawAsync(byte service, byte pid, CancellationToken ct = default)
    {
        var cmd = ObdCommand.ServiceCommand((ObdService)service, pid);
        var response = await SendCommandAsync(cmd, ct);

        if (string.IsNullOrEmpty(response)) return (null, "");

        var cleanResponse = response.Replace(" ", "").Replace(">", "").Trim();
        
        // Extract ECU address (first 3 chars if they start with 7E)
        string ecuAddress = "";
        if (cleanResponse.Length >= 3 && cleanResponse.StartsWith("7E"))
        {
            ecuAddress = cleanResponse.Substring(0, 3);
        }
        
        var expectedPrefix = $"{(service + 0x40):X2}{pid:X2}";
        var idx = cleanResponse.IndexOf(expectedPrefix);
        
        if (idx >= 0 && cleanResponse.Length >= idx + 4)
        {
            var dataHex = cleanResponse.Substring(idx + 4);
            return (ConvertHexToBytes(dataHex), ecuAddress);
        }

        return (null, ecuAddress);
    }

    public async Task<(List<(byte[] Data, string EcuAddress)> Responses, Dictionary<byte, byte> EcuMasksByPid)> ReadPidRawFromAllEcusAsync(byte service, byte pid, byte expectedEcuMask = 0, CancellationToken ct = default)
    {
        // For Windows, just call ReadPidRawAsync and return single result as list
        var (data, ecuAddress) = await ReadPidRawAsync(service, pid, ct);
        var responses = new List<(byte[] Data, string EcuAddress)>();
        var ecuMasksByPid = new Dictionary<byte, byte>();
        
        if (data != null && data.Length > 0)
        {
            responses.Add((data, ecuAddress));
            // Update ECU mask for this PID
            if (ecuAddress.StartsWith("7E") && ecuAddress.Length >= 3)
            {
                if (byte.TryParse(ecuAddress.Substring(2, 1), System.Globalization.NumberStyles.HexNumber, null, out byte ecuNum))
                {
                    if (ecuNum >= 8 && ecuNum <= 15)
                    {
                        ecuMasksByPid[pid] = (byte)(1 << (ecuNum - 8));
                    }
                }
            }
        }
        return (responses, ecuMasksByPid);
    }

    public async Task<ObdCommandResult> SendCommandWithMultiFrameSupportAsync(ObdCommand command, byte expectedEcuMask = 0, CancellationToken ct = default)
    {
        // Windows implementation - simple wrapper around SendCommandAsync
        var result = new ObdCommandResult();
        var response = await SendCommandAsync(command, ct);
        result.Response = response;
        result.Elapsed = TimeSpan.Zero;
        return result;
    }

    #endregion

    #region Command Interface

    public async Task<string> SendCommandAsync(string command, CancellationToken ct = default)
    {
        return await SendCommandAsync(new ObdCommand(command), ct);
    }

    public async Task<string> SendCommandAsync(ObdCommand command, CancellationToken ct = default)
    {
        if (_txCharacteristic == null) return "";

        await _commandLock.WaitAsync(ct);

        try
        {
            var tcs = new TaskCompletionSource<string>();
            var startTime = DateTime.Now;

            // Add to pending commands queue
            _pendingCommands.Enqueue((command.Command, tcs));

            LogToFile($"SendCommandAsync: Queued command '{command.Command}', waiting for response (timeout={command.Timeout}ms)");

            try
            {
                await SendCommandInternalAsync(command.Command);

                using (ct.Register(() => tcs.TrySetCanceled()))
                {
                    var completedTask = await Task.WhenAny(tcs.Task, Task.Delay(command.Timeout, ct));
                    
                    if (completedTask == tcs.Task)
                    {
                        var result = await tcs.Task;
                        LogToFile($"SendCommandAsync: Response received in {(DateTime.Now - startTime).TotalMilliseconds:F0}ms: '{result}'");
                        return result;
                    }
                    else
                    {
                        LogToFile($"SendCommandAsync: TIMEOUT after {command.Timeout}ms waiting for '{command.Command}'");
                        tcs.TrySetResult("");
                        return "";
                    }
                }
            }
            catch (OperationCanceledException)
            {
                // Remove from pending if canceled
                _pendingCommands.TryDequeue(out _);
                LogToFile($"SendCommandAsync: Command canceled");
                throw;
            }
        }
        catch (Exception ex)
        {
            LogToFile($"SendCommand error: {ex.Message}");
            return "";
        }
        finally
        {
            _commandLock.Release();
        }
    }

    private async Task SendCommandInternalAsync(string command)
    {
        Log.Debug($"[BT_SERVICE] SendCommandInternalAsync called: {command}");
        if (_txCharacteristic == null) 
        {
            Log.Debug("[BT_SERVICE] SendCommandInternalAsync: TX characteristic is null!");
            return;
        }

        var bytes = Encoding.ASCII.GetBytes(command + "\r");
        Log.Debug($"[BT_SERVICE] Sending {bytes.Length} bytes: {command}");
        await _txCharacteristic.WriteAsync(bytes);
        
        LogToFile($"TX: {command}");
        Log.Debug($"[BT_SERVICE] Command sent: {command}");
        
        // Add TX to message buffer so Settings page can see it
        var timestamp = DateTime.Now.ToString("HH:mm:ss.fff");
        var txMessage = $">>> {command}";
        lock (_messageBufferLock)
        {
            _messageBuffer.Add($"[{timestamp}] {txMessage}");
            if (_messageBuffer.Count > 100)
                _messageBuffer.RemoveAt(0);
        }
        
        // Fire events so UI can display TX
        CommandSent?.Invoke(this, txMessage);

        // Fire RawDataReceived for TX in all modes so Settings page always sees communication
        Log.Debug($"[BT_SERVICE] Firing RawDataReceived for TX: {txMessage} (Mode: {CurrentMode})");
        RawDataReceived?.Invoke(this, txMessage);
    }

    #endregion

    #region PID Discovery

    public async Task<bool> StartPidDiscoveryAsync(ObdService service = ObdService.CurrentData)
    {
        if (!IsInitialized) return false;
        _protocolHandler.StartDataService();
        return true;
    }

    public void SetFixedPids(IEnumerable<byte> pids)
    {
        _protocolHandler.PidDiscovery?.SetFixedPids(pids);
    }

    public void ResetFixedPids()
    {
        _protocolHandler.PidDiscovery?.ResetFixedPids();
    }

    #endregion

    #region DTC Operations

    public async Task ReadTroubleCodesAsync()
    {
        if (!IsInitialized) return;
        _protocolHandler.ReadTroubleCodes();
    }

    public async Task ClearTroubleCodesAsync()
    {
        if (!IsInitialized) return;
        _protocolHandler.ClearTroubleCodes();
    }

    public async Task<List<DiagnosticTroubleCode>> GetDiagnosticTroubleCodesAsync(CancellationToken ct = default)
    {
        var dtcs = new List<DiagnosticTroubleCode>();
        
        if (!IsInitialized)
        {
            Log.Debug("WindowsOBD2: Cannot get DTCs - not initialized");
            return dtcs;
        }

        try
        {
            // Read current trouble codes
            await SendCommandAsync("03", ct);
            await Task.Delay(500, ct);
            
            // Read pending trouble codes
            await SendCommandAsync("07", ct);
            await Task.Delay(500, ct);
            
            // Read permanent trouble codes
            await SendCommandAsync("0A", ct);
            await Task.Delay(500, ct);

            // Convert TroubleCode objects to DiagnosticTroubleCode
            var troubleCodes = DtcHandler?.TroubleCodes;
            if (troubleCodes != null)
            {
                var now = DateTime.UtcNow;
                foreach (var tc in troubleCodes.Take(10))
                {
                    dtcs.Add(new DiagnosticTroubleCode
                    {
                        Code = tc.Code,
                        Timestamp = now,
                        IsPending = tc.Source == ObdService.PendingTroubleCodes,
                        IsPermanent = tc.Source == ObdService.PermanentTroubleCodes
                    });
                }
            }

            Log.Debug($"WindowsOBD2: Got {dtcs.Count} DTCs");
        }
        catch (Exception ex)
        {
            Log.Debug($"WindowsOBD2: Error getting DTCs: {ex.Message}");
        }

        return dtcs;
    }

    #endregion

    #region Data Streaming

    public async Task<bool> StartDataStreamAsync(CancellationToken ct = default)
    {
        if (!IsInitialized) return false;
        if (_streamTask != null) return true;

        try
        {
            _streamCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            _streamTask = RunDataStreamAsync(_streamCts.Token);
            return true;
        }
        catch (Exception ex)
        {
            LogToFile($"StartDataStream error: {ex.Message}");
            return false;
        }
    }

    public void StopDataStream()
    {
        _streamCts?.Cancel();
        _streamTask = null;
    }

    public Task<bool> StartListeningAsync()
    {
        return StartDataStreamAsync();
    }

    public void StopListening()
    {
        StopDataStream();
    }

    private async Task RunDataStreamAsync(CancellationToken ct)
    {
        try
        {
            while (!ct.IsCancellationRequested)
            {
                var command = _protocolHandler.GetNextCommand();
                
                if (command != null)
                {
                    await SendCommandInternalAsync(command.Command);
                    
                    var timeout = DateTime.Now.Add(command.Timeout);
                    while (_protocolHandler.CommandQueue.CurrentCommand == command && DateTime.Now < timeout)
                    {
                        await Task.Delay(10, ct);
                    }
                }
                else
                {
                    await Task.Delay(_config.PollingIntervalMs, ct);
                }
            }
        }
        catch (OperationCanceledException)
        {
        }
        catch (Exception ex)
        {
            LogToFile($"Data stream error: {ex.Message}");
            ConnectionLost?.Invoke(this, EventArgs.Empty);
        }
    }

    #endregion

    #region Event Handlers

    private void OnCharacteristicValueChanged(object? sender, CharacteristicUpdatedEventArgs e)
    {
        try
        {
            var rawBytes = e.Characteristic.Value;
            var data = Encoding.ASCII.GetString(rawBytes);
            Log.Debug($"[BT_SERVICE] OnCharacteristicValueChanged: Received {rawBytes.Length} bytes: '{data}'");
            LogToFile($"RX raw ({rawBytes.Length} bytes): '{data.Replace("\r", "\\r").Replace("\n", "\\n")}'");
            _receiveBuffer.Append(data);

            string buffer = _receiveBuffer.ToString();
            int newlineIdx;

            while ((newlineIdx = buffer.IndexOfAny(new[] { '\r', '\n', '>' })) >= 0)
            {
                string line = buffer.Substring(0, newlineIdx + 1).Trim();
                buffer = buffer.Substring(newlineIdx + 1);

                if (!string.IsNullOrWhiteSpace(line))
                {
                    LogToFile($"RX parsed line: '{line}'");
                    
                    // Add RX to message buffer
                    var timestamp = DateTime.Now.ToString("HH:mm:ss.fff");
                    var rxMessage = $"<<< {line}";
                    lock (_messageBufferLock)
                    {
                        _messageBuffer.Add($"[{timestamp}] {rxMessage}");
                        if (_messageBuffer.Count > 100)
                            _messageBuffer.RemoveAt(0);
                    }

                    // Fire RawDataReceived for RX in all modes so Settings page always sees communication
                    Log.Debug($"[BT_SERVICE] Firing RawDataReceived for RX: {rxMessage} (Mode: {CurrentMode})");
                    RawDataReceived?.Invoke(this, rxMessage);

                    // Check if this response matches a pending command
                    if (TryMatchPendingCommand(line))
                    {
                        // Response was consumed by a pending command
                        // In Background mode, don't forward to protocol handler (UI)
                        if (CurrentMode == ObdServiceMode.Background)
                        {
                            continue;
                        }
                    }

                    // Forward to protocol handler for UI display and processing
                    _protocolHandler.ProcessReceivedData(line);
                }
            }

            _receiveBuffer.Clear();
            _receiveBuffer.Append(buffer);
        }
        catch (Exception ex)
        {
            LogToFile($"Characteristic update error: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Tries to match incoming data with a pending command response
    /// Returns true if the data was consumed by a pending command
    /// </summary>
    private bool TryMatchPendingCommand(string data)
    {
        if (_pendingCommands.IsEmpty)
        {
            LogToFile($"TryMatchPendingCommand: No pending commands, data='{data}'");
            return false;
        }

        LogToFile($"TryMatchPendingCommand: Checking data='{data}'");

        // Check if data contains a command terminator
        bool isTerminator = data.Contains(">") || data.Contains("OK") ||
                           data.Contains("ERROR") || data.Contains("NODATA") ||
                           data.Contains("UNABLE") || data.Contains("SEARCHING") ||
                           data.Contains("ELM");

        LogToFile($"TryMatchPendingCommand: isTerminator={isTerminator}");

        // For now, complete ALL pending commands when we see a terminator
        // This is a simple approach - in production, you'd want command ID matching
        if (isTerminator && _pendingCommands.TryDequeue(out var pending))
        {
            LogToFile($"TryMatchPendingCommand: Matched! Command='{pending.command}', Result='{data}'");
            pending.tcs.TrySetResult(data);
            return true;
        }

        // Also check for hex responses (PID data like "41 0C 1B 56")
        if (data.Length > 4 && data.Substring(0, 2).All(c => "0123456789ABCDEFabcdef".Contains(c)))
        {
            LogToFile($"TryMatchPendingCommand: Hex response detected");
            // This looks like a PID response, complete pending command
            if (_pendingCommands.TryDequeue(out var pendingPid))
            {
                LogToFile($"TryMatchPendingCommand: Matched hex! Command='{pendingPid.command}', Result='{data}'");
                pendingPid.tcs.TrySetResult(data);
                return true;
            }
        }

        LogToFile($"TryMatchPendingCommand: No match found");
        return false;
    }

    #endregion

    #region Helpers

    private static byte[] ConvertHexToBytes(string hex)
    {
        var bytes = new List<byte>();
        for (int i = 0; i < hex.Length - 1; i += 2)
        {
            if (byte.TryParse(hex.Substring(i, 2), System.Globalization.NumberStyles.HexNumber, null, out byte b))
            {
                bytes.Add(b);
            }
        }
        return bytes.ToArray();
    }

    private static OBD2Data CreateMockData()
    {
        return new OBD2Data
        {
            EngineStatus = false,
            Speed = 0,
            FuelLevel = 100,
            RPM = 0,
            EngineTemperature = 90,
            ThrottlePosition = 0,
            CheckEngineLight = "Off",
            FuelEfficiency = 0
        };
    }
    
    private async Task<string> WaitForResponseAsync(TimeSpan timeout)
    {
        if (_rxCharacteristic == null)
        {
            LogToFile("WaitForResponseAsync: RX characteristic is null");
            return "";
        }

        var responseBuilder = new StringBuilder();
        var startTime = DateTime.UtcNow;

        LogToFile($"WaitForResponseAsync: Starting wait, timeout={timeout.TotalMilliseconds:F0}ms");

        while (DateTime.UtcNow - startTime < timeout)
        {
            try
            {
                // Try to read directly (may not work on all platforms)
                var result = await _rxCharacteristic.ReadAsync();
                if (result.data != null && result.data.Length > 0)
                {
                    var responseStr = Encoding.ASCII.GetString(result.data);
                    responseBuilder.Append(responseStr);
                    LogToFile($"WaitForResponse chunk: {responseStr.Trim()}");

                    if (responseStr.Contains(">") || responseStr.Contains("OK") || responseStr.Contains("ELM"))
                    {
                        LogToFile($"WaitForResponse: Found terminator, breaking");
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                // ReadAsync may throw if characteristic doesn't support read
                // This is normal - data comes via ValueUpdated event instead
                LogToFile($"WaitForResponse ReadAsync: {ex.GetType().Name} - {ex.Message}");
            }

            await Task.Delay(50);
        }

        var fullResponse = responseBuilder.ToString();
        LogToFile($"WaitForResponse full ({(DateTime.UtcNow - startTime).TotalMilliseconds:F0}ms): '{fullResponse.Trim()}'");
        return fullResponse;
    }
    
    private async Task<bool> WaitForPromptAsync(TimeSpan timeout)
    {
        if (_rxCharacteristic == null)
        {
            LogToFile("WaitForPromptAsync: RX characteristic is null");
            return false;
        }

        var startTime = DateTime.UtcNow;
        
        while (DateTime.UtcNow - startTime < timeout)
        {
            try
            {
                var result = await _rxCharacteristic.ReadAsync();
                if (result.data != null && result.data.Length > 0)
                {
                    var responseStr = Encoding.ASCII.GetString(result.data);
                    if (responseStr.Contains(">"))
                    {
                        LogToFile("Prompt '>' received");
                        return true;
                    }
                }
            }
            catch (Exception ex)
            {
                LogToFile($"WaitForPrompt error: {ex.Message}");
            }
            
            await Task.Delay(50);
        }
        
        LogToFile("WaitForPrompt: Timeout - no prompt received");
        return false;
    }

    // Message buffer for Settings page debug log
    private static readonly List<string> _messageBuffer = new();
    private static readonly object _messageBufferLock = new();

    public static List<string> GetMessageBuffer()
    {
        lock (_messageBufferLock)
        {
            return new List<string>(_messageBuffer);
        }
    }

    public static void ClearMessageBuffer()
    {
        lock (_messageBufferLock)
        {
            _messageBuffer.Clear();
        }
    }

    public static void AddToMessageBuffer(string message)
    {
        lock (_messageBufferLock)
        {
            var timestamp = DateTime.Now.ToString("HH:mm:ss.fff");
            _messageBuffer.Add($"[{timestamp}] {message}");
            if (_messageBuffer.Count > 100)
                _messageBuffer.RemoveAt(0);
        }
    }

    #endregion
}
#endif
