using llcar.Models;
using llcar.Models.QtpCompression;
using System.Diagnostics;
using Core.Logger;

#if ANDROID
using Android.Util;
#endif

namespace llcar.Services
{
    /// <summary>
    /// Service for capturing and compressing accelerometer data
    /// </summary>
    public interface IAccelerometerCaptureService
    {
        /// <summary>
        /// Event raised when new compressed accelerometer data is available
        /// </summary>
        event EventHandler<AccelerometerCompressedData>? DataReceived;
        
        /// <summary>
        /// Starts capturing accelerometer data
        /// </summary>
        Task<bool> StartAsync(int sampleRateHz);
        
        /// <summary>
        /// Stops capturing
        /// </summary>
        Task StopAsync();
        
        /// <summary>
        /// Gets compressed data for the last interval (typically 1 second)
        /// </summary>
        Task<AccelerometerCompressedData> GetCompressedDataAsync();
        
        /// <summary>
        /// Gets all accumulated QTP blocks and clears the buffers
        /// Returns null if no blocks available
        /// </summary>
        Task<(List<byte[]> ax, List<byte[]> ay, List<byte[]> az)?> GetAndClearQtpBlocksAsync();
        
        /// <summary>
        /// Sets the window manager for accelerometer window queuing
        /// </summary>
        void SetWindowManager(SensorWindowManager? manager);
        
        /// <summary>
        /// Returns true if sensor is available
        /// </summary>
        bool IsAvailable { get; }
        
        /// <summary>
        /// Current sample rate in Hz
        /// </summary>
        int SampleRate { get; }
        
        /// <summary>
        /// Number of samples captured
        /// </summary>
        long TotalSamplesCaptured { get; }
    }
    
    /// <summary>
    /// Cross-platform accelerometer implementation
    /// </summary>
    public class AccelerometerCaptureService : IAccelerometerCaptureService
    {
        public event EventHandler<AccelerometerCompressedData>? DataReceived;
        
        private readonly List<AccelerometerSample> _samples = new();
        private readonly SemaphoreSlim _sampleLock = new(1, 1);
        private CancellationTokenSource? _cts;
        private Task? _captureTask;
        private DateTime _lastCompressionTime;
        private int _sampleRateHz = 50;
        private long _totalSamples;
        
        // QTP blocks buffer - collected every 500ms
        private readonly List<byte[]> _qtpXBlocks = new();
        private readonly List<byte[]> _qtpYBlocks = new();
        private readonly List<byte[]> _qtpZBlocks = new();
        private readonly SemaphoreSlim _qtpBlockLock = new(1, 1);
        private Task? _qtpBlockTask;
        
        // Window manager for queueing
        private SensorWindowManager? _windowManager;
        
        // Logging throttling
        private DateTime _lastLogTime = DateTime.MinValue;
        private readonly TimeSpan _logInterval = TimeSpan.FromSeconds(1);
        
        private readonly ServiceLogger _logger = new ServiceLogger("AccelerometerCaptureService");
        
        public bool IsAvailable => Accelerometer.Default?.IsSupported ?? false;
        public int SampleRate => _sampleRateHz;
        public long TotalSamplesCaptured => _totalSamples;
        

        
        public async Task<bool> StartAsync(int sampleRateHz)
        {
            if (!IsAvailable)
            {
                _logger.Debug("Accelerometer not available on this device");
                return false;
            }
            
            try
            {
                _sampleRateHz = sampleRateHz;
                _cts = new CancellationTokenSource();
                _lastCompressionTime = DateTime.UtcNow;
                
                // Subscribe to accelerometer readings
                Accelerometer.Default.ReadingChanged += OnAccelerometerReadingChanged;
                
                // Only start if not already running (another service may have started it)
                if (Accelerometer.Default.IsMonitoring)
                {
                    // _logger.Debug("[AccelerometerCaptureService] Accelerometer already running, just subscribing to events");
                }
                else
                {
                    Accelerometer.Default.Start(SensorSpeed.Game);
                }
                
                // Start compression task
                _captureTask = RunCompressionTaskAsync(_cts.Token);
                
                // Start QTP block collection task
                _qtpBlockTask = RunQtpBlockCollectionAsync(_cts.Token);
                
                // _logger.Debug($"AccelerometerCaptureService started at {sampleRateHz}Hz");
                return true;
            }
            catch (Exception ex)
            {
                _logger.Debug($"Failed to start accelerometer: {ex.Message}");
                return false;
            }
        }
        
        public void SetWindowManager(SensorWindowManager? manager)
        {
            _windowManager = manager;
            // _logger.Debug($"[Accelerometer] Window manager set: {manager != null}");
        }
        
        public async Task StopAsync()
        {
            try
            {
                _cts?.Cancel();
                
                if (Accelerometer.Default?.IsSupported == true)
                {
                    Accelerometer.Default.ReadingChanged -= OnAccelerometerReadingChanged;
                    Accelerometer.Default.Stop();
                }
                
                if (_captureTask != null)
                    await Task.WhenAny(_captureTask, Task.Delay(1000));
                
                if (_qtpBlockTask != null)
                    await Task.WhenAny(_qtpBlockTask, Task.Delay(1000));
                
                // _logger.Debug("AccelerometerCaptureService stopped");
            }
            catch (Exception ex)
            {
                // _logger.Debug($"Error stopping accelerometer: {ex.Message}");
            }
            finally
            {
                _cts?.Dispose();
                _cts = null;
            }
        }
        
        // Fixed gravity values in G units - standard Earth gravity on Z axis
        // MAUI Accelerometer returns values in G (1.0 = 9.81 m/s²)
        private const double GravityX = 0.0;  // in G
        private const double GravityY = 0.0;  // in G
        private const double GravityZ = 1.0;  // in G (1g = 9.81 m/s²)
        
        private void OnAccelerometerReadingChanged(object? sender, AccelerometerChangedEventArgs e)
        {
            // Remove fixed gravity to get linear acceleration in G units
            // Input is already in G, so we subtract 1.0 for gravity, not 9.8
            var linearX = e.Reading.Acceleration.X - GravityX;
            var linearY = e.Reading.Acceleration.Y - GravityY;
            var linearZ = e.Reading.Acceleration.Z - GravityZ;
            
            var sample = new AccelerometerSample
            {
                Timestamp = DateTime.UtcNow,
                X = linearX,
                Y = linearY,
                Z = linearZ
                // Magnitude removed - calculate per-axis only
            };
            
            _sampleLock.Wait();
            try
            {
                _samples.Add(sample);
                _totalSamples++;
                
                // Keep only last 5 seconds of samples to prevent memory issues
                var cutoff = DateTime.UtcNow.AddSeconds(-5);
                _samples.RemoveAll(s => s.Timestamp < cutoff);
            }
            finally
            {
                _sampleLock.Release();
            }
        }
        
        private async Task RunCompressionTaskAsync(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(1000, ct); // Compress every second
                    
                    // Get compressed data and notify subscribers
                    var compressedData = await GetCompressedDataAsync();
                    if (compressedData.SampleCount > 0)
                    {
                        DataReceived?.Invoke(this, compressedData);
                        var now = DateTime.Now;
                        if (now - _lastLogTime >= _logInterval)
                        {
                            _lastLogTime = now;
                            // _logger.Debug($"[Accelerometer] Data captured: X={compressedData.AvgX:F2}, Y={compressedData.AvgY:F2}, Z={compressedData.AvgZ:F2}, samples={compressedData.SampleCount}");
                        }
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.Debug($"[Accelerometer] Error in compression task: {ex.Message}");
                }
            }
        }
        
        /// <summary>
        /// Continuously collects QTP blocks every 500ms and stores them in buffer
        /// </summary>
        private async Task RunQtpBlockCollectionAsync(CancellationToken ct)
        {
            var nextCollectionTime = DateTime.UtcNow.AddMilliseconds(500);
            
            while (!ct.IsCancellationRequested)
            {
                try
                {
                    // Wait exactly until next collection time
                    var delay = nextCollectionTime - DateTime.UtcNow;
                    if (delay > TimeSpan.Zero)
                        await Task.Delay(delay, ct);
                    
                    var collectionEnd = DateTime.UtcNow;
                    var collectionStart = nextCollectionTime.AddMilliseconds(-500); // Start of this window
                    nextCollectionTime = nextCollectionTime.AddMilliseconds(500); // Schedule next window
                    
                    await _sampleLock.WaitAsync(ct);
                    try
                    {
                        // Get samples in the 500ms window
                        var windowSamples = _samples
                            .Where(s => s.Timestamp >= collectionStart && s.Timestamp <= collectionEnd)
                            .OrderBy(s => s.Timestamp)
                            .ToList();
                        
                        if (windowSamples.Count >= 3)
                        {
                            // Create QTP blocks for each axis
                            var ax = EncodeAxisToQtp(windowSamples.Select(s => s.X).ToList());
                            var ay = EncodeAxisToQtp(windowSamples.Select(s => s.Y).ToList());
                            var az = EncodeAxisToQtp(windowSamples.Select(s => s.Z).ToList());
                            
                            // Create AccelWindow and add to manager
                            if (_windowManager != null)
                            {
                                var window = new AccelWindow
                                {
                                    Ax = ax,
                                    Ay = ay,
                                    Az = az
                                };
                                _windowManager.AddAccelWindow(window);
                                // _logger.Debug($"[Accelerometer] Window created with QTP blocks");
                            }
                            
                            // Also add to legacy buffers for backward compatibility
                            await _qtpBlockLock.WaitAsync(ct);
                            try
                            {
                                _qtpXBlocks.Add(ax);
                                _qtpYBlocks.Add(ay);
                                _qtpZBlocks.Add(az);
                            }
                            finally
                            {
                                _qtpBlockLock.Release();
                            }
                        }
                    }
                    finally
                    {
                        _sampleLock.Release();
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.Debug($"[Accelerometer] Error in QTP block collection: {ex.Message}");
                }
            }
        }
        
        /// <summary>
        /// Gets all accumulated QTP blocks and clears the buffers
        /// </summary>
        public async Task<(List<byte[]> ax, List<byte[]> ay, List<byte[]> az)?> GetAndClearQtpBlocksAsync()
        {
            await _qtpBlockLock.WaitAsync();
            try
            {
                if (_qtpXBlocks.Count == 0)
                {
                    return null;
                }
                
                var result = (
                    ax: _qtpXBlocks.ToList(),
                    ay: _qtpYBlocks.ToList(),
                    az: _qtpZBlocks.ToList()
                );
                
                _qtpXBlocks.Clear();
                _qtpYBlocks.Clear();
                _qtpZBlocks.Clear();
                
                return result;
            }
            finally
            {
                _qtpBlockLock.Release();
            }
        }
        
        public async Task<AccelerometerCompressedData> GetCompressedDataAsync()
        {
            await _sampleLock.WaitAsync();
            try
            {
                var intervalStart = _lastCompressionTime;
                var intervalEnd = DateTime.UtcNow;
                
                // Get samples in the interval
                var intervalSamples = _samples
                    .Where(s => s.Timestamp >= intervalStart && s.Timestamp <= intervalEnd)
                    .ToList();
                
                _lastCompressionTime = intervalEnd;
                
                if (intervalSamples.Count == 0)
                {
                    return new AccelerometerCompressedData
                    {
                        StartTime = intervalStart,
                        EndTime = intervalEnd,
                        SampleCount = 0,
                        VibrationLevel = VibrationLevel.None
                    };
                }
                
                // Calculate statistics per axis (no combined magnitude)
                var avgX = intervalSamples.Average(s => s.X);
                var avgY = intervalSamples.Average(s => s.Y);
                var avgZ = intervalSamples.Average(s => s.Z);
                var maxX = intervalSamples.Max(s => s.X);
                var maxY = intervalSamples.Max(s => s.Y);
                var maxZ = intervalSamples.Max(s => s.Z);
                
                // Calculate standard deviation per axis
                var varX = intervalSamples.Average(s => Math.Pow(s.X - avgX, 2));
                var varY = intervalSamples.Average(s => Math.Pow(s.Y - avgY, 2));
                var varZ = intervalSamples.Average(s => Math.Pow(s.Z - avgZ, 2));
                var maxStdDev = Math.Max(Math.Sqrt(varX), Math.Max(Math.Sqrt(varY), Math.Sqrt(varZ)));
                
                // Determine vibration level based on max axis std dev
                var vibrationLevel = maxStdDev switch
                {
                    < 0.5 => VibrationLevel.None,
                    < 1.0 => VibrationLevel.Low,
                    < 2.0 => VibrationLevel.Medium,
                    < 4.0 => VibrationLevel.High,
                    _ => VibrationLevel.Extreme
                };
                
                // Extract 5 dominant vibration frequencies for each axis (15 total)
                var xFreqs = ExtractDominantFrequencies(intervalSamples, s => s.X);
                var yFreqs = ExtractDominantFrequencies(intervalSamples, s => s.Y);
                var zFreqs = ExtractDominantFrequencies(intervalSamples, s => s.Z);
                
                // Detect top 3 peaks for each axis in chronological order
                var xPeaks = DetectAxisPeaks(intervalSamples, intervalStart, s => s.X);
                var yPeaks = DetectAxisPeaks(intervalSamples, intervalStart, s => s.Y);
                var zPeaks = DetectAxisPeaks(intervalSamples, intervalStart, s => s.Z);
                
                // Compress raw samples if needed (optional, for debug/backup)
                string? compressedSamples = null;
                if (intervalSamples.Count > 0)
                {
                    compressedSamples = CompressSamples(intervalSamples);
                }
                
                return new AccelerometerCompressedData
                {
                    StartTime = intervalStart,
                    EndTime = intervalEnd,
                    SampleCount = intervalSamples.Count,
                    AvgX = avgX,
                    AvgY = avgY,
                    AvgZ = avgZ,
                    MaxX = maxX,
                    MaxY = maxY,
                    MaxZ = maxZ,
                    StdDevX = Math.Sqrt(varX),
                    StdDevY = Math.Sqrt(varY),
                    StdDevZ = Math.Sqrt(varZ),
                    VibrationLevel = vibrationLevel,
                    CompressedSamples = compressedSamples,
                    XFrequencies = xFreqs,
                    YFrequencies = yFreqs,
                    ZFrequencies = zFreqs,
                    XPeaks = xPeaks,
                    YPeaks = yPeaks,
                    ZPeaks = zPeaks
                };
            }
            finally
            {
                _sampleLock.Release();
            }
        }
        
        /// <summary>
        /// Encodes a list of samples to QTP 8-byte block
        /// Computes with 16-bit precision for accuracy, compresses to 8-bit for transmission
        /// Format: [min8, max8, avg8, sd8, shape1, shape2, shape3, shape4]
        /// </summary>
        private byte[] EncodeAxisToQtp(List<double> samples)
        {
            if (samples.Count < 3)
            {
                return new byte[8]; // Return empty 8-byte block
            }

            // Fixed range for accelerometer: -0.1g to +0.1g for linear acceleration
            // Input values are already in G units (MAUI Accelerometer API)
            // Narrower range gives better resolution for small vibrations
            const double minG = -0.1;
            const double maxG = 0.1;

            // Calculate statistics
            var min = samples.Min();
            var max = samples.Max();
            var avg = samples.Average();
            var variance = samples.Select(s => Math.Pow(s - avg, 2)).Average();
            var stdDev = Math.Sqrt(variance);

            // Map to 16-bit integers using fixed range (high precision calculation)
            ushort MapToUInt16(double value)
            {
                var normalized = (value - minG) / (maxG - minG);
                normalized = Math.Max(0, Math.Min(1, normalized));
                return (ushort)(normalized * 65535); // 16-bit: 0-65535
            }

            var min16 = MapToUInt16(min);
            var max16 = MapToUInt16(max);
            var avg16 = MapToUInt16(avg);
            var sd16 = MapToUInt16(stdDev);

            // Extract turning points for shape (4 bytes)
            var shapeBytes = ExtractShapeBytes(samples, min, max, avg, stdDev);

            // Compress to 8-byte block: take high 8 bits of each 16-bit value
            // This preserves the precision calculation while fitting the 8-byte format
            var result = new byte[8];
            result[0] = (byte)(min16 >> 8);  // High 8 bits of min
            result[1] = (byte)(max16 >> 8);  // High 8 bits of max
            result[2] = (byte)(avg16 >> 8);  // High 8 bits of avg
            result[3] = (byte)(sd16 >> 8);   // High 8 bits of std
            result[4] = shapeBytes[0];
            result[5] = shapeBytes[1];
            result[6] = shapeBytes[2];
            result[7] = shapeBytes[3];

            return result;
        }
        
        /// <summary>
        /// Extracts shape bytes from samples for QTP encoding
        /// </summary>
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
        
        private string CompressSamples(List<AccelerometerSample> samples)
        {
            try
            {
                // Delta encoding: store first value, then deltas
                using var ms = new System.IO.MemoryStream();
                using var writer = new System.IO.BinaryWriter(ms);
                
                // Header: count, first timestamp
                writer.Write(samples.Count);
                writer.Write(samples[0].Timestamp.ToBinary());
                
                // First sample (full precision)
                writer.Write((short)(samples[0].X * 1000));
                writer.Write((short)(samples[0].Y * 1000));
                writer.Write((short)(samples[0].Z * 1000));
                
                // Delta encode subsequent samples (8-bit deltas for efficiency)
                for (int i = 1; i < samples.Count && i < 100; i++) // Limit to 100 samples
                {
                    var dt = (short)((samples[i].Timestamp - samples[i-1].Timestamp).TotalMilliseconds);
                    var dx = (short)((samples[i].X - samples[i-1].X) * 1000);
                    var dy = (short)((samples[i].Y - samples[i-1].Y) * 1000);
                    var dz = (short)((samples[i].Z - samples[i-1].Z) * 1000);
                    
                    writer.Write(dt);
                    writer.Write(dx);
                    writer.Write(dy);
                    writer.Write(dz);
                }
                
                writer.Flush();
                return Convert.ToBase64String(ms.ToArray());
            }
            catch
            {
                return "";
            }
        }
        
                /// <summary>
        /// Extracts 5 dominant vibration frequencies using FFT for a specific axis
        /// </summary>
        private List<VibrationFrequency> ExtractDominantFrequencies(List<AccelerometerSample> samples, Func<AccelerometerSample, double> axisSelector)
        {
            var frequencies = new List<VibrationFrequency>();
            
            if (samples.Count < 64)
                return frequencies;
            
            // Sample rate is typically 50Hz for accelerometer
            const int sampleRate = 50;
            const int fftSize = 64; // Must be power of 2
            
            // Extract signal for specific axis
            var signal = samples.Select(axisSelector).ToArray();
            
            // Perform FFT
            var fftResult = PerformFFT(signal, fftSize);
            
            // Convert to frequency bins
            var freqBins = new List<(double freq, double amp)>();
            for (int k = 1; k < fftSize / 2; k++) // Skip DC
            {
                double freq = (double)k * sampleRate / fftSize;
                if (freq <= 25) // Only up to 25 Hz (relevant for vehicle vibrations)
                {
                    freqBins.Add((freq, fftResult[k]));
                }
            }
            
            // Get top 10 by amplitude
            return freqBins
                .OrderByDescending(f => f.amp)
                .Take(10)
                .Select(f => new VibrationFrequency
                {
                    Frequency = f.freq,
                    Amplitude = f.amp
                })
                .ToList();
        }
        
        /// <summary>
        /// Simple FFT implementation for accelerometer data
        /// </summary>
        private double[] PerformFFT(double[] signal, int fftSize)
        {
            var result = new double[fftSize / 2];
            
            for (int k = 0; k < fftSize / 2; k++)
            {
                double real = 0, imag = 0;
                for (int n = 0; n < fftSize && n < signal.Length; n++)
                {
                    double angle = -2 * Math.PI * k * n / fftSize;
                    real += signal[n] * Math.Cos(angle);
                    imag += signal[n] * Math.Sin(angle);
                }
                result[k] = Math.Sqrt(real * real + imag * imag) / fftSize;
            }
            
            return result;
        }
        
        /// <summary>
        /// Detects top 3 peaks for a specific axis in chronological order
        /// </summary>
        private List<AxisPeak> DetectAxisPeaks(List<AccelerometerSample> samples, DateTime intervalStart, Func<AccelerometerSample, double> axisSelector)
        {
            if (samples.Count < 3)
                return new List<AxisPeak>();
            
            var peaks = new List<AxisPeak>();
            
            // Find local maxima and minima (extrema) for this axis
            for (int i = 1; i < samples.Count - 1; i++)
            {
                var prev = axisSelector(samples[i - 1]);
                var curr = axisSelector(samples[i]);
                var next = axisSelector(samples[i + 1]);
                
                // Check if current is local maximum or minimum
                if ((curr > prev && curr > next) || (curr < prev && curr < next))
                {
                    // Only significant peaks (above threshold)
                    if (Math.Abs(curr) > 0.5) // 0.5 m/s² threshold
                    {
                        peaks.Add(new AxisPeak
                        {
                            OffsetMs = (int)(samples[i].Timestamp - intervalStart).TotalMilliseconds,
                            Value = curr
                        });
                    }
                }
            }
            
            // Sort by absolute magnitude to get top 10
            var topPeaks = peaks
                .OrderByDescending(p => Math.Abs(p.Value))
                .Take(10)
                .ToList();
            
            // Re-sort by time (chronological order)
            return topPeaks
                .OrderBy(p => p.OffsetMs)
                .ToList();
        }
    }
    
    internal class AccelerometerSample
    {
        public DateTime Timestamp { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
        public double Z { get; set; }
        // Magnitude removed - calculate per-axis only when needed
    }
}
