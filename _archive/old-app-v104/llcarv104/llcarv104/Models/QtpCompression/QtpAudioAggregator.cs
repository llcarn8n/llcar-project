using System;
using System.Collections.Generic;
using System.Linq;
using llcar.Models;

namespace llcar.Models.QtpCompression;

/// <summary>
/// Aggregates audio data with intensity-based peak detection for QTP packets
/// </summary>
public class QtpAudioAggregator
{
    private readonly Queue<(DateTime timestamp, AudioData data, short[]? rawSamples)> _buffer = new();
    private const int MaxBufferSize = 30; // 30 seconds max to ensure data availability for QTP windows with delays
    
    /// <summary>
    /// Adds audio recording to buffer
    /// </summary>
    public void AddAudio(AudioData audio, short[]? rawSamples = null)
    {
        // Use audio.Timestamp (when recording ended) instead of current time
        var timestamp = audio.Timestamp != default ? audio.Timestamp : DateTime.UtcNow;
        lock (_buffer)
        {
            _buffer.Enqueue((timestamp, audio, rawSamples));
            while (_buffer.Count > MaxBufferSize)
            {
                _buffer.Dequeue();
            }
            Log.Debug($"[AUDIO_AGG] Added audio at {timestamp:HH:mm:ss.fff}, buffer size: {_buffer.Count}");
        }
    }
    
    /// <summary>
    /// Gets audio array for QTP packet.
    /// Audio window is always 1 second (40 values: 10 harmonic frequencies + 10 percussive frequencies).
    /// QTP packet can be 2-5 seconds (configurable in settings), containing multiple audio windows.
    /// Returns array of arrays: each inner array is one 1-second audio window.
    /// 
    /// Format:
    /// - freq_1..freq_10: Harmonic frequencies (двигатель, свист) [Hz, dB×100]
    /// - peak_1..peak_10: Percussive frequencies (удары, стуки) [Hz, dB×100]
    /// </summary>
    public List<List<int>> GetAudioArrayForWindow(DateTime windowStart, DateTime windowEnd)
    {
        lock (_buffer)
        {
            var result = new List<List<int>>();
            
            // Debug logging
            Log.Debug($"[AUDIO_AGG] Window: {windowStart:HH:mm:ss.fff} - {windowEnd:HH:mm:ss.fff}, Buffer size: {_buffer.Count}");
            if (_buffer.Count > 0)
            {
                var first = _buffer.First();
                var last = _buffer.Last();
                Log.Debug($"[AUDIO_AGG] Buffer range: {first.timestamp:HH:mm:ss.fff} - {last.timestamp:HH:mm:ss.fff}");
            }
            
            // Get all audio recordings in the QTP window
            var audioInWindow = _buffer
                .Where(x => x.timestamp >= windowStart && x.timestamp <= windowEnd)
                .OrderBy(x => x.timestamp)
                .ToList();
            
            Log.Debug($"[AUDIO_AGG] Found {audioInWindow.Count} audio records in window");
            
            // Process each 1000ms interval (each audio window)
            foreach (var (timestamp, audio, rawSamples) in audioInWindow)
            {
                var windowData = new List<int>();
                
                // Add 10 dominant frequencies from FFT
                AddFrequencies(windowData, audio);
                
                // Add 10 percussive frequencies (ударные частоты)
                AddIntensityPeaks(windowData, audio);
                
                // Add this 1-second window as a separate array
                result.Add(windowData);
            }
            
            return result;
        }
    }
    
    private void AddFrequencies(List<int> result, AudioData audio)
    {
        // Use HarmonicFrequencies (двигатель, свист) for freq_X fields
        // Fallback to DominantFrequencies for backward compatibility
        var frequencies = audio.FrequencyData?.HarmonicFrequencies?.Count > 0 
            ? audio.FrequencyData.HarmonicFrequencies 
            : audio.FrequencyData?.DominantFrequencies;
            
        if (frequencies == null)
        {
            // Pad with zeros if no frequency data
            for (int i = 0; i < 10; i++)
            {
                result.Add(0);
                result.Add(0);
            }
            return;
        }
        
        // Take top 10 harmonic frequencies
        var topFreqs = frequencies.Take(10);
        foreach (var freq in topFreqs)
        {
            if (freq.Length >= 2)
            {
                result.Add((int)freq[0]);                    // Frequency in Hz
                result.Add((int)(freq[1] * 100));            // Amplitude in dB x 100
            }
            else
            {
                result.Add(0);
                result.Add(0);
            }
        }
        
        // Pad if less than 10 frequencies
        int remaining = 10 - frequencies.Count;
        for (int i = 0; i < remaining; i++)
        {
            result.Add(0);
            result.Add(0);
        }
    }
    
    private void AddIntensityPeaks(List<int> result, AudioData audio)
    {
        // Use PercussiveFrequencies (удары, стуки, шины) for peak_X fields
        // These are now frequencies, not time offsets
        var percussiveFreqs = audio.FrequencyData?.PercussiveFrequencies;
        
        if (percussiveFreqs == null || percussiveFreqs.Count == 0)
        {
            // Pad with zeros if no percussive frequency data
            for (int i = 0; i < 10; i++)
            {
                result.Add(0);
                result.Add(-10000); // -100 dB
            }
            return;
        }
        
        // Add top 10 percussive frequencies
        // Format: peak_X_offset = frequency in Hz, peak_X_amp = amplitude in dB x 100
        foreach (var freq in percussiveFreqs.Take(10))
        {
            if (freq.Length >= 2)
            {
                result.Add((int)freq[0]);                    // Frequency in Hz (stored as "offset")
                result.Add((int)(freq[1] * 100));            // Amplitude in dB x 100
            }
            else
            {
                result.Add(0);
                result.Add(-10000);
            }
        }
        
        // Pad if less than 10 frequencies
        int remaining = 10 - percussiveFreqs.Count;
        for (int i = 0; i < remaining; i++)
        {
            result.Add(0);
            result.Add(-10000);
        }
    }

}
