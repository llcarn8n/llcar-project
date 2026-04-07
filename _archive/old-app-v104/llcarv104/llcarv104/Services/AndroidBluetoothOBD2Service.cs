#if ANDROID
using Plugin.BLE.Abstractions.Contracts;
using Plugin.BLE.Abstractions;
using Plugin.BLE;
using Plugin.BLE.Abstractions.EventArgs;
using llcar.Models;
using llcar.Services.ObdProtocol;
using System.Text;
using Android.Content;
using Android.Content.PM;
using Android.OS;
using AndroidX.Core.Content;
using Android.Bluetooth;
using Android.Util;

namespace llcar.Services;

/// <summary>
/// Improved Android Bluetooth OBD2 service using ElmProtocolHandler
/// Based on AndrOBD's architecture
/// </summary>
public class AndroidBluetoothOBD2Service : IBluetoothOBD2Service
{
    // Version identifier for debugging
    private const string AppVersion = "v1.2-ClassicalBT-Fix";
    private const string LogTag = "LLCAR_OBD2";
    

    
    // Bluetooth components
    private IAdapter? _adapter;
    private IDevice? _device;
    private IService? _service;
    private ICharacteristic? _txCharacteristic;
    private ICharacteristic? _rxCharacteristic;
    
    // Store device name for Classic Bluetooth connections (where _device is null)
    private string? _connectedDeviceName;

    // Protocol handling
    private readonly ElmProtocolHandler _protocolHandler = new();
    private ObdConnectionConfig _config = new();

    // Streaming
    private CancellationTokenSource? _streamCts;
    private Task? _streamTask;
    private readonly StringBuilder _receiveBuffer = new();

    // Cache for discovered adapters (valid for 5 minutes - longer cache for faster repeated scans)
    private List<string>? _cachedAdapters;
    private DateTime _cacheTimestamp;
    private const int CacheDurationMs = 300000; // 5 minutes
    private const int QuickScanDurationMs = 5000; // 5 seconds scan for better device discovery (like CarScanner)

    // Command response handling
    private TaskCompletionSource<string>? _pendingResponseTcs;
    private readonly StringBuilder _responseBuffer = new();
    private readonly object _responseLock = new object(); // Unified lock for _pendingResponseTcs and _responseBuffer
    private readonly SemaphoreSlim _commandLock = new(1, 1); // Lock for command serialization
    private bool _isConnecting = false; // Prevent multiple concurrent connections
    private bool _isInitializing = false; // Prevent multiple concurrent initializations
    private DateTime _lastConnectTime = DateTime.MinValue;
    private const int MinReconnectIntervalSeconds = 5;
    
    // Multi-frame command state for early exit on prompt
    private TaskCompletionSource<bool>? _multiFrameResponseTcs;
    private byte _multiFrameExpectedEcuMask = 0;
    private byte _multiFrameReceivedEcuMask = 0;
    private readonly object _multiFrameLock = new object();
    
    // Timing measurement for RX processing diagnostics
    private readonly System.Diagnostics.Stopwatch _rxStopwatch = new();

    // Message buffer for storing TX/RX history (accessible from Settings page)
    private static readonly List<string> _messageBuffer = new();
    private static readonly object _messageBufferLock = new();
    private const int MaxBufferSize = 100;

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
        "0000110A-0000-1000-8000-00805F9B34FB",  // Standard SPP TX
        "0000fff1-0000-1000-8000-00805f9b34fb",  // BLE custom TX
        "0000FFF1-0000-1000-8000-00805F9B34FB",  // BLE custom TX (uppercase)
        "0000ae01-0000-1000-8000-00805f9b34fb",  // Another BLE TX
        "00002B51-0000-1000-8000-00805F9B34FB",  // BROM S10 TX (common)
        "00002B52-0000-1000-8000-00805F9B34FB",  // BROM S10 alternative
    };

    private readonly string[] _rxCharacteristicUuids = new[]
    {
        "0000110B-0000-1000-8000-00805F9B34FB",  // Standard SPP RX
        "0000fff2-0000-1000-8000-00805f9b34fb",  // BLE custom RX
        "0000FFF2-0000-1000-8000-00805F9B34FB",  // BLE custom RX (uppercase)
        "0000ae02-0000-1000-8000-00805f9b34fb",  // Another BLE RX
        "00002B51-0000-1000-8000-00805F9B34FB",  // BROM S10 RX (common)
        "00002B52-0000-1000-8000-00805F9B34FB",  // BROM S10 alternative
    };

    // Properties
    public bool IsConnected 
    { 
        get 
        {
            var classicConnected = _classicSocket != null && _classicSocket.IsConnected;
            var bleConnected = _device != null && _device.State == DeviceState.Connected;
            var result = classicConnected || bleConnected;
            // High-frequency log commented out to reduce log spam
            // _loggingService.LogDebug($"[ANDROID_BT] IsConnected check: Classic={classicConnected}, BLE={bleConnected}, Result={result}");
            return result;
        }
    }
    public bool IsInitialized => _protocolHandler.State >= ObdState.Initialized;
    public bool IsConnecting => _isConnecting;
    public string? DeviceName => _device?.Name ?? _connectedDeviceName;
    public ObdState State => _protocolHandler.State;
    public IAdapter? Adapter => _adapter;
    public IDevice? Device => _device;

    public ElmProtocolHandler? ProtocolHandler => _protocolHandler;
    public AdaptiveTiming? AdaptiveTiming => _protocolHandler.AdaptiveTiming;
    public PidDiscovery? PidDiscovery => _protocolHandler.PidDiscovery;
    public DiagnosticTroubleCodeHandler? DtcHandler => _protocolHandler.DtcHandler;
    
    /// <summary>
    /// Current operating mode - affects where data is routed
    /// </summary>
    public ObdServiceMode CurrentMode { get; set; } = ObdServiceMode.Setup;

    // Events
    public event EventHandler<OBD2Data>? DataReceived;
    public event EventHandler<ObdStateChangedEventArgs>? StateChanged;
    public event EventHandler<PidDataReceivedEventArgs>? PidDataReceived;
    public event EventHandler<string>? RawDataReceived;
    /// <summary>
    /// Fired when a command is transmitted to ELM327
    /// </summary>
    public event EventHandler<string>? CommandSent;
    public event EventHandler? ConnectionLost;
    public event EventHandler? Connected;

    private readonly ILoggingService _loggingService;

    public AndroidBluetoothOBD2Service(ILoggingService loggingService)
    {
        _loggingService = loggingService;
        _loggingService.LogDebug($"============================================");
        _loggingService.LogDebug($"{AppVersion} - Classical Bluetooth SPP Support");
        _loggingService.LogDebug($"============================================");

        _protocolHandler.StateChanged += (s, e) => StateChanged?.Invoke(this, e);
        _protocolHandler.PidDataReceived += (s, e) => PidDataReceived?.Invoke(this, e);
        _protocolHandler.RawDataReceived += (s, e) => RawDataReceived?.Invoke(this, e.Data);
        
        // Handle excessive CAN errors - disconnect to allow recovery
        _protocolHandler.CanErrorLimitReached += async (s, e) =>
        {
            try
            {
                _loggingService.LogError("[ANDROID_BT] CAN ERROR limit reached. Disconnecting...");
                await DisconnectAsync();
                ConnectionLost?.Invoke(this, EventArgs.Empty);
            }
            catch (Exception ex)
            {
                _loggingService.LogError($"[ANDROID_BT] Error in CanErrorLimitReached handler: {ex.Message}");
            }
        };
    }

    #region Connection Management

    // SPP UUID for Classic Bluetooth serial
    private static readonly Java.Util.UUID SppUuid = Java.Util.UUID.FromString("00001101-0000-1000-8000-00805F9B34FB");
    
    // Native Android Bluetooth socket for Classic Bluetooth
    private Android.Bluetooth.BluetoothSocket? _classicSocket;
    private System.IO.Stream? _bluetoothStream;

    public async Task<bool> ConnectAsync(string adapterName)
    {
        // Prevent concurrent connection attempts
        if (_isConnecting)
        {
            _loggingService.LogDebug("[ANDROID_CONNECT] Connection already in progress, skipping...");
            return false;
        }
        
        // Prevent rapid reconnection (wait at least 5 seconds between attempts)
        if ((DateTime.Now - _lastConnectTime).TotalSeconds < MinReconnectIntervalSeconds)
        {
            _loggingService.LogDebug($"[ANDROID_CONNECT] Too soon since last connection attempt ({(DateTime.Now - _lastConnectTime).TotalSeconds:F1}s ago), skipping...");
            return IsConnected;
        }
        
        // If already connected, return true immediately
        if (IsConnected)
        {
            _loggingService.LogDebug("[ANDROID_CONNECT] Already connected, returning true");
            return true;
        }

        _isConnecting = true;
        
        try
        {
            // Read UseClassicBluetooth setting from saved settings
            // Default is Classic Bluetooth SPP for reliable AT command communication
            // BLE mode available for modern adapters that support BLE OBD2 profile
            var useClassic = true; // Default to Classic Bluetooth SPP
            
            try
            {
                var settingsFilePath = System.IO.Path.Combine(FileSystem.Current.AppDataDirectory, "settings.json");
                if (File.Exists(settingsFilePath))
                {
                    var json = await File.ReadAllTextAsync(settingsFilePath);
                    var settings = System.Text.Json.JsonSerializer.Deserialize<llcar.Models.SettingsData>(json);
                    useClassic = settings?.UseClassicBluetooth ?? true;
                }
            }
            catch (Exception ex)
            {
                _loggingService.LogDebug($"[ANDROID_CONNECT] Error reading UseClassicBluetooth setting: {ex.Message}");
                useClassic = true; // Default to Classic on error
            }

            _loggingService.LogDebug($"[ANDROID_CONNECT] ==========================================");
            _loggingService.LogDebug($"[ANDROID_CONNECT] Connecting to: {adapterName}");
            _loggingService.LogDebug($"[ANDROID_CONNECT] Connection mode: {(useClassic ? "Classic Bluetooth SPP" : "BLE")}");
            _loggingService.LogDebug($"[ANDROID_CONNECT] UseClassicBluetooth setting: {useClassic}");

            bool result;
            if (useClassic)
            {
                result = await ConnectClassicBluetooth(adapterName);
            }
            else
            {
                result = await ConnectBLE(adapterName);
            }
            
            if (result)
            {
                _lastConnectTime = DateTime.Now;
            }
            
            return result;
        }
        finally
        {
            _isConnecting = false;
        }
    }

    // Classic Bluetooth SPP connection (for older ELM327 adapters)
    private async Task<bool> ConnectClassicBluetooth(string adapterName)
    {
        try
        {
            _loggingService.LogDebug($"[ANDROID_CONNECT] === Classic Bluetooth Mode ===");

            // Get native Android BluetoothAdapter for Classic Bluetooth
            var nativeAdapter = Android.Bluetooth.BluetoothAdapter.DefaultAdapter;
            if (nativeAdapter == null)
            {
                _loggingService.LogDebug("[ANDROID_CONNECT] ERROR: Bluetooth adapter not available");
                return false;
            }

            if (!nativeAdapter.IsEnabled)
            {
                _loggingService.LogDebug("[ANDROID_CONNECT] ERROR: Bluetooth is disabled");
                return false;
            }

            // Find device in paired devices
            Android.Bluetooth.BluetoothDevice? nativeDevice = null;
            
            _loggingService.LogDebug($"[ANDROID_CONNECT] Checking {nativeAdapter.BondedDevices?.Count ?? 0} paired devices...");
            foreach (var device in nativeAdapter.BondedDevices)
            {
                _loggingService.LogDebug($"[ANDROID_CONNECT]   Paired: {device.Name} ({device.Address})");
                if (device.Name?.Equals(adapterName, StringComparison.OrdinalIgnoreCase) == true)
                {
                    nativeDevice = device;
                    _loggingService.LogDebug($"[ANDROID_CONNECT] Found matching device: {device.Name}");
                    break;
                }
            }

            if (nativeDevice == null)
            {
                _loggingService.LogError($"[ANDROID_CONNECT] ERROR: Device '{adapterName}' not found in paired devices");
                _loggingService.LogDebug($"[ANDROID_CONNECT] Please pair the device in Android Settings first!");
                return false;
            }

            // Store device name for later reference (since _device is only for BLE)
            _connectedDeviceName = nativeDevice.Name;
            _loggingService.LogDebug($"[ANDROID_CONNECT] Device name stored: {_connectedDeviceName}");

            _loggingService.LogDebug($"[ANDROID_CONNECT] Creating RFCOMM socket...");
            
            // Create RFCOMM socket for Classic Bluetooth SPP
            try
            {
                _classicSocket = nativeDevice.CreateRfcommSocketToServiceRecord(SppUuid);
                _loggingService.LogDebug($"[ANDROID_CONNECT] Socket created, connecting to {nativeDevice.Address}...");
            }
            catch (Exception socketEx)
            {
                _loggingService.LogDebug($"[ANDROID_CONNECT] ERROR creating socket: {socketEx.Message}");
                return false;
            }

            // Cancel discovery as it interferes with connection
            _loggingService.LogDebug($"[ANDROID_CONNECT] Canceling discovery...");
            nativeAdapter.CancelDiscovery();
            await Task.Delay(100);

            // Connect with timeout
            _loggingService.LogDebug($"[ANDROID_CONNECT] Connecting with 10 second timeout...");
            var connectTask = Task.Run(() =>
            {
                try
                {
                    _classicSocket?.Connect();
                    return true;
                }
                catch (Exception ex)
                {
                    _loggingService.LogDebug($"[ANDROID_CONNECT] Socket connect error: {ex.Message}");
                    return false;
                }
            });

            var timeoutTask = Task.Delay(TimeSpan.FromSeconds(10));
            var completedTask = await Task.WhenAny(connectTask, timeoutTask);

            if (completedTask == timeoutTask)
            {
                _loggingService.LogDebug("[ANDROID_CONNECT] ERROR: Connection timeout after 10 seconds!");
                try { _classicSocket?.Close(); } catch { }
                return false;
            }

            var connected = await connectTask;
            if (!connected)
            {
                _loggingService.LogDebug("[ANDROID_CONNECT] ERROR: Connection failed!");
                return false;
            }

            _loggingService.LogDebug("[ANDROID_CONNECT] Connection succeeded!");

            // Get the output stream for sending commands
            _bluetoothStream = _classicSocket?.OutputStream;
            if (_bluetoothStream == null)
            {
                _loggingService.LogDebug("[ANDROID_CONNECT] ERROR: Could not get output stream");
                return false;
            }

            _loggingService.LogDebug("[ANDROID_CONNECT] Output stream obtained");

            // Start input reading thread
            StartInputStreamReader();

            // Wait for adapter to stabilize
            _loggingService.LogDebug("[ANDROID_CONNECT] Waiting 500ms for adapter to stabilize...");
            await Task.Delay(500);

            _loggingService.LogDebug("[ANDROID_CONNECT] Device connected successfully via Classic Bluetooth SPP");
            Connected?.Invoke(this, EventArgs.Empty);
            return true;
        }
        catch (Exception ex)
        {
            _loggingService.LogError($"[ANDROID_CONNECT] ERROR: {ex.Message}");
            _loggingService.LogDebug($"[ANDROID_CONNECT] Stack: {ex.StackTrace}");
            try { _classicSocket?.Close(); } catch { }
            return false;
        }
    }

    // BLE connection (default for modern ELM327 adapters like BROM S10)
    private async Task<bool> ConnectBLE(string adapterName)
    {
        try
        {
            _loggingService.LogDebug($"[ANDROID_CONNECT] === BLE Mode ===");

            _adapter = CrossBluetoothLE.Current.Adapter;
            if (_adapter == null)
            {
                _loggingService.LogDebug("[ANDROID_CONNECT] ERROR: BLE Adapter is null");
                return false;
            }

            // First check if we already know about this device from last scan
            IDevice? targetDevice = null;

            if (_lastDiscoveredDevices != null)
            {
                _loggingService.LogDebug($"[ANDROID_CONNECT] Checking {_lastDiscoveredDevices.Count} cached devices...");
                targetDevice = _lastDiscoveredDevices.FirstOrDefault(d =>
                    d.Name?.Contains(adapterName, StringComparison.OrdinalIgnoreCase) == true);

                if (targetDevice != null)
                {
                    _loggingService.LogDebug($"[ANDROID_CONNECT] Using cached device: '{targetDevice.Name}' (Id: {targetDevice.Id})");
                }
            }

            // Check if we have device ID from previous scan (for unpaired devices like VLinker)
            if (targetDevice == null && _deviceIdCache.TryGetValue(adapterName, out var cachedDeviceId))
            {
                _loggingService.LogDebug($"[ANDROID_CONNECT] Found cached device ID for '{adapterName}': {cachedDeviceId}");
                // Try to find device by ID in all known devices
                targetDevice = _lastDiscoveredDevices?.FirstOrDefault(d => 
                    d.Id.ToString() == cachedDeviceId);
                
                if (targetDevice != null)
                {
                    _loggingService.LogDebug($"[ANDROID_CONNECT] Using device from ID cache: '{targetDevice.Name}'");
                }
                else
                {
                    _loggingService.LogDebug($"[ANDROID_CONNECT] Device with ID {cachedDeviceId} not in current scan, will search...");
                }
            }

            // If not cached, check paired devices quickly
            if (targetDevice == null)
            {
                _loggingService.LogDebug("[ANDROID_CONNECT] Checking paired devices...");
                var paired = _adapter.GetSystemConnectedOrPairedDevices();
                _loggingService.LogDebug($"[ANDROID_CONNECT] Found {paired.Count()} paired devices");
                foreach (var p in paired)
                {
                    _loggingService.LogDebug($"[ANDROID_CONNECT]   Paired: {p.Name} (Id: {p.Id})");
                }
                
                targetDevice = paired.FirstOrDefault(d =>
                    d.Name?.Contains(adapterName, StringComparison.OrdinalIgnoreCase) == true);

                if (targetDevice != null)
                {
                    _loggingService.LogDebug($"[ANDROID_CONNECT] Found '{adapterName}' in paired devices");
                }
            }

            // Only scan if we haven't found it yet
            if (targetDevice == null)
            {
                _loggingService.LogDebug($"[ANDROID_CONNECT] Device not cached, scanning for '{adapterName}'...");
                var devices = await ScanForDevicesAsync(adapterName);
                _loggingService.LogDebug($"[ANDROID_CONNECT] Scan found {devices.Count} devices");
                targetDevice = devices.FirstOrDefault(d =>
                    d.Name?.Contains(adapterName, StringComparison.OrdinalIgnoreCase) == true);
            }

            if (targetDevice == null)
            {
                _loggingService.LogError($"[ANDROID_CONNECT] ERROR: Device '{adapterName}' not found after all attempts");
                return false;
            }

            _device = targetDevice;
            _loggingService.LogDebug($"[ANDROID_CONNECT] Device state: {_device.State}");

            // Connect to device with retry
            _loggingService.LogDebug("[ANDROID_CONNECT] Connecting to device (BLE)...");
            bool connected = false;
            int maxAttempts = 3;
            
            for (int attempt = 1; attempt <= maxAttempts && !connected; attempt++)
            {
                try
                {
                    _loggingService.LogDebug($"[ANDROID_CONNECT] Connection attempt {attempt}/{maxAttempts} with 8 second timeout...");
                    
                    // Create connection task with timeout
                    var connectTask = attempt == 1
                        ? Task.Run(async () => await _adapter.ConnectToDeviceAsync(_device))
                        : Task.Run(async () => await _adapter.ConnectToDeviceAsync(_device, 
                            new ConnectParameters(forceBleTransport: true, autoConnect: true)));
                    
                    // Wait for connection with 8 second timeout
                    var timeoutTask = Task.Delay(TimeSpan.FromSeconds(8));
                    var completedTask = await Task.WhenAny(connectTask, timeoutTask);
                    
                    if (completedTask == timeoutTask)
                    {
                        _loggingService.LogDebug($"[ANDROID_CONNECT] Attempt {attempt} TIMEOUT after 8 seconds");
                        if (attempt < maxAttempts)
                        {
                            _loggingService.LogDebug("[ANDROID_CONNECT] Waiting 1 second before retry...");
                            await Task.Delay(1000);
                        }
                        continue;
                    }
                    
                    // Check if connection task completed successfully
                    await connectTask; // This will throw if the task faulted
                    connected = true;
                    _loggingService.LogDebug("[ANDROID_CONNECT] BLE Connection succeeded");
                }
                catch (Exception connectEx)
                {
                    _loggingService.LogDebug($"[ANDROID_CONNECT] Attempt {attempt} failed: {connectEx.Message}");
                    if (attempt < maxAttempts)
                    {
                        _loggingService.LogDebug("[ANDROID_CONNECT] Waiting 1 second before retry...");
                        await Task.Delay(1000);
                    }
                }
            }
            
            if (!connected)
            {
                _loggingService.LogDebug("[ANDROID_CONNECT] All connection attempts failed");
                return false;
            }

            // Connection succeeded
            _loggingService.LogDebug("[ANDROID_CONNECT] Device connected successfully via BLE");

            // AndrOBD: Delay connection for 500ms (Fix issue #233)
            _loggingService.LogDebug("[ANDROID_CONNECT] Waiting 500ms before service discovery...");
            await Task.Delay(500);

            // Discover services and characteristics
            _loggingService.LogDebug("[ANDROID_CONNECT] Discovering services...");
            var discoverResult = await DiscoverServicesAndCharacteristicsAsync();
            _loggingService.LogDebug($"[ANDROID_CONNECT] Service discovery result: {discoverResult}");
            
            if (!discoverResult)
            {
                _loggingService.LogDebug("[ANDROID_CONNECT] ERROR: Failed to discover services");
                await DisconnectAsync();
                return false;
            }

            _loggingService.LogDebug("[ANDROID_CONNECT] Services discovered successfully");

            // Start receiving updates
            if (_rxCharacteristic != null)
            {
                _loggingService.LogDebug("[ANDROID_CONNECT] Starting characteristic updates...");
                // Remove existing handler to prevent duplicates
                _rxCharacteristic.ValueUpdated -= OnCharacteristicValueChanged;
                _rxCharacteristic.ValueUpdated += OnCharacteristicValueChanged;
                await _rxCharacteristic.StartUpdatesAsync();
            }

            _loggingService.LogDebug("[ANDROID_CONNECT] BLE connection complete - waiting for ELM327 initialization...");
            // Connected event will be fired after successful initialization
            return true;
        }
        catch (Exception ex)
        {
            _loggingService.LogError($"[ANDROID_CONNECT] ERROR: {ex.Message}");
            _loggingService.LogDebug($"[ANDROID_CONNECT] Stack: {ex.StackTrace}");
            return false;
        }
    }

    // Input stream reader for receiving data from ELM327
    private void StartInputStreamReader()
    {
        _loggingService.LogDebug("[ANDROID_STREAM] Starting input stream reader...");
        
        Task.Run(() =>
        {
            var inputStream = _classicSocket?.InputStream;
            if (inputStream == null)
            {
                _loggingService.LogDebug("[ANDROID_STREAM] ERROR: Input stream is null");
                return;
            }

            var buffer = new byte[256];
            
            try
            {
                _loggingService.LogDebug("[ANDROID_STREAM] Reading from input stream...");
                
                while (_classicSocket?.IsConnected == true)
                {
                    var bytesRead = inputStream.Read(buffer, 0, buffer.Length);
                    
                    if (bytesRead > 0)
                    {
                        var data = Encoding.ASCII.GetString(buffer, 0, bytesRead);
                        _loggingService.LogDebug($"[RX] {data.Replace("\r", "").Replace("\n", " ").Trim()}");
                        
                        // Process received data
                        OnDataReceived(data);
                    }
                    else
                    {
                        // Small delay to prevent busy loop
                        Thread.Sleep(10);
                    }
                }
                
                _loggingService.LogDebug("[ANDROID_STREAM] Connection closed");
            }
            catch (Exception ex)
            {
                _loggingService.LogDebug($"[ANDROID_STREAM] Read error: {ex.Message}");
            }
        });
    }

    // Process received data and notify listeners
    private void OnDataReceived(string data)
    {
        _loggingService.LogDebug($"[ANDROID_DATA] Processing received data: '{data}'");
        
        // Add to message buffer (with RX prefix if not already formatted)
        if (!data.StartsWith(">>>") && !data.StartsWith("<<<"))
        {
            AddToMessageBuffer($"<<< RX: {data.Replace("\r", "\\r").Replace("\n", "\\n")}");
        }
        else
        {
            AddToMessageBuffer(data);
        }

        // Complete pending command response if waiting
        // No lock needed - we check _pendingResponseTcs atomically
        if (_pendingResponseTcs != null && !string.IsNullOrWhiteSpace(data))
        {
            _loggingService.LogDebug($"[ANDROID_DATA] Completing pending response TCS with: '{data}'");
            
            _responseBuffer.Append(data);
            
            // Check if response is complete (contains prompt or OK/ERROR)
            var responseData = _responseBuffer.ToString();
            if (responseData.Contains(">") || 
                responseData.Contains("OK") || 
                responseData.Contains("ERROR") ||
                responseData.Contains("NODATA"))
            {
                _loggingService.LogDebug($"[ANDROID_DATA] Response complete, completing TCS");
                _pendingResponseTcs.TrySetResult(responseData.Trim());
                _pendingResponseTcs = null;
            }
        }

        // Also process through protocol handler
        _protocolHandler.ProcessReceivedData(data);
    }

    public async Task<bool> DisconnectAsync()
    {
        try
        {
            StopDataStream();

            // Close Classic Bluetooth socket
            if (_classicSocket != null)
            {
                _loggingService.LogDebug("[ANDROID_DISCONNECT] Closing Classic Bluetooth socket...");
                try { _classicSocket.Close(); } catch { }
                _classicSocket = null;
            }

            // Close stream
            if (_bluetoothStream != null)
            {
                _loggingService.LogDebug("[ANDROID_DISCONNECT] Closing Bluetooth stream...");
                try { _bluetoothStream.Close(); } catch { }
                _bluetoothStream = null;
            }

            _protocolHandler.Reset();

            _device = null;
            _service = null;
            _txCharacteristic = null;
            _rxCharacteristic = null;
            _connectedDeviceName = null;  // Clear stored device name

            _loggingService.LogDebug("[ANDROID_DISCONNECT] Disconnected successfully");
            return true;
        }
        catch (Exception ex)
        {
            _loggingService.LogDebug($"AndroidOBD2: Disconnect error: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> InitializeAsync(ElmProtocol preferredProtocol = ElmProtocol.Automatic)
    {
        if (!IsConnected)
        {
            _loggingService.LogDebug("AndroidOBD2: Cannot initialize - not connected");
            return false;
        }

        try
        {
            _config.PreferredProtocol = preferredProtocol;
            _protocolHandler.Initialize(preferredProtocol);

            // Process initialization commands
            var timeout = DateTime.Now.AddSeconds(30);
            while (_protocolHandler.State < ObdState.EcuDetected && DateTime.Now < timeout)
            {
                var command = _protocolHandler.GetNextCommand();
                if (command != null)
                {
                    await SendCommandInternalAsync(command.Command);
                    
                    // Wait for response with timeout
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
            _loggingService.LogDebug($"AndroidOBD2: Initialization {(success ? "successful" : "failed")} - State: {_protocolHandler.State}");
            
            return success;
        }
        catch (Exception ex)
        {
            _loggingService.LogDebug($"AndroidOBD2: Initialization error: {ex.Message}");
            return false;
        }
    }
    
    public async Task<(bool success, string message)> InitializeAdapterAsync(List<InitializationCommand>? brandCommands = null)
    {
        if (!IsConnected)
        {
            return (false, "Not connected to adapter");
        }

        // Prevent multiple concurrent initializations
        if (_isInitializing)
        {
            _loggingService.LogDebug("[ANDROID_INIT] Initialization already in progress, waiting...");
            // Wait for existing initialization to complete (with timeout)
            var waitStart = DateTime.Now;
            while (_isInitializing && (DateTime.Now - waitStart).TotalSeconds < 30)
            {
                await Task.Delay(100);
            }
            
            if (_isInitializing)
            {
                return (false, "Another initialization is still running after 30 seconds");
            }
            
            // Assume the other initialization succeeded
            return (true, "Initialization was already completed by another caller");
        }

        _isInitializing = true;

        try
        {
            _loggingService.LogDebug("=== Starting OBD2 Adapter Initialization ===");
            RawDataReceived?.Invoke(this, ">>> === Starting OBD2 Adapter Initialization ===");

            // If brand-specific commands are provided, use them
            if (brandCommands != null && brandCommands.Count > 0)
            {
                _loggingService.LogDebug($"Using brand-specific initialization with {brandCommands.Count} commands");
                RawDataReceived?.Invoke(this, $">>> Brand: {brandCommands.FirstOrDefault()?.description ?? "Unknown"}");

                foreach (var cmd in brandCommands.OrderBy(c => c.step))
                {
                    _loggingService.LogDebug($"Step {cmd.step}: {cmd.description} ({cmd.command})");
                    RawDataReceived?.Invoke(this, $">>> Step {cmd.step}: {cmd.description}");

                    // Use appropriate timeout based on command type
                    TimeSpan timeout;
                    if (cmd.step == 1 || cmd.command == "ATZ")
                    {
                        timeout = TimeSpan.FromSeconds(4); // ATZ needs 4 seconds for BLE reset
                    }
                    else if (cmd.command == "0100")
                    {
                        timeout = TimeSpan.FromSeconds(1.5); // 0100 needs 1.5 seconds
                    }
                    else
                    {
                        timeout = TimeSpan.FromMilliseconds(1500); // Other commands 1.5 seconds
                    }
                    
                    var obdCmd = new ObdCommand(cmd.command, cmd.description, timeout);
                    var response = await SendCommandAsync(obdCmd, CancellationToken.None);
                    _loggingService.LogDebug($"Response: {response}");
                    RawDataReceived?.Invoke(this, $">>> Response: {response?.Replace("\r", "\\r").Replace("\n", "\\n")}");

                    // Validate response for critical commands (more lenient check)
                    if (cmd.step == 1 && cmd.command == "ATZ") // ATZ - Reset
                    {
                        // More lenient validation: any non-empty response or prompt is OK
                        // Some adapters don't send "ELM" in response to ATZ
                        if (string.IsNullOrWhiteSpace(response) || 
                            !(response.Contains("ELM") || response.Contains("OK") || response.Contains(">") || response.Contains("v") || response.Any(char.IsLetterOrDigit)))
                        {
                            _loggingService.LogDebug("WARNING: ATZ did not receive expected response, but continuing...");
                            RawDataReceived?.Invoke(this, ">>> WARNING: ATZ response was unexpected, but continuing...");
                            // Don't fail here, try to continue - some adapters are quirky
                        }
                    }
                    else if (cmd.command == "0100") // Query PIDs
                    {
                        if (string.IsNullOrWhiteSpace(response))
                        {
                            RawDataReceived?.Invoke(this, ">>> ERROR: No response from ECU (0100)");
                            return (false, "No response from ECU (0100)");
                        }
                    }

                    // Larger delay between commands for better adapter compatibility
                    if (cmd.step < brandCommands.Count)
                    {
                        await Task.Delay(200);
                    }
                }

                _loggingService.LogDebug("=== Brand-specific OBD2 Adapter Initialization Complete ===");
                RawDataReceived?.Invoke(this, ">>> === Initialization Complete ===");
                return (true, "Adapter initialized successfully with brand-specific settings");
            }

            // Fallback to default initialization
            _loggingService.LogDebug("Using default initialization (no brand specified)");
            RawDataReceived?.Invoke(this, ">>> Using default initialization");

            // Step 1: Send ATZ and get response (use 4 second timeout as ATZ takes longer, especially for BLE)
            _loggingService.LogDebug("Step 1: Sending ATZ (Reset)...");
            RawDataReceived?.Invoke(this, ">>> Step 1: Sending ATZ (Reset)...");
            var atzCommand = new ObdCommand("ATZ", "Reset adapter", TimeSpan.FromSeconds(4));
            var atzResponse = await SendCommandAsync(atzCommand, CancellationToken.None);
            _loggingService.LogDebug($"ATZ Response: {atzResponse}");
            RawDataReceived?.Invoke(this, $">>> ATZ Response: {atzResponse?.Replace("\r", "\\r").Replace("\n", "\\n")}");

            // More lenient validation: accept any non-empty response or prompt
            if (string.IsNullOrWhiteSpace(atzResponse) || 
                !(atzResponse.Contains("ELM") || atzResponse.Contains("OK") || atzResponse.Contains(">") || atzResponse.Contains("v") || atzResponse.Any(char.IsLetterOrDigit)))
            {
                _loggingService.LogDebug("WARNING: ATZ did not receive expected response, but continuing...");
                RawDataReceived?.Invoke(this, ">>> WARNING: ATZ response was unexpected, but continuing with initialization...");
                // Don't fail here - some adapters work fine even with quirky responses
            }

            // Wait longer after ATZ for adapter to stabilize
            await Task.Delay(500);

            // Step 2: Configure adapter
            _loggingService.LogDebug("Step 2: Sending configuration commands...");
            RawDataReceived?.Invoke(this, ">>> Step 2: Configuration...");

            // Echo Off (1.5 second timeout for BLE)
            await SendCommandAsync(new ObdCommand("ATE0", "Echo off", TimeSpan.FromSeconds(1.5)), CancellationToken.None);
            await Task.Delay(200);

            // Linefeeds Off (1.5 second timeout for BLE)
            await SendCommandAsync(new ObdCommand("ATL0", "Linefeeds off", TimeSpan.FromSeconds(1.5)), CancellationToken.None);
            await Task.Delay(200);

            // Spaces Off (1.5 second timeout for BLE)
            await SendCommandAsync(new ObdCommand("ATS0", "Spaces off", TimeSpan.FromSeconds(1.5)), CancellationToken.None);
            await Task.Delay(200);

            // Headers On (1.5 second timeout for BLE)
            await SendCommandAsync(new ObdCommand("ATH1", "Headers on", TimeSpan.FromSeconds(1.5)), CancellationToken.None);
            await Task.Delay(300);

            // Step 3: Query ECU with 0100 (3 second timeout as ECU response can take time)
            _loggingService.LogDebug("Step 3: Querying ECU with 0100...");
            RawDataReceived?.Invoke(this, ">>> Step 3: Querying ECU (0100)...");
            var pidCommand = new ObdCommand("0100", "Query PIDs", TimeSpan.FromSeconds(1.5));
            var pidResponse = await SendCommandAsync(pidCommand, CancellationToken.None);
            _loggingService.LogDebug($"0100 Response: {pidResponse}");
            RawDataReceived?.Invoke(this, $">>> 0100 Response: {pidResponse?.Replace("\r", "\\r").Replace("\n", "\\n")}");

            if (string.IsNullOrWhiteSpace(pidResponse))
            {
                _loggingService.LogDebug("ERROR: No response from ECU (0100)");
                RawDataReceived?.Invoke(this, ">>> ERROR: No response from ECU (0100)");
                return (false, "No response from ECU (0100)");
            }

            _loggingService.LogDebug("=== OBD2 Adapter Initialization Complete ===");
            RawDataReceived?.Invoke(this, ">>> === Initialization Complete ===");
            
            // Note: Connected event is already fired in ConnectAsync, don't fire it again here
            // to prevent duplicate initialization attempts
            
            return (true, "Adapter initialized successfully");
        }
        catch (Exception ex)
        {
            _loggingService.LogDebug($"Initialization error: {ex.Message}");
            return (false, $"Initialization error: {ex.Message}");
        }
        finally
        {
            _isInitializing = false;
        }
    }
    
    /// <summary>
    /// Wait for response - now just returns the buffered response from SendCommandAsync
    /// This is kept for compatibility but returns empty string as responses are handled via TCS
    /// </summary>
    private async Task<string> WaitForResponseAsync(TimeSpan timeout)
    {
        _loggingService.LogDebug($"[ANDROID_BT] WaitForResponseAsync called (timeout={timeout.TotalMilliseconds}ms) - this should not be called directly anymore");
        await Task.Delay(10); // Small delay to allow processing
        return _responseBuffer.ToString().Trim();
    }
    
    private async Task<bool> WaitForPromptAsync(TimeSpan timeout)
    {
        var startTime = DateTime.Now;
        var individualReadTimeout = TimeSpan.FromMilliseconds(500); // 500ms max per read
        
        while (DateTime.Now - startTime < timeout)
        {
            try
            {
                // Use timeout wrapper for individual read
                var readTask = _rxCharacteristic.ReadAsync();
                var readTimeoutTask = Task.Delay(individualReadTimeout);
                
                var completedTask = await Task.WhenAny(readTask, readTimeoutTask);
                
                if (completedTask == readTask)
                {
                    var result = await readTask;
                    if (result.data != null && result.data.Length > 0)
                    {
                        var responseStr = System.Text.Encoding.ASCII.GetString(result.data);
                        if (responseStr.Contains(">"))
                        {
                            return true;
                        }
                    }
                }
                // If read timed out, continue to next iteration
            }
            catch (Exception ex)
            {
                _loggingService.LogDebug($"AndroidOBD2: WaitForPrompt read error: {ex.Message}");
            }
            
            await Task.Delay(50);
        }
        
        return false;
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
            _loggingService.LogDebug($"AndroidOBD2: GetAvailableAdapters error: {ex.Message}");
        }

        return adapters.ToArray();
    }

    public async Task<string[]> GetELM327AdaptersAsync(bool fullScan = false, bool showAllDevices = false, Action<string>? onDeviceDiscovered = null)
    {
        // Cache disabled to ensure fresh scan every time - prevents showing disconnected devices
        // and ensures newly connected devices appear immediately
        _loggingService.LogDebug($"[ANDROID_BT] Scanning for ELM327 adapters (BLE)... Full scan: {fullScan}, ShowAll: {showAllDevices}");
        var adapters = new List<string>();
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _loggingService.LogDebug("AndroidOBD2: Starting GetELM327AdaptersAsync (BLE mode)...");

            // Check Android 12+ Bluetooth permissions before scanning
            #if ANDROID
            if (Android.OS.Build.VERSION.SdkInt >= Android.OS.BuildVersionCodes.S)
            {
                var context = Android.App.Application.Context;
                var scanPermission = AndroidX.Core.Content.ContextCompat.CheckSelfPermission(context, Android.Manifest.Permission.BluetoothScan);
                var connectPermission = AndroidX.Core.Content.ContextCompat.CheckSelfPermission(context, Android.Manifest.Permission.BluetoothConnect);
                _loggingService.LogDebug($"AndroidOBD2: Android 12+ permissions - Scan: {scanPermission}, Connect: {connectPermission}");
                
                if (scanPermission != Android.Content.PM.Permission.Granted)
                {
                    _loggingService.LogDebug("AndroidOBD2: ERROR - BLUETOOTH_SCAN permission not granted!");
                    return Array.Empty<string>();
                }
            }
            #endif

            // Use Plugin.BLE for BLE scanning (works with BROM S10, vLinker, etc.)
            var ble = CrossBluetoothLE.Current;
            if (ble == null)
            {
                _loggingService.LogDebug("AndroidOBD2: ERROR - CrossBluetoothLE.Current is null");
                return Array.Empty<string>();
            }

            _loggingService.LogDebug($"AndroidOBD2: Bluetooth state: {ble.State}");

            if (ble.State == BluetoothState.Off)
            {
                _loggingService.LogDebug("AndroidOBD2: ERROR - Bluetooth is turned OFF");
                return Array.Empty<string>();
            }

            if (ble.State == BluetoothState.Unauthorized)
            {
                _loggingService.LogDebug("AndroidOBD2: ERROR - Bluetooth permissions not granted");
                return Array.Empty<string>();
            }

            if (ble.State == BluetoothState.Unavailable)
            {
                _loggingService.LogDebug("AndroidOBD2: ERROR - Bluetooth is not available on this device");
                return Array.Empty<string>();
            }

            _adapter = ble.Adapter;
            if (_adapter == null)
            {
                _loggingService.LogDebug("AndroidOBD2: ERROR - BLE Adapter is null");
                return Array.Empty<string>();
            }

            _loggingService.LogDebug($"AndroidOBD2: BLE Adapter obtained in {stopwatch.ElapsedMilliseconds}ms, starting scan...");

            // Scan for BLE devices (fast mode depends on fullScan parameter)
            var discovered = await ScanForDevicesAsync(fastMode: !fullScan, onDeviceDiscovered: onDeviceDiscovered);
            _loggingService.LogDebug($"AndroidOBD2: Scan completed in {stopwatch.ElapsedMilliseconds}ms, found {discovered.Count} total devices");

            _loggingService.LogDebug($"AndroidOBD2: Scan completed, found {discovered.Count} total devices");

            foreach (var device in discovered)
            {
                _loggingService.LogDebug($"AndroidOBD2: Found device - Name: '{device.Name}', ID: {device.Id}");
            }

            // Show all discovered BLE devices (including unnamed with MAC addresses)
            List<string> obdDevices = discovered
                .Select(d => !string.IsNullOrEmpty(d.Name) ? d.Name! : $"Unknown ({d.Id.ToString().Substring(0, 8)}...)")
                .Distinct()
                .ToList();
            adapters.AddRange(obdDevices);

            _loggingService.LogDebug($"AndroidOBD2: Found {adapters.Count} OBD adapters");
            foreach (var adapter in adapters)
            {
                _loggingService.LogDebug($"AndroidOBD2: OBD Adapter: {adapter}");
            }

            // Cache disabled - always return fresh results
            _loggingService.LogDebug($"AndroidOBD2: Total GetELM327AdaptersAsync time: {stopwatch.ElapsedMilliseconds}ms");
        }
        catch (Exception ex)
        {
            _loggingService.LogDebug($"AndroidOBD2: GetELM327Adapters error: {ex.Message}");
            _loggingService.LogDebug($"AndroidOBD2: Stack trace: {ex.StackTrace}");
        }

        return adapters.ToArray();
    }

    /// <summary>
    /// Invalidate the adapter cache to force a new scan
    /// </summary>
    public void InvalidateCache()
    {
        _cachedAdapters = null;
        _loggingService.LogDebug("[ANDROID_BT] Adapter cache invalidated");
    }

    private List<IDevice>? _lastDiscoveredDevices;
    
    // Dictionary to store device IDs by name for connection (persists across scans)
    private static readonly Dictionary<string, string> _deviceIdCache = new();

    private async Task<List<IDevice>> ScanForDevicesAsync(string? targetName = null, bool fastMode = false, Action<string>? onDeviceDiscovered = null)
    {
        var devices = new List<IDevice>();
        var discovered = new List<IDevice>();
        bool foundObdInPaired = false;

        _loggingService.LogDebug("AndroidOBD2: Starting ScanForDevicesAsync...");

        // Add paired devices (fast - no scanning needed)
        try
        {
            _loggingService.LogDebug("AndroidOBD2: Getting paired devices...");
            var paired = _adapter?.GetSystemConnectedOrPairedDevices() ?? Enumerable.Empty<IDevice>();
            var pairedList = paired.ToList();
            _loggingService.LogDebug($"AndroidOBD2: Found {pairedList.Count} paired devices");
            foreach (var device in pairedList)
            {
                _loggingService.LogDebug($"AndroidOBD2: Paired device - Name: '{device.Name}', ID: {device.Id}");
            }
            // NOTE: Don't add paired devices to the list yet - they might be turned off
            // We'll only show devices that are actually discovered during active scanning
            
            // If we found the target in paired devices, we can try to connect directly
            // but we still need to scan to show all available devices
            if (!string.IsNullOrEmpty(targetName))
            {
                var foundInPaired = pairedList.FirstOrDefault(d => 
                    d.Name?.Contains(targetName, StringComparison.OrdinalIgnoreCase) == true);
                if (foundInPaired != null)
                {
                    _loggingService.LogDebug($"AndroidOBD2: Target '{targetName}' found in paired devices");
                    // Still continue scanning to show all devices
                }
            }
            
            // Check if we have any OBD adapters in paired devices
            foundObdInPaired = pairedList.Any(d => d.Name != null && (
                d.Name.Contains("OBD", StringComparison.OrdinalIgnoreCase) ||
                d.Name.Contains("ELM", StringComparison.OrdinalIgnoreCase) ||
                d.Name.Contains("BROM", StringComparison.OrdinalIgnoreCase)));
            
            // NOTE: Always scan for new devices to discover broadcast names (like CarScanner)
            // This allows seeing devices like "VLinker FD-Android" before pairing
            _loggingService.LogDebug("AndroidOBD2: Will scan for all devices including broadcast advertisements");
        }
        catch (Exception ex)
        {
            _loggingService.LogDebug($"AndroidOBD2: Error getting paired devices: {ex.Message}");
        }

        // ALWAYS scan for new devices to discover broadcast names (like CarScanner)
        // This shows devices like "VLinker FD-Android" with their advertisement names
        bool shouldScan = _adapter != null;
        
        if (shouldScan && (string.IsNullOrEmpty(targetName) || !devices.Any(d => d.Name?.Contains(targetName, StringComparison.OrdinalIgnoreCase) == true)))
        {
            _loggingService.LogDebug($"AndroidOBD2: Will scan for devices (fastMode={fastMode}, foundObdInPaired={foundObdInPaired})");
            void OnDeviceDiscovered(object? s, DeviceEventArgs e)
            {
                if (e.Device != null && !discovered.Any(d => d.Id == e.Device.Id))
                {
                    var displayName = !string.IsNullOrEmpty(e.Device.Name) ? e.Device.Name : $"Unknown ({e.Device.Id.ToString().Substring(0, 8)}...)";
                    _loggingService.LogDebug($"AndroidOBD2: Discovered device during scan - Name: '{displayName}'");
                    discovered.Add(e.Device);
                    
                    // Notify callback immediately for real-time UI updates
                    onDeviceDiscovered?.Invoke(displayName);
                }
            }

            _adapter.DeviceDiscovered += OnDeviceDiscovered;

            try
            {
                _loggingService.LogDebug("AndroidOBD2: Starting Bluetooth scan...");
                await _adapter.StartScanningForDevicesAsync();
                _loggingService.LogDebug($"AndroidOBD2: Scan started, waiting {QuickScanDurationMs}ms...");
                await Task.Delay(QuickScanDurationMs); // Quick scan for faster UI response
                await _adapter.StopScanningForDevicesAsync();
                _loggingService.LogDebug($"AndroidOBD2: Scan completed, discovered {discovered.Count} new devices");
            }
            catch (Exception ex)
            {
                _loggingService.LogDebug($"AndroidOBD2: Error during scan: {ex.Message}");
            }
            finally
            {
                _adapter.DeviceDiscovered -= OnDeviceDiscovered;
            }

            // Use discovered devices (from active scan), not paired devices
            // This ensures we only show devices that are actually available right now
        }
        else
        {
            _loggingService.LogDebug("AndroidOBD2: Skipping scan - target already found or adapter null");
        }

        _lastDiscoveredDevices = discovered;
        
        // Cache device IDs by display name for later connection
        foreach (var device in discovered)
        {
            var displayName = !string.IsNullOrEmpty(device.Name) ? device.Name : $"Unknown ({device.Id.ToString().Substring(0, 8)}...)";
            if (!_deviceIdCache.ContainsKey(displayName))
            {
                _deviceIdCache[displayName] = device.Id.ToString();
                _loggingService.LogDebug($"AndroidOBD2: Cached device ID - '{displayName}' -> '{device.Id}'");
            }
        }
        
        // Add paired OBD devices that weren't discovered during scan
        // This is needed because some OBD adapters (especially BLE) don't advertise continuously
        // but can still be connected to if they are paired
        try
        {
            var paired = _adapter?.GetSystemConnectedOrPairedDevices() ?? Enumerable.Empty<IDevice>();
            foreach (var device in paired)
            {
                // Only add if not already in discovered list
                if (device != null && !discovered.Any(d => d.Id == device.Id))
                {
                    var displayName = !string.IsNullOrEmpty(device.Name) ? device.Name : $"Unknown ({device.Id.ToString().Substring(0, 8)}...)";
                    // Check if it's likely an OBD adapter
                    bool isObdDevice = device.Name != null && (
                        device.Name.Contains("OBD", StringComparison.OrdinalIgnoreCase) ||
                        device.Name.Contains("ELM", StringComparison.OrdinalIgnoreCase) ||
                        device.Name.Contains("BROM", StringComparison.OrdinalIgnoreCase) ||
                        device.Name.Contains("VLINK", StringComparison.OrdinalIgnoreCase) ||
                        device.Name.Contains("Vgate", StringComparison.OrdinalIgnoreCase) ||
                        device.Name.Contains("SCAN", StringComparison.OrdinalIgnoreCase));
                    
                    if (isObdDevice)
                    {
                        _loggingService.LogDebug($"AndroidOBD2: Adding paired OBD device: '{displayName}'");
                        discovered.Add(device);
                        onDeviceDiscovered?.Invoke(displayName);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _loggingService.LogDebug($"AndroidOBD2: Error adding paired devices: {ex.Message}");
        }

        _loggingService.LogDebug($"AndroidOBD2: Total devices found: {discovered.Count}");
        return discovered;
    }

    private async Task<bool> DiscoverServicesAndCharacteristicsAsync()
    {
        if (_device == null)
        {
            _loggingService.LogDebug("[ANDROID_DISCOVER] ERROR: Device is null");
            return false;
        }

        try
        {
            _loggingService.LogDebug($"[ANDROID_DISCOVER] Starting service discovery for {_device.Name}...");
            
            // Get services
            _loggingService.LogDebug("[ANDROID_DISCOVER] Getting services...");
            var services = await _device.GetServicesAsync();
            _loggingService.LogDebug($"[ANDROID_DISCOVER] Found {services.Count()} services");
            
            foreach (var s in services)
            {
                _loggingService.LogDebug($"[ANDROID_DISCOVER]   Service: {s.Id}");
            }

            _service = services.FirstOrDefault(s =>
                _obdServiceUuids.Any(uuid => s.Id.ToString().Equals(uuid, StringComparison.OrdinalIgnoreCase)));

            if (_service == null)
            {
                _loggingService.LogDebug("[ANDROID_DISCOVER] OBD service not found by UUID, trying first non-standard service...");
                // Try any service that's not a standard GATT service
                _service = services.FirstOrDefault(s =>
                {
                    var id = s.Id.ToString().ToUpper();
                    return !id.StartsWith("00001800") && // Generic Access
                           !id.StartsWith("00001801") && // Generic Attribute
                           !id.StartsWith("0000180A") && // Device Information
                           !id.StartsWith("0000180F");   // Battery Service
                });
            }

            // If still not found, just use the first service with characteristics
            if (_service == null)
            {
                _loggingService.LogDebug("[ANDROID_DISCOVER] Trying first service with characteristics...");
                foreach (var s in services)
                {
                    var chars = await s.GetCharacteristicsAsync();
                    if (chars.Any())
                    {
                        _service = s;
                        _loggingService.LogDebug($"[ANDROID_DISCOVER] Using first service with characteristics: {s.Id}");
                        break;
                    }
                }
            }

            if (_service == null)
            {
                _loggingService.LogDebug("[ANDROID_DISCOVER] ERROR: No suitable service found");
                return false;
            }
            
            _loggingService.LogDebug($"[ANDROID_DISCOVER] Using service: {_service.Id}");

            // Get characteristics
            _loggingService.LogDebug("[ANDROID_DISCOVER] Getting characteristics...");
            var characteristics = await _service.GetCharacteristicsAsync();
            _loggingService.LogDebug($"[ANDROID_DISCOVER] Found {characteristics.Count()} characteristics");
            
            foreach (var c in characteristics)
            {
                _loggingService.LogDebug($"[ANDROID_DISCOVER]   Characteristic: {c.Id} (CanRead={c.CanRead}, CanWrite={c.CanWrite}, CanUpdate={c.CanUpdate})");
            }

            // Try to find by UUID first
            _loggingService.LogDebug("[ANDROID_DISCOVER] Looking for TX characteristic by UUID...");
            _txCharacteristic = characteristics.FirstOrDefault(c =>
                _txCharacteristicUuids.Any(uuid => c.Id.ToString().Equals(uuid, StringComparison.OrdinalIgnoreCase)));

            _loggingService.LogDebug("[ANDROID_DISCOVER] Looking for RX characteristic by UUID...");
            _rxCharacteristic = characteristics.FirstOrDefault(c =>
                _rxCharacteristicUuids.Any(uuid => c.Id.ToString().Equals(uuid, StringComparison.OrdinalIgnoreCase)));

            // Validate that found characteristics can actually work
            if (_txCharacteristic != null && !_txCharacteristic.CanWrite)
            {
                _loggingService.LogDebug($"[ANDROID_DISCOVER] TX { _txCharacteristic.Id} found but can't write, will find alternative");
                _txCharacteristic = null;
            }

            // Validate RX characteristic - it needs either CanRead OR CanUpdate (notify)
            // Some BLE devices (like VLinker FD-iOS) use notify without CanRead flag
            if (_rxCharacteristic != null && !_rxCharacteristic.CanRead && !_rxCharacteristic.CanUpdate)
            {
                _loggingService.LogDebug($"[ANDROID_DISCOVER] RX {_rxCharacteristic.Id} found but can't read or receive updates, will find alternative");
                _rxCharacteristic = null;
            }
            else if (_rxCharacteristic != null && !_rxCharacteristic.CanRead && _rxCharacteristic.CanUpdate)
            {
                _loggingService.LogDebug($"[ANDROID_DISCOVER] RX {_rxCharacteristic.Id} uses notify only (CanRead=False, CanUpdate=True) - this is valid for some devices");
            }

            // Fall back to capability-based detection
            if (_txCharacteristic == null)
            {
                _loggingService.LogDebug("[ANDROID_DISCOVER] TX not found by UUID, looking for CanWrite characteristic...");
                // Prefer characteristics with write capability
                _txCharacteristic = characteristics.FirstOrDefault(c => c.CanWrite);
            }

            if (_rxCharacteristic == null)
            {
                _loggingService.LogDebug("[ANDROID_DISCOVER] RX not found by UUID, looking for CanUpdate characteristic...");
                // For RX we need CanUpdate (notify/indicate) - CanRead is optional
                // Some devices like VLinker FD-iOS have CanRead=False for notify characteristics
                _rxCharacteristic = characteristics.FirstOrDefault(c => 
                    c.CanUpdate && c != _txCharacteristic);
                
                // If still not found, try characteristics with read capability
                if (_rxCharacteristic == null)
                {
                    _loggingService.LogDebug("[ANDROID_DISCOVER] Looking for any CanRead characteristic...");
                    _rxCharacteristic = characteristics.FirstOrDefault(c => 
                        c.CanRead && c != _txCharacteristic);
                }
            }

            // If still not found, try same characteristic for both (some devices use one char for both)
            if (_txCharacteristic == null && _rxCharacteristic == null)
            {
                _loggingService.LogDebug("[ANDROID_DISCOVER] Looking for single CanRead && CanWrite characteristic...");
                var rwChar = characteristics.FirstOrDefault(c => c.CanRead && c.CanWrite);
                if (rwChar != null)
                {
                    _txCharacteristic = rwChar;
                    _rxCharacteristic = rwChar;
                    _loggingService.LogDebug("[ANDROID_DISCOVER] Using single characteristic for both TX and RX");
                }
            }

            _loggingService.LogDebug($"[ANDROID_DISCOVER] TX: {_txCharacteristic?.Id}");
            _loggingService.LogDebug($"[ANDROID_DISCOVER] RX: {_rxCharacteristic?.Id}");
            
            var result = _txCharacteristic != null && _rxCharacteristic != null;
            _loggingService.LogDebug($"[ANDROID_DISCOVER] Discovery result: {result}");
            return result;
        }
        catch (Exception ex)
        {
            _loggingService.LogDebug($"[ANDROID_DISCOVER] ERROR: {ex.Message}");
            _loggingService.LogDebug($"[ANDROID_DISCOVER] Stack: {ex.StackTrace}");
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
            // Use the new PID-based approach
            var data = new OBD2Data();

            // Read common PIDs
            data.RPM = await ReadPidValueAsync(0x01, 0x0C) ?? 0;
            data.Speed = await ReadPidValueAsync(0x01, 0x0D) ?? 0;
            data.EngineTemperature = await ReadPidValueAsync(0x01, 0x05) ?? 0;
            data.ThrottlePosition = await ReadPidValueAsync(0x01, 0x11) ?? 0;
            data.FuelLevel = await ReadPidValueAsync(0x01, 0x2F) ?? 0;
            data.EngineStatus = data.RPM > 0;
            data.CheckEngineLight = DtcHandler?.IsMilOn == true ? "On" : "Off";

            return data;
        }
        catch (Exception ex)
        {
            _loggingService.LogDebug($"AndroidOBD2: GetOBD2Data error: {ex.Message}");
            return CreateMockData();
        }
    }

    public async Task<double?> ReadPidValueAsync(byte service, byte pid, CancellationToken ct = default)
    {
        var (rawData, _) = await ReadPidRawAsync(service, pid, ct);
        if (rawData == null || rawData.Length == 0) return null;

        // Apply formula based on PID
        return pid switch
        {
            0x0C => ((rawData[0] * 256.0 + rawData[1]) / 4.0),  // RPM
            0x0D => rawData[0],                                  // Speed
            0x05 => rawData[0] - 40,                            // Coolant temp
            0x0F => rawData[0] - 40,                            // Intake temp
            0x11 => (rawData[0] * 100.0 / 255.0),               // Throttle
            0x2F => (rawData[0] * 100.0 / 255.0),               // Fuel level
            0x0B => rawData[0],                                  // MAP
            0x10 => ((rawData[0] * 256.0 + rawData[1]) / 100.0), // MAF
            0x04 => (rawData[0] * 100.0 / 255.0),               // Load
            _ => rawData[0]                                     // Default
        };
    }

    public async Task<(byte[]? Data, string EcuAddress)> ReadPidRawAsync(byte service, byte pid, CancellationToken ct = default)
    {
        // For backward compatibility - return first ECU response
        var (responses, _) = await ReadPidRawFromAllEcusAsync(service, pid, 0, ct);
        if (responses.Count > 0)
        {
            return (responses[0].Data, responses[0].EcuAddress);
        }
        return (null, "");
    }

    public async Task<(List<(byte[] Data, string EcuAddress)> Responses, Dictionary<byte, byte> EcuMasksByPid)> ReadPidRawFromAllEcusAsync(byte service, byte pid, byte expectedEcuMask = 0, CancellationToken ct = default)
    {
        _loggingService.LogDebug($"[ANDROID_BT] ReadPidRawFromAllEcusAsync START for PID 0x{pid:X2}, expected ECU mask: 0x{expectedEcuMask:X2}");
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        
        var cmd = ObdCommand.ServiceCommand((ObdService)service, pid);
        var result = await SendCommandWithMultiFrameSupportAsync(cmd, expectedEcuMask, ct);
        
        stopwatch.Stop();
        _loggingService.LogDebug($"[ANDROID_BT] ReadPidRawFromAllEcusAsync response in {stopwatch.ElapsedMilliseconds}ms for PID 0x{pid:X2}: {(string.IsNullOrEmpty(result.Response) ? "EMPTY" : result.Response)}");

        var responses = new List<(byte[] Data, string EcuAddress)>();
        
        if (string.IsNullOrEmpty(result.Response)) return (responses, result.EcuMasksByPid);

        // Parse all ECU responses from the assembled response
        // Format: 7E803410C1A407E903410C1B50 (concatenated responses from multiple ECUs)
        var cleanResponse = result.Response.Replace(" ", "").Replace(">", "").Trim();
        var expectedPrefix = $"{(service + 0x40):X2}{pid:X2}";
        
        // Find all occurrences of the prefix
        int searchIndex = 0;
        while (searchIndex < cleanResponse.Length)
        {
            // Look for ECU address pattern (7E8, 7E9, 7EA, etc.)
            var ecuStartIdx = cleanResponse.IndexOf("7E", searchIndex);
            if (ecuStartIdx < 0 || ecuStartIdx + 3 > cleanResponse.Length) break;
            
            var ecuAddress = cleanResponse.Substring(ecuStartIdx, 3);
            
            // Find the service+PID prefix after this ECU address
            var prefixIdx = cleanResponse.IndexOf(expectedPrefix, ecuStartIdx);
            if (prefixIdx < 0) break;
            
            // Calculate where data starts (after ECU + PCI + Service + PID)
            // Format: 7E8[PCI:2][Service+PID:4][Data...]
            var pciStartIdx = ecuStartIdx + 3;
            if (pciStartIdx + 2 > cleanResponse.Length) break;
            
            var pci = cleanResponse.Substring(pciStartIdx, 2);
            var dataStartIdx = prefixIdx + 4;
            
            // Determine data length based on PCI
            // Format: 7E8[PCI:2][Service+PID:4][Data...]
            // PCI contains total data length including Service and PID bytes
            int dataLength = 0;
            if (pci.Length >= 1 && pci[0] == '0')
            {
                // Single frame: PCI byte contains total length (service + PID + data)
                if (int.TryParse(pci, System.Globalization.NumberStyles.HexNumber, null, out int pciValue))
                {
                    // Subtract 2 bytes for Service and PID to get actual data length
                    dataLength = Math.Max(0, pciValue - 2);
                }
            }
            else
            {
                // For multi-frame or unknown, find next ECU or end
                var nextEcuIdx = cleanResponse.IndexOf("7E", dataStartIdx);
                if (nextEcuIdx > dataStartIdx)
                {
                    dataLength = (nextEcuIdx - dataStartIdx) / 2; // Convert hex chars to bytes
                }
                else
                {
                    dataLength = (cleanResponse.Length - dataStartIdx) / 2;
                }
            }
            
            if (dataStartIdx + dataLength * 2 <= cleanResponse.Length && dataLength > 0)
            {
                var dataHex = cleanResponse.Substring(dataStartIdx, dataLength * 2);
                var bytes = ConvertHexToBytes(dataHex);
                if (bytes != null && bytes.Length > 0)
                {
                    responses.Add((bytes, ecuAddress));
                    _loggingService.LogDebug($"[ANDROID_BT] Parsed ECU {ecuAddress}: {bytes.Length} bytes");
                }
            }
            
            // Move to next potential ECU response
            searchIndex = dataStartIdx + dataLength * 2;
        }
        
        _loggingService.LogDebug($"[ANDROID_BT] ReadPidRawFromAllEcusAsync found {responses.Count} ECU responses for PID 0x{pid:X2}");
        return (responses, result.EcuMasksByPid);
    }

    public async Task<string?> ReadVinAsync(CancellationToken ct = default)
    {
        try
        {
            _loggingService.LogDebug("[VIN] ============================================");
            _loggingService.LogDebug("[VIN] Starting VIN read sequence");
            _loggingService.LogDebug("[VIN] Step 1: Clearing response buffer");
            
            // Clear buffer to ensure clean VIN parsing
            _responseBuffer.Clear();
            
            _loggingService.LogDebug("[VIN] Step 2: Preparing command 0902 (Service 09 PID 02)");
            
            // VIN is read using Service 0x09 (Vehicle Information) PID 0x02
            // Response format: 49 02 followed by VIN data (17 bytes ASCII)
            var cmd = ObdCommand.ServiceCommand(ObdService.VehicleInfo, 0x02);
            cmd.Timeout = TimeSpan.FromMilliseconds(1500); // 1.5s is enough with ecu_mask=1
            
            _loggingService.LogDebug("[VIN] Step 3: Sending command via multi-frame support");
            _loggingService.LogDebug("[VIN] Command: " + cmd.Command);
            _loggingService.LogDebug("[VIN] Timeout: " + cmd.Timeout.TotalMilliseconds + "ms");
            
            // Use multi-frame support to get complete response
            // VIN reading: ecu_mask=1 (wait for 7E8 response only) for early exit
            var result = await SendCommandWithMultiFrameSupportAsync(cmd, 0x01, ct);
            
            _loggingService.LogDebug("[VIN] Step 4: Received response");
            _loggingService.LogDebug("[VIN] Response length: " + (result.Response?.Length ?? 0));
            _loggingService.LogDebug("[VIN] Response data: " + (result.Response ?? "NULL"));
            
            if (string.IsNullOrEmpty(result.Response))
            {
                _loggingService.LogDebug("[VIN] ERROR: Empty response from ECU");
                return null;
            }
            
            // Parse VIN from assembled response
            _loggingService.LogDebug("[VIN] Step 5: Parsing VIN from response");
            var vin = ParseVinFromResponse(result.Response);
            
            if (!string.IsNullOrEmpty(vin))
            {
                _loggingService.LogDebug("[VIN] SUCCESS: VIN parsed successfully");
                _loggingService.LogDebug($"[VIN] VIN: '{vin}' ({vin.Length} chars)");
                _loggingService.LogDebug("[VIN] ============================================");
                return vin;
            }
            
            _loggingService.LogDebug("[VIN] ERROR: ParseVinFromResponse returned empty");
            _loggingService.LogDebug($"[VIN] Raw response was: {result.Response}");
            _loggingService.LogDebug("[VIN] ============================================");
            return null;
        }
        catch (Exception ex)
        {
            _loggingService.LogDebug($"[VIN] EXCEPTION: {ex.Message}");
            _loggingService.LogDebug($"[VIN] Stack trace: {ex.StackTrace}");
            _loggingService.LogDebug("[VIN] ============================================");
            return null;
        }
    }

    /// <summary>
    /// Acquires the command lock to serialize access to ELM327
    /// This prevents "STOPPED" responses when commands overlap
    /// </summary>
    public async Task AcquireCommandLockAsync(CancellationToken ct = default)
    {
        await _commandLock.WaitAsync(ct);
    }

    /// <summary>
    /// Tries to acquire the command lock without waiting
    /// </summary>
    public async Task<bool> TryAcquireCommandLockAsync(CancellationToken ct = default)
    {
        return await _commandLock.WaitAsync(0, ct);
    }

    /// <summary>
    /// Releases the command lock
    /// </summary>
    public void ReleaseCommandLock()
    {
        _commandLock.Release();
    }
    
    /// <summary>
    /// Test command to measure ELM327 response latency
    /// Sends ATI command and measures round-trip time
    /// </summary>
    public async Task<(bool success, double latencyMs)> TestLatencyAsync(CancellationToken ct = default)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            _loggingService.LogDebug("[LATENCY_TEST] Starting ATI latency test...");
            var response = await SendCommandAsync(new ObdCommand("ATI", "Get adapter info", TimeSpan.FromMilliseconds(500)), ct);
            stopwatch.Stop();

            if (!string.IsNullOrEmpty(response) && (response.Contains("ELM") || response.Contains("v") || response.Contains("OK")))
            {
                _loggingService.LogDebug($"[LATENCY_TEST] ATI command succeeded in {stopwatch.ElapsedMilliseconds}ms");
                return (true, stopwatch.ElapsedMilliseconds);
            }

            _loggingService.LogDebug($"[LATENCY_TEST] ATI command failed or invalid response after {stopwatch.ElapsedMilliseconds}ms");
            return (false, stopwatch.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _loggingService.LogDebug($"[LATENCY_TEST] ATI command exception after {stopwatch.ElapsedMilliseconds}ms: {ex.Message}");
            return (false, stopwatch.ElapsedMilliseconds);
        }
    }

    /// <summary>
    /// Sends a command and assembles multi-frame ISO-TP responses
    /// Returns both data for requested PID and ECU masks for ALL observed PIDs
    /// </summary>
    public async Task<ObdCommandResult> SendCommandWithMultiFrameSupportAsync(ObdCommand command, byte expectedEcuMask = 0, CancellationToken ct = default)
    {
        var result = new ObdCommandResult();
        
        try
        {
            _loggingService.LogDebug($"[ANDROID_BT] Sending command with multi-frame support: {command.Command}, expected ECU mask: 0x{expectedEcuMask:X2}");
            
            // Parse requested service and PID from command
            byte requestedService = 0;
            byte requestedPid = 0;
            if (command.Command.Length >= 4)
            {
                if (byte.TryParse(command.Command.Substring(0, 2), System.Globalization.NumberStyles.HexNumber, null, out requestedService) &&
                    byte.TryParse(command.Command.Substring(2, 2), System.Globalization.NumberStyles.HexNumber, null, out requestedPid))
                {
                    // Service + 0x40 = response service code
                    requestedService += 0x40;
                }
            }
            
            // Send command and collect all frames using event
            var responseDataForRequestedPid = new StringBuilder();
            var startTime = DateTime.Now;
            
            // Use 250ms timeout for all commands (including VIN)
            // Note: BLE write can take up to 200ms, so we need extra time for response
            var timeout = TimeSpan.FromMilliseconds(250);
            bool firstFrameReceived = false;
            bool singleFrameDetected = false;
            var collectionStartTime = DateTime.Now;
            
            // Track received ECUs for early exit (for ANY PID)
            bool earlyExit = false;
            
            // Event-based signaling for immediate exit (replaces polling loop)
            // Using TaskCompletionSource for async/await instead of ManualResetEventSlim to avoid blocking
            var waitStartTime = DateTime.Now;
            _loggingService.LogDebug($"[ANDROID_BT] Using TaskCompletionSource for async response signaling");
            
            // Initialize multi-frame state for early exit detection
            lock (_multiFrameLock)
            {
                _multiFrameResponseTcs = new TaskCompletionSource<bool>();
                _multiFrameExpectedEcuMask = expectedEcuMask;
                _multiFrameReceivedEcuMask = 0;
            }
            
            // Track which PID each ECU is responding with (for multi-frame support)
            var ecuToPidMap = new Dictionary<string, (byte Service, byte Pid)>();
            
            // Subscribe to RawDataReceived to collect all frames
            void OnRawData(object? sender, string data)
            {
                // DEBUG: Log all incoming data to see what's coming
                _loggingService.LogDebug($"[ANDROID_BT] OnRawData received: '{data}'");
                
                // Check for prompt character - indicates adapter is ready
                // Early exit only if we have received responses from ALL expected ECUs
                var trimmed = data.Trim();
                bool isPrompt = (trimmed == ">" || 
                                trimmed == "<<< >" || 
                                (trimmed.EndsWith(">") && !trimmed.Contains("7E")));
                
                if (isPrompt)
                {
                    // Early exit only if we have received responses from ALL expected ECUs
                    // Using bitwise AND check like the original single-frame logic
                    lock (_multiFrameLock)
                    {
                        if (_multiFrameExpectedEcuMask > 0 && (_multiFrameReceivedEcuMask & _multiFrameExpectedEcuMask) == _multiFrameExpectedEcuMask)
                        {
                            var elapsed = (DateTime.Now - waitStartTime).TotalMilliseconds;
                            _loggingService.LogDebug($"[ANDROID_BT] Prompt '>' detected with ALL ECUs responded (received: 0x{_multiFrameReceivedEcuMask:X2}, expected: 0x{_multiFrameExpectedEcuMask:X2}) after {elapsed:F1}ms, signaling early exit");
                            _multiFrameResponseTcs?.TrySetResult(true);
                        }
                        else
                        {
                            _loggingService.LogDebug($"[ANDROID_BT] Prompt '>' detected but not all ECUs responded yet (received: 0x{_multiFrameReceivedEcuMask:X2}, expected: 0x{_multiFrameExpectedEcuMask:X2}), continuing wait");
                        }
                    }
                    return;
                }
                
                // Only process RX data (starts with <<<)
                if (data.StartsWith("<<< "))
                {
                    // New format: "<<< [ECU:7EB PID:0x00] 7EB06410080080011"
                    // Extract frame data after the ECU/PID info
                    string frameData;
                    if (data.Contains("] "))
                    {
                        // Extract data after "[ECU:XXX PID:0xYY] "
                        frameData = data.Substring(data.IndexOf("] ") + 2);
                    }
                    else
                    {
                        // Fallback: remove "<<< " prefix
                        frameData = data.Substring(4);
                    }
                    
                    var cleanData = frameData.Replace(" ", "").Replace(">", "").Trim();
                    if (!string.IsNullOrEmpty(cleanData) && (cleanData.StartsWith("7E") || cleanData.Contains("7E8") || cleanData.Contains("7E0")))
                    {
                        _loggingService.LogDebug($"[ANDROID_BT] Collected frame: {cleanData}");
                        
                        // Parse PCI (Protocol Control Information)
                        // Format: [CAN ID 3 chars][PCI 2 chars][Service+PID:4][Data...]
                        // Example: 7E803411700 → 7E8=CAN ID, 03=PCI, 411700=Data
                        if (cleanData.Length >= 5)  // Need at least CAN ID + PCI
                        {
                            var canId = cleanData.Substring(0, 3);      // "7E8", "7E9" etc.
                            var pci = cleanData.Substring(3, 2);         // "03", "10", "21" etc.
                            var pciType = pci[0];                         // '0'=single, '1'=first frame, '2'=consecutive
                            
                            _loggingService.LogDebug($"[ANDROID_BT] Frame parsed: CAN={canId}, PCI={pci}, Type={pciType}");
                            
                            // For single frames (PCI type 0) and first frames (PCI type 1), extract Service+PID
                            // For consecutive frames (PCI type 2), use the PID from the first frame
                            byte respService = 0;
                            byte respPid = 0;
                            bool hasPidInfo = false;
                            
                            if (pciType == '0')
                            {
                                // Single frame - Service+PID at position 5
                                if (cleanData.Length >= 9)
                                {
                                    var responseServicePid = cleanData.Substring(5, 4);  // e.g., "410C"
                                    _loggingService.LogDebug($"[ANDROID_BT] Single frame: Parsing Service+PID from: '{responseServicePid}' at pos 5-8 of '{cleanData}'");
                                    if (byte.TryParse(responseServicePid.Substring(0, 2), System.Globalization.NumberStyles.HexNumber, null, out respService) &&
                                        byte.TryParse(responseServicePid.Substring(2, 2), System.Globalization.NumberStyles.HexNumber, null, out respPid))
                                    {
                                        hasPidInfo = true;
                                        // Store the PID for this ECU (for consecutive frames)
                                        ecuToPidMap[canId] = (respService, respPid);
                                        _loggingService.LogDebug($"[ANDROID_BT] Single frame from {canId}: Service=0x{respService:X2}, PID=0x{respPid:X2}");
                                    }
                                    else
                                    {
                                        _loggingService.LogDebug($"[ANDROID_BT] Failed to parse Service+PID from '{responseServicePid}'");
                                    }
                                }
                                else
                                {
                                    _loggingService.LogDebug($"[ANDROID_BT] Single frame too short: {cleanData.Length} chars");
                                }
                            }
                            else if (pciType == '1')
                            {
                                // First frame - PCI is 2 chars, length is 2 chars, Service+PID at position 7
                                if (cleanData.Length >= 11)
                                {
                                    var responseServicePid = cleanData.Substring(7, 4);  // e.g., "4902"
                                    _loggingService.LogDebug($"[ANDROID_BT] First frame: Parsing Service+PID from: '{responseServicePid}' at pos 7-10 of '{cleanData}'");
                                    if (byte.TryParse(responseServicePid.Substring(0, 2), System.Globalization.NumberStyles.HexNumber, null, out respService) &&
                                        byte.TryParse(responseServicePid.Substring(2, 2), System.Globalization.NumberStyles.HexNumber, null, out respPid))
                                    {
                                        hasPidInfo = true;
                                        // Store the PID for this ECU (for consecutive frames)
                                        ecuToPidMap[canId] = (respService, respPid);
                                        _loggingService.LogDebug($"[ANDROID_BT] First frame from {canId}: Service=0x{respService:X2}, PID=0x{respPid:X2}");
                                    }
                                    else
                                    {
                                        _loggingService.LogDebug($"[ANDROID_BT] Failed to parse Service+PID from '{responseServicePid}'");
                                    }
                                }
                                else
                                {
                                    _loggingService.LogDebug($"[ANDROID_BT] First frame too short: {cleanData.Length} chars");
                                }
                            }
                            else if (pciType == '2')
                            {
                                // Consecutive frame - use PID from first frame
                                _loggingService.LogDebug($"[ANDROID_BT] Looking up PID for {canId} in map. Map has {ecuToPidMap.Count} entries: {string.Join(", ", ecuToPidMap.Select(kv => $"{kv.Key}=0x{kv.Value.Pid:X2}"))}");
                                if (ecuToPidMap.TryGetValue(canId, out var pidInfo))
                                {
                                    respService = pidInfo.Service;
                                    respPid = pidInfo.Pid;
                                    hasPidInfo = true;
                                    _loggingService.LogDebug($"[ANDROID_BT] Consecutive frame from {canId}: using PID 0x{respPid:X2} from first frame");
                                }
                                else
                                {
                                    _loggingService.LogDebug($"[ANDROID_BT] Warning: Consecutive frame from {canId} without first frame!");
                                }
                            }
                            
                            if (hasPidInfo)
                            {
                                // Extract ECU number from CAN ID (7E8-7EF)
                                if (canId.StartsWith("7E") && canId.Length >= 3)
                                {
                                    if (byte.TryParse(canId.Substring(2, 1), System.Globalization.NumberStyles.HexNumber, null, out byte ecuNum))
                                    {
                                        if (ecuNum >= 8 && ecuNum <= 15) // 7E8-7EF
                                        {
                                            var ecuBit = (byte)(1 << (ecuNum - 8));
                                            
                                            // Update ECU mask for THIS PID (regardless of whether it's the requested one)
                                            if (!result.EcuMasksByPid.ContainsKey(respPid))
                                            {
                                                result.EcuMasksByPid[respPid] = 0;
                                            }
                                            result.EcuMasksByPid[respPid] |= ecuBit;
                                            
                                            // Also update global received mask for early exit check
                                            lock (_multiFrameLock)
                                            {
                                                _multiFrameReceivedEcuMask |= ecuBit;
                                            }
                                            
                                            _loggingService.LogDebug($"[ANDROID_BT] PID 0x{respPid:X2} from ECU {canId}: mask now 0x{result.EcuMasksByPid[respPid]:X2}");
                                            
                                            }
                                    }
                                }
                                
                                // Add data ONLY for the requested PID (BEFORE checking exit condition!)
                                if (respService == requestedService && respPid == requestedPid)
                                {
                                    responseDataForRequestedPid.Append(cleanData);
                                    _loggingService.LogDebug($"[ANDROID_BT] Adding data for requested PID 0x{requestedPid:X2}");
                                    
                                    // Early exit disabled - waiting for '>' prompt instead
                                    // Original code:
                                    // if (pciType == '0' && expectedEcuMask > 0 && (receivedEcuMask & expectedEcuMask) == expectedEcuMask)
                                    // {
                                    //     earlyExit = true;
                                    //     var elapsed = (DateTime.Now - waitStartTime).TotalMilliseconds;
                                    //     _loggingService.LogDebug($"[ANDROID_BT] Single frame complete, signaling exit after {elapsed:F1}ms");
                                    //     responseReceivedTcs.TrySetResult(true);
                                    // }
                                }
                                else
                                {
                                    _loggingService.LogDebug($"[ANDROID_BT] Ignoring data for PID 0x{respPid:X2} (requested 0x{requestedPid:X2})");
                                }
                            }
                            
                            // Single frame detection - just for logging, NOT for early exit
                            // We wait for ALL expected ECUs, not just single frame
                            if (pciType == '0' && !singleFrameDetected)
                            {
                                singleFrameDetected = true;
                                firstFrameReceived = true;
                                var elapsed = (DateTime.Now - waitStartTime).TotalMilliseconds;
                                _loggingService.LogDebug($"[ANDROID_BT] Single frame from ECU after {elapsed:F1}ms - continuing to wait for other ECUs");
                                // Не сигнализируем responseReceivedTcs - ждём все ECU!
                            }
                            else if (pciType == '1' && !firstFrameReceived)
                            {
                                firstFrameReceived = true;
                                collectionStartTime = DateTime.Now;
                                _loggingService.LogDebug("[ANDROID_BT] First frame received, starting collection timer...");
                            }
                        }
                    }
                }
            }
            
            RawDataReceived += OnRawData;
            
            try
            {
                // Send the command first
                await SendCommandInternalAsync(command.Command);
                
                // OPTIMIZED: Event-based waiting instead of polling loop
                // ManualResetEventSlim provides immediate response (~0ms) instead of waiting for Task.Delay
                // This eliminates ~200-300ms overhead from thread pool contention
                waitStartTime = DateTime.Now;
                _loggingService.LogDebug($"[ANDROID_BT] Waiting for responses (timeout: {timeout.TotalMilliseconds}ms, expected ECUs: 0x{expectedEcuMask:X2})...");
                
                // Wait for either: all ECUs responded (TCS signaled) OR timeout
                // Using async/await to avoid blocking the thread
                TaskCompletionSource<bool>? currentTcs;
                lock (_multiFrameLock)
                {
                    currentTcs = _multiFrameResponseTcs;
                }
                
                if (currentTcs == null)
                {
                    _loggingService.LogDebug("[ANDROID_BT] Multi-frame TCS is null, waiting for timeout");
                    await Task.Delay(timeout, ct);
                }
                else
                {
                    var completedTask = await Task.WhenAny(currentTcs.Task, Task.Delay(timeout, ct));
                    bool signaled = completedTask == currentTcs.Task;
                    
                    var elapsed = (DateTime.Now - waitStartTime).TotalMilliseconds;
                    byte currentReceivedMask;
                    lock (_multiFrameLock)
                    {
                        currentReceivedMask = _multiFrameReceivedEcuMask;
                    }
                    
                    if (signaled)
                    {
                        _loggingService.LogDebug($"[ANDROID_BT] Event signaled after {elapsed:F1}ms - all expected ECUs responded or single frame detected");
                    }
                    else
                    {
                        _loggingService.LogDebug($"[ANDROID_BT] Timeout after {elapsed:F1}ms - not all ECUs responded (received mask: 0x{currentReceivedMask:X2})");
                    }
                }
            }
            finally
            {
                RawDataReceived -= OnRawData;
                // TaskCompletionSource doesn't need Dispose
                var totalElapsed = (DateTime.Now - waitStartTime).TotalMilliseconds;
                byte finalReceivedMask;
                lock (_multiFrameLock)
                {
                    finalReceivedMask = _multiFrameReceivedEcuMask;
                    // Clear multi-frame state
                    _multiFrameResponseTcs = null;
                    _multiFrameExpectedEcuMask = 0;
                    _multiFrameReceivedEcuMask = 0;
                }
                _loggingService.LogDebug($"[ANDROID_BT] Total wait time: {totalElapsed:F1}ms, received ECUs: 0x{finalReceivedMask:X2}, expected: 0x{expectedEcuMask:X2}");
            }
            
            // Prepare result
            result.Response = responseDataForRequestedPid.ToString().Replace(">", "").Trim();
            result.Elapsed = DateTime.Now - startTime;
            
            _loggingService.LogDebug($"[ANDROID_BT] Command completed in {result.Elapsed.TotalMilliseconds:F0}ms");
            _loggingService.LogDebug($"[ANDROID_BT] Response for PID 0x{requestedPid:X2}: {(string.IsNullOrEmpty(result.Response) ? "EMPTY" : result.Response)}");
            _loggingService.LogDebug($"[ANDROID_BT] ECU masks by PID: {string.Join(", ", result.EcuMasksByPid.Select(kv => $"0x{kv.Key:X2}=0x{kv.Value:X2}"))}");
            
            return result;
        }
        catch (Exception ex)
        {
            _loggingService.LogDebug($"[ANDROID_BT] Multi-frame read error: {ex.Message}");
            return result;
        }
    }
    
    private string? ParseVinFromResponse(string response)
    {
        try
        {
            _loggingService.LogDebug("[VIN_PARSE] ============================================");
            _loggingService.LogDebug($"[VIN_PARSE] Input response: {response}");
            _loggingService.LogDebug($"[VIN_PARSE] Response length: {response.Length}");
            
            string dataToParse = response;
            
            // Remove all CAN headers from multi-frame response
            // Format: [CAN ID 3 chars][PCI 2 chars][Data...]
            // Example: 7E810144902114C5734 -> 4902114C5734 (first frame)
            // Example: 7E821353647483950 -> 353647483950 (consecutive frame)
            var processed = new StringBuilder();
            var remaining = response;
            
            // Process each frame separately
            var frames = new List<string>();
            var searchPos = 0;
            
            while (searchPos < response.Length - 3)
            {
                // Find next CAN ID
                if (response.Substring(searchPos, 3) == "7E8" || response.Substring(searchPos, 3) == "7E0" ||
                    response.Substring(searchPos, 3) == "7E1" || response.Substring(searchPos, 3) == "7E9")
                {
                    // Find end of this frame (start of next CAN ID or end of string)
                    var frameStart = searchPos;
                    var frameEnd = response.Length;
                    
                    for (int i = searchPos + 3; i < response.Length - 3; i++)
                    {
                        if (response.Substring(i, 3) == "7E8" || response.Substring(i, 3) == "7E0" ||
                            response.Substring(i, 3) == "7E1" || response.Substring(i, 3) == "7E9")
                        {
                            frameEnd = i;
                            break;
                        }
                    }
                    
                    frames.Add(response.Substring(frameStart, frameEnd - frameStart));
                    searchPos = frameEnd;
                }
                else
                {
                    searchPos++;
                }
            }
            
            // Process each frame
            int totalLength = 0;
            int collectedLength = 0;
            
            foreach (var frame in frames)
            {
                if (frame.Length < 10) continue;
                
                var pci = frame.Substring(3, 2);
                var frameData = frame.Substring(5);
                
                // For first frame (PCI starts with 1)
                if (pci.StartsWith("1") && frameData.Length >= 8)
                {
                    // ISO-TP first frame header: PCI (2) + Service 49 (2) + PID 02 (2) + counter/extra (2) = 8 hex chars
                    // Example: frameData = "144902114C5734" -> skip "14490211" -> VIN data = "4C5734"
                    totalLength = 17; // VIN is always 17 bytes
                    _loggingService.LogDebug($"[ANDROID_BT] First frame, skipping 8 hex chars, VIN length: {totalLength}");
                    frameData = frameData.Substring(8); // Skip 8 hex chars (PCI + 4902 + 2 extra bytes)
                    collectedLength += frameData.Length / 2;
                }
                else if (pci.StartsWith("2"))
                {
                    // Consecutive frame - check if we need all data
                    var dataBytes = frameData.Length / 2;
                    if (collectedLength + dataBytes > totalLength)
                    {
                        // Take only needed bytes
                        var neededBytes = totalLength - collectedLength;
                        frameData = frameData.Substring(0, neededBytes * 2);
                    }
                    collectedLength += frameData.Length / 2;
                }
                
                processed.Append(frameData);
                
                // Stop if we collected enough data
                if (totalLength > 0 && collectedLength >= totalLength)
                {
                    break;
                }
            }
            
            dataToParse = processed.ToString();
            _loggingService.LogDebug($"[ANDROID_BT] Processed VIN data: {dataToParse}");
            
            // Data already starts with VIN (4902 was skipped in first frame)
            var vinHex = dataToParse;
            
            // Remove any duplicate patterns (e.g., 4902 appearing again)
            var duplicateIdx = vinHex.IndexOf("4902");
            if (duplicateIdx > 0)
            {
                vinHex = vinHex.Substring(0, duplicateIdx);
            }
            
            // Take up to 34 hex chars (17 bytes) - but accept partial data
            if (vinHex.Length > 34)
                vinHex = vinHex.Substring(0, 34);
            
            // VIN must be exactly 17 characters (34 hex chars)
            if (vinHex.Length < 34)
            {
                _loggingService.LogDebug($"[ANDROID_BT] VIN data too short: {vinHex.Length} hex chars, need 34 (17 chars)");
                return null;
            }
            
            var vin = HexToAscii(vinHex);
            _loggingService.LogDebug($"[ANDROID_BT] Partial VIN extracted: '{vin}' ({vin?.Length ?? 0} chars)");
            return vin;
        }
        catch (Exception ex)
        {
            _loggingService.LogDebug($"[ANDROID_BT] VIN parse error: {ex.Message}");
            return null;
        }
    }
    
    private string? HexToAscii(string hex)
    {
        try
        {
            var validChars = new List<char>();
            for (int i = 0; i < hex.Length; i += 2)
            {
                if (i + 1 < hex.Length)
                {
                    var byteValue = Convert.ToByte(hex.Substring(i, 2), 16);
                    var c = (char)byteValue;
                    // Only include printable alphanumeric characters (valid VIN chars)
                    if (char.IsLetterOrDigit(c))
                    {
                        validChars.Add(c);
                    }
                }
            }
            
            var result = new string(validChars.ToArray()).Trim();
            
            // Validate VIN format - must be exactly 17 characters
            if (result.Length == 17)
            {
                _loggingService.LogDebug($"[ANDROID_BT] Full VIN successfully parsed: {result}");
                return result;
            }
            else
            {
                _loggingService.LogDebug($"[ANDROID_BT] Invalid VIN length: {result} ({result.Length}/17 chars)");
                return null;
            }
        }
        catch (Exception ex)
        {
            _loggingService.LogDebug($"[ANDROID_BT] HexToAscii error: {ex.Message}");
            return null;
        }
    }

    #endregion

    #region Command Interface

    public async Task<string> SendCommandAsync(string command, CancellationToken ct = default)
    {
        return await SendCommandAsync(new ObdCommand(command), ct);
    }

    public async Task<string> SendCommandAsync(ObdCommand command, CancellationToken ct = default)
    {
        // Check if we have a valid connection (either BLE or Classic)
        if (_txCharacteristic == null && _bluetoothStream == null)
        {
            _loggingService.LogDebug($"[ANDROID_BT] SendCommandAsync: No valid connection!");
            return "";
        }

        _loggingService.LogDebug($"[ANDROID_BT] SendCommandAsync: Sending command '{command.Command}' (timeout={command.Timeout}ms)");

        var tcs = new TaskCompletionSource<string>();
        var startTime = DateTime.Now;

        // Set TCS and clear buffer BEFORE sending command to avoid race condition
        _pendingResponseTcs = tcs;
        _responseBuffer.Clear();

        try
        {
            await SendCommandInternalAsync(command.Command);

            using (ct.Register(() => tcs.TrySetCanceled()))
            {
                var completedTask = await Task.WhenAny(tcs.Task, Task.Delay(command.Timeout, ct));
                
                if (completedTask == tcs.Task)
                {
                    var result = await tcs.Task;
                    _loggingService.LogDebug($"[ANDROID_BT] SendCommandAsync: Response received in {(DateTime.Now - startTime).TotalMilliseconds:F0}ms");
                    return result;
                }
                else
                {
                    _loggingService.LogDebug($"[ANDROID_BT] SendCommandAsync: TIMEOUT after {command.Timeout}ms, buffer: '{_responseBuffer}'");
                    return "";
                }
            }
        }
        finally
        {
            _pendingResponseTcs = null;
        }
    }

    private async Task SendCommandInternalAsync(string command)
    {
        var bytes = Encoding.ASCII.GetBytes(command + "\r");
        var sendStart = DateTime.Now;
        
        try
        {
            // Fire CommandSent event for UI logging (before sending)
            CommandSent?.Invoke(this, command);
            // Also fire RawDataReceived for TX so Settings page sees it
            var txMessage = $">>> TX: {command}";
            RawDataReceived?.Invoke(this, txMessage);
            AddToMessageBuffer(txMessage);
            
            if (_bluetoothStream != null)
            {
                // Classic Bluetooth mode
                _loggingService.LogDebug($"[TX] {command}");
                await _bluetoothStream.WriteAsync(bytes.AsMemory(0, bytes.Length));
                await _bluetoothStream.FlushAsync();
                var sendElapsed = (DateTime.Now - sendStart).TotalMilliseconds;
                _loggingService.LogDebug($"[ANDROID_SEND] Classic BT sent successfully in {sendElapsed:F0}ms");
            }
            else if (_txCharacteristic != null)
            {
                // BLE mode - adapter doesn't support WriteWithoutResponse, 
                // but we have 100ms OBD2 response timeout in SendCommandWithMultiFrameSupportAsync
                _loggingService.LogDebug($"[TX] {command}");
                _loggingService.LogDebug($"[ANDROID_SEND] Starting BLE write for: {command}");
                await _txCharacteristic.WriteAsync(bytes);
                var sendElapsed = (DateTime.Now - sendStart).TotalMilliseconds;
                _loggingService.LogDebug($"[ANDROID_SEND] BLE write completed in {sendElapsed:F0}ms");
            }
            else
            {
                _loggingService.LogDebug("[ANDROID_SEND] ERROR: No valid connection (both stream and characteristic are null)");
            }
        }
        catch (Exception ex)
        {
            _loggingService.LogDebug($"[ANDROID_SEND] ERROR: {ex.Message}");
        }
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
            _loggingService.LogDebug("AndroidOBD2: Cannot get DTCs - not initialized");
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

            _loggingService.LogDebug($"AndroidOBD2: Got {dtcs.Count} DTCs");
        }
        catch (Exception ex)
        {
            _loggingService.LogDebug($"AndroidOBD2: Error getting DTCs: {ex.Message}");
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
            _loggingService.LogDebug($"AndroidOBD2: StartDataStream error: {ex.Message}");
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
        var lastPollTime = DateTime.Now;
        var pollCount = 0;
        
        try
        {
            _loggingService.LogDebug($"[ANDROID_DATA] Starting data stream with polling interval: {_config.PollingIntervalMs}ms");
            
            while (!ct.IsCancellationRequested)
            {
                var command = _protocolHandler.GetNextCommand();
                
                if (command != null)
                {
                    var currentTime = DateTime.Now;
                    var interval = (currentTime - lastPollTime).TotalMilliseconds;
                    pollCount++;
                    
                    if (pollCount % 10 == 0) // Log every 10th poll to avoid spam
                    {
                        _loggingService.LogDebug($"[ANDROID_DATA] Poll #{pollCount} - Interval: {interval:F0}ms (target: {_config.PollingIntervalMs}ms)");
                    }
                    
                    await SendCommandInternalAsync(command.Command);
                    lastPollTime = currentTime;
                    
                    // Wait for command completion
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
        catch (System.OperationCanceledException)
        {
            // Normal cancellation
        }
        catch (Exception ex)
        {
            _loggingService.LogDebug($"AndroidOBD2: Data stream error: {ex.Message}");
            ConnectionLost?.Invoke(this, EventArgs.Empty);
        }
    }

    #endregion

    #region Event Handlers

    private void OnCharacteristicValueChanged(object? sender, CharacteristicUpdatedEventArgs e)
    {
        _rxStopwatch.Restart();
        try
        {
            var data = Encoding.ASCII.GetString(e.Characteristic.Value);
            _loggingService.LogDebug($"[RX] {data.Replace("\r", "").Replace("\n", " ").Trim()}");
            _receiveBuffer.Append(data);

            // Process complete lines
            string buffer = _receiveBuffer.ToString();
            int newlineIdx;

            while ((newlineIdx = buffer.IndexOfAny(new[] { '\r', '\n', '>' })) >= 0)
            {
                string line = buffer.Substring(0, newlineIdx + 1).Trim();
                buffer = buffer.Substring(newlineIdx + 1);

                if (!string.IsNullOrWhiteSpace(line))
                {
                    // Skip standalone prompt characters - they are not actual responses
                    if (line == ">")
                    {
                        // RX logging disabled to reduce duplicates - data shown in Settings page only
                        // _loggingService.LogDebug($"[ANDROID_BT] RX parsed: '{line}' (prompt, skipping)");
                        
                        // Complete pending response if we have buffered data
                        // No lock needed - atomic check
                        if (_pendingResponseTcs != null && _responseBuffer.Length > 0)
                        {
                            var fullResponse = _responseBuffer.ToString().Trim();
                            _loggingService.LogDebug($"[ANDROID_BT] Prompt received with buffered data, completing TCS");
                            _pendingResponseTcs.TrySetResult(fullResponse);
                            _pendingResponseTcs = null;
                        }
                        
                        // Signal early exit for multi-frame commands if all ECUs responded
                        lock (_multiFrameLock)
                        {
                            if (_multiFrameResponseTcs != null && 
                                _multiFrameExpectedEcuMask > 0 && 
                                (_multiFrameReceivedEcuMask & _multiFrameExpectedEcuMask) == _multiFrameExpectedEcuMask)
                            {
                                _loggingService.LogDebug($"[ANDROID_BT] Prompt '>' received with all ECUs responded (mask: 0x{_multiFrameReceivedEcuMask:X2}), signaling multi-frame early exit");
                                _multiFrameResponseTcs.TrySetResult(true);
                            }
                        }
                    }
                    else
                    {
                    // Parse CAN response to extract ECU address and PID
                    string parsedInfo = ParseCanResponseInfo(line);
                    string logLine = string.IsNullOrEmpty(parsedInfo) ? $"'[ECU:?? PID:??] {line}'" : parsedInfo;
                    // RX logging disabled to reduce duplicates - data shown in Settings page only
                    // _loggingService.LogDebug($"[ANDROID_BT] RX parsed: {logLine}");
                    
                    // Add to response buffer for pending command
                    // No lock needed - atomic check
                    if (_pendingResponseTcs != null)
                    {
                        _responseBuffer.Append(line).Append("\n");
                        _loggingService.LogDebug($"[ANDROID_BT] Response buffer: '{_responseBuffer.ToString()}'");
                        
                        // Check if we have a complete response (terminator received)
                        if (line.Contains(">") || line.Contains("OK") || line.Contains("ELM") || 
                            line.Contains("ERROR") || line.Contains("NODATA"))
                        {
                            var fullResponse = _responseBuffer.ToString().Trim();
                            _loggingService.LogDebug($"[ANDROID_BT] Found terminator, completing TCS");
                            _pendingResponseTcs.TrySetResult(fullResponse);
                            _pendingResponseTcs = null;
                        }
                    }
                    
                    // Process data through protocol handler (which will fire RawDataReceived)
                    // Send all data including prompt characters - needed for early exit detection
                    _protocolHandler.ProcessReceivedData(line);
                    }
                }
            }

            _receiveBuffer.Clear();
            _receiveBuffer.Append(buffer);
            
            // Log timing for slow RX processing (helps diagnose latency issues)
            _rxStopwatch.Stop();
            if (_rxStopwatch.ElapsedMilliseconds > 10)
            {
                _loggingService.LogDebug($"[ANDROID_BT] RX processing took {_rxStopwatch.ElapsedMilliseconds}ms");
            }
        }
        catch (Exception ex)
        {
            _rxStopwatch.Stop();
            _loggingService.LogDebug($"AndroidOBD2: Characteristic update error: {ex.Message}");
        }
    }

    #endregion

    #region Helpers

    /// <summary>
    /// Parses CAN response to extract ECU address and PID
    /// Format: 7EB06410080080011 where:
    /// - 7EB = ECU address (7EA-7EF for functional addressing, 7E8-7EF for physical)
    /// - 06 = length (6 bytes follow)
    /// - 41 = service response (0x01 + 0x40)
    /// - 00 = PID
    /// Returns: "[ECU:7EB PID:0x00]" or empty string if not a CAN response
    /// </summary>
    private static string ParseCanResponseInfo(string response)
    {
        try
        {
            // Check if it's a CAN response (starts with 7E0-7EF)
            if (response.Length < 6) return "";
            
            string header = response.Substring(0, 3);
            if (!header.StartsWith("7E")) return "";
            
            // Parse ECU address (last nibble of header: 0-9, A-F)
            char ecuNibble = header[2];
            if (!IsHexDigit(ecuNibble)) return "";
            
            int ecuId = Convert.ToInt32(ecuNibble.ToString(), 16);
            string ecuAddress = $"7E{ecuNibble}";
            
            // For OBD responses, the format is typically:
            // 7EXX41PPDD... where XX is length, 41 is service+0x40, PP is PID, DD is data
            // Or for service 09 (VIN): 7EXX49PPDD...
            if (response.Length >= 8)
            {
                // Try to extract PID from the response
                // Position after header (3 chars) + length byte (2 chars) = 5
                // Service response starts at position 5, takes 2 chars
                if (response.Length >= 7)
                {
                    string serviceByte = response.Substring(5, 2);
                    if (byte.TryParse(serviceByte, System.Globalization.NumberStyles.HexNumber, null, out byte service))
                    {
                        // Service response = request service + 0x40
                        // e.g., 0x41 means service 0x01, 0x49 means service 0x09
                        if ((service >= 0x41 && service <= 0x49) && response.Length >= 9)
                        {
                            string pidByte = response.Substring(7, 2);
                            if (byte.TryParse(pidByte, System.Globalization.NumberStyles.HexNumber, null, out byte pid))
                            {
                                return $"[ECU:{ecuAddress} PID:0x{pid:X2}]";
                            }
                        }
                    }
                }
            }
            
            // Return just ECU address if we can't parse PID
            return $"[ECU:{ecuAddress} PID:??]";
        }
        catch
        {
            return "";
        }
    }
    
    private static bool IsHexDigit(char c)
    {
        return (c >= '0' && c <= '9') || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f');
    }

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

    #endregion

    #region Message Buffer

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
            if (_messageBuffer.Count > MaxBufferSize)
                _messageBuffer.RemoveAt(0);
        }
    }

    #endregion
}
#endif
