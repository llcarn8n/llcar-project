using System;
using System.Collections.Generic;
using System.Linq;

namespace llcar.Models.QtpCompression;

/// <summary>
/// QTP (Quantized Turning Points) Encoder
/// Compresses multiple samples into 8 bytes: min, max, avg, sd + 4 turning points
/// </summary>
public static class QtpEncoder
{
    /// <summary>
    /// Encodes a list of samples into QTP 8-byte array
    /// </summary>
    /// <param name="samples">Original ELM327 values (16-bit or 8-bit)</param>
    /// <param name="globalMin">Min value from pids.csv for linear mapping</param>
    /// <param name="globalMax">Max value from pids.csv for linear mapping</param>
    /// <returns>8-byte array [min8, max8, avg8, sd8, shape1, shape2, shape3, shape4] or null if samples.Count < 3</returns>
    public static byte[]? Encode(List<int> samples, double globalMin, double globalMax)
    {
        if (samples == null || samples.Count < 3)
            return null;

        // Calculate statistics on original values
        var min = samples.Min();
        var max = samples.Max();
        var avg = samples.Average();
        var variance = samples.Select(s => Math.Pow(s - avg, 2)).Average();
        var stdDev = Math.Sqrt(variance);

        // Map value to byte (0-255)
        byte MapToByte(double value)
        {
            if (globalMax > 255)
            {
                // For 2-byte PIDs like RPM (0-16384), return high byte
                return (byte)((int)value >> 8);
            }
            else
            {
                // For 1-byte PIDs, return low byte
                return (byte)((int)value & 0xFF);
            }
        }

        var min8 = MapToByte(min);
        var max8 = MapToByte(max);
        var avg8 = MapToByte(avg);
        var sd8 = MapToByte(stdDev); // Non-linear, but we'll use linear for simplicity

        // Extract 4 turning points with shape encoding
        var shapeBytes = ExtractShape(samples, min, max, avg, stdDev);

        return new byte[] { min8, max8, avg8, sd8, shapeBytes[0], shapeBytes[1], shapeBytes[2], shapeBytes[3] };
    }

    /// <summary>
    /// Extracts 4 turning points and encodes them into 4 bytes
    /// Format per point: 3 bits level + 4 bits duration + 1 bit trend direction
    /// Total: 4 points × 8 bits = 32 bits = 4 bytes
    /// </summary>
    private static byte[] ExtractShape(List<int> samples, int min, int max, double avg, double stdDev)
    {
        // Define 7 quantization levels based on avg and stdDev
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

        // Find turning points (local minima/maxima)
        var turningPoints = FindTurningPoints(samples);
        
        // Take up to 4 most significant turning points
        var selectedPoints = turningPoints.Take(4).ToList();
        
        // Pad to 4 points if needed
        while (selectedPoints.Count < 4)
        {
            selectedPoints.Add((samples.Count / 2, avg)); // Middle point as default
        }

        var result = new byte[4];
        int prevIndex = 0;

        for (int i = 0; i < 4; i++)
        {
            var (index, value) = selectedPoints[i];
            
            // Quantize value to 0-6 (3 bits)
            int quantizedLevel = Quantize(value, levels);
            
            // Calculate duration as percentage of total samples (4 bits, log scale)
            int duration = EncodeDuration(index - prevIndex, samples.Count);
            
            // Determine trend direction (1 bit): 0=down/stable, 1=up
            bool isUp = (i == 0) ? (value > avg) : (value > selectedPoints[Math.Max(0, i - 1)].value);
            int trend = isUp ? 1 : 0;
            
            // Pack: 3 bits level + 4 bits duration + 1 bit trend = 8 bits
            result[i] = (byte)((quantizedLevel << 5) | (duration << 1) | trend);
            
            prevIndex = index;
        }

        return result;
    }

    /// <summary>
    /// Quantizes a value to nearest level (0-6)
    /// </summary>
    private static int Quantize(double value, double[] levels)
    {
        int nearestIndex = 0;
        double minDiff = double.MaxValue;

        for (int i = 0; i < levels.Length; i++)
        {
            var diff = Math.Abs(value - levels[i]);
            if (diff < minDiff)
            {
                minDiff = diff;
                nearestIndex = i;
            }
        }

        return Math.Min(6, nearestIndex); // Ensure 0-6 range
    }

    /// <summary>
    /// Encodes duration using log-scale (4 bits: 0-15)
    /// </summary>
    private static int EncodeDuration(int samples, int totalSamples)
    {
        if (totalSamples <= 0) return 0;
        
        double percentage = (double)samples / totalSamples * 100;
        
        // Log-scale mapping: 0-7%, 8-17%, 18-33%, 34-67%, >67%
        return percentage switch
        {
            <= 7 => 0,
            <= 17 => 1,
            <= 33 => 2,
            <= 67 => 3,
            _ => 4
        };
    }

    /// <summary>
    /// Finds turning points (local minima and maxima) in the signal
    /// </summary>
    private static List<(int index, double value)> FindTurningPoints(List<int> samples)
    {
        var points = new List<(int index, double value)>();

        for (int i = 1; i < samples.Count - 1; i++)
        {
            var prev = samples[i - 1];
            var curr = samples[i];
            var next = samples[i + 1];

            // Local maximum
            if (curr > prev && curr > next)
            {
                points.Add((i, curr));
            }
            // Local minimum
            else if (curr < prev && curr < next)
            {
                points.Add((i, curr));
            }
        }

        // Sort by significance (deviation from mean)
        var mean = samples.Average();
        return points.OrderByDescending(p => Math.Abs(p.value - mean)).ToList();
    }

    /// <summary>
    /// Decodes QTP 8-byte array back to approximate values (for debugging)
    /// </summary>
    public static (byte min, byte max, byte avg, byte sd, int[] levels, int[] durations, int[] trends) Decode(byte[] qtpData)
    {
        if (qtpData == null || qtpData.Length != 8)
            throw new ArgumentException("QTP data must be 8 bytes");

        var min = qtpData[0];
        var max = qtpData[1];
        var avg = qtpData[2];
        var sd = qtpData[3];

        var levels = new int[4];
        var durations = new int[4];
        var trends = new int[4];

        for (int i = 0; i < 4; i++)
        {
            byte b = qtpData[4 + i];
            levels[i] = (b >> 5) & 0x07;      // Top 3 bits
            durations[i] = (b >> 1) & 0x0F;   // Middle 4 bits
            trends[i] = b & 0x01;             // Bottom 1 bit
        }

        return (min, max, avg, sd, levels, durations, trends);
    }
}

