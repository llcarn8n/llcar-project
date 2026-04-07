using llcar.Models;
using System.Collections.Concurrent;
using Core.Logger;

namespace llcar.Services;

/// <summary>
/// Aggregated data collection service
/// Collects statistics (min/avg/max/quantiles) over time windows and sends as single string
/// Works alongside BackgroundDataService
/// </summary>
public class AggregatedDataCollectionService
{
    private readonly IBackgroundDataService _backgroundDataService;
    private readonly IServerCommunicationService _serverService;
    private readonly ISettingsService _settingsService;
    private readonly IWeatherService _weatherService;
    private readonly IRoadTypeService _roadTypeService;
    private readonly IAccelerationStateService _accelerationStateService;
    private readonly ServiceLogger _logger;
    
    private readonly AggregatedDataBuffer _buffer = new();
    private Timer? _windowTimer;
    private DateTime _windowStartTime;
    private int _windowSeconds = 10; // Default 10 second windows
    private bool _isRunning = false;
    private string _clientHash = "";
    
    // Cache for last known values
    private AccelerometerCompressedData? _lastAccelData;
    private LocationData? _lastLocation;
    private DeviceStatus? _lastDeviceStatus;
    private readonly List<DiagnosticTroubleCode> _dtcCodes = new();
    
    public event EventHandler<AggregatedDataPacket>? DataReady;
    
    public bool IsRunning => _isRunning;
    
    public int WindowSeconds
    {
        get => _windowSeconds;
        set
        {
            if (value != _windowSeconds && value >= 5 && value <= 300)
            {
                _windowSeconds = value;
                if (_isRunning)
                {
                    RestartTimer();
                }
            }
        }
    }
    
    public AggregatedDataCollectionService(
        IBackgroundDataService backgroundDataService,
        IServerCommunicationService serverService,
        ISettingsService settingsService,
        IWeatherService weatherService,
        IRoadTypeService roadTypeService,
        IAccelerationStateService accelerationStateService,
        ServiceLogger logger)
    {
        _backgroundDataService = backgroundDataService;
        _serverService = serverService;
        _settingsService = settingsService;
        _weatherService = weatherService;
        _roadTypeService = roadTypeService;
        _accelerationStateService = accelerationStateService;
        _logger = logger;
        
        // Subscribe to background data events
        _backgroundDataService.DataCollected += OnBackgroundDataCollected;
    }
    
    public async Task StartAsync(string clientHash)
    {
        if (_isRunning) return;
        
        _clientHash = clientHash;
        _buffer.ClientHash = clientHash;
        _windowStartTime = DateTime.UtcNow;
        _buffer.StartWindow(_windowStartTime);
        
        // Get upload interval from settings (default 3 seconds)
        var settings = await _settingsService.LoadSettingsAsync();
        _windowSeconds = settings.UploadIntervalSeconds > 0 ? settings.UploadIntervalSeconds : 3;
        
        _isRunning = true;
        StartTimer();
        
        _logger.Information($"Aggregated data collection started with {_windowSeconds}s windows");
    }
    
    public async Task StopAsync()
    {
        if (!_isRunning) return;
        
        _isRunning = false;
        _windowTimer?.Dispose();
        _windowTimer = null;
        
        // Flush remaining data
        await FlushWindowAsync();
        
        _logger.Information("Aggregated data collection stopped");
    }
    
    private void StartTimer()
    {
        _windowTimer?.Dispose();
        _windowTimer = new Timer(
            async _ => await OnWindowCompleteAsync(),
            null,
            TimeSpan.FromSeconds(_windowSeconds),
            TimeSpan.FromSeconds(_windowSeconds));
    }
    
    private void RestartTimer()
    {
        if (_isRunning)
        {
            StartTimer();
        }
    }
    
    private async Task OnWindowCompleteAsync()
    {
        try
        {
            await FlushWindowAsync();
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Error in aggregation window completion");
        }
    }
    
    private async Task FlushWindowAsync()
    {
        var windowEnd = DateTime.UtcNow;
        _buffer.EndWindow(windowEnd);
        
        var packet = _buffer.BuildPacket();
        
        // Only send if we have data
        if (packet.OBD2Stats.Count > 0 || packet.AccelerometerStats.Count > 0)
        {
            // Enrich with context
            await EnrichPacketAsync(packet);
            
            // Fire event
            DataReady?.Invoke(this, packet);
            
            // Upload
            await UploadPacketAsync(packet);
            
            _logger.Debug($"Flushed window: {packet.OBD2Stats.Count} OBD2, " +
                         $"{packet.AccelerometerStats.Count} accel metrics");
        }
        
        // Start new window
        _windowStartTime = DateTime.UtcNow;
        _buffer.StartWindow(_windowStartTime);
    }
    
    private async Task EnrichPacketAsync(AggregatedDataPacket packet)
    {
        // Context
        packet.Context.Season = GetCurrentSeason();
        packet.Context.TimeOfDay = GetTimeOfDay();
        
        // Road type and weather from GPS
        if (packet.GPS != null && _lastLocation != null)
        {
            try
            {
                // Get road type
                packet.Context.RoadType = await _roadTypeService.DetermineRoadTypeAsync(
                    _lastLocation, _lastAccelData);
                
                // Get weather
                var weather = await _weatherService.GetWeatherAsync(
                    _lastLocation.Latitude, _lastLocation.Longitude);
                
                packet.Weather = new AggregatedWeatherData
                {
                    Temperature = (int)(weather.Temperature * 10),
                    Humidity = (int)(weather.Humidity * 10),
                    WindSpeed = (int)(weather.WindSpeed * 10),
                    Pressure = (int)(weather.Pressure * 10),
                    Condition = weather.Condition
                };
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error enriching packet");
            }
        }
        
        // Acceleration state from accelerometer
        if (packet.AccelerometerStats.TryGetValue("x", out var xStats))
        {
            packet.Context.AccelerationState = _accelerationStateService.DetermineStateFromStats(xStats);
        }
    }
    
    private async Task UploadPacketAsync(AggregatedDataPacket packet)
    {
        try
        {
            var json = System.Text.Json.JsonSerializer.Serialize(packet, 
                new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNamingPolicy = null,
                    WriteIndented = false,
                    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
                });
            
            var success = await _serverService.SendAggregatedDataAsync(json, CancellationToken.None);
            
            if (success)
            {
                _logger.Debug($"✓ Uploaded {json.Length} bytes");
            }
            else
            {
                _logger.Warning("✗ Upload failed");
            }
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Error uploading aggregated packet");
        }
    }
    
    private void OnBackgroundDataCollected(object? sender, BackgroundDataPacket packet)
    {
        if (!_isRunning) return;
        
        var offsetMs = (int)(packet.Timestamp - _windowStartTime).TotalMilliseconds;
        
        // OBD2 data
        foreach (var reading in packet.PidReadings)
        {
            var pid = reading.Pid.Replace("0x", "").ToUpper();
            _buffer.AddOBD2Value(pid, reading.ConvertedValue, offsetMs);
        }
        
        // Accelerometer
        if (packet.AccelerometerData != null)
        {
            _lastAccelData = packet.AccelerometerData;
            _buffer.AddAccelerometerValue("x", packet.AccelerometerData.AvgX, offsetMs);
            _buffer.AddAccelerometerValue("y", packet.AccelerometerData.AvgY, offsetMs);
            _buffer.AddAccelerometerValue("z", packet.AccelerometerData.AvgZ, offsetMs);
            _buffer.AddAccelerometerValue("mag", Math.Max(packet.AccelerometerData.MaxX, Math.Max(packet.AccelerometerData.MaxY, packet.AccelerometerData.MaxZ)), offsetMs);
        }
        
        // Audio
        if (packet.AudioData != null)
        {
            _buffer.AddAudioValue("db_avg", packet.AudioData.AvgDecibels, offsetMs);
            _buffer.AddAudioValue("db_peak", packet.AudioData.PeakDecibels, offsetMs);
            
            if (packet.AudioData.FrequencyData != null)
            {
                _buffer.AddAudioValue("flatness", packet.AudioData.FrequencyData.SpectralFlatness, offsetMs);
            }
        }
        
        // GPS
        if (packet.Location != null)
        {
            _lastLocation = packet.Location;
            var geohash = Geohash.Encode(
                packet.Location.Latitude, 
                packet.Location.Longitude, 
                8);
            
            _buffer.SetGPS(new AggregatedGpsData
            {
                GeoHash = geohash,
                Latitude = (int)(packet.Location.Latitude * 1_000_000),
                Longitude = (int)(packet.Location.Longitude * 1_000_000),
                Altitude = packet.Location.Altitude.HasValue 
                    ? (int)(packet.Location.Altitude.Value * 10) 
                    : 0,
                Speed = packet.Location.Speed.HasValue 
                    ? (int)(packet.Location.Speed.Value * 100) 
                    : 0,
                Heading = packet.Location.Heading.HasValue 
                    ? (int)(packet.Location.Heading.Value * 10) 
                    : 0,
                Accuracy = packet.Location.Accuracy.HasValue 
                    ? (int)(packet.Location.Accuracy.Value * 10) 
                    : 0
            });
        }
        
        // Device
        if (packet.DeviceStatus != null)
        {
            _lastDeviceStatus = packet.DeviceStatus;
            _buffer.SetDevice(new AggregatedDeviceStatus
            {
                Battery = (int)(packet.DeviceStatus.BatteryLevel * 10),
                IsCharging = packet.DeviceStatus.IsCharging ? 1 : 0
            });
        }
        
        // DTCs
        if (packet.DtcCodes?.Count > 0)
        {
            foreach (var dtc in packet.DtcCodes)
            {
                var codeInt = DtcToInt(dtc.Code);
                _buffer.AddDtcCode(codeInt);
            }
        }
    }
    
    private static int DtcToInt(string code)
    {
        if (string.IsNullOrEmpty(code) || code.Length < 5)
            return 0;
        
        int category = code[0] switch
        {
            'P' => 0,
            'B' => 1,
            'C' => 2,
            'U' => 3,
            _ => 0
        };
        
        if (int.TryParse(code.Substring(1), out int digits))
        {
            return category * 10000 + digits;
        }
        
        return category * 10000;
    }
    
    private static string GetCurrentSeason()
    {
        var month = DateTime.Now.Month;
        return month switch
        {
            12 or 1 or 2 => "winter",
            3 or 4 or 5 => "spring",
            6 or 7 or 8 => "summer",
            _ => "autumn"
        };
    }
    
    private static string GetTimeOfDay()
    {
        var hour = DateTime.Now.Hour;
        return hour switch
        {
            >= 6 and < 12 => "morning",
            >= 12 and < 18 => "day",
            >= 18 and < 22 => "evening",
            _ => "night"
        };
    }
}

// Interfaces and helper classes defined in separate files
