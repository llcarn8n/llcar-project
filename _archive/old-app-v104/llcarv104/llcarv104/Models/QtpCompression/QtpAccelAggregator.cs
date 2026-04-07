using System;
using System.Collections.Generic;
using System.Linq;

namespace llcar.Models.QtpCompression;

/// <summary>
/// Aggregates accelerometer data into QTP blocks every 500ms
/// Fixed range: -16g to +16g mapped to 0-255
/// </summary>
public class QtpAccelAggregator
{
    // Circular buffer for 5 seconds of data (at 50Hz = 250 samples per axis)
    private readonly Queue<AccelSample> _xBuffer = new();
    private readonly Queue<AccelSample> _yBuffer = new();
    private readonly Queue<AccelSample> _zBuffer = new();
    
    private const int SampleRate = 50; // 50 Hz
    private const int MaxBufferSize = 500; // 10 seconds at 50Hz (need 2x window for QTP)
    
    // Fixed range for mapping: -1g to +1g
    // -1g = -9.81 m/s², +1g = +9.81 m/s²
    private const double MinG = -1.0;
    private const double MaxG = 1.0;
    private const double MinMs2 = -9.81;
    private const double MaxMs2 = 9.81;
    
    private record AccelSample(DateTime Timestamp, double Value);
    
    /// <summary>
    /// Adds accelerometer sample
    /// </summary>
    public void AddSample(DateTime timestamp, double x, double y, double z)
    {
        lock (_xBuffer)
        {
            _xBuffer.Enqueue(new AccelSample(timestamp, x));
            _yBuffer.Enqueue(new AccelSample(timestamp, y));
            _zBuffer.Enqueue(new AccelSample(timestamp, z));
            
            // Debug logging - every 10 samples
            if (_xBuffer.Count % 10 == 0)
            {
                Log.Debug($"[ACCEL_AGG] Added sample at {timestamp:HH:mm:ss.fff}, Buffer sizes: X={_xBuffer.Count}, Y={_yBuffer.Count}, Z={_zBuffer.Count}");
            }
            
            // Trim buffers by count (max 500 samples = 10 seconds at 50Hz)
            while (_xBuffer.Count > MaxBufferSize) 
            {
                var removed = _xBuffer.Dequeue();
                if (_xBuffer.Count == MaxBufferSize - 1) // Log only once per trim
                    Log.Debug($"[ACCEL_AGG] Trimmed X: {removed.Timestamp:HH:mm:ss.fff}, remaining: {_xBuffer.Count}");
            }
            while (_yBuffer.Count > MaxBufferSize) _yBuffer.Dequeue();
            while (_zBuffer.Count > MaxBufferSize) _zBuffer.Dequeue();
        }
    }
    
    /// <summary>
    /// Gets QTP arrays for all three axes
    /// Returns: ax, ay, az - each is List<byte[]> (500ms blocks)
    /// </summary>
    public (List<byte[]> ax, List<byte[]> ay, List<byte[]> az) GetQtpArraysForWindow(
        DateTime windowStart, DateTime windowEnd)
    {
        lock (_xBuffer)
        {
            Log.Debug($"[ACCEL_AGG] GetQtpArraysForWindow: {windowStart:HH:mm:ss.fff} - {windowEnd:HH:mm:ss.fff}, Buffer sizes: X={_xBuffer.Count}, Y={_yBuffer.Count}, Z={_zBuffer.Count}");
            
            var ax = EncodeAxisToQtp(_xBuffer, windowStart, windowEnd);
            var ay = EncodeAxisToQtp(_yBuffer, windowStart, windowEnd);
            var az = EncodeAxisToQtp(_zBuffer, windowStart, windowEnd);
            
            Log.Debug($"[ACCEL_AGG] Result: ax={ax.Count}, ay={ay.Count}, az={az.Count} blocks");
            
            return (ax, ay, az);
        }
    }
    
    private List<byte[]> EncodeAxisToQtp(Queue<AccelSample> buffer, DateTime start, DateTime end)
    {
        var result = new List<byte[]>();
        
        // Get samples in window
        var matchingSamples = buffer.Where(s => s.Timestamp >= start && s.Timestamp <= end).ToList();
        var samples = matchingSamples.Select(s => s.Value).ToList();
        
        Log.Debug($"[ACCEL_AGG] Window {start:HH:mm:ss.fff}-{end:HH:mm:ss.fff}: {matchingSamples.Count} matching samples out of {buffer.Count} total");
        if (matchingSamples.Count > 0)
        {
            var first = matchingSamples.First().Timestamp;
            var last = matchingSamples.Last().Timestamp;
            Log.Debug($"[ACCEL_AGG] Sample range: {first:HH:mm:ss.fff} to {last:HH:mm:ss.fff}");
        }
        
        if (samples.Count == 0)
        {
            return result;
        }
        
        // Split into 500ms blocks
        // At 50Hz, 500ms = 25 samples
        const int samplesPerBlock = 25;
        
        for (int i = 0; i < samples.Count; i += samplesPerBlock)
        {
            var blockSamples = samples.Skip(i).Take(samplesPerBlock).ToList();
            
            if (blockSamples.Count >= 3) // Need at least 3 samples for QTP
            {
                var qtpBlock = EncodeBlockToQtp(blockSamples);
                result.Add(qtpBlock);
            }
        }
        
        return result;
    }
    
    private byte[] EncodeBlockToQtp(List<double> samples)
    {
        if (samples.Count < 3)
        {
            return new byte[8]; // Return empty QTP block
        }
        
        // Calculate statistics
        var min = samples.Min();
        var max = samples.Max();
        var avg = samples.Average();
        var variance = samples.Select(s => Math.Pow(s - avg, 2)).Average();
        var stdDev = Math.Sqrt(variance);
        
        // Map to bytes using fixed range -16g to +16g
        byte MapToByte(double value)
        {
            var normalized = (value - MinMs2) / (MaxMs2 - MinMs2);
            normalized = Math.Max(0, Math.Min(1, normalized));
            return (byte)(normalized * 255);
        }
        
        var min8 = MapToByte(min);
        var max8 = MapToByte(max);
        var avg8 = MapToByte(avg);
        var sd8 = MapToByte(stdDev);
        
        // Extract turning points for shape (4 points)
        var shapeBytes = ExtractShapeBytes(samples, min, max, avg, stdDev);
        
        return new byte[] { min8, max8, avg8, sd8, shapeBytes[0], shapeBytes[1], shapeBytes[2], shapeBytes[3] };
    }
    
    private byte[] ExtractShapeBytes(List<double> samples, double min, double max, double avg, double stdDev)
    {
        // Define 7 quantization levels
        var levels = new double[]
        {
            min,
            avg - 0.7 * stdDev,
            avg - 0.3 * stdDev,
            avg,
            avg + 0.3 * stdDev,
            avg + 0.7 * stdDev,
            max
        };
        
        // Find turning points
        var turningPoints = new List<(int index, double value)>();
        
        for (int i = 1; i < samples.Count - 1; i++)
        {
            var prev = samples[i - 1];
            var curr = samples[i];
            var next = samples[i + 1];
            
            if ((curr > prev && curr > next) || (curr < prev && curr < next))
            {
                turningPoints.Add((i, curr));
            }
        }
        
        // Sort by deviation from mean and take top 4
        var selected = turningPoints
            .OrderByDescending(p => Math.Abs(p.value - avg))
            .Take(4)
            .ToList();
        
        // Pad to 4 if needed
        while (selected.Count < 4)
        {
            selected.Add((samples.Count / 2, avg));
        }
        
        var result = new byte[4];
        int prevIndex = 0;
        
        for (int i = 0; i < 4; i++)
        {
            var (index, value) = selected[i];
            
            // Quantize level (3 bits, 0-6)
            int level = Quantize(value, levels);
            
            // Duration (4 bits, log scale)
            int duration = EncodeDuration(index - prevIndex, samples.Count);
            
            // Trend (1 bit): 0=down/stable, 1=up
            int trend = (i == 0) ? (value > avg ? 1 : 0) : (value > selected[i - 1].value ? 1 : 0);
            
            // Pack: LLLDDDDT (3 bits level + 4 bits duration + 1 bit trend)
            result[i] = (byte)((level << 5) | (duration << 1) | trend);
            
            prevIndex = index;
        }
        
        return result;
    }
    
    private int Quantize(double value, double[] levels)
    {
        int nearest = 0;
        double minDiff = double.MaxValue;
        
        for (int i = 0; i < levels.Length; i++)
        {
            var diff = Math.Abs(value - levels[i]);
            if (diff < minDiff)
            {
                minDiff = diff;
                nearest = i;
            }
        }
        
        return Math.Min(6, nearest);
    }
    
    private int EncodeDuration(int samples, int total)
    {
        if (total <= 0) return 0;
        
        double pct = (double)samples / total * 100;
        
        return pct switch
        {
            <= 7 => 0,
            <= 17 => 1,
            <= 33 => 2,
            <= 67 => 3,
            _ => 4
        };
    }
}
