#if IOS
using Plugin.BLE.Abstractions.Contracts;
using Plugin.BLE;
using Plugin.BLE.Abstractions.EventArgs;
using llcar.Models;
using llcar.Services.ObdProtocol;
using System.Linq;
using System.Text;

namespace llcar.Services;

public class IOSBluetoothOBD2Service : IBluetoothOBD2Service
{
    private IAdapter? _adapter;
    private IDevice? _device;
    private IService? _service;
    private ICharacteristic? _txCharacteristic;
    private ICharacteristic? _rxCharacteristic;
    private bool _isListening = false;
    private CancellationTokenSource? _cts;
    private readonly string _targetServiceUUID = "00001101-0000-1000-8000-00805F9B34FB";
    private readonly string _targetTxCharacteristicUUID = "0000FFE1-0000-1000-8000-00805F9B34FB";
    private readonly string _targetRxCharacteristicUUID = "0000FFE1-0000-1000-8000-00805F9B34FB";

    public bool IsListening => _isListening;
    public bool IsConnected => _device != null;
    public bool IsInitialized => _isListening;
    public bool IsConnecting => false; // TODO: Implement for iOS if needed
    public ObdState State => _isListening ? ObdState.Connected : (_device != null ? ObdState.Initialized : ObdState.Undefined);
    public string? DeviceName => _device?.Name;
    public IAdapter? Adapter => _adapter;
    public IDevice? Device => _device;
    
    // iOS implementation doesn't use the new protocol handlers yet
    public ElmProtocolHandler? ProtocolHandler => null;
    public AdaptiveTiming? AdaptiveTiming => null;
    public PidDiscovery? PidDiscovery => null;
    public DiagnosticTroubleCodeHandler? DtcHandler => null;
    
    /// <summary>
    /// Current operating mode - affects where data is routed
    /// </summary>
    public ObdServiceMode CurrentMode { get; set; } = ObdServiceMode.Setup;

    public event EventHandler<OBD2Data>? DataReceived;
    public event EventHandler<ObdStateChangedEventArgs>? StateChanged;
    public event EventHandler<PidDataReceivedEventArgs>? PidDataReceived;
    public event EventHandler<string>? RawDataReceived;
    /// <summary>
    /// Fired when a command is transmitted to ELM327
    /// </summary>
    public event EventHandler<string>? CommandSent;
    public event EventHandler? ConnectionLost;
    /// <summary>
    /// Fired when Bluetooth adapter is successfully connected and initialized
    /// </summary>
    public event EventHandler? Connected;

    public async Task<bool> ConnectAsync(string adapterName)
    {
        try
        {
            _adapter = CrossBluetoothLE.Current.Adapter;
            _device = null;

            var devices = _adapter.GetSystemConnectedOrPairedDevices();
            var device = devices.FirstOrDefault(d => d.Name?.Contains("OBDII", StringComparison.OrdinalIgnoreCase) == true ||
                                                 d.Name?.Contains("ELM", StringComparison.OrdinalIgnoreCase) == true ||
                                                 d.Name?.Contains(adapterName, StringComparison.OrdinalIgnoreCase) == true);

            if (device == null)
            {
                return false;
            }

            _device = device;
            _service = null;

            await _adapter.ConnectToDeviceAsync(_device);
            await Task.Delay(1000);

            var services = await _device.GetServicesAsync();
            var targetService = services.FirstOrDefault(s => s.Id.ToString() == "00001101-0000-1000-8000-00805F9B34FB");

            if (targetService == null)
            {
                return false;
            }

            _service = targetService;

            var characteristics = await targetService.GetCharacteristicsAsync();
            _txCharacteristic = characteristics.FirstOrDefault(c => c.Id.ToString() == "0000FFE1-0000-1000-8000-00805F9B34FB");
            _rxCharacteristic = characteristics.FirstOrDefault(c => c.Id.ToString() == "0000FFE1-0000-1000-8000-00805F9B34FB");

            // Fire Connected event
            Connected?.Invoke(this, EventArgs.Empty);
            Log.Debug("[IOS_BT] Connected event fired");

            return true;
        }
        catch (Exception ex)
        {
            Log.Debug($"Connection error: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> DisconnectAsync()
    {
        try
        {
            StopListening();

            if (_device != null)
            {
                await _adapter.DisconnectDeviceAsync(_device);
            }

            _device = null;
            _service = null;
            _txCharacteristic = null;
            _rxCharacteristic = null;

            return true;
        }
        catch (Exception ex)
        {
            Log.Debug($"Disconnect error: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> StartListeningAsync()
    {
        try
        {
            if (_device == null)
            {
                Log.Debug("Device not connected");
                return false;
            }

            _cts = new CancellationTokenSource();
            _isListening = true;

            await Task.Run(async () =>
            {
                try
                {
                    while (!_cts.Token.IsCancellationRequested)
                    {
                        await Task.Delay(100, _cts.Token);

                        try
                        {
                            var obd2Data = await GetOBD2DataAsync();
                            DataReceived?.Invoke(this, obd2Data);
                        }
                        catch (Exception ex)
                        {
                            Log.Debug($"Error getting OBD2 data: {ex.Message}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    Log.Debug($"Error in listening loop: {ex.Message}");
                }
            }, _cts.Token);

            return true;
        }
        catch (Exception ex)
        {
            Log.Debug($"Start listening error: {ex.Message}");
            return false;
        }
    }

    public void StopListening()
    {
        _cts?.Cancel();
        _isListening = false;
    }

    public async Task<(bool success, string message)> InitializeAdapterAsync(List<InitializationCommand>? brandCommands = null)
    {
        try
        {
            if (_txCharacteristic == null || _rxCharacteristic == null)
            {
                return (false, "Characteristics not initialized");
            }

            Log.Debug("=== Starting OBD2 Adapter Initialization ===");

            // If brand-specific commands are provided, use them
            if (brandCommands != null && brandCommands.Count > 0)
            {
                Log.Debug($"Using brand-specific initialization with {brandCommands.Count} commands");
                
                foreach (var cmd in brandCommands.OrderBy(c => c.step))
                {
                    Log.Debug($"Step {cmd.step}: {cmd.description} ({cmd.command})");
                    
                    // Send command
                    await SendCommandAsync(cmd.command);
                    await Task.Delay(100);
                    
                    // Wait for response with timeout
                    var timeout = TimeSpan.FromMilliseconds(cmd.timeoutMs);
                    var response = await WaitForResponseAsync(timeout);
                    Log.Debug($"Response: {response}");
                    
                    // Validate response for critical commands
                    if (cmd.step == 1) // ATZ - Reset
                    {
                        if (!response.Contains("ELM") && !response.Contains("OK") && !response.Contains(">"))
                        {
                            Log.Debug("ERROR: ATZ did not receive expected response");
                            return (false, "Failed to reset adapter (ATZ)");
                        }
                    }
                    else if (cmd.command == "0100") // Query PIDs
                    {
                        if (string.IsNullOrWhiteSpace(response))
                        {
                            return (false, "No response from ECU (0100)");
                        }
                    }
                    
                    // Small delay between commands
                    if (cmd.step < brandCommands.Count)
                    {
                        await Task.Delay(50);
                    }
                }
                
                Log.Debug("=== Brand-specific OBD2 Adapter Initialization Complete ===");
                return (true, "Adapter initialized successfully with brand-specific settings");
            }
            
            // Fallback to default initialization
            Log.Debug("Using default initialization (no brand specified)");

            // Step 1: Send ATZ and wait for OK
            Log.Debug("Step 1: Sending ATZ (Reset)...");
            await SendCommandAsync("ATZ");
            var defaultResponse = await WaitForResponseAsync(TimeSpan.FromSeconds(3));
            Log.Debug($"ATZ Response: {defaultResponse}");
            
            if (!defaultResponse.Contains("ELM") && !defaultResponse.Contains("OK") && !defaultResponse.Contains(">"))
            {
                Log.Debug("ERROR: ATZ did not receive expected response");
                return (false, "Failed to reset adapter (ATZ)");
            }

            // Step 2: Configure adapter
            Log.Debug("Step 2: Sending configuration commands...");
            
            // Echo Off
            await SendCommandAsync("ATE0");
            await Task.Delay(100);
            
            // Linefeeds Off
            await SendCommandAsync("ATL0");
            await Task.Delay(100);
            
            // Spaces Off
            await SendCommandAsync("ATS0");
            await Task.Delay(100);
            
            // Adaptive Timing Off
            await SendCommandAsync("ATAT0");
            await Task.Delay(100);
            
            // Auto Protocol
            await SendCommandAsync("ATSP0");
            await Task.Delay(100);
            
            // Headers On
            await SendCommandAsync("ATH1");
            await Task.Delay(100);

            // Step 3: Query ECU with 0100
            Log.Debug("Step 3: Querying ECU with 0100...");
            await SendCommandAsync("0100");
            var pidResponse = await WaitForResponseAsync(TimeSpan.FromSeconds(5));
            Log.Debug($"0100 Response: {pidResponse}");
            
            if (string.IsNullOrEmpty(pidResponse))
            {
                Log.Debug("ERROR: No response from ECU");
                return (false, "No response from ECU (0100)");
            }

            // Wait for prompt character '>'
            Log.Debug("Step 4: Waiting for prompt (>...)");
            var promptReceived = await WaitForPromptAsync(TimeSpan.FromSeconds(3));
            
            if (!promptReceived)
            {
                Log.Debug("ERROR: Prompt character '>' not received");
                return (false, "Failed to initialize: prompt not received");
            }

            Log.Debug("=== OBD2 Adapter Initialization Complete ===");
            return (true, "Adapter initialized successfully");
        }
        catch (Exception ex)
        {
            Log.Debug($"Initialization error: {ex.Message}");
            return (false, $"Initialization error: {ex.Message}");
        }
    }

    private async Task<string> WaitForResponseAsync(TimeSpan timeout)
    {
        var responseBuilder = new System.Text.StringBuilder();
        var startTime = DateTime.Now;
        
        while (DateTime.Now - startTime < timeout)
        {
            try
            {
                var (data, resultCode) = await _rxCharacteristic.ReadAsync();
                if (data?.Length > 0)
                {
                    var responseStr = System.Text.Encoding.ASCII.GetString(data);
                    responseBuilder.Append(responseStr);
                    Log.Debug($"WaitForResponse chunk: {responseStr.Trim()}");
                    
                    // Check if we received a complete response
                    if (responseStr.Contains(">") || responseStr.Contains("OK"))
                    {
                        break;
                    }
                }
            }
            catch { }
            
            await Task.Delay(50);
        }
        
        return responseBuilder.ToString();
    }

    private async Task<bool> WaitForPromptAsync(TimeSpan timeout)
    {
        var startTime = DateTime.Now;
        
        while (DateTime.Now - startTime < timeout)
        {
            try
            {
                var (data, resultCode) = await _rxCharacteristic.ReadAsync();
                if (data?.Length > 0)
                {
                    var responseStr = System.Text.Encoding.ASCII.GetString(data);
                    if (responseStr.Contains(">"))
                    {
                        Log.Debug("Prompt '>' received");
                        return true;
                    }
                }
            }
            catch { }
            
            await Task.Delay(50);
        }
        
        return false;
    }

    public async Task<OBD2Data> GetOBD2DataAsync()
    {
        try
        {
            if (_txCharacteristic == null)
            {
                return GetMockData();
            }

            await SendCommandAsync("ATZ");
            await Task.Delay(1000);
            await SendCommandAsync("AT E0");
            await Task.Delay(100);

            var rpm = await ReadPidAsync("01 0C");
            var speed = await ReadPidAsync("01 0D");
            var coolantTemp = await ReadPidAsync("01 05");
            var throttlePos = await ReadPidAsync("01 11");
            var fuelLevel = await ReadPidAsync("01 0E");

            return new OBD2Data
            {
                EngineStatus = true,
                Speed = speed,
                FuelLevel = fuelLevel,
                RPM = rpm,
                EngineTemperature = coolantTemp,
                ThrottlePosition = throttlePos,
                CheckEngineLight = "Off",
                FuelEfficiency = 0
            };
        }
        catch (Exception ex)
        {
            Log.Debug($"Error getting OBD2 data: {ex.Message}");
            return GetMockData();
        }
    }

    private async Task<double> ReadPidAsync(string command)
    {
        try
        {
            await SendCommandAsync(command);
            await Task.Delay(200);

            string? response = null;
            var timeout = DateTime.Now.AddSeconds(2);

            while (DateTime.Now < timeout)
            {
                await Task.Delay(50);
                var (data, resultCode) = await _rxCharacteristic.ReadAsync();
                if (data?.Length > 0)
                {
                    var responseStr = System.Text.Encoding.ASCII.GetString(data);

                    if (responseStr.Contains("41"))
                    {
                        response = responseStr;
                        break;
                    }
                }
            }

            if (response != null && response.Contains("41"))
            {
                var parts = response.Split(' ');
                foreach (var part in parts)
                {
                    if (part.StartsWith("41") && part.Length >= 4)
                    {
                        string hexValue = part.Substring(2, 2);
                        if (byte.TryParse(hexValue, System.Globalization.NumberStyles.HexNumber, null, out byte byteValue))
                        {
                            return byteValue;
                        }
                    }
                }
            }

            return 0;
        }
        catch
        {
            return 0;
        }
    }
    
    public async Task<double?> ReadPidValueAsync(byte service, byte pid, CancellationToken ct = default)
    {
        var command = $"{service:X2} {pid:X2}";
        var value = await ReadPidAsync(command);
        return value;
    }
    
    public async Task<(byte[]? Data, string EcuAddress)> ReadPidRawAsync(byte service, byte pid, CancellationToken ct = default)
    {
        try
        {
            var command = $"{service:X2} {pid:X2}";
            await SendCommandAsync(command);
            await Task.Delay(200, ct);

            var responseBuilder = new System.Text.StringBuilder();
            var timeout = DateTime.Now.AddSeconds(2);

            while (DateTime.Now < timeout)
            {
                await Task.Delay(50, ct);
                var (data, resultCode) = await _rxCharacteristic.ReadAsync();
                if (data?.Length > 0)
                {
                    var responseStr = System.Text.Encoding.ASCII.GetString(data);
                    responseBuilder.Append(responseStr);

                    if (responseStr.Contains(">"))
                    {
                        break;
                    }
                }
            }

            var response = responseBuilder.ToString();
            
            // Parse response: 7EB0641PPDD... where 7EB = ECU, 06 = length, 41 = service+0x40, PP = PID, DD = data
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
        catch
        {
            return (null, "");
        }
    }
    
    public async Task<(List<(byte[] Data, string EcuAddress)> Responses, Dictionary<byte, byte> EcuMasksByPid)> ReadPidRawFromAllEcusAsync(byte service, byte pid, byte expectedEcuMask = 0, CancellationToken ct = default)
    {
        // For iOS, just call ReadPidRawAsync and return single result as list
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
    
    public Task<bool> InitializeAsync(ElmProtocol preferredProtocol = ElmProtocol.Automatic)
    {
        // iOS uses the existing InitializeAdapterAsync method
        return Task.FromResult(true);
    }
    
    public Task<bool> StartDataStreamAsync(CancellationToken ct = default)
    {
        return StartListeningAsync();
    }
    
    public void StopDataStream()
    {
        StopListening();
    }
    
    public Task<bool> StartPidDiscoveryAsync(ObdService service = ObdService.CurrentData)
    {
        // Not implemented in iOS legacy version
        return Task.FromResult(false);
    }
    
    public void SetFixedPids(IEnumerable<byte> pids) { }
    public void ResetFixedPids() { }
    
    public Task ReadTroubleCodesAsync()
    {
        // Send mode 03 command
        return SendCommandAsync("03");
    }
    
    public Task ClearTroubleCodesAsync()
    {
        // Send mode 04 command
        return SendCommandAsync("04");
    }

    public Task<List<DiagnosticTroubleCode>> GetDiagnosticTroubleCodesAsync(CancellationToken ct = default)
    {
        // iOS implementation - return empty list for now
        // This would need platform-specific implementation
        Log.Debug("iOSOBD2: GetDiagnosticTroubleCodesAsync not implemented");
        return Task.FromResult(new List<DiagnosticTroubleCode>());
    }

    public Task<string> SendCommandAsync(ObdCommand command, CancellationToken ct = default)
    {
        return SendCommandAsync(command.Command, ct);
    }
    
    public Task<string> SendCommandAsync(string command, CancellationToken ct = default)
    {
        SendCommandAsync(command);
        return Task.FromResult("");
    }

    private async Task SendCommandAsync(string command)
    {
        if (_txCharacteristic == null)
            return;

        try
        {
            var bytes = System.Text.Encoding.ASCII.GetBytes(command + "\r\n");
            await _txCharacteristic.WriteAsync(bytes);
            await Task.Delay(100);
        }
        catch (Exception ex)
        {
            Log.Debug($"Send command error: {ex.Message}");
        }
    }

    private OBD2Data GetMockData()
    {
        return new OBD2Data
        {
            EngineStatus = true,
            Speed = 0,
            FuelLevel = 100,
            RPM = 0,
            EngineTemperature = 90,
            ThrottlePosition = 0,
            CheckEngineLight = "Off",
            FuelEfficiency = 0
        };
    }

    public bool IsBluetoothAvailable()
    {
        try
        {
            return CrossBluetoothLE.Current.IsAvailable;
        }
        catch
        {
            return false;
        }
    }

    public async Task<string[]> GetAvailableAdaptersAsync()
    {
        try
        {
            _adapter = CrossBluetoothLE.Current.Adapter;
            if (_adapter == null)
                return Array.Empty<string>();

            var devices = _adapter.GetSystemConnectedOrPairedDevices();

            var obdAdapters = devices
                .Where(d => d.Name?.Contains("OBDII", StringComparison.OrdinalIgnoreCase) == true ||
                           d.Name?.Contains("ELM", StringComparison.OrdinalIgnoreCase) == true)
                .Select(d => d.Name ?? "Unknown Device")
                .ToArray();

            return obdAdapters;
        }
        catch
        {
            return Array.Empty<string>();
        }
    }

    public async Task<string[]> GetELM327AdaptersAsync(bool fullScan = false, bool showAllDevices = false, Action<string>? onDeviceDiscovered = null)
    {
        try
        {
            _adapter = CrossBluetoothLE.Current.Adapter;
            if (_adapter == null)
            {
                Log.Debug("GetELM327AdaptersAsync: Adapter is null");
                return Array.Empty<string>();
            }

            var allDevices = new List<IDevice>();

            Log.Debug($"GetELM327AdaptersAsync: Starting... Full scan: {fullScan}");

            // Step 1: Get paired devices
            try
            {
                var devices = _adapter.GetSystemConnectedOrPairedDevices().ToList();
                Log.Debug($"GetELM327AdaptersAsync: Found {devices.Count} paired devices");
                
                foreach (var device in devices)
                {
                    Log.Debug($"  Paired: {device.Name ?? "null"}");
                    if (!allDevices.Any(d => d.Id == device.Id))
                    {
                        allDevices.Add(device);
                    }
                }
            }
            catch (Exception ex)
            {
                Log.Debug($"Error getting paired devices: {ex.Message}");
            }

            // Step 2: ALWAYS scan for new devices
            Log.Debug("GetELM327AdaptersAsync: Starting scan for new devices...");
            var discoveredDevices = new List<IDevice>();
            
            EventHandler<DeviceEventArgs>? deviceDiscoveredHandler = null;
            deviceDiscoveredHandler = (s, e) =>
            {
                if (e.Device != null && !discoveredDevices.Any(d => d.Id == e.Device.Id))
                {
                    var displayName = !string.IsNullOrEmpty(e.Device.Name) ? e.Device.Name : $"Unknown ({e.Device.Id.ToString().Substring(0, 8)}...)";
                    Log.Debug($"  Discovered: {displayName}");
                    discoveredDevices.Add(e.Device);
                    
                    // Notify callback immediately for real-time UI updates
                    onDeviceDiscovered?.Invoke(displayName);
                }
            };

            try
            {
                _adapter.DeviceDiscovered += deviceDiscoveredHandler;
                await _adapter.StartScanningForDevicesAsync();
                Log.Debug("GetELM327AdaptersAsync: Scanning for 5 seconds...");
                await Task.Delay(5000);
                await _adapter.StopScanningForDevicesAsync();
                Log.Debug("GetELM327AdaptersAsync: Scan stopped");
            }
            catch (Exception scanEx)
            {
                Log.Debug($"Scan error: {scanEx.Message}");
            }
            finally
            {
                _adapter.DeviceDiscovered -= deviceDiscoveredHandler;
            }

            Log.Debug($"GetELM327AdaptersAsync: Discovered {discoveredDevices.Count} devices during scan");
            
            // Add discovered devices to the list
            foreach (var device in discoveredDevices)
            {
                if (!allDevices.Any(d => d.Id == device.Id))
                {
                    allDevices.Add(device);
                }
            }

            // Step 3: Show all discovered BLE devices (including unnamed with MAC addresses)
            string[] elm327Adapters = allDevices
                .Select(d => !string.IsNullOrEmpty(d.Name) ? d.Name! : $"Unknown ({d.Id.ToString().Substring(0, 8)}...)")
                .Distinct()
                .ToArray();
                    d.Name.Contains("WIRELESS", StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Contains("MODULE", StringComparison.OrdinalIgnoreCase) ||
                    
                    // Common Chinese adapter patterns
                    d.Name.Contains("CHX", StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Contains("HH", StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Contains("MINI", StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Contains("PRO", StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Contains("SUPER", StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Contains("ULTRA", StringComparison.OrdinalIgnoreCase) ||
                    
                    // Automotive specific
                    d.Name.Contains("AUTO", StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Contains("CAR", StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Contains("MOTOR", StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Contains("ENGINE", StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Contains("ECU", StringComparison.OrdinalIgnoreCase) ||
                    
                    // Serial/communication
                    d.Name.Contains("COM", StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Contains("SERIAL", StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Contains("UART", StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Contains("RS232", StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Contains("FIXD", StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Contains("V020", StringComparison.OrdinalIgnoreCase)))
                .Select(d => d.Name!)
                .Distinct()
                .ToArray();
            }

            Log.Debug($"GetELM327AdaptersAsync: Returning {elm327Adapters.Length} ELM327 devices");
            foreach (var name in elm327Adapters)
            {
                Log.Debug($"  -> {name}");
            }
            return elm327Adapters;
        }
        catch (Exception ex)
        {
            Log.Debug($"GetELM327AdaptersAsync Error: {ex.Message}");
            return Array.Empty<string>();
        }
    }

    public void InvalidateCache()
    {
        // iOS implementation - no cache yet, but required by interface
        Log.Debug("[IOS_BT] Cache invalidation requested (not implemented)");
    }

    public async Task<string?> ReadVinAsync(CancellationToken ct = default)
    {
        try
        {
            Log.Debug("[IOS_BT] Reading VIN from ECU...");
            
            // VIN is read using Service 0x09 (Vehicle Information) PID 0x02
            var cmd = ObdCommand.ServiceCommand(ObdService.VehicleInfo, 0x02);
            
            // Use multi-frame support to get complete response
            // VIN reading: no early exit (expectedEcuMask=0), wait for full response
            var result = await SendCommandWithMultiFrameSupportAsync(cmd, 0, ct);
            
            if (string.IsNullOrEmpty(result.Response))
            {
                Log.Debug("[IOS_BT] VIN read failed: empty response");
                return null;
            }
            
            // Parse VIN from response - skip protocol header and service response bytes
            // Expected format: 7E810144902114C5734... (where 4902 is the service response)
            var cleanResponse = result.Response.Replace(" ", "").Replace(">", "").Trim();
            
            // Find the 4902 marker (Service 09 PID 02)
            var idx = cleanResponse.IndexOf("4902", StringComparison.OrdinalIgnoreCase);
            if (idx >= 0 && idx + 38 <= cleanResponse.Length)
            {
                // VIN starts after 4902, takes next 34 hex chars (17 ASCII chars)
                var vinHex = cleanResponse.Substring(idx + 4, 34);
                var vin = HexToAscii(vinHex);
                
                if (!string.IsNullOrEmpty(vin) && vin.Length >= 17)
                {
                    Log.Debug($"[IOS_BT] VIN read: '{vin}' ({vin.Length} chars)");
                    return vin;
                }
            }
            
            Log.Debug($"[IOS_BT] VIN parse failed from response: {result.Response}");
            return null;
        }
        catch (Exception ex)
        {
            Log.Debug($"[IOS_BT] VIN read error: {ex.Message}");
            return null;
        }
    }

    public async Task<ObdCommandResult> SendCommandWithMultiFrameSupportAsync(ObdCommand command, byte expectedEcuMask = 0, CancellationToken ct = default)
    {
        var result = new ObdCommandResult();
        
        try
        {
            Log.Debug($"[IOS_BT] Sending command with multi-frame support: {command.Command}, expected ECU mask: 0x{expectedEcuMask:X2}");
            
            var allData = new StringBuilder();
            var startTime = DateTime.Now;
            var timeout = TimeSpan.FromMilliseconds(2000);
            var firstFrameReceived = false;
            var collectionStartTime = DateTime.Now;
            var collectionTimeout = TimeSpan.FromMilliseconds(500);
            
            // Subscribe to RawDataReceived to collect all frames
            void OnRawData(object? sender, string data)
            {
                if (data.StartsWith("<<< "))
                {
                    var cleanData = data.Substring(4).Replace(" ", "").Replace(">", "").Trim();
                    if (!string.IsNullOrEmpty(cleanData) && cleanData.Length > 3)
                    {
                        Log.Debug($"[IOS_BT] Collected frame: {cleanData}");
                        allData.Append(cleanData);
                        
                        if (!firstFrameReceived && cleanData.Length >= 5 && cleanData.Substring(3, 1) == "1")
                        {
                            firstFrameReceived = true;
                            collectionStartTime = DateTime.Now;
                        }
                    }
                }
            }
            
            RawDataReceived += OnRawData;
            
            try
            {
                await SendCommandAsync(command.Command);
                
                while (DateTime.Now - startTime < timeout)
                {
                    if (firstFrameReceived && DateTime.Now - collectionStartTime >= collectionTimeout)
                    {
                        Log.Debug("[IOS_BT] Collection timeout reached");
                        break;
                    }
                    await Task.Delay(50);
                }
            }
            finally
            {
                RawDataReceived -= OnRawData;
            }
            
            result.Response = allData.ToString();
            result.Elapsed = DateTime.Now - startTime;
            Log.Debug($"[IOS_BT] Multi-frame response: {result.Response}");
            return result;
        }
        catch (Exception ex)
        {
            Log.Debug($"[IOS_BT] Multi-frame command error: {ex.Message}");
            return result;
        }
    }

    private static string? HexToAscii(string hex)
    {
        try
        {
            var bytes = new byte[hex.Length / 2];
            for (int i = 0; i < hex.Length; i += 2)
            {
                bytes[i / 2] = Convert.ToByte(hex.Substring(i, 2), 16);
            }
            return System.Text.Encoding.ASCII.GetString(bytes);
        }
        catch
        {
            return null;
        }
    }
}
#endif
