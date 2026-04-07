using System;
using System.Collections.Generic;
using System.Linq;
using System.Timers;
using Timer = System.Timers.Timer;

namespace llcar.Models.QtpCompression;

/// <summary>
/// Rolling window accumulator for QTP compression
/// Aggregates samples over time window (2-5 seconds) and produces QTP data
/// </summary>
public class QtpWindow
{
    private readonly Dictionary<string, List<PidSample>> _pidSamples = new();
    private readonly Dictionary<string, (double min, double max)> _pidRanges;
    private readonly int _windowDurationMs;
    private DateTime _windowStart;
    private DateTime _windowEnd;
    
    public QtpWindow(int windowDurationMs, Dictionary<string, (double min, double max)> pidRanges)
    {
        _windowDurationMs = windowDurationMs;
        _pidRanges = pidRanges;
        _windowStart = DateTime.UtcNow;
        _windowEnd = _windowStart.AddMilliseconds(windowDurationMs);
        
        // LOG: Track window creation
        Log.Debug($"[QTP_WINDOW] Created new window: start={_windowStart:HH:mm:ss.fff}, end={_windowEnd:HH:mm:ss.fff}, duration={windowDurationMs}ms");
    }
    
    /// <summary>
    /// Adds a PID reading to the window
    /// </summary>
    public void AddSample(string pidKey, int rawValue, DateTime timestamp)
    {
        if (!_pidSamples.ContainsKey(pidKey))
        {
            _pidSamples[pidKey] = new List<PidSample>();
        }
        
        _pidSamples[pidKey].Add(new PidSample(rawValue, timestamp));
    }
    
    /// <summary>
    /// Encodes all accumulated PID data into QTP format
    /// Returns dictionary: PID key -> QTP byte array OR single average value
    /// </summary>
    public Dictionary<string, object> EncodeQtp()
    {
        var result = new Dictionary<string, object>();
        int qtpCount = 0;
        int avgCount = 0;
        int noRangeCount = 0;
        
        foreach (var kvp in _pidSamples)
        {
            var pidKey = kvp.Key;
            var samples = kvp.Value.Select(s => s.RawValue).ToList();
            
            if (samples.Count == 0)
                continue;
            
            // Check if we have range info for this PID
            if (_pidRanges.TryGetValue(pidKey, out var range))
            {
                // Encode to QTP 8-byte array (requires >= 3 samples)
                var encodedValue = QtpEncoder.Encode(samples, range.min, range.max);
                
                if (encodedValue != null)
                {
                    // QTP encoding successful - store 8-byte array
                    result[pidKey] = encodedValue;
                    qtpCount++;
                    
                    // Log encoding for debugging
                    if (pidKey.Contains("0C") || pidKey.Contains("0D"))
                    {
                        var lastValue = samples[^1];
                        Log.Debug($"[QTP_ENCODE] {pidKey}: Last={lastValue}, QTP bytes=[{string.Join(",", encodedValue)}], samples={samples.Count}");
                    }
                }
                else if (samples.Count > 0)
                {
                    // Not enough samples for QTP (< 3) - store average
                    var avgValue = (int)samples.Average();
                    result[pidKey] = avgValue;
                    avgCount++;
                    
                    if (pidKey.Contains("0C") || pidKey.Contains("0D"))
                    {
                        Log.Debug($"[QTP_ENCODE] {pidKey}: Avg={avgValue} (only {samples.Count} samples, need 3+ for QTP)");
                    }
                }
            }
            else
            {
                // No range info - store last sample as-is
                var lastValue = samples[^1];
                result[pidKey] = lastValue;
                noRangeCount++;
                
                if (pidKey.Contains("0C") || pidKey.Contains("0D"))
                {
                    Log.Debug($"[QTP_ENCODE] {pidKey}: Last value ({lastValue}) - NO RANGE, samples={samples.Count}");
                }
            }
        }
        
        Log.Debug($"[QTP_ENCODE] Summary: {qtpCount} QTP, {avgCount} AVG, {noRangeCount} NO RANGE, total {result.Count}");
        
        return result;
    }
    
    /// <summary>
    /// Gets window timestamps
    /// </summary>
    public (DateTime start, DateTime end) GetWindowTimes()
    {
        return (_windowStart, _windowEnd);
    }
    
    /// <summary>
    /// Gets sample count per PID
    /// </summary>
    public Dictionary<string, int> GetSampleCounts()
    {
        return _pidSamples.ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Count);
    }
    
    /// <summary>
    /// Gets rejected PIDs (those with less than 3 samples that won't get QTP encoding)
    /// </summary>
    public List<(string pidKey, int sampleCount, int avgValue)> GetRejectedPids()
    {
        var rejected = new List<(string pidKey, int sampleCount, int avgValue)>();
        
        foreach (var kvp in _pidSamples)
        {
            var samples = kvp.Value.Select(s => s.RawValue).ToList();
            if (samples.Count > 0 && samples.Count < 3)
            {
                rejected.Add((kvp.Key, samples.Count, (int)samples.Average()));
            }
        }
        
        return rejected;
    }
    
    private record PidSample(int RawValue, DateTime Timestamp);
}

/// <summary>
/// Manages QTP windows using timer-based closure for reliable timing
/// </summary>
public class QtpWindowManager
{
    private readonly int _windowDurationMs;
    private readonly Dictionary<string, (double min, double max)> _pidRanges;
    private QtpWindow? _currentWindow;
    private readonly object _lock = new();
    private Timer? _windowTimer;
    private int _isProcessingCompletedWindow = 0; // 0 = false, 1 = true (for Interlocked)
    
    /// <summary>
    /// Event fired when window is completed and ready for processing
    /// </summary>
    public event EventHandler<(Dictionary<string, object> qtpData, DateTime start, DateTime end)>? WindowCompleted;
    
    public QtpWindowManager(int windowDurationMs, Dictionary<string, (double min, double max)> pidRanges)
    {
        _windowDurationMs = windowDurationMs;
        _pidRanges = pidRanges;
        
        // Create first window and start timer
        CreateNewWindow();
    }
    
    /// <summary>
    /// Creates a new window and starts the timer
    /// </summary>
    private void CreateNewWindow()
    {
        lock (_lock)
        {
            _currentWindow = new QtpWindow(_windowDurationMs, _pidRanges);
            
            // Start timer for window duration
            _windowTimer?.Stop();
            _windowTimer?.Dispose();
            
            _windowTimer = new Timer(_windowDurationMs);
            _windowTimer.Elapsed += OnWindowTimerElapsed;
            _windowTimer.AutoReset = false; // Run only once
            _windowTimer.Start();
            
            Log.Debug($"[QTP_WINDOW] Timer started for {_windowDurationMs}ms");
        }
    }
    
    /// <summary>
    /// Called when window timer expires - close current window and start new one
    /// Uses Interlocked for thread-safe single execution
    /// </summary>
    private void OnWindowTimerElapsed(object? sender, ElapsedEventArgs e)
    {
        // Atomically check and set flag (0 -> 1)
        if (Interlocked.CompareExchange(ref _isProcessingCompletedWindow, 1, 0) != 0)
        {
            Log.Debug("[QTP_WINDOW] Already processing window, skipping");
            return;
        }
        
        try
        {
            // Stop timer immediately to prevent re-triggering
            _windowTimer?.Stop();
            
            lock (_lock)
            {
                if (_currentWindow == null)
                {
                    Log.Debug("[QTP_WINDOW] No current window to complete");
                    CreateNewWindow();
                    return;
                }
                
                // Encode current window data
                var completedData = _currentWindow.EncodeQtp();
                var completedTimes = _currentWindow.GetWindowTimes();
                
                Log.Debug($"[QTP_WINDOW] Window COMPLETED with {completedData.Count} keys. Has 0C_0:{completedData.ContainsKey("p0C_0")}, 0D_0:{completedData.ContainsKey("p0D_0")}");
                
                // Fire event if we have data
                if (completedData.Count > 0 && WindowCompleted != null)
                {
                    WindowCompleted.Invoke(this, (completedData, completedTimes.start, completedTimes.end));
                }
                else if (completedData.Count == 0)
                {
                    Log.Debug("[QTP_WINDOW] Window has no data, skipping upload");
                }
            }
            
            // Create new window for next period
            CreateNewWindow();
        }
        finally
        {
            // Reset flag atomically
            Interlocked.Exchange(ref _isProcessingCompletedWindow, 0);
        }
    }
    
    /// <summary>
    /// Adds a sample to the current window
    /// Simple implementation - just adds, no time checking
    /// </summary>
    public void AddSample(string pidKey, int rawValue, DateTime timestamp)
    {
        lock (_lock)
        {
            _currentWindow?.AddSample(pidKey, rawValue, timestamp);
        }
    }
    
    /// <summary>
    /// Forces completion of current window and returns data
    /// </summary>
    public (Dictionary<string, object> qtpData, DateTime start, DateTime end)? ForceComplete()
    {
        lock (_lock)
        {
            if (_currentWindow == null)
                return null;
            
            var data = _currentWindow.EncodeQtp();
            var times = _currentWindow.GetWindowTimes();
            
            if (data.Count > 0)
            {
                return (data, times.start, times.end);
            }
            
            return null;
        }
    }
    
    /// <summary>
    /// Gets rejected PIDs from current window (those with < 3 samples)
    /// </summary>
    public List<(string pidKey, int sampleCount, int avgValue)> GetCurrentWindowRejectedPids()
    {
        lock (_lock)
        {
            return _currentWindow?.GetRejectedPids() ?? new List<(string, int, int)>();
        }
    }
    
    /// <summary>
    /// Stops the timer and cleans up resources
    /// </summary>
    public void Stop()
    {
        _windowTimer?.Stop();
        _windowTimer?.Dispose();
        _windowTimer = null;
    }
}
