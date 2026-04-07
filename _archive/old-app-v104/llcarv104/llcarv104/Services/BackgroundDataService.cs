using llcar.Models;
using llcar.Models.QtpCompression;
using llcar.Services.ObdProtocol;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using Core.Logger;

#if ANDROID
using Android.Util;
#endif

namespace llcar.Services
{
    /// <summary>
    /// Main background service for collecting and sending vehicle data
    /// </summary>
    public interface IBackgroundDataService
    {
        /// <summary>
        /// Starts the background data collection
        /// </summary>
        Task<bool> StartAsync(BackgroundServiceSettings settings);
        
        /// <summary>
        /// Stops the background data collection
        /// </summary>
        Task StopAsync();
        
        /// <summary>
        /// Returns true if the service is running
        /// </summary>
        bool IsRunning { get; }
        
        /// <summary>
        /// Current service status
        /// </summary>
        BackgroundServiceStatus Status { get; }
        
        /// <summary>
        /// Event fired when status changes
        /// </summary>
        event EventHandler<BackgroundServiceStatus>? StatusChanged;
        
        /// <summary>
        /// Event fired when data is collected (for UI, converted from QTP)
        /// </summary>
        event EventHandler<BackgroundDataPacket>? DataCollected;
        
        /// <summary>
        /// Event fired when raw QTP data is collected (for server upload)
        /// </summary>
        event EventHandler<QtpPacket>? QtpDataCollected;

        /// <summary>
        /// Event fired when VIN read fails after timeout
        /// </summary>
        event EventHandler<string>? VinReadFailed;

        /// <summary>
        /// Event fired when VIN is successfully read from ECU
        /// </summary>
        event EventHandler<string>? VinReadSuccess;

        /// <summary>
        /// Gets recent data packets (for UI display)
        /// </summary>
        IReadOnlyList<BackgroundDataPacket> GetRecentData(int count = 10);
        
        /// <summary>
        /// Forces an immediate data upload
        /// </summary>
        Task<bool> ForceUploadAsync(CancellationToken ct = default);
    }
    
    public enum BackgroundServiceStatus
    {
        Stopped,
        Starting,
        Running,
        Paused,
        Error,
        Uploading
    }
    
    /// <summary>
    /// Implementation of the background data service
    /// </summary>
    public class BackgroundDataService : IBackgroundDataService
    {
        private readonly IBluetoothOBD2Service _bluetoothService;
        private readonly IPidConfigurationService _pidConfigService;
        private readonly IServerCommunicationService _serverService;
        private readonly IAccelerometerCaptureService _accelerometerService;
        private readonly IAudioCaptureService _audioService;
        private readonly IBrandInitializationService _brandService;
        private readonly ISettingsService _settingsService;
        private readonly IGeolocation _geolocation;
        private readonly NormalizedVehicleDataRepository _normalizedVehicleDataRepository;
        private readonly ServiceLogger _logger;



        private BackgroundServiceSettings _settings = new();
        private CancellationTokenSource? _cts;
        private Task? _collectionTask;
        private Task? _uploadTask;
        private Task? _accelerometerTask;
        private Task? _audioTask;
        
        private readonly ConcurrentQueue<BackgroundDataPacket> _dataQueue = new();
        private readonly List<BackgroundDataPacket> _recentData = new();
        private readonly SemaphoreSlim _recentDataLock = new(1, 1);
        
        // Retry queue for failed packets - stores packet with first failure timestamp
        private readonly ConcurrentQueue<(BackgroundDataPacket Packet, DateTime FirstFailureTime)> _retryQueue = new();
        private readonly SemaphoreSlim _retryLock = new(1, 1);
        private readonly SemaphoreSlim _startStopLock = new(1, 1);
        
        // Flag to track if PID discovery is in progress
        // Note: Command serialization is now handled by IBluetoothOBD2Service._commandLock
        private bool _isDiscoveringPids = false;
        
        // Lock for thread-safe access to PID configuration collections
        // BUG-1 fix: Prevents data race between discovery and collection threads
        private readonly object _pidConfigLock = new object();
        private DateTime _lastRetryTime = DateTime.MinValue;
        
        private BackgroundServiceStatus _status = BackgroundServiceStatus.Stopped;
        private DateTime _lastUploadTime = DateTime.MinValue;
        private DateTime _lastDtcCheckTime = DateTime.MinValue;
        private bool _isRegistered = false;
        private bool _hasBeenInitialized = false; // Track if ELM327 has been initialized in this session
        
        // Logging throttling
        private readonly TimeSpan _audioLogInterval = TimeSpan.FromSeconds(1);
        
        // PID availability tracking
        private readonly HashSet<uint> _availablePids = new(); // Combined service+pid (0xSSPP)
        private List<PidConfiguration> _activePidConfigs = new();
        private readonly Dictionary<int, List<PidConfiguration>> _pidsByCycle = new();
        // Separate storage for CSV and discovered PIDs to enable intersection logic
        private List<PidConfiguration> _csvPidConfigs = new();
        private List<PidConfiguration> _discoveredPidConfigs = new();
        // Track which ECUs responded for each PID (key: "p0C_0", value: bitmask of ECUs)
        private readonly ConcurrentDictionary<string, byte> _pidEcuMasks = new();
        // Store all configurations grouped by Service+PID for multi-field parsing
        private Dictionary<string, List<PidConfiguration>> _configsByPidKey = new();
        
        // BUG-4 FIX: Doze Mode tracking
        private DateTime _lastDozeLogTime = DateTime.MinValue;
        private bool _wasInDozeMode = false;
        
        // QTP Compression components
        private readonly IWeatherService _weatherService;
        private global::llcar.Models.QtpCompression.QtpWindowManager? _qtpWindowManager;
        private readonly SensorWindowManager _sensorWindowManager;
        private QtpPacketBuilder? _qtpPacketBuilder;
        private readonly IQtpRetryService _qtpRetryService;
        private readonly global::llcar.Models.QtpCompression.QtpAudioAggregator _audioAggregator;
        private readonly global::llcar.Models.QtpCompression.QtpAccelAggregator _accelAggregator;
        
        // QTP data queues
        private readonly ConcurrentQueue<QtpPacket> _qtpQueue = new();
        private readonly List<QtpPacket> _recentQtpData = new();
        private readonly SemaphoreSlim _qtpDataLock = new(1, 1);
        
        // PID data queue - accumulates readings for QTP window
        private readonly ConcurrentQueue<(string pidKey, int value, DateTime timestamp)> _pidDataQueue = new();
        
        // Current DTCs for event handler access
        private List<DiagnosticTroubleCode>? _currentDtcs;
        
        public bool IsRunning => _status == BackgroundServiceStatus.Running || 
                                 _status == BackgroundServiceStatus.Uploading;
        
        public BackgroundServiceStatus Status 
        { 
            get => _status;
            private set
            {
                if (_status != value)
                {
                    _status = value;
                    StatusChanged?.Invoke(this, value);
                }
            }
        }
        
        public event EventHandler<BackgroundServiceStatus>? StatusChanged;
        public event EventHandler<BackgroundDataPacket>? DataCollected;
        public event EventHandler<QtpPacket>? QtpDataCollected;
        public event EventHandler<string>? VinReadFailed;
        public event EventHandler<string>? VinReadSuccess;
        
        public BackgroundDataService(
            IBluetoothOBD2Service bluetoothService,
            IPidConfigurationService pidConfigService,
            IServerCommunicationService serverService,
            IAccelerometerCaptureService accelerometerService,
            IAudioCaptureService audioService,
            IBrandInitializationService brandService,
            ISettingsService settingsService,
            IGeolocation geolocation,
            IWeatherService weatherService,
            IQtpRetryService qtpRetryService,
            NormalizedVehicleDataRepository normalizedVehicleDataRepository,
            ServiceLogger logger)
        {
            _bluetoothService = bluetoothService;
            _pidConfigService = pidConfigService;
            _serverService = serverService;
            _accelerometerService = accelerometerService;
            _audioService = audioService;
            _brandService = brandService;
            _settingsService = settingsService;
            _geolocation = geolocation;
            _weatherService = weatherService;
            _qtpRetryService = qtpRetryService;
            _normalizedVehicleDataRepository = normalizedVehicleDataRepository;
            _logger = logger;
            _sensorWindowManager = new SensorWindowManager();
            _qtpPacketBuilder = new QtpPacketBuilder(_weatherService);
        }
        
        /// <summary>
        /// BUG-4 FIX: Check if device is in Doze Mode (Android 6.0+)
        /// In Doze Mode, network operations are restricted to conserve battery
        /// </summary>
        private bool IsInDozeMode()
        {
#if ANDROID
            try
            {
                if (Android.OS.Build.VERSION.SdkInt >= Android.OS.BuildVersionCodes.M)
                {
                    var context = Android.App.Application.Context;
                    var powerManager = context.GetSystemService(Android.Content.Context.PowerService) as Android.OS.PowerManager;
                    if (powerManager != null)
                    {
                        return powerManager.IsDeviceIdleMode;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.Debug($"[DOZE] Error checking idle mode: {ex.Message}");
            }
#endif
            return false;
        }
        
        /// <summary>
        /// BUG-4 FIX: Check if app is ignoring battery optimizations ( whitelist)
        /// </summary>
        private bool IsIgnoringBatteryOptimizations()
        {
#if ANDROID
            try
            {
                if (Android.OS.Build.VERSION.SdkInt >= Android.OS.BuildVersionCodes.M)
                {
                    var context = Android.App.Application.Context;
                    var powerManager = context.GetSystemService(Android.Content.Context.PowerService) as Android.OS.PowerManager;
                    if (powerManager != null)
                    {
                        return powerManager.IsIgnoringBatteryOptimizations(context.PackageName);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.Debug($"[DOZE] Error checking battery optimization: {ex.Message}");
            }
#endif
            return false;
        }
        
        public async Task<bool> StartAsync(BackgroundServiceSettings settings)
        {
            await _startStopLock.WaitAsync();
            try
            {
                if (IsRunning)
                {
                    _logger.Debug("BackgroundDataService already running");
                    return true;
                }
                
                _logger.Information("Starting BackgroundDataService...");
                Status = BackgroundServiceStatus.Starting;
                
                // Store settings
                _settings = settings;
                
                // Initialize cancellation token
                _cts = new CancellationTokenSource();
                
                // Load PID configurations first
                await _pidConfigService.LoadConfigurationsAsync();
                _logger.Information("[QTP_INIT] PID configurations loaded from CSV");
                
                // Get all configurations
                var allPids = _pidConfigService.GetAllConfigurations();
                _logger.Information($"[QTP_INIT] Loaded {allPids.Count()} PID configurations");
                
                // Build PID ranges for QTP compression
                // Add ranges for all ECU indices (0-7) since same PID can come from different ECUs
                var pidRanges = new Dictionary<string, (double min, double max)>();
                foreach (var pid in allPids)
                {
                    if (!string.IsNullOrEmpty(pid.Pid))
                    {
                        var pidClean = pid.Pid.Replace("0x", "").ToUpper();
                        var min = pid.Min ?? 0;
                        var max = pid.Max ?? 65535;
                        // Add for all 8 possible ECU indices
                        for (int ecuIdx = 0; ecuIdx <= 7; ecuIdx++)
                        {
                            var key = $"p{pidClean}_{ecuIdx}";
                            pidRanges[key] = (min, max);
                        }
                        _logger.Information($"[QTP_INIT] Added PID {pidClean} with range [{min}, {max}] for all ECUs");
                    }
                }
                _logger.Information($"[QTP_INIT] Total PID ranges: {pidRanges.Count}");
                
                _qtpWindowManager = new global::llcar.Models.QtpCompression.QtpWindowManager(
                    _settings.UploadIntervalSeconds * 1000,
                    pidRanges
                );
                
                // Subscribe to window completion event
                _qtpWindowManager.WindowCompleted += async (sender, e) =>
                {
                    try
                    {
                        var (qtpData, start, end) = e;
                        _logger.Debug($"[QTP_EVENT] Window completed with {qtpData.Count} PIDs from QTP direct");
                        
                        // Drain PID queue and add to window data
                        var queuedData = DrainPidQueue();
                        _logger.Debug($"[QTP_EVENT] Drained {queuedData.Count} PIDs from queue");
                        
                        // Merge QTP data with queued data
                        foreach (var kvp in queuedData)
                        {
                            if (!qtpData.ContainsKey(kvp.Key))
                            {
                                qtpData[kvp.Key] = kvp.Value;
                            }
                        }
                        
                        _logger.Debug($"[QTP_EVENT] Total PIDs after merge: {qtpData.Count}");
                        await ProcessQtpWindowAsync((qtpData, start, end), _currentDtcs, _cts.Token);
                    }
                    catch (Exception ex)
                    {
                        _logger.Error(ex, $"[QTP_EVENT] Error in WindowCompleted handler: {ex.Message}");
                    }
                };
                
                _logger.Information("QTP compression initialized with {0} PIDs, window: {1}ms, SensorWindowManager ready", 
                    pidRanges.Count, _settings.UploadIntervalSeconds * 1000);
                
                // Initialize ELM327 adapter before starting data collection
                if (!_hasBeenInitialized)
                {
                    _logger.Information("Initializing ELM327 adapter...");
                    _logger.Debug("[BG_SERVICE] Initializing ELM327 adapter...");
                    var initSuccess = await InitializeELM327AdapterAsync(_cts.Token);
                    if (!initSuccess)
                    {
                        _logger.Error("Failed to initialize ELM327 adapter");
                        _logger.Debug("[BG_SERVICE] ERROR: Failed to initialize ELM327 adapter");
                        Status = BackgroundServiceStatus.Error;
                        return false;
                    }
                    _hasBeenInitialized = true;
                    _logger.Information("ELM327 adapter initialized successfully");
                    _logger.Debug("[BG_SERVICE] ELM327 adapter initialized successfully");
                    
                    // Check if still connected after initialization
                    if (!_bluetoothService.IsConnected)
                    {
                        _logger.Error("Bluetooth disconnected during initialization");
                        throw new InvalidOperationException("Bluetooth connection lost during adapter initialization");
                    }
                    
                    // Read VIN if not already set
                    if (string.IsNullOrEmpty(settings.Vin))
                    {
                        _logger.Debug("Reading VIN from ECU...");
                        
                        // CRITICAL: Check if Bluetooth is actually connected before reading VIN
                        if (!_bluetoothService.IsConnected)
                        {
                            _logger.Warning("[BG_SERVICE] Bluetooth not connected, waiting for connection...");
                            Console.WriteLine("[BG_SERVICE] Bluetooth not connected, waiting up to 5 seconds...");
                            int waitCount = 0;
                            while (!_bluetoothService.IsConnected && waitCount < 50) // Wait up to 5 seconds
                            {
                                await Task.Delay(100, _cts.Token);
                                waitCount++;
                            }
                            
                            if (!_bluetoothService.IsConnected)
                            {
                                _logger.Error("[BG_SERVICE] Bluetooth still not connected after 5 seconds, cannot read VIN");
                                Console.WriteLine("[BG_SERVICE] ERROR: Bluetooth not connected after 5 seconds!");
                                VinReadFailed?.Invoke(this, "Bluetooth адаптер не подключен. Проверьте соединение.");
                                // Continue without VIN - service can still collect local data
                                return true; // Return true to allow service to continue without VIN
                            }
                            Console.WriteLine("[BG_SERVICE] Bluetooth connected after waiting!");
                        }
                        
                        // Wait for ELM327 to be fully ready after initialization
                        _logger.Debug("Waiting 500ms for adapter stabilization...");
                        await Task.Delay(500, _cts.Token);
                        
                        string? vin = null;
                        int vinAttempts = 0;
                        const int maxVinAttempts = 2;
                        
                        // Try reading VIN up to 2 times
                        while (vinAttempts < maxVinAttempts && string.IsNullOrEmpty(vin))
                        {
                            vinAttempts++;
                            _logger.Debug($"VIN read attempt {vinAttempts}/{maxVinAttempts}...");
                            
                            var vinCts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
                            try
                            {
                                vin = await _bluetoothService.ReadVinAsync(vinCts.Token);
                                
                                if (!string.IsNullOrEmpty(vin))
                                {
                                    _logger.Information($"VIN successfully read on attempt {vinAttempts}: {vin}");
                                    break;
                                }
                                else if (vinAttempts < maxVinAttempts)
                                {
                                    _logger.Warning($"VIN read attempt {vinAttempts} returned empty, retrying...");
                                    await Task.Delay(500, _cts.Token);
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.Warning($"VIN read attempt {vinAttempts} failed: {ex.Message}");
                                if (vinAttempts < maxVinAttempts)
                                {
                                    await Task.Delay(500, _cts.Token);
                                }
                            }
                        }
                        
                        if (!string.IsNullOrEmpty(vin))
                        {
                            // Load current settings and update VIN
                            var currentSettings = await _settingsService.LoadSettingsAsync();
                            if (currentSettings != null)
                            {
                                currentSettings.Vin = vin;
                                currentSettings.ClientHash = ComputeSimpleHash(vin);
                                await _settingsService.SaveSettingsAsync(currentSettings);
                                
                                // Update _settings used by upload loop
                                _settings.Vin = vin;
                                _settings.ClientHash = currentSettings.ClientHash;
                                _logger.Information("VIN read and saved: {0}", vin);
                                _logger.Information("VIN now available - upload will start automatically");
                                
                                // Notify UI about successful VIN read
                                VinReadSuccess?.Invoke(this, vin);
                            }
                        }
                        else
                        {
                            _logger.Warning($"VIN read failed after {maxVinAttempts} attempts");
                            // Notify UI about VIN read failure
                            VinReadFailed?.Invoke(this, "Не удалось прочитать VIN после нескольких попыток. Проверьте подключение адаптера и перейдите в Настройки.");
                        }
                    }
                }
                
                // Switch to Background mode to isolate data from Settings/MainPage
                _logger.Debug("Switching to Background mode...");
                _bluetoothService.CurrentMode = ObdServiceMode.Background;
                
                // Stop the regular data stream to prevent conflicts with background polling
                _logger.Debug("Stopping regular data stream...");
                _bluetoothService.StopDataStream();
                await Task.Delay(500); // Give time for stream to stop completely
                
                // Start PID discovery in background (non-blocking)
                if (_bluetoothService.IsConnected)
                {
                    _logger.Debug("Starting PID discovery in background...");
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await DiscoverAvailablePidsAsync(_cts.Token);
                            _logger.Information("Background PID discovery complete. Available PIDs: {0}", _availablePids.Count);
                        }
                        catch (Exception ex)
                        {
                            _logger.Error(ex, "Background PID discovery failed: {0}", ex.Message);
                        }
                    });
                }
                
                // Register client if not already registered
                if (!_isRegistered && !string.IsNullOrEmpty(settings.ClientHash))
                {
                    var registration = new ClientRegistration
                    {
                        changedt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                        thash = settings.ClientHash,
                        mobile = settings.MobileNumber,
                        email = settings.Email,
                        vin = settings.Vin,
                        brand = settings.SelectedBrandName,
                        model = settings.SelectedModelName,
                        year = settings.SelectedYear,
                        obd2_device = settings.SelectedAdapter,
                        smartphone = $"{DeviceInfo.Current.Manufacturer} {DeviceInfo.Current.Model}"
                    };
                    
                    _isRegistered = await _serverService.RegisterClientAsync(registration, _cts.Token);
                    if (!_isRegistered)
                    {
                        _logger.Warning("Failed to register client, continuing anyway...");
                    }
                }
                
                // Configure window managers for sensor services
                _accelerometerService.SetWindowManager(_sensorWindowManager);
                _audioService.SetWindowManager(_sensorWindowManager);
                
                // Start accelerometer capture
                _logger.Debug($"[BG_SERVICE] Starting accelerometer (Available={_accelerometerService.IsAvailable})...");
                bool accelStarted = await _accelerometerService.StartAsync(_settings.AccelerometerSampleRate);
                _logger.Debug($"[BG_SERVICE] Accelerometer start result: {accelStarted}");
                
                // Start audio capture if enabled
                if (_settings.EnableSoundRecording)
                {
                    _logger.Debug($"Starting audio capture (EnableSoundRecording={_settings.EnableSoundRecording})");
                    bool audioStarted = await _audioService.StartAsync(_settings.SoundRecordingDurationMs);
                    _logger.Debug($"Audio service start result: {audioStarted}, IsAvailable={_audioService.IsAvailable}");
                }
                
                // Start data collection loop
                _logger.Debug("[BG_SERVICE] Starting data collection task...");
                _collectionTask = RunDataCollectionAsync(_cts.Token);
                _logger.Debug("[BG_SERVICE] Data collection task started");
                
                // Start upload loop
                _uploadTask = RunUploadLoopAsync(_cts.Token);
                
                // Process any pending packets from previous sessions or Doze Mode
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await ProcessPendingPacketsBacklogAsync(_cts.Token);
                    }
                    catch (Exception ex)
                    {
                        _logger.Error(ex, "Error processing pending packets backlog: {0}", ex.Message);
                    }
                });
                
                // Start accelerometer processing loop
                _accelerometerTask = RunAccelerometerLoopAsync(_cts.Token);
                
                // Start audio processing loop if enabled
                if (_settings.EnableSoundRecording)
                {
                    _audioTask = RunAudioLoopAsync(_cts.Token);
                }
                
                Status = BackgroundServiceStatus.Running;
                _logger.Information("BackgroundDataService started successfully");
                return true;
            }
            catch (Exception ex)
            {
                _logger.Debug($"[BG_SERVICE] EXCEPTION in StartAsync: {ex.GetType().Name}: {ex.Message}");
                _logger.Debug($"[BG_SERVICE] Stack trace: {ex.StackTrace}");
                _logger.Error(ex, "Failed to start BackgroundDataService: {0}", ex.Message);
                Status = BackgroundServiceStatus.Error;
                return false;
            }
            finally
            {
                _startStopLock.Release();
            }
        }
        
        public async Task StopAsync()
        {
            await _startStopLock.WaitAsync();
            try
            {
                if (!IsRunning && Status != BackgroundServiceStatus.Starting)
                    return;
                
                try
                {
                    _cts?.Cancel();
                    
                    // Stop accelerometer
                    await _accelerometerService.StopAsync();
                    
                    // Stop audio
                    await _audioService.StopAsync();
                    
                    // Wait for tasks to complete with timeout
                    if (_collectionTask != null)
                        await Task.WhenAny(_collectionTask, Task.Delay(5000));
                    
                    if (_uploadTask != null)
                        await Task.WhenAny(_uploadTask, Task.Delay(5000));
                    
                    if (_accelerometerTask != null)
                        await Task.WhenAny(_accelerometerTask, Task.Delay(5000));
                    
                    if (_audioTask != null)
                        await Task.WhenAny(_audioTask, Task.Delay(5000));
                    
                    // Force final upload
                    await ForceUploadAsync();
                    
                    // Restart the regular data stream for UI updates
                    if (_bluetoothService.IsConnected)
                    {
                        _logger.Debug("Restarting regular data stream...");
                        await _bluetoothService.StartDataStreamAsync();
                    }
                    
                    // Switch back to Setup mode so Settings page can receive data again
                    _logger.Debug("Switching back to Setup mode...");
                    _bluetoothService.CurrentMode = ObdServiceMode.Setup;
                    
                    Status = BackgroundServiceStatus.Stopped;
                    _logger.Information("BackgroundDataService stopped");
                    
                    // Reset initialization flag so next start will re-initialize ELM327
                    _hasBeenInitialized = false;
                    _logger.Debug("ELM327 initialization flag reset for next session");
                }
                catch (Exception ex)
                {
                    _logger.Error(ex, "Error stopping BackgroundDataService: {0}", ex.Message);
                    Status = BackgroundServiceStatus.Error;
                }
                finally
                {
                    _cts?.Dispose();
                    _cts = null;
                }
            }
            finally
            {
                _startStopLock.Release();
            }
        }
        
        private async Task RunDataCollectionAsync(CancellationToken ct)
        {
            _logger.Debug("[BG_SERVICE] RunDataCollectionAsync ENTERED");
            
            // Don't wait for PID discovery - start with default PIDs immediately
            // PID discovery will update _activePidConfigs in the background
            // BUG-1 fix: Use lock to safely check count
            int initialPidCount;
            lock (_pidConfigLock)
            {
                initialPidCount = _activePidConfigs.Count;
            }
            
            if (initialPidCount == 0)
            {
                _logger.Warning("No PID configurations available yet, starting with defaults...");
                
                // Ensure PID configurations are loaded from CSV
                _logger.Debug("[BG_SERVICE] Loading PID configurations from CSV...");
                await _pidConfigService.LoadConfigurationsAsync();
                _logger.Debug("[BG_SERVICE] PID configurations loaded");
                
                // Use default PID configurations from CSV without discovery
                await FilterAvailablePidsAsync();
                
                // BUG-1 fix: Use lock to safely check count after update
                lock (_pidConfigLock)
                {
                    initialPidCount = _activePidConfigs.Count;
                }
                
                if (initialPidCount == 0)
                {
                    _logger.Error("ERROR: No PID configurations available even after using defaults. Data collection cannot start.");
                    return;
                }
            }
            
            _logger.Information($"Starting data collection immediately with {initialPidCount} PIDs");
            
            // DEBUG: Keep log level at Debug for troubleshooting early exit
            // Previously reduced to Info after initialization for performance
            // Commented out to see all debug logs including prompt detection
            /*
            if (_logger.CurrentLevel == LogLevel.Debug || _logger.CurrentLevel == LogLevel.Verbose)
            {
                _logger.Information("[BG_SERVICE] Reducing log level from Debug to Info after PID polling started");
                _logger.CurrentLevel = LogLevel.Info;
            }
            */
            
            _logger.Debug($"Starting data collection for {initialPidCount} PIDs");
            _logger.Debug($"Query interval: {_settings.Obd2QueryIntervalMs}ms");
            
            // Track last read time for each cycle
            var lastReadTimes = new Dictionary<int, DateTime>();
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            int iterationCount = 0;
            List<DiagnosticTroubleCode>? currentDtcs = null;
            
            _logger.Debug($"[BG_SERVICE] About to enter while loop. IsCancellationRequested: {ct.IsCancellationRequested}");
            
            while (!ct.IsCancellationRequested)
            {
                // High-frequency loop entry log commented out to reduce spam
                // _logger.Debug($"[BG_SERVICE] INSIDE WHILE LOOP - iteration #{iterationCount + 1}");
                try
                {
                    iterationCount++;
                    
                    // After first complete cycle, reduce log level from Verbose to Info
                    if (iterationCount == 1 && (_logger.CurrentLevel == LogLevel.Verbose || _logger.CurrentLevel == LogLevel.Debug))
                    {
                        _logger.Information("[BG_SERVICE] First PID cycle complete, reducing log level from Verbose/Debug to Info");
                        _logger.CurrentLevel = LogLevel.Info;
                    }
                    
                    var cycleStartTime = DateTime.Now;
                    
                    // BUG-1 fix: Get safe copies of PID collections under lock
                    // This prevents InvalidOperationException when discovery modifies them
                    List<PidConfiguration> activePidsSnapshot;
                    Dictionary<int, List<PidConfiguration>> pidsByCycleSnapshot;
                    lock (_pidConfigLock)
                    {
                        activePidsSnapshot = _activePidConfigs.ToList();
                        pidsByCycleSnapshot = _pidsByCycle.ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value.ToList()
                        );
                    }
                    
                    // Log status every 100 iterations to reduce spam
                    if (iterationCount % 100 == 0)
                    {
                        _logger.Debug($"Collection iteration #{iterationCount}, Connected: {_bluetoothService.IsConnected}, PIDs: {activePidsSnapshot.Count}, Cycles: {pidsByCycleSnapshot.Count}");
                    }
                    
                    // Collect OBD2 data if connected
                    // High-frequency connection check log commented out
                    // _logger.Debug($"[BG_SERVICE] Checking IsConnected: {_bluetoothService.IsConnected}");
                    if (_bluetoothService.IsConnected)
                    {
                        // _logger.Debug($"[BG_SERVICE] Starting OBD2 data collection, cycles: {pidsByCycleSnapshot.Count}");
                        int totalReadings = 0;
                        int cyclesProcessed = 0;
                        int cyclesSkipped = 0;
                        
                         // CRITICAL: Read high-priority PIDs (0C, 0D) first in every iteration
                        // These are essential for the app and must be in every QTP window
                        
                        // Profile tracking variables
                        double totalReadTime = 0;
                        double totalSaveTime = 0;
                        int totalReads = 0;
                        int totalSaves = 0;
                        
                        var criticalPids = new[] { "0x0C", "0x0D" };
                        var criticalReadings = 0;
                        foreach (var criticalPid in criticalPids)
                        {
                            var criticalConfig = activePidsSnapshot.FirstOrDefault(c => c.Pid.Equals(criticalPid, StringComparison.OrdinalIgnoreCase));
                            if (criticalConfig != null)
                            {
                                try
                                {
                                    // Measure READ time
                                    var readStart = DateTime.Now;
                                    var readings = await ReadPidAsync(criticalConfig, ct);
                                    totalReadTime += (DateTime.Now - readStart).TotalMilliseconds;
                                    totalReads++;
                                    
                                    if (readings?.Count > 0)
                                    {
                                        // Measure SAVE time
                                        var saveStart = DateTime.Now;
                                        
                                        foreach (var reading in readings)
                                        {
                                            var ecuSuffix = ConvertEcuAddressToSuffix(reading.EcuAddress);
                                            var pidKey = $"p{reading.Pid.Replace("0x", "").ToUpper()}_{ecuSuffix}";
                                            var rawValue = (int)reading.RawValue;
                                            
                                            _logger.Debug($"[PRIORITY_READ] {pidKey}={rawValue} from ECU {reading.EcuAddress}");
                                            
                                            // Add to QTP window (existing)
                                            _qtpWindowManager?.AddSample(pidKey, rawValue, DateTime.UtcNow);
                                            
                                            // Add to queue for backup (NEW - doesn't break existing flow)
                                            _pidDataQueue.Enqueue((pidKey, rawValue, DateTime.UtcNow));
                                            
                                            totalSaves++;
                                        }
                                        
                                        totalSaveTime += (DateTime.Now - saveStart).TotalMilliseconds;
                                        criticalReadings += readings.Count;
                                    }
                                }
                                catch (Exception ex)
                                {
                                    _logger.Error(ex, "Error reading critical PID {0}: {1}", criticalPid, ex.Message);
                                }
                            }
                        }
                        
                        if (criticalReadings > 0)
                        {
                            _logger.Debug($"[PRIORITY_READ] Critical PIDs read: {criticalReadings} readings");
                        }
                        
                        // Process each update cycle group
                        foreach (var cycleGroup in pidsByCycleSnapshot)
                        {
                            // Check cancellation before processing each cycle group
                            if (ct.IsCancellationRequested) break;
                            
                            int cycleMs = cycleGroup.Key;
                            var configs = cycleGroup.Value;
                            
                            // Check if this cycle is due
                            if (lastReadTimes.TryGetValue(cycleMs, out var lastRead))
                            {
                                var elapsed = (DateTime.Now - lastRead).TotalMilliseconds;
                                var remaining = cycleMs - elapsed;
                             if (elapsed < cycleMs)
                             {
                                 cyclesSkipped++;
                                 if (iterationCount % 60 == 0) // Log every minute
                                 {
                                     _logger.Debug($"Cycle {cycleMs}ms: {elapsed:F0}ms elapsed, {remaining:F0}ms remaining - SKIPPING ({configs.Count} PIDs)");
                                 }
                                 continue; // Not time yet
                             }
                            }
                            
                            cyclesProcessed++;
                            var cycleStart = DateTime.Now;
                            
                             // Read all PIDs in this cycle (skip critical PIDs already read)
                             var criticalPidsSet = new HashSet<string> { "0x0C", "0x0D" };
                             var nonCriticalConfigs = configs.Where(c => !criticalPidsSet.Contains(c.Pid)).ToList();
                             
                             foreach (var config in nonCriticalConfigs)
                            {
                            // Check cancellation before each PID read
                            if (ct.IsCancellationRequested) break;
                            
                            try
                            {
                                // Measure READ time
                                var readStart = DateTime.Now;
                                var readings = await ReadPidAsync(config, ct);
                                totalReadTime += (DateTime.Now - readStart).TotalMilliseconds;
                                totalReads++;
                                
                                if (readings != null && readings.Count > 0)
                                {
                                    // Measure SAVE time
                                    var saveStart = DateTime.Now;
                                    
                                    // Add to QTP window instead of packet
                                    foreach (var reading in readings)
                                    {
                                        // Convert ECU address to suffix (7E8=0, 7E9=1, 7EA=2, etc.)
                                        var ecuSuffix = ConvertEcuAddressToSuffix(reading.EcuAddress);
                                        var pidKey = $"p{reading.Pid.Replace("0x", "").ToUpper()}_{ecuSuffix}";
                                        var rawValue = (int)reading.RawValue;
                                        
                                        // LOG: Track 0C_0 and 0D_0 specifically
                                        if (pidKey == "p0C_0" || pidKey == "p0D_0")
                                        {
                                            _logger.Debug($"[QTP_ADD] {pidKey}={rawValue} from ECU {reading.EcuAddress}");
                                        }
                                        
                                        // Add to QTP window (existing)
                                        _qtpWindowManager?.AddSample(pidKey, rawValue, DateTime.UtcNow);
                                        
                                        // Add to queue for backup (NEW - doesn't break existing flow)
                                        _pidDataQueue.Enqueue((pidKey, rawValue, DateTime.UtcNow));
                                        
                                        totalSaves++;
                                    }
                                    
                                    totalSaveTime += (DateTime.Now - saveStart).TotalMilliseconds;
                                    totalReadings += readings.Count;
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.Error(ex, "Error reading PID {0}: {1}", config.Pid, ex.Message);
                            }
                            }
                            
                            // LOG: End of cycle summary for 0C/0D tracking
                            if (cycleMs == 100 && iterationCount % 30 == 0) // Log every ~3 seconds for fast cycle
                            {
                                _logger.Debug($"[PID_TRACK] Cycle {cycleMs}ms completed - Total readings: {totalReadings}");
                            }
                            
                            // Update last read time AFTER cycle completes
                            lastReadTimes[cycleMs] = DateTime.Now;
                            
                             var cycleDuration = (DateTime.Now - cycleStart).TotalMilliseconds;
                             if (cycleDuration > 100) // Логируем только медленные циклы
                             {
                                 _logger.Debug($"[BG_SERVICE] WARNING: Slow cycle {cycleMs}ms took {cycleDuration:F0}ms for {configs.Count} PIDs");
                             }
                             if (iterationCount % 10 == 0)
                             {
                                 _logger.Debug($"Cycle {cycleMs}ms PROCESSED: {configs.Count} PIDs in {cycleDuration:F0}ms");
                             }
                        }
                        
                         // Profile summary - READ vs SAVE
                        // _logger.Debug($"[Profile] READ: {totalReadTime:F1}ms ({totalReads} PIDs), SAVE: {totalSaveTime:F1}ms ({totalSaves} ops)");
                        
                        if (iterationCount % 10 == 0)
                        {
                            _logger.Debug($"Summary: {cyclesProcessed} cycles processed, {cyclesSkipped} skipped, {totalReadings} readings collected");
                        }
                    }
                    // Log Bluetooth connection status too
                    if (iterationCount % 10 == 0)
                    {
                        _logger.Debug($"Bluetooth not connected, skipping OBD2 data collection");
                    }
                    
                    // Collect sensor data for QTP aggregators
                    // Check for DTCs every 30 seconds
                    var timeSinceLastDtcCheck = DateTime.UtcNow - _lastDtcCheckTime;
                    if (timeSinceLastDtcCheck.TotalSeconds >= 30 && _bluetoothService.IsConnected)
                    {
                        try
                        {
                            currentDtcs = await _bluetoothService.GetDiagnosticTroubleCodesAsync(ct);
                            _currentDtcs = currentDtcs; // Store for event handler access
                            if (currentDtcs?.Count > 0)
                            {
                                _logger.Information($"Collected {currentDtcs.Count} DTCs");
                            }
                            _lastDtcCheckTime = DateTime.UtcNow;
                        }
                        catch (Exception ex)
                        {
                            _logger.Error(ex, "Error reading DTCs: {0}", ex.Message);
                        }
                    }
                    
                    // Get audio data if enabled
                    if (_settings.EnableSoundRecording)
                    {
                        var audioData = await _audioService.GetLatestAudioDataAsync();
                        if (audioData != null)
                        {
                            // Get raw PCM samples if available
                            short[]? rawSamples = null;
                            if (!string.IsNullOrEmpty(audioData.AudioBase64))
                            {
                                try
                                {
                                    var bytes = Convert.FromBase64String(audioData.AudioBase64);
                                    rawSamples = new short[bytes.Length / 2];
                                    Buffer.BlockCopy(bytes, 0, rawSamples, 0, bytes.Length);
                                }
                                catch { }
                            }
                            
                            // Audio window is now created automatically by AudioCaptureService
                            // No need to add manually - it's handled in the service
                            // High-frequency audio capture log commented out
                            // _logger.Debug($"[BG_SERVICE] Audio data captured: {audioData.FrequencyData?.DominantFrequencies?.Count ?? 0} frequencies");
                        }
                    }
                    
                    // Fixed 10ms delay for maximum throughput
                    await Task.Delay(10, ct);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.Error(ex, "Error in data collection loop: {0}", ex.Message);
                    await Task.Delay(1000, ct);
                }
            }
        }
        
        private async Task<List<PidReading>> ReadPidAsync(PidConfiguration config, CancellationToken ct)
        {
            var readings = new List<PidReading>();
            
            // Try to acquire command lock without waiting - if another operation is in progress, skip this read
            // This prevents parallel access to ELM327 which is a serial device
            if (!await _bluetoothService.TryAcquireCommandLockAsync(ct))
            {
                // Another operation is in progress, skip this read to avoid conflict
                return readings;
            }
            
            try
            {
                // Parse service and PID from configuration
                // Service format: "0x01" or "0x01,0x02" - take first one
                var serviceHex = config.Service.Split(',')[0].Replace("0x", "").Trim();
                if (!byte.TryParse(serviceHex, System.Globalization.NumberStyles.HexNumber, null, out byte service))
                {
                    _logger.Error("ReadPidAsync: Invalid service format: {0}", config.Service);
                    return readings;
                }
                
                // PID format: "0x0C"
                var pidHex = config.Pid.Replace("0x", "").Trim();
                if (!byte.TryParse(pidHex, System.Globalization.NumberStyles.HexNumber, null, out byte pid))
                {
                    _logger.Error("ReadPidAsync: Invalid PID format: {0}", config.Pid);
                    return readings;
                }
                
                // Read raw data from ALL responding ECUs
                _logger.Debug("Reading PID 0x{0:X2} (Service 0x{1:X2}) from all ECUs...", pid, service);
                
                // LOG: Track 0C and 0D specifically
                bool isCriticalPid = (pid == 0x0C || pid == 0x0D);
                if (isCriticalPid)
                {
                    _logger.Debug($"[PID_TRACK] Starting read for PID 0x{pid:X2} ({config.Mnemonic})");
                }
                
                // Default: expect all ECUs (0xFF) on first read
                // After first read, use accumulated mask of ECUs that actually respond
                byte expectedEcuMask = 0xFF;
                var pidKeyForMask = $"p{pid:X2}";
                if (_pidEcuMasks.TryGetValue(pidKeyForMask, out var savedMask) && savedMask > 0)
                {
                    // Use accumulated mask - wait only for ECUs that ever responded
                    expectedEcuMask = savedMask;
                    if (isCriticalPid)
                    {
                        _logger.Debug($"[PID_TRACK] Using accumulated ECU mask for PID 0x{pid:X2}: 0x{expectedEcuMask:X2}");
                    }
                }
                else if (isCriticalPid)
                {
                    _logger.Debug($"[PID_TRACK] First read for PID 0x{pid:X2}, expecting all ECUs (0xFF)");
                }
                
                var (ecuResponses, ecuMasksByPid) = await _bluetoothService.ReadPidRawFromAllEcusAsync(service, pid, expectedEcuMask, ct);
                
                // Update ECU masks for ALL observed PIDs - MERGE, don't overwrite
                // This ensures we accumulate all ECUs that ever responded for this PID
                foreach (var (observedPid, mask) in ecuMasksByPid)
                {
                    var observedPidKey = $"p{observedPid:X2}";
                    var oldMask = _pidEcuMasks.ContainsKey(observedPidKey) ? _pidEcuMasks[observedPidKey] : (byte)0;
                    var newMask = (byte)(oldMask | mask);  // Merge: keep old + add new
                    _pidEcuMasks[observedPidKey] = newMask;
                    
                    if (isCriticalPid)
                    {
                        if (oldMask != newMask)
                        {
                            _logger.Debug($"[PID_TRACK] Expanded ECU mask for PID 0x{observedPid:X2}: 0x{oldMask:X2} | 0x{mask:X2} = 0x{newMask:X2} (NEW ECU detected!)");
                        }
                        else
                        {
                            _logger.Debug($"[PID_TRACK] ECU mask for PID 0x{observedPid:X2}: 0x{newMask:X2} (no change)");
                        }
                    }
                }
                
                if (ecuResponses.Count == 0)
                {
                    _logger.Debug("ReadPidAsync: No data received for PID {0} (0x{1:X2})", config.Pid, pid);
                    if (isCriticalPid)
                    {
                        _logger.Debug($"[PID_TRACK] NO DATA received for PID 0x{pid:X2} ({config.Mnemonic}) - ECU responses count: 0");
                    }
                    return readings;
                }
                
                if (isCriticalPid)
                {
                    _logger.Debug($"[PID_TRACK] SUCCESS for PID 0x{pid:X2} ({config.Mnemonic}) - {ecuResponses.Count} ECUs responded");
                }
                
                _logger.Debug("ReadPidAsync: Received responses from {0} ECUs for PID {1}", ecuResponses.Count, config.Pid);
                
                // Get all configurations for this PID (for multi-field parsing)
                var pidKey = GetPidKey(config);
                var allConfigsForPid = _configsByPidKey.TryGetValue(pidKey, out var configs) 
                    ? configs 
                    : new List<PidConfiguration> { config };
                
                // Process responses from ALL ECUs
                foreach (var ecuResponse in ecuResponses)
                {
                    var rawData = ecuResponse.Data;
                    var ecuAddress = ecuResponse.EcuAddress;
                    _logger.Debug("ReadPidAsync: Processing {0} bytes from ECU {1} for PID {2}: {3}", 
                        rawData.Length, ecuAddress, config.Pid, BitConverter.ToString(rawData));
                    
                    // Parse all fields from this ECU's response
                    foreach (var pidConfig in allConfigsForPid)
                    {
                        try
                        {
                            // Calculate raw value based on offset and length from config
                            double rawValue = 0;
                            if (pidConfig.Length == 1 && pidConfig.Offset < rawData.Length)
                            {
                                rawValue = rawData[pidConfig.Offset];
                                
                                // Apply bit mask if specified
                                if (!string.IsNullOrEmpty(pidConfig.BitMask))
                                {
                                    try
                                    {
                                        var maskHex = pidConfig.BitMask.Replace("0x", "").Replace("0X", "");
                                        if (int.TryParse(maskHex, System.Globalization.NumberStyles.HexNumber, null, out int mask))
                                        {
                                            rawValue = ((int)rawValue & mask) >> pidConfig.BitOffset;
                                        }
                                        else
                                        {
                                            _logger.Warning("[BG_SERVICE] Invalid BitMask format for PID {0}: {1}", pidConfig.Pid, pidConfig.BitMask);
                                        }
                                    }
                                    catch (Exception ex)
                                    {
                                        _logger.Warning("[BG_SERVICE] Failed to parse BitMask for PID {0}: {1} - {2}", pidConfig.Pid, pidConfig.BitMask, ex.Message);
                                    }
                                }
                            }
                            else if (pidConfig.Length == 2 && pidConfig.Offset + 1 < rawData.Length)
                            {
                                rawValue = (rawData[pidConfig.Offset] << 8) | rawData[pidConfig.Offset + 1];
                            }
                            else if (rawData.Length > 0)
                            {
                                // Fallback to first byte if offset/length don't match
                                rawValue = rawData[0];
                            }
                            
                            // Apply conversion formula
                            double convertedValue = ApplyFormula(rawValue, pidConfig.Formula);
                            
                            var reading = new PidReading
                            {
                                Pid = pidConfig.Pid,
                                Mnemonic = pidConfig.Mnemonic,
                                Label = pidConfig.Label,
                                RawValue = rawValue,
                                ConvertedValue = convertedValue,
                                Unit = GetUnitForFormula(pidConfig.Formula),
                                Timestamp = DateTime.UtcNow,
                                EcuAddress = ecuAddress
                            };
                            
                            readings.Add(reading);
                            
                            _logger.Debug($"{pidConfig.Mnemonic} from {ecuAddress} = {convertedValue} {reading.Unit} (raw: {rawValue})");
                        }
                        catch (Exception ex)
                        {
                            _logger.Error(ex, "ReadPidAsync: Error parsing field {0} for PID {1} from ECU {2}: {3}", 
                                pidConfig.Mnemonic, pidConfig.Pid, ecuAddress, ex.Message);
                        }
                    }
                }
                
                // ECU masks are now updated automatically from ReadPidRawFromAllEcusAsync
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "ReadPidAsync error for PID {0}: {1}", config.Pid, ex.Message);
            }
            finally
            {
                // Always release the lock, even if an exception occurred
                _bluetoothService.ReleaseCommandLock();
            }
            
            return readings;
        }
        
        /// <summary>
        /// Drains all accumulated PID data from queue and returns as dictionary
        /// Takes the most recent value for each PID
        /// </summary>
        private Dictionary<string, object> DrainPidQueue()
        {
            var result = new Dictionary<string, object>();
            var pidGroups = new Dictionary<string, List<int>>();
            
            // Drain all items from queue
            int drainedCount = 0;
            while (_pidDataQueue.TryDequeue(out var item))
            {
                if (!pidGroups.ContainsKey(item.pidKey))
                {
                    pidGroups[item.pidKey] = new List<int>();
                }
                pidGroups[item.pidKey].Add(item.value);
                drainedCount++;
            }
            
            if (drainedCount > 0)
            {
                _logger.Debug($"[PID_DRAIN] Drained {drainedCount} readings for {pidGroups.Count} PIDs");
            }
            
            // Take average for each PID
            foreach (var kvp in pidGroups)
            {
                var avg = (int)kvp.Value.Average();
                result[kvp.Key] = avg;
            }
            
            return result;
        }
        
        /// <summary>
        /// Processes completed QTP window - builds packet and enqueues for upload
        /// </summary>
        private async Task ProcessQtpWindowAsync(
            (Dictionary<string, object> qtpData, DateTime start, DateTime end) qtpResult, 
            List<DiagnosticTroubleCode>? dtcs, 
            CancellationToken ct)
        {
            _logger.Debug($"[BG_SERVICE] ProcessQtpWindowAsync ENTERED - {qtpResult.qtpData.Count} PIDs in window");
            _logger.Debug("[BG_SERVICE] ProcessQtpWindowAsync: About to enter try block");
            
            try
            {
                _logger.Debug("[BG_SERVICE] ProcessQtpWindowAsync: Step 1 - Getting location...");
                // Get current location
                Location? location = null;
                if (_settings.EnableLocationTracking)
                {
                    try
                    {
                        location = await _geolocation.GetLocationAsync(new GeolocationRequest
                        {
                            DesiredAccuracy = GeolocationAccuracy.Medium,
                            Timeout = TimeSpan.FromSeconds(2)
                        }, ct);
                        _logger.Debug($"[BG_SERVICE] Location obtained: {location?.Latitude}, {location?.Longitude}");
                    }
                    catch (Exception ex)
                    {
                        _logger.Debug($"[BG_SERVICE] Location failed: {ex.Message}");
                        _logger.Debug("Failed to get location for QTP packet: {0}", ex.Message);
                    }
                }
                else
                {
                    _logger.Debug("[BG_SERVICE] Location tracking disabled");
                }
                
                _logger.Debug("[BG_SERVICE] ProcessQtpWindowAsync: Step 2 - Building device status...");
                // Build device status - skip battery to avoid potential deadlock
                var deviceStatus = new global::llcar.Models.DeviceStatus
                {
                    BatteryLevel = 50,  // Default value
                    IsCharging = false  // Default value
                };
                _logger.Debug($"[BG_SERVICE] Device status (default): Battery={deviceStatus.BatteryLevel}%, Charging={deviceStatus.IsCharging}");
                
                _logger.Debug("[BG_SERVICE] ProcessQtpWindowAsync: Step 3 - Checking QTP packet builder...");
                // Build QTP packet
                if (_qtpPacketBuilder == null)
                {
                    _logger.Error("QTP packet builder is null");
                    return;
                }
                
                // Convert DiagnosticTroubleCode list to int list for JSON
                List<int>? dtcIntCodes = null;
                if (dtcs != null && dtcs.Count > 0)
                {
                    dtcIntCodes = new List<int>();
                    foreach (var dtc in dtcs)
                    {
                        // Parse hex code like "P0301" to int
                        if (!string.IsNullOrEmpty(dtc.Code) && dtc.Code.Length >= 4)
                        {
                            try
                            {
                                var hexPart = dtc.Code.Substring(1); // Remove P/B/C/U prefix
                                if (int.TryParse(hexPart, System.Globalization.NumberStyles.HexNumber, null, out int code))
                                {
                                    dtcIntCodes.Add(code);
                                }
                            }
                            catch { }
                        }
                    }
                }
                
                // Calculate how many windows we need based on packet duration
                // Audio: 1 window per second, Accel: 2 windows per second
                var windowDuration = qtpResult.end - qtpResult.start;
                var audioWindowsNeeded = (int)windowDuration.TotalSeconds;  // N audio windows
                var accelWindowsNeeded = audioWindowsNeeded * 2;              // 2N accel windows
                
                _logger.Debug($"[BG_SERVICE] Packet duration: {windowDuration.TotalSeconds}s, need {audioWindowsNeeded} audio + {accelWindowsNeeded} accel windows");
                
                // Get audio windows from queue
                var audioWindows = _sensorWindowManager.GetAudioWindows(audioWindowsNeeded);
                if (audioWindows.Count > 0)
                {
                    // Convert List<AudioWindow> to List<List<int>> for JSON
                    var audioArray = audioWindows.Select(w => w.Data).ToList();
                    qtpResult.qtpData["s"] = audioArray;
                    
                    // Add quality scores for each window
                    var qualityArray = audioWindows.Select(w => w.Quality).ToList();
                    qtpResult.qtpData["quality_audio"] = qualityArray;
                    
                    _logger.Debug($"[BG_SERVICE] Added {audioWindows.Count}/{audioWindowsNeeded} audio windows with quality scores");
                }
                else
                {
                    _logger.Debug($"[BG_SERVICE] WARNING: No audio windows available (queue may be empty)");
                }
                
                // Get accelerometer windows from queue
                var accelWindows = _sensorWindowManager.GetAccelWindows(accelWindowsNeeded);
                if (accelWindows.Count > 0)
                {
                    // Convert List<AccelWindow> to List<int[]> for each axis
                    qtpResult.qtpData["ax"] = accelWindows.Select(w => w.Ax.Select(b => (int)b).ToArray()).ToList();
                    qtpResult.qtpData["ay"] = accelWindows.Select(w => w.Ay.Select(b => (int)b).ToArray()).ToList();
                    qtpResult.qtpData["az"] = accelWindows.Select(w => w.Az.Select(b => (int)b).ToArray()).ToList();
                    _logger.Debug($"[BG_SERVICE] Added {accelWindows.Count}/{accelWindowsNeeded} accel windows");
                }
                else
                {
                    _logger.Debug($"[BG_SERVICE] WARNING: No accelerometer windows available (queue may be empty)");
                }
                
                _logger.Debug("[BG_SERVICE] Building QTP packet...");
                var packet = await _qtpPacketBuilder.BuildPacketAsync(
                    qtpResult.qtpData,
                    qtpResult.start,
                    qtpResult.end,
                    _settings.ClientHash,
                    location,
                    deviceStatus,
                    dtcIntCodes);
                _logger.Debug($"[BG_SERVICE] QTP packet built: {packet.Data.Count} data fields");
                
                // LOG: Check for critical PIDs
                bool has0C_0 = packet.Data.ContainsKey("p0C_0");
                bool has0D_0 = packet.Data.ContainsKey("p0D_0");
                bool has0C_2 = packet.Data.ContainsKey("p0C_2");
                _logger.Debug($"[PID_TRACK] Packet validation - 0C_0:{has0C_0} 0D_0:{has0D_0} 0C_2:{has0C_2} | Keys: {string.Join(", ", packet.Data.Keys.Where(k => k.StartsWith("p0")).Take(10))}");
                
                // Calculate ECU mask from packet data
                packet.EcuMask = CalculateEcuMask(packet.Data);
                _logger.Debug($"[BG_SERVICE] Calculated ECU mask: {packet.EcuMask} (binary: {Convert.ToString(packet.EcuMask, 2).PadLeft(8, '0')})");
                
                // Enqueue for upload
                _qtpQueue.Enqueue(packet);
                _logger.Debug($"[BG_SERVICE] Packet enqueued. Queue size: {_qtpQueue.Count}");
                
                // Save to database for retry if upload fails
                long packetId = 0;
                try
                {
                    _logger.Debug("[BG_SERVICE] Saving packet to database...");
                    packetId = await _normalizedVehicleDataRepository.StorePacketAsync(packet);
                    _logger.Debug($"[BG_SERVICE] Packet saved to database successfully with ID: {packetId}");
                    
                    // CRITICAL: Set srcid BEFORE sending to server
                    packet.PacketSrcId = packetId;
                    packet.PacketSrcTimestamp = packet.WindowStart;
                    _logger.Debug($"[BG_SERVICE] Packet srcid set: {packetId}, timestamp: {packet.PacketSrcTimestamp}");
                }
                catch (Exception ex)
                {
                    _logger.Debug($"[BG_SERVICE] WARNING: Failed to save packet to database: {ex.Message}");
                }
                
                // Notify QTP subscribers (for server upload logic) - NOW with srcid!
                QtpDataCollected?.Invoke(this, packet);
                _logger.Debug("[BG_SERVICE] QtpDataCollected event fired");
                
                // Convert to BackgroundDataPacket for UI and notify
                var bgPacket = QtpToBackgroundDataConverter.Convert(packet);
                DataCollected?.Invoke(this, bgPacket);
                
                // Add to recent data
                await _qtpDataLock.WaitAsync(ct);
                try
                {
                    _recentQtpData.Add(packet);
                    if (_recentQtpData.Count > 100)
                        _recentQtpData.RemoveAt(0);
                }
                finally
                {
                    _qtpDataLock.Release();
                }
                
                _logger.Debug("QTP window processed: {0} to {1}, {2} PIDs", 
                    qtpResult.start, qtpResult.end, qtpResult.qtpData.Count);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error processing QTP window: {0}", ex.Message);
            }
        }
        
        /// <summary>
        /// Applies the conversion formula to raw value
        /// </summary>
        private double ApplyFormula(double rawValue, string formula)
        {
            if (string.IsNullOrEmpty(formula))
                return rawValue;
                
            return formula.ToUpper() switch
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
        
        private async Task RunUploadLoopAsync(CancellationToken ct)
        {
            bool uploadEnabled = false;
            
            while (!ct.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.UtcNow;
                    
                    // BUG-4 FIX: Check for Doze Mode and handle accordingly
                    bool inDozeMode = IsInDozeMode();
                    
                    // Log Doze Mode state changes (throttled to once per minute)
                    if (inDozeMode != _wasInDozeMode || (now - _lastDozeLogTime).TotalMinutes >= 1)
                    {
                        if (inDozeMode)
                        {
                            _logger.Debug("[DOZE] Device is in Doze Mode - uploads deferred");
                            bool ignoringOptimizations = IsIgnoringBatteryOptimizations();
                            _logger.Debug($"[DOZE] Battery optimization ignored: {ignoringOptimizations}");
                        }
                        else if (_wasInDozeMode)
                        {
                            _logger.Debug("[DOZE] Device exited Doze Mode - resuming uploads and processing backlog...");
                            // Process any packets that accumulated during Doze Mode
                            _ = Task.Run(async () =>
                            {
                                try
                                {
                                    await ProcessPendingPacketsBacklogAsync(CancellationToken.None);
                                }
                                catch (Exception ex)
                                {
                                    _logger.Error(ex, "[DOZE] Error processing backlog after Doze exit: {0}", ex.Message);
                                }
                            });
                        }
                        _wasInDozeMode = inDozeMode;
                        _lastDozeLogTime = now;
                    }
                    
                    // Check if VIN is now available (for dynamic enable after VIN read)
                    if (!uploadEnabled && !string.IsNullOrEmpty(_settings?.ClientHash))
                    {
                        uploadEnabled = true;
                        _logger.Information("VIN now available - enabling server upload");
                    }

                    // Only upload if VIN is configured and not in Doze Mode
                    if (uploadEnabled && !inDozeMode)
                    {
                        // Check if it's time for regular upload
                        var timeSinceLastUpload = now - _lastUploadTime;
                        if (timeSinceLastUpload.TotalSeconds >= _settings.UploadIntervalSeconds)
                        {
                            await UploadPendingDataAsync(ct);
                            _lastUploadTime = now;
                        }
                        
                        // Check retry queue every 500ms
                        var timeSinceLastRetry = now - _lastRetryTime;
                        if (timeSinceLastRetry.TotalMilliseconds >= 500)
                        {
                            await ProcessRetryQueueAsync(ct);
                            _lastRetryTime = now;
                        }
                    }
                    else if (uploadEnabled && inDozeMode)
                    {
                        // BUG-4 FIX: In Doze Mode, save data locally and skip network operations
                        // Data will be uploaded when device exits Doze Mode
                        // The foreground service keeps running, so we continue collecting data
                        
                        // Only log occasionally to avoid spam
                        if ((now - _lastDozeLogTime).TotalMinutes >= 5)
                        {
                            _logger.Debug("[DOZE] Collecting data locally - upload deferred");
                            _lastDozeLogTime = now;
                        }
                    }
                    
                    // Small delay to prevent tight loop
                    await Task.Delay(TimeSpan.FromMilliseconds(100), ct);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.Error(ex, "Error in upload loop: {0}", ex.Message);
                    await Task.Delay(1000, ct);
                }
            }
        }
        
        /// <summary>
        /// Processes retry queue - attempts to send failed QTP packets from database
        /// </summary>
        private async Task ProcessRetryQueueAsync(CancellationToken ct)
        {
            try
            {
                // Get failed packets from database
                var failedPackets = await _qtpRetryService.GetFailedPacketsAsync(50);
                
                if (failedPackets.Count == 0)
                    return;
                
                _logger.Debug($"Retrying {failedPackets.Count} QTP packets from database");
                
                var previousStatus = Status;
                Status = BackgroundServiceStatus.Uploading;
                
                try
                {
                    // Extract just the QtpPacket objects
                    var packets = failedPackets.Select(f => f.Packet).ToList();
                    
                    var success = await _serverService.SendQtpPacketsAsync(packets, ct);
                    
                    if (success)
                    {
                        // Mark all as sent
                        foreach (var (id, _) in failedPackets)
                        {
                            await _qtpRetryService.MarkAsSentAsync(id);
                        }
                        _logger.Information($"✓ Retry upload successful: {failedPackets.Count} packets");
                    }
                    else
                    {
                        _logger.Error("Retry upload failed: {0}", _serverService.LastError);
                    }
                }
                finally
                {
                    Status = previousStatus;
                }
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error in QTP retry queue processing: {0}", ex.Message);
            }
        }
        
        private async Task RunAccelerometerLoopAsync(CancellationToken ct)
        {
            // Accelerometer runs independently at its own sample rate
            // This loop just ensures continuous capture
            while (!ct.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(1000, ct);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
        
        private async Task RunAudioLoopAsync(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(_settings.SoundRecordingDurationMs, ct);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
        
        private async Task UploadPendingDataAsync(CancellationToken ct)
        {
            var packets = new List<QtpPacket>();
            while (_qtpQueue.TryDequeue(out var packet))
            {
                packets.Add(packet);
            }
            
            if (packets.Count == 0)
                return;
            
            var success = await UploadQtpBatchAsync(packets, ct);
            
            if (success)
            {
                // Mark packets as sent in database
                foreach (var packet in packets)
                {
                    if (packet.PacketSrcId.HasValue)
                    {
                        await _normalizedVehicleDataRepository.MarkAsSentAsync(packet.PacketSrcId.Value);
                    }
                }
            }
            else
            {
                // Mark packets as failed for retry
                foreach (var packet in packets)
                {
                    if (packet.PacketSrcId.HasValue)
                    {
                        await _normalizedVehicleDataRepository.MarkAsFailedAsync(packet.PacketSrcId.Value);
                    }
                }
                _logger.Information($"Marked {packets.Count} QTP packets as failed for retry");
            }
        }
        
        /// <summary>
        /// Processes pending packets backlog from previous sessions or Doze Mode
        /// This ensures data collected while app was minimized/killed gets uploaded
        /// </summary>
        private async Task ProcessPendingPacketsBacklogAsync(CancellationToken ct)
        {
            try
            {
                // Wait a bit for service to fully initialize
                await Task.Delay(2000, ct);
                
                // Check for pending packets (both 'queued' and 'failed' statuses)
                var pendingCount = await _normalizedVehicleDataRepository.GetPendingCountAsync();
                if (pendingCount == 0)
                {
                    _logger.Debug("[BACKLOG] No pending packets found in database");
                    return;
                }
                
                _logger.Information($"[BACKLOG] Found {pendingCount} pending packets in database - processing backlog...");
                
                // Process in batches
                int processedCount = 0;
                int batchSize = 50;
                
                while (!ct.IsCancellationRequested)
                {
                    // Get pending packets with their IDs
                    var pendingPackets = await _normalizedVehicleDataRepository.GetPendingPacketsWithIdsAsync(batchSize);
                    
                    if (pendingPackets.Count == 0)
                        break;
                    
                    _logger.Debug($"[BACKLOG] Processing batch of {pendingPackets.Count} pending packets...");
                    
                    // Extract packets for upload
                    var packets = pendingPackets.Select(p => p.Packet).ToList();
                    
                    // Attempt to upload
                    var success = await _serverService.SendQtpPacketsAsync(packets, ct);
                    
                    if (success)
                    {
                        // Mark all as sent
                        foreach (var (id, _) in pendingPackets)
                        {
                            await _normalizedVehicleDataRepository.MarkAsSentAsync(id);
                        }
                        processedCount += pendingPackets.Count;
                        _logger.Information($"[BACKLOG] ✓ Uploaded {pendingPackets.Count} pending packets ({processedCount}/{pendingCount} total)");
                    }
                    else
                    {
                        // Mark as failed for retry later
                        foreach (var (id, _) in pendingPackets)
                        {
                            await _normalizedVehicleDataRepository.MarkAsFailedAsync(id);
                        }
                        _logger.Warning($"[BACKLOG] Failed to upload {pendingPackets.Count} packets - marked for retry");
                        break; // Stop processing this batch, will retry via normal retry queue
                    }
                    
                    // Small delay between batches
                    await Task.Delay(100, ct);
                }
                
                if (processedCount > 0)
                {
                    _logger.Information($"[BACKLOG] ✓ Backlog processing complete: {processedCount} packets uploaded");
                }
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "[BACKLOG] Error processing pending packets backlog: {0}", ex.Message);
            }
        }
        
        /// <summary>
        /// Uploads a batch of QTP packets to the server
        /// </summary>
        private async Task<bool> UploadQtpBatchAsync(List<QtpPacket> packets, CancellationToken ct)
        {
            if (packets.Count == 0)
                return true;
            
            var previousStatus = Status;
            Status = BackgroundServiceStatus.Uploading;
            
            try
            {
                _logger.Debug($"Uploading {packets.Count} QTP packets");
                _logger.Debug($"Server URL: {_serverService.ServerUrl}");
                
                // Log packet data contents
                foreach (var pkt in packets)
                {
                    var dataKeys = string.Join(", ", pkt.Data.Keys.Take(10));
                    _logger.Debug($"[QTP_UPLOAD] Packet data keys: {dataKeys} (total: {pkt.Data.Count})");
                    if (pkt.Data.ContainsKey("p0C_0"))
                    {
                        var val = pkt.Data["p0C_0"];
                        _logger.Debug($"[QTP_UPLOAD] Packet has p0C_0 = {val} (type: {val.GetType().Name})");
                    }
                    if (pkt.Data.ContainsKey("p0D_0"))
                    {
                        var val = pkt.Data["p0D_0"];
                        _logger.Debug($"[QTP_UPLOAD] Packet has p0D_0 = {val} (type: {val.GetType().Name})");
                    }
                }
                
                var startTime = DateTime.Now;
                var success = await _serverService.SendQtpPacketsAsync(packets, ct);
                var duration = DateTime.Now - startTime;
                
                _logger.Debug($"Upload completed in {duration.TotalMilliseconds:F0}ms");
                
                if (success)
                {
                    _logger.Information($"✓ QTP upload successful: {packets.Count} packets");
                    return true;
                }
                else
                {
                    _logger.Error("QTP upload failed: {0}", _serverService.LastError);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "QTP upload error: {0}", ex.Message);
                return false;
            }
            finally
            {
                Status = previousStatus;
            }
        }
        
        /// <summary>
        /// Discovers available PIDs by querying the vehicle at standard ranges
        /// </summary>
        private async Task DiscoverAvailablePidsAsync(CancellationToken ct)
        {
            // Acquire lock to prevent concurrent PID operations
            await _bluetoothService.AcquireCommandLockAsync(ct);
            _isDiscoveringPids = true;
            
            try
            {
                _logger.Debug("Starting PID discovery...");
                _availablePids.Clear();
                
                // Query PID availability at standard ranges: 0x00, 0x20, 0x40, 0x60, 0x80, 0xA0, 0xC0, 0xE0
                var ranges = new byte[] { 0x00, 0x20, 0x40, 0x60, 0x80, 0xA0, 0xC0, 0xE0 };
                
                foreach (var range in ranges)
                {
                    try
                    {
                        // Query available PIDs for this range using service 0x01
                        var command = $"01{range:X2}";
                        _logger.Debug("Querying PID range 0x{0:X2}...", range);
                        
                        var response = await _bluetoothService.SendCommandAsync(command, ct);
                        
                        if (!string.IsNullOrEmpty(response) && !response.Contains("ERROR") && !response.Contains("UNABLE"))
                        {
                            // Parse the bitmask response
                            var discovered = ParsePidBitmask(response, range);
                            _logger.Debug("Range 0x{0:X2}: Discovered {1} PIDs", range, discovered);
                            
                            // Check if more ranges are available (bit 0 of response)
                            if (!HasMorePidRanges(response))
                            {
                                _logger.Debug("No more PID ranges indicated at 0x{0:X2}", range);
                                break;
                            }
                        }
                        else
                        {
                            _logger.Debug("Range 0x{0:X2}: No response or error", range);
                        }
                        
                        // Small delay between queries
                        await Task.Delay(100, ct);
                    }
                    catch (Exception ex)
                    {
                        _logger.Error(ex, "Error querying range 0x{0:X2}: {1}", range, ex.Message);
                    }
                }
                
                _logger.Information("PID discovery complete. Total available PIDs: {0}", _availablePids.Count);
                
                // Build discovered PID configurations for intersection logic
                _discoveredPidConfigs.Clear();
                foreach (var combinedPid in _availablePids)
                {
                    byte service = (byte)(combinedPid >> 8);
                    byte pid = (byte)(combinedPid & 0xFF);
                    
                    // Create minimal config for discovered PID
                    _discoveredPidConfigs.Add(new PidConfiguration
                    {
                        Service = $"0x{service:X2}",
                        Pid = $"0x{pid:X2}",
                        Mnemonic = $"PID_0x{pid:X2}",
                        Label = $"PID 0x{pid:X2}",
                        UpdateCycleMs = 1000 // Default 1 second
                    });
                }
                
                _logger.Debug($"[BG_SERVICE] Built {_discoveredPidConfigs.Count} configs from discovered PIDs");
                
                // Filter PID configurations based on availability (intersection with CSV)
                await FilterAvailablePidsAsync();
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "PID discovery failed: {0}", ex.Message);
                // Fall back to using all PIDs from CSV
                await FilterAvailablePidsAsync();
            }
            finally
            {
                _isDiscoveringPids = false;
                _bluetoothService.ReleaseCommandLock();
                _logger.Debug("PID discovery lock released");
            }
        }

        /// <summary>
        /// Parses PID bitmask response from all ECUs and adds discovered PIDs to the available set
        /// </summary>
        private int ParsePidBitmask(string response, byte startPid)
        {
            int discovered = 0;
            
            // Clean response - remove whitespace and newlines
            var cleanResponse = response.Replace(" ", "").Replace("\r", "").Replace("\n", "");
            
            // Combine bitmasks from all ECUs (OR operation)
            long combinedBitmask = 0;
            int ecuCount = 0;
            
            // Find all occurrences of "41" followed by PID and 8 hex chars (bitmask)
            // Response format: [7E8 06]41PPDDDDDDDD[7E9 06]41PPDDDDDDDD... from multiple ECUs
            var matches = System.Text.RegularExpressions.Regex.Matches(cleanResponse, @"41[0-9A-Fa-f]{2}([0-9A-Fa-f]{8})");
            
            foreach (System.Text.RegularExpressions.Match match in matches)
            {
                if (match.Success && long.TryParse(match.Groups[1].Value, System.Globalization.NumberStyles.HexNumber, null, out long bitmask))
                {
                    combinedBitmask |= bitmask;  // OR operation - combine all ECU masks
                    ecuCount++;
                    _logger.Debug("ECU {0}: bitmask 0x{1:X8}", ecuCount, bitmask);
                }
            }
            
            if (ecuCount > 0)
            {
                _logger.Debug("Combined bitmask from {0} ECUs: 0x{1:X8}", ecuCount, combinedBitmask);
                
                // Parse 32 bits from combined mask
                for (int i = 0; i < 32; i++)
                {
                    if ((combinedBitmask & (0x80000000L >> i)) != 0)
                    {
                        byte pid = (byte)(startPid + i + 1);
                        // Store as combined service (0x01) + pid: 0x01PP
                        uint combinedPid = (uint)((0x01 << 8) | pid);
                        _availablePids.Add(combinedPid);
                        discovered++;
                    }
                }
                
                _logger.Debug("Total PIDs discovered from all ECUs: {0}", discovered);
            }
            
            return discovered;
        }
        
        /// <summary>
        /// Checks if more PID ranges should be queried based on bit 0 from all ECUs
        /// </summary>
        private bool HasMorePidRanges(string response)
        {
            var cleanResponse = response.Replace(" ", "").Replace("\r", "").Replace("\n", "");
            
            // Combine bitmasks from all ECUs - if ANY ECU supports next range, continue
            long combinedBitmask = 0;
            var matches = System.Text.RegularExpressions.Regex.Matches(cleanResponse, @"41[0-9A-Fa-f]{2}([0-9A-Fa-f]{8})");
            
            foreach (System.Text.RegularExpressions.Match match in matches)
            {
                if (match.Success && long.TryParse(match.Groups[1].Value, System.Globalization.NumberStyles.HexNumber, null, out long bitmask))
                {
                    combinedBitmask |= bitmask;  // OR operation
                }
            }
            
            // Bit 0 (LSB of last byte) indicates if next range is supported
            return (combinedBitmask & 0x01) != 0;
        }
        
        /// <summary>
        /// Filters PID configurations to only include available PIDs and groups by update cycle
        /// </summary>
        private string GetPidKey(PidConfiguration config)
        {
            var serviceHex = config.Service.Split(',')[0].Replace("0x", "").Trim();
            var pidHex = config.Pid.Replace("0x", "").Trim();
            return $"{serviceHex}:{pidHex}";
        }
        
        private async Task FilterAvailablePidsAsync()
        {
            var allConfigs = _pidConfigService.GetAllConfigurations()
                .Where(p => !string.IsNullOrEmpty(p.Pid))
                .ToList();
            
            _logger.Debug($"[BG_SERVICE] Total PID configs from CSV: {allConfigs.Count}");
            
            // Group all configurations by Service+PID for multi-field parsing
            _configsByPidKey.Clear();
            foreach (var config in allConfigs)
            {
                var key = GetPidKey(config);
                if (!_configsByPidKey.ContainsKey(key))
                {
                    _configsByPidKey[key] = new List<PidConfiguration>();
                }
                _configsByPidKey[key].Add(config);
            }
            
            _logger.Information($"Grouped into {_configsByPidKey.Count} unique PID keys");
            
            // Deduplicate by Service+PID to prevent sending same command multiple times
            // Keep the config with the shortest update cycle as the "primary" one
            var uniquePids = new Dictionary<string, PidConfiguration>();
            foreach (var config in allConfigs)
            {
                var key = GetPidKey(config);
                
                if (!uniquePids.ContainsKey(key))
                {
                    uniquePids[key] = config;
                }
                else if (config.UpdateCycleMs > 0 && config.UpdateCycleMs < uniquePids[key].UpdateCycleMs)
                {
                    // Use the one with faster update cycle
                    uniquePids[key] = config;
                }
            }
            
            var deduplicatedConfigs = uniquePids.Values.ToList();
            _logger.Debug("Deduplicated to {0} unique PIDs", deduplicatedConfigs.Count);
            
            // Store CSV configs for intersection with discovery
            _csvPidConfigs = deduplicatedConfigs.Take(50).ToList();
            _logger.Debug($"[BG_SERVICE] Stored {_csvPidConfigs.Count} PIDs from CSV");
            
            // BUG-1 fix: Use lock to prevent data race with collection thread
            lock (_pidConfigLock)
            {
                // INTERSECTION LOGIC: Use only PIDs present in BOTH CSV and discovered
                // If discovered is empty (not complete yet), use CSV as fallback
                if (_discoveredPidConfigs.Count == 0)
                {
                    // Discovery not complete, use CSV as fallback
                    _activePidConfigs = _csvPidConfigs.ToList();
                    _logger.Debug($"[BG_SERVICE] Discovery not complete, using CSV only: {_activePidConfigs.Count} PIDs");
                }
                else
                {
                    // Build set of discovered PID keys
                    var discoveredKeys = new HashSet<string>(_discoveredPidConfigs.Select(GetPidKey));
                    
                    // INTERSECTION: Keep only CSV PIDs that were discovered
                    var intersection = _csvPidConfigs
                        .Where(c => discoveredKeys.Contains(GetPidKey(c)))
                        .ToList();
                    
                    _activePidConfigs = intersection;
                    
                    int removedCount = _csvPidConfigs.Count - intersection.Count;
                    _logger.Debug($"[BG_SERVICE] Intersection result: {intersection.Count} PIDs (removed {removedCount} from CSV that were not discovered)");
                }
                
                // Group by update cycle
                _pidsByCycle.Clear();
                foreach (var config in _activePidConfigs)
                {
                    int cycle = config.UpdateCycleMs > 0 ? config.UpdateCycleMs : 1000;
                    
                    if (!_pidsByCycle.ContainsKey(cycle))
                    {
                        _pidsByCycle[cycle] = new List<PidConfiguration>();
                    }
                    
                    _pidsByCycle[cycle].Add(config);
                }
                
                // Sort PIDs in each cycle: critical PIDs (0C, 0D) first
                foreach (var cycle in _pidsByCycle.Keys.ToList())
                {
                    _pidsByCycle[cycle] = _pidsByCycle[cycle]
                        .OrderByDescending(c => c.Pid == "0x0C" || c.Pid == "0x0D") // Critical PIDs first
                        .ThenBy(c => c.Pid) // Then sort by PID for consistency
                        .ToList();
                }
                
                _logger.Debug($"[BG_SERVICE] PIDs grouped into {_pidsByCycle.Count} update cycles (0C/0D prioritized)");
                foreach (var cycle in _pidsByCycle.Keys.OrderBy(k => k))
                {
                    _logger.Debug($"[BG_SERVICE]   Cycle {cycle}ms: {_pidsByCycle[cycle].Count} PIDs");
                }
            } // End of _pidConfigLock
        }

        public IReadOnlyList<BackgroundDataPacket> GetRecentData(int count = 10)
        {
            lock (_recentQtpData)
            {
                // Convert QTP packets to BackgroundDataPacket for UI
                return _recentQtpData.TakeLast(count).Select(QtpToBackgroundDataConverter.Convert).ToList();
            }
        }
        
        public async Task<bool> ForceUploadAsync(CancellationToken ct = default)
        {
            try
            {
                await UploadPendingDataAsync(ct);
                return true;
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Force upload failed: {0}", ex.Message);
                return false;
            }
        }
        
        private string GetUnitForFormula(string formula)
        {
            return formula?.ToUpper() switch
            {
                "RPM" => "rpm",
                "TEMPERATURE" or "TEMP_WIDERANGE" => "°C",
                "PERCENT" or "PERCENT7_REL" or "PERCENT_REL" => "%",
                "VEHSPEED" => "km/h",
                "PRESS" or "PRESS_AIR" or "PRESS_REL" or "PRESS_WIDERANGE" => "kPa",
                "PRESS_VAPOR" => "Pa",
                "AIRFLOW" => "g/s",
                "ANGLE" => "°",
                "DISTANCE" => "km",
                "HOURS" => "h",
                "O2_VOLTAGE" or "O2_VOLT_WIDE" => "V",
                "O2_CURRENT" => "mA",
                "LAMBDA" => "λ",
                _ => ""
            };
        }
        
        /// <summary>
        /// Calculates bitmask of active ECUs from packet data keys
        /// Bit 0 = 7E8, Bit 1 = 7E9, Bit 2 = 7EA, etc.
        /// </summary>
        private int CalculateEcuMask(Dictionary<string, object> data)
        {
            int mask = 0;
            var ecuBits = new Dictionary<string, int>
            {
                ["0"] = 1,   // 7E8 - bit 0
                ["1"] = 2,   // 7E9 - bit 1
                ["2"] = 4,   // 7EA - bit 2
                ["3"] = 8,   // 7EB - bit 3
                ["4"] = 16,  // 7EC - bit 4
                ["5"] = 32,  // 7ED - bit 5
                ["6"] = 64,  // 7EE - bit 6
                ["7"] = 128  // 7EF - bit 7
            };
            
            foreach (var key in data.Keys)
            {
                // Format: "p0C_0", "p04_2", etc.
                if (key.StartsWith("p") && key.Contains("_"))
                {
                    var parts = key.Split('_');
                    if (parts.Length == 2 && ecuBits.TryGetValue(parts[1], out int bit))
                    {
                        mask |= bit;
                    }
                }
            }
            
            return mask;
        }
        
        /// <summary>
        /// Converts ECU address (7E8, 7E9, etc.) to suffix number for PID key
        /// 7E8=0, 7E9=1, 7EA=2, 7EB=3, 7EC=4, 7ED=5, 7EE=6, 7EF=7, unknown=15
        /// </summary>
        private int ConvertEcuAddressToSuffix(string ecuAddress)
        {
            if (string.IsNullOrEmpty(ecuAddress) || ecuAddress.Length < 3)
                return 15; // Unknown
                
            // ECU addresses: 7E8-7EF
            return ecuAddress.ToUpper() switch
            {
                "7E8" => 0,
                "7E9" => 1,
                "7EA" => 2,
                "7EB" => 3,
                "7EC" => 4,
                "7ED" => 5,
                "7EE" => 6,
                "7EF" => 7,
                _ => 15 // Unknown/other
            };
        }
        
        private async Task<bool> InitializeELM327AdapterAsync(CancellationToken ct)
        {
            // Wait a bit for connection to stabilize
            int attempts = 0;
            while (!_bluetoothService.IsConnected && attempts < 10)
            {
                attempts++;
                _logger.Debug("Waiting for Bluetooth connection... (attempt {0})", attempts);
                await Task.Delay(200, ct);
            }
            
            if (!_bluetoothService.IsConnected)
            {
                _logger.Debug("[BG_SERVICE] ERROR: Cannot initialize - not connected after 10 attempts");
                _logger.Error("Cannot initialize - not connected after 10 attempts");
                return false;
            }
            
            _logger.Debug("Bluetooth is connected, proceeding with initialization");
            
            try
            {
            // Load settings to get the selected brand
            var settings = await _settingsService.LoadSettingsAsync();
            var brandId = settings?.SelectedBrandId ?? "generic";
            _logger.Debug("Using brand configuration: {0}", brandId);
            
            // Get brand-specific initialization commands
            var brand = await _brandService.GetBrandByIdAsync(brandId);
            if (brand?.initializationCommands != null && brand.initializationCommands.Count > 0)
            {
                _logger.Debug("Found {0} brand-specific initialization commands", brand.initializationCommands.Count);
                
                foreach (var cmd in brand.initializationCommands.OrderBy(c => c.step))
                {
                    if (ct.IsCancellationRequested) break;
                    
                    var timeout = cmd.timeoutMs > 0 ? TimeSpan.FromMilliseconds(cmd.timeoutMs) : TimeSpan.FromSeconds(1);
                    var obdCmd = new ObdCommand(cmd.command, cmd.description, timeout);
                    
                    _logger.Debug("Step {0}: {1} - {2}", cmd.step, cmd.command, cmd.description);
                    var response = await SendCommandWithTimeoutAsync(obdCmd, ct);
                    _logger.Debug("Response: {0}", response);
                    
                    // Validate critical commands
                    if (cmd.step == 1 && cmd.command == "ATZ")
                    {
                        if (string.IsNullOrWhiteSpace(response) || (!response.Contains("ELM") && !response.Contains("OK")))
                        {
                            _logger.Debug($"[BG_SERVICE] ERROR: ATZ failed - response: '{response}'");
                            _logger.Error("ERROR: ATZ failed - adapter not responding properly");
                            return false;
                        }
                    }
                    
                    // Small delay between commands
                    await Task.Delay(100, ct);
                }
                
                _logger.Information("Brand-specific initialization completed for {0}", brand.name);
            }
            else
            {
                // Fallback to default initialization if no brand-specific commands
                _logger.Debug("No brand-specific commands found, using default initialization");
                
                // Send ATZ to reset the adapter
                _logger.Debug("Sending ATZ (reset)...");
                var atzCmd = new ObdCommand("ATZ", "Reset adapter", TimeSpan.FromSeconds(3));
                var atzResponse = await SendCommandWithTimeoutAsync(atzCmd, ct);
                _logger.Debug("ATZ response: {0}", atzResponse);
                
                // Validate ATZ response
                if (string.IsNullOrWhiteSpace(atzResponse) || (!atzResponse.Contains("ELM") && !atzResponse.Contains("OK")))
                {
                    _logger.Debug($"[BG_SERVICE] ERROR: ATZ failed in fallback - response: '{atzResponse}'");
                    _logger.Error("ERROR: ATZ failed - adapter not responding properly");
                    return false;
                }
                
                await Task.Delay(500, ct);
                
                // Turn off echo (1 second for BLE)
                _logger.Debug("Sending ATE0 (echo off)...");
                var ate0Cmd = new ObdCommand("ATE0", "Echo off", TimeSpan.FromSeconds(1));
                await SendCommandWithTimeoutAsync(ate0Cmd, ct);
                
                // Turn off spaces (1 second for BLE)
                _logger.Debug("Sending ATS0 (spaces off)...");
                var ats0Cmd = new ObdCommand("ATS0", "Spaces off", TimeSpan.FromSeconds(1));
                await SendCommandWithTimeoutAsync(ats0Cmd, ct);
                
                // Set protocol (2 seconds for BLE)
                _logger.Debug("Sending ATSP6 (CAN protocol)...");
                var atspCmd = new ObdCommand("ATSP6", "CAN protocol", TimeSpan.FromSeconds(2));
                await SendCommandWithTimeoutAsync(atspCmd, ct);
                
                // Headers on (1 second for BLE)
                _logger.Debug("Sending ATH1 (headers on)...");
                var ath1Cmd = new ObdCommand("ATH1", "Headers on", TimeSpan.FromSeconds(1));
                await SendCommandWithTimeoutAsync(ath1Cmd, ct);
                
                await Task.Delay(200, ct);
            }
            
            _logger.Information("ELM327 adapter initialized successfully");
            return true;
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Failed to initialize ELM327: {0}", ex.Message);
                return false;
            }
        }
        
        private async Task<string> SendCommandWithTimeoutAsync(ObdCommand command, CancellationToken ct)
        {
            try
            {
                // Use the ObdCommand overload to respect the timeout
                var response = await _bluetoothService.SendCommandAsync(command, ct);
                return response;
            }
            catch (OperationCanceledException)
            {
                _logger.Warning("Command {0} timed out after {1}ms", command.Command, command.Timeout.TotalMilliseconds);
                return "";
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Command {0} failed: {1}", command.Command, ex.Message);
                return "";
            }
        }

        private static string ComputeSimpleHash(string input)
        {
            using var md5 = System.Security.Cryptography.MD5.Create();
            var bytes = System.Text.Encoding.UTF8.GetBytes(input);
            var hash = md5.ComputeHash(bytes);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }
    }
}
