using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace llcar.Models.QtpCompression;

/// <summary>
/// Window of audio data (1 second)
/// Contains 40 values: 10 frequencies + 10 peaks + quality
/// </summary>
public class AudioWindow
{
    /// <summary>Raw audio data: 40 values (10 freq pairs + 10 peak pairs)</summary>
    public List<int> Data { get; set; } = new List<int>(40);
    
    /// <summary>Audio quality score (0-100): 100=perfect vehicle sounds, 0=music/speech</summary>
    public int Quality { get; set; } = 50;
}

/// <summary>
/// Window of accelerometer data (500ms)
/// Contains QTP-encoded blocks for each axis (16 bytes each)
/// Format: [min16, max16, avg16, sd16, shape1-4, reserved(8 bytes)]
/// </summary>
public class AccelWindow
{
    /// <summary>QTP block for X axis (16 bytes)</summary>
    public byte[] Ax { get; set; } = new byte[16];

    /// <summary>QTP block for Y axis (16 bytes)</summary>
    public byte[] Ay { get; set; } = new byte[16];

    /// <summary>QTP block for Z axis (16 bytes)</summary>
    public byte[] Az { get; set; } = new byte[16];
}

/// <summary>
/// Manager for audio and accelerometer window queues
/// Thread-safe FIFO queues with automatic old data removal
/// </summary>
public class SensorWindowManager
{
    // Audio: 1 window per second, max 60 windows (60 seconds)
    private readonly ConcurrentQueue<AudioWindow> _audioQueue = new();
    private const int MaxAudioWindows = 60;
    
    // Accel: 2 windows per second, max 120 windows (60 seconds)
    private readonly ConcurrentQueue<AccelWindow> _accelQueue = new();
    private const int MaxAccelWindows = 120;
    
    /// <summary>
    /// Adds audio window to queue
    /// </summary>
    public void AddAudioWindow(AudioWindow window)
    {
        _audioQueue.Enqueue(window);
        
        // Remove old windows if queue is full (FIFO)
        while (_audioQueue.Count > MaxAudioWindows)
        {
            _audioQueue.TryDequeue(out _);
        }
    }
    
    /// <summary>
    /// Adds accelerometer window to queue
    /// </summary>
    public void AddAccelWindow(AccelWindow window)
    {
        _accelQueue.Enqueue(window);
        
        // Remove old windows if queue is full (FIFO)
        while (_accelQueue.Count > MaxAccelWindows)
        {
            _accelQueue.TryDequeue(out _);
        }
    }
    
    /// <summary>
    /// Gets specified number of audio windows from queue
    /// Returns empty list if not enough windows
    /// </summary>
    public List<AudioWindow> GetAudioWindows(int count)
    {
        var result = new List<AudioWindow>();
        
        for (int i = 0; i < count; i++)
        {
            if (_audioQueue.TryDequeue(out var window))
            {
                result.Add(window);
            }
            else
            {
                // Not enough windows - return what we have
                break;
            }
        }
        
        return result;
    }
    
    /// <summary>
    /// Gets specified number of accelerometer windows from queue
    /// Returns empty list if not enough windows
    /// </summary>
    public List<AccelWindow> GetAccelWindows(int count)
    {
        var result = new List<AccelWindow>();
        
        for (int i = 0; i < count; i++)
        {
            if (_accelQueue.TryDequeue(out var window))
            {
                result.Add(window);
            }
            else
            {
                // Not enough windows - return what we have
                break;
            }
        }
        
        return result;
    }
    
    /// <summary>
    /// Gets current queue sizes for debugging
    /// </summary>
    public (int audioCount, int accelCount) GetQueueSizes()
    {
        return (_audioQueue.Count, _accelQueue.Count);
    }
    
    /// <summary>
    /// Checks if we have minimum required data to form a packet
    /// </summary>
    public bool HasMinimumData(int audioNeeded, int accelNeeded)
    {
        return _audioQueue.Count >= audioNeeded && _accelQueue.Count >= accelNeeded;
    }
    
    /// <summary>
    /// Clears all queues (e.g., on disconnect)
    /// </summary>
    public void ClearQueues()
    {
        while (_audioQueue.TryDequeue(out _)) { }
        while (_accelQueue.TryDequeue(out _)) { }
    }
}
