using llcar.Models;
using Microsoft.Maui.Devices.Sensors;

namespace llcar.Services;

public class AccelerometerService
{
    private bool _isListening = false;
    private Models.AccelerometerData? _lastReading;
    private readonly object _lock = new();
    private DateTime _lastLogTime = DateTime.MinValue;
    private readonly TimeSpan _logInterval = TimeSpan.FromSeconds(1);

    public bool IsListening => _isListening;

    public event EventHandler<Models.AccelerometerData>? DataReceived;

    public enum AccelerometerStatus
    {
        NotSupported,
        NotMonitoring,
        Monitoring
    }

    public async Task<bool> StartListeningAsync()
    {
        try
        {
            if (!Microsoft.Maui.Devices.Sensors.Accelerometer.IsSupported)
            {
                Log.Debug("[AccelerometerService] Accelerometer not supported on this device");
                return false;
            }

            // Subscribe to accelerometer events
            Microsoft.Maui.Devices.Sensors.Accelerometer.ReadingChanged += OnAccelerometerReadingChanged;
            
            // Start monitoring with default interval
            Microsoft.Maui.Devices.Sensors.Accelerometer.Start(SensorSpeed.Default);
            
            _isListening = true;
            Log.Debug("[AccelerometerService] Started listening");
            
            return true;
        }
        catch (Exception ex)
        {
            Log.Debug($"[AccelerometerService] Error starting: {ex.Message}");
            return false;
        }
    }

    private void OnAccelerometerReadingChanged(object? sender, AccelerometerChangedEventArgs e)
    {
        var data = new Models.AccelerometerData
        {
            X = e.Reading.Acceleration.X,
            Y = e.Reading.Acceleration.Y,
            Z = e.Reading.Acceleration.Z
        };
        
        lock (_lock)
        {
            _lastReading = data;
        }
        
        // Notify subscribers immediately when new data arrives
        DataReceived?.Invoke(this, data);
        
        // Log only once per second to avoid spam
        var now = DateTime.Now;
        if (now - _lastLogTime >= _logInterval)
        {
            _lastLogTime = now;
            // Log.Debug($"[AccelerometerService] Reading: X={data.X:F2}, Y={data.Y:F2}, Z={data.Z:F2}");
        }
    }

    public void StopListening()
    {
        try
        {
            if (_isListening)
            {
                Microsoft.Maui.Devices.Sensors.Accelerometer.ReadingChanged -= OnAccelerometerReadingChanged;
                Microsoft.Maui.Devices.Sensors.Accelerometer.Stop();
                _isListening = false;
                Log.Debug("[AccelerometerService] Stopped listening");
            }
        }
        catch (Exception ex)
        {
            Log.Debug($"[AccelerometerService] Error stopping: {ex.Message}");
        }
    }

    public Models.AccelerometerData GetLastReading()
    {
        lock (_lock)
        {
            return _lastReading ?? new Models.AccelerometerData
            {
                X = 0,
                Y = 0,
                Z = 9.8
            };
        }
    }

    public bool IsSupported()
    {
        return Microsoft.Maui.Devices.Sensors.Accelerometer.IsSupported;
    }

    public AccelerometerStatus GetStatus()
    {
        if (!IsSupported())
            return AccelerometerStatus.NotSupported;
        return _isListening ? AccelerometerStatus.Monitoring : AccelerometerStatus.NotMonitoring;
    }
}
