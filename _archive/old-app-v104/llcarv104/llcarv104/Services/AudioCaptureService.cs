using llcar.Models;
using llcar.Models.QtpCompression;
using System.Diagnostics;
using NWaves.Transforms;
using Core.Logger;

#if ANDROID
using Android.Util;
#endif

namespace llcar.Services
{
    /// <summary>
    /// Service for capturing and processing audio from microphone
    /// </summary>
    public interface IAudioCaptureService
    {
        /// <summary>
        /// Event raised when new audio data is captured
        /// </summary>
        event EventHandler<AudioData>? AudioDataCaptured;
        
        /// <summary>
        /// Starts audio capture
        /// </summary>
        Task<bool> StartAsync(int recordingDurationMs);
        
        /// <summary>
        /// Stops audio capture
        /// </summary>
        Task StopAsync();
        
        /// <summary>
        /// Gets the latest recorded audio data
        /// </summary>
        Task<AudioData?> GetLatestAudioDataAsync();
        
        /// <summary>
        /// Returns true if microphone is available
        /// </summary>
        bool IsAvailable { get; }
        
        /// <summary>
        /// Returns true if currently recording
        /// </summary>
        bool IsRecording { get; }
        
        /// <summary>
        /// Sets the window manager for audio window queuing
        /// </summary>
        void SetWindowManager(SensorWindowManager? manager);
    }
    
    /// <summary>
    /// Cross-platform audio capture implementation
    /// </summary>
    public class AudioCaptureService : IAudioCaptureService
    {
        public event EventHandler<AudioData>? AudioDataCaptured;
        
        private readonly ServiceLogger _logger = new ServiceLogger("AudioCaptureService");
        private CancellationTokenSource? _cts;
        private Task? _recordingTask;
        private int _recordingDurationMs = 1000;
        private AudioData? _lastAudioData;
        private readonly SemaphoreSlim _dataLock = new(1, 1);
        private bool _isRecording = false;
        private DateTime _lastAudioLogTime = DateTime.MinValue;
        private readonly TimeSpan _audioLogInterval = TimeSpan.FromSeconds(1);
        private SensorWindowManager? _windowManager;
        private readonly AudioQualityAnalyzer _qualityAnalyzer = new AudioQualityAnalyzer(16000, 2048, 512);
        
        public bool IsAvailable
        {
            get
            {
#if ANDROID
                return Platform.CurrentActivity?.CheckSelfPermission(Android.Manifest.Permission.RecordAudio)
                    == Android.Content.PM.Permission.Granted;
#elif IOS
                return AVFoundation.AVCaptureDevice.GetAuthorizationStatus(AVFoundation.AVAuthorizationMediaType.Audio)
                    == AVFoundation.AVAuthorizationStatus.Authorized;
#else
                return true; // Windows or other platforms
#endif
            }
        }


        
        public bool IsRecording => _isRecording;
        
        public async Task<bool> StartAsync(int recordingDurationMs)
        {
            if (!IsAvailable)
            {
                _logger.Debug("Microphone not available or permission not granted");
                return false;
            }
            
            try
            {
                _recordingDurationMs = recordingDurationMs;
                _cts = new CancellationTokenSource();
                
                // Start continuous recording loop
                _recordingTask = RunRecordingLoopAsync(_cts.Token);
                
                // _logger.Debug($"AudioCaptureService started ({recordingDurationMs}ms intervals)");
                return true;
            }
            catch (Exception ex)
            {
                _logger.Debug($"Failed to start audio capture: {ex.Message}");
                return false;
            }
        }
        
        public async Task<AudioData?> GetLatestAudioDataAsync()
        {
            await _dataLock.WaitAsync();
            try
            {
                return _lastAudioData;
            }
            finally
            {
                _dataLock.Release();
            }
        }
        
        public async Task StopAsync()
        {
            try
            {
                _cts?.Cancel();
                
                if (_recordingTask != null)
                    await Task.WhenAny(_recordingTask, Task.Delay(2000));
                
                _isRecording = false;
                // _logger.Debug("AudioCaptureService stopped");
            }
            catch (Exception ex)
            {
                // _logger.Debug($"Error stopping audio capture: {ex.Message}");
            }
            finally
            {
                _cts?.Dispose();
                _cts = null;
            }
        }
        
        public void SetWindowManager(SensorWindowManager? manager)
        {
            _windowManager = manager;
            // _logger.Debug($"[AudioCapture] Window manager set: {manager != null}");
        }
        
        private async Task RunRecordingLoopAsync(CancellationToken ct)
        {
            // _logger.Debug("[AudioCapture] Recording loop STARTED");
            while (!ct.IsCancellationRequested)
            {
                try
                {
                    _isRecording = true;
                    var audioData = await RecordAudioSegmentAsync(_recordingDurationMs, ct);
                    
                    if (audioData != null)
                    {
                        // Store for backward compatibility
                        await _dataLock.WaitAsync(ct);
                        try
                        {
                            _lastAudioData = audioData;
                            AudioDataCaptured?.Invoke(this, audioData);
                        }
                        finally
                        {
                            _dataLock.Release();
                        }
                        
                        // Create audio window and add to queue
                        if (_windowManager != null && (audioData.FrequencyData?.HarmonicFrequencies?.Count > 0 || audioData.FrequencyData?.DominantFrequencies?.Count > 0))
                        {
                            var window = CreateAudioWindow(audioData);
                            _windowManager.AddAudioWindow(window);
                            // _logger.Debug($"[AudioCapture] Window created: {window.Data.Count} values, Quality: {window.Quality}");
                        }
                        
                        // Log throttling
                        var now = DateTime.UtcNow;
                        if (now - _lastAudioLogTime >= _audioLogInterval)
                        {
                            _lastAudioLogTime = now;
                            // _logger.Debug($"[AudioCapture] Data captured: {audioData.FrequencyData?.DominantFrequencies.Count ?? 0} freqs, {audioData.AvgDecibels:F1} dB");
                        }
                    }
                    
                    // No delay - continuous recording for next window
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    // _logger.Debug($"Error in recording loop: {ex.Message}");
                    await Task.Delay(1000, ct);
                }
            }
            
            _isRecording = false;
        }
        
        private AudioWindow CreateAudioWindow(AudioData audioData)
        {
            var window = new AudioWindow
            {
                Quality = (int)audioData.QualityScore
            };
            
            // Use HarmonicFrequencies (with proper band separation) if available, fallback to DominantFrequencies
            var frequencies = audioData.FrequencyData?.HarmonicFrequencies?.Count > 0 
                ? audioData.FrequencyData.HarmonicFrequencies 
                : audioData.FrequencyData?.DominantFrequencies;
            
            if (frequencies != null)
            {
                // Add 10 frequencies (harmonic with band separation, or dominant as fallback)
                var freqs = frequencies.Take(10);
                foreach (var freq in freqs)
                {
                    if (freq.Length >= 2)
                    {
                        window.Data.Add((int)freq[0]);                    // Frequency Hz
                        window.Data.Add((int)(freq[1] * 100));           // Amplitude dB x 100
                    }
                    else
                    {
                        window.Data.Add(0);
                        window.Data.Add(0);
                    }
                }
                
                // Pad to 20 values if less than 10 frequencies
                while (window.Data.Count < 20)
                {
                    window.Data.Add(0);
                    window.Data.Add(0);
                }
                
                // Add 10 percussive frequencies (from HPSS percussive component)
                // These represent transient sounds: tire impacts, road noise, suspension knocks
                var percussiveFreqs = audioData.FrequencyData?.PercussiveFrequencies;
                if (percussiveFreqs != null && percussiveFreqs.Count > 0)
                {
                    foreach (var freq in percussiveFreqs.Take(10))
                    {
                        if (freq.Length >= 2)
                        {
                            window.Data.Add((int)freq[0]);                    // Frequency Hz
                            window.Data.Add((int)(freq[1] * 100));           // Amplitude dB x 100
                        }
                        else
                        {
                            window.Data.Add(0);
                            window.Data.Add(-10000);
                        }
                    }
                    
                    // Pad if less than 10 percussive frequencies
                    while (window.Data.Count < 40)
                    {
                        window.Data.Add(0);
                        window.Data.Add(-10000);
                    }
                }
                else
                {
                    // No percussive data - fill with zeros
                    for (int i = 0; i < 10; i++)
                    {
                        window.Data.Add(0);
                        window.Data.Add(-10000);
                    }
                }
            }
            else
            {
                // Empty window
                for (int i = 0; i < 40; i++)
                {
                    window.Data.Add(0);
                }
            }
            
            return window;
        }
        
        private async Task<AudioData> RecordAudioSegmentAsync(int durationMs, CancellationToken ct)
        {
            // Platform-specific audio recording would go here
            // For now, return simulated data with noise analysis
            
            var samples = await SimulateAudioSamplingAsync(durationMs, ct);
            
            // Calculate decibels
            var rms = Math.Sqrt(samples.Average(s => s * s));
            var avgDb = 20 * Math.Log10(rms + 0.0001);
            var peakDb = 20 * Math.Log10(samples.Max(Math.Abs) + 0.0001);
            
            // Simple frequency analysis (simulated)
            var freqAnalysis = AnalyzeFrequency(samples);
            
            // Classify noise
            var classification = ClassifyNoise(avgDb, freqAnalysis);
            
            // Compress audio data (Base64 encoded, truncated for transmission)
            var compressedAudio = CompressAudioData(samples);
            
            // Calculate audio quality score (0-100) using professional analyzer
            var sw = System.Diagnostics.Stopwatch.StartNew();
            var qualityResult = _qualityAnalyzer.AnalyzeOneSecond(samples);
            float qualityScore = qualityResult.IsUsable ? qualityResult.Confidence * 100 : 30f;
            var qualityTime = sw.ElapsedMilliseconds;
            sw.Stop();
            
            // Log quality for debugging
            // Debug: log top 5 frequencies with amplitudes
            var top5 = freqAnalysis.DominantFrequencies?.Take(5)
                .Select(f => $"{f[0]:F0}Hz({f[1]:F0}dB)")
                .ToList() ?? new List<string>();
            // _logger.Debug($"[AUDIO] Quality: {qualityScore:F1}/100 ({qualityResult.Reason}), dB: {avgDb:F1}, Top5: {string.Join(", ", top5)}, Time: {qualityTime}ms");
            
            return new AudioData
            {
                Timestamp = DateTime.UtcNow,
                DurationMs = durationMs,
AvgDecibels = avgDb,  // Keep real dB values (-100 to 0)
                PeakDecibels = peakDb,
                AudioBase64 = compressedAudio,
                NoiseClassification = classification,
                FrequencyData = freqAnalysis,
                QualityScore = qualityScore
            };
        }
        
        private async Task<double[]> SimulateAudioSamplingAsync(int durationMs, CancellationToken ct)
        {
#if ANDROID
            return await RecordAndroidAudioAsync(durationMs, ct);
#else
            // Fallback to simulation for other platforms
            return await SimulateAudioDataAsync(durationMs, ct);
#endif
        }

#if ANDROID
        private async Task<double[]> RecordAndroidAudioAsync(int durationMs, CancellationToken ct)
        {
            const int sampleRate = 16000;  // 16kHz для поддержки частот до 8kHz
            const Android.Media.Encoding audioFormat = Android.Media.Encoding.Pcm16bit;
            const Android.Media.ChannelIn channelConfig = Android.Media.ChannelIn.Mono;
            
            int minBufferSize = Android.Media.AudioRecord.GetMinBufferSize(sampleRate, channelConfig, audioFormat);
            int bufferSize = Math.Max(minBufferSize, sampleRate * 2); // 1 second buffer
            
            int sampleCount = (durationMs * sampleRate) / 1000;
            var samples = new double[sampleCount];
            
            var audioRecord = new Android.Media.AudioRecord(
                Android.Media.AudioSource.Mic,
                sampleRate,
                channelConfig,
                audioFormat,
                bufferSize
            );
            
            try
            {
                if (audioRecord.State != Android.Media.State.Initialized)
                {
                    // _logger.Debug("[AUDIO] AudioRecord initialization failed");
                    return await SimulateAudioDataAsync(durationMs, ct);
                }
                
                audioRecord.StartRecording();
                // _logger.Debug($"[AUDIO] Started recording for {durationMs}ms");
                
                var buffer = new byte[bufferSize];
                int samplesRead = 0;
                int totalBytesRead = 0;
                int targetBytes = sampleCount * 2; // 16-bit = 2 bytes per sample
                
                while (samplesRead < sampleCount && !ct.IsCancellationRequested)
                {
                    int bytesRead = await Task.Run(() => 
                        audioRecord.Read(buffer, 0, Math.Min(buffer.Length, targetBytes - totalBytesRead)), ct);
                    
                    if (bytesRead > 0)
                    {
                        // Convert 16-bit PCM to double samples (-1.0 to 1.0)
                        for (int i = 0; i < bytesRead - 1 && samplesRead < sampleCount; i += 2)
                        {
                            short sample = (short)(buffer[i] | (buffer[i + 1] << 8));
                            samples[samplesRead++] = sample / 32768.0;
                        }
                        totalBytesRead += bytesRead;
                    }
                    else if (bytesRead < 0)
                    {
                        // _logger.Debug($"[AUDIO] Read error: {bytesRead}");
                        break;
                    }
                    
                    await Task.Delay(10, ct);
                }
                
                audioRecord.Stop();
                // _logger.Debug($"[AUDIO] Recorded {samplesRead} samples");
                
                // If we didn't get enough samples, fill with zeros
                if (samplesRead < sampleCount)
                {
                    // _logger.Debug($"[AUDIO] Warning: Only got {samplesRead}/{sampleCount} samples");
                }
                
                return samples;
            }
            catch (Exception ex)
            {
                // _logger.Debug($"[AUDIO] Recording error: {ex.Message}");
                return await SimulateAudioDataAsync(durationMs, ct);
            }
            finally
            {
                // BUG-3 FIX: Proper cleanup with StopRecording and null checks
                CleanupAudioRecord(audioRecord);
            }
        }
        
        /// <summary>
        /// BUG-3 FIX: Properly cleanup AudioRecord to prevent resource leaks
        /// </summary>
        private void CleanupAudioRecord(Android.Media.AudioRecord? audioRecord)
        {
            if (audioRecord == null) return;
            
            try
            {
                // Stop recording first before releasing
                if (audioRecord.RecordingState == Android.Media.RecordState.Recording)
                {
                    audioRecord.Stop();
                }
            }
            catch (Exception ex)
            {
                _logger.Debug($"[AUDIO] Error stopping recording: {ex.Message}");
            }
            
            try
            {
                // Release native resources
                audioRecord.Release();
            }
            catch (Exception ex)
            {
                _logger.Debug($"[AUDIO] Error releasing AudioRecord: {ex.Message}");
            }
            
            try
            {
                // Dispose managed resources
                audioRecord.Dispose();
            }
            catch (Exception ex)
            {
                _logger.Debug($"[AUDIO] Error disposing AudioRecord: {ex.Message}");
            }
        }
#endif

        private async Task<double[]> SimulateAudioDataAsync(int durationMs, CancellationToken ct)
        {
            // Fallback simulation
            const int sampleRate = 8000;
            int sampleCount = (durationMs * sampleRate) / 1000;
            var samples = new double[sampleCount];
            
            var random = new Random();
            
            await Task.Run(() =>
            {
                for (int i = 0; i < sampleCount && !ct.IsCancellationRequested; i++)
                {
                    var t = (double)i / sampleRate;
                    var signal = Math.Sin(2 * Math.PI * 440 * t) * 0.3 +
                                 Math.Sin(2 * Math.PI * 880 * t) * 0.1 +
                                 (random.NextDouble() - 0.5) * 0.1;
                    
                    samples[i] = signal;
                    
                    if (i % 1000 == 0)
                        Task.Yield();
                }
            }, ct);
            
            return samples;
        }
        
        private FrequencyAnalysis AnalyzeFrequency(double[] samples)
        {
            // Use NWaves RealFft for professional FFT analysis with HPSS separation
            // MUST match AudioRecord sample rate (16000 Hz)
            const int sampleRate = 16000;  // 16kHz to capture up to 8kHz (Nyquist)
            const int fftSize = 2048;      // Resolution: 16000/2048 = 7.8 Hz
            const int hopSize = 512;       // 75% overlap for better time resolution
            
            var analysis = new FrequencyAnalysis
            {
                DominantFrequencies = new List<double[]>(),
                HarmonicFrequencies = new List<double[]>(),
                PercussiveFrequencies = new List<double[]>()
            };
            
            // Create FFT and window
            var fft = new RealFft(fftSize);
            var window = CreateHanningWindow(fftSize);
            var nyquist = sampleRate / 2;
            
            // Process multiple overlapping frames for STFT
            var numFrames = (samples.Length - fftSize) / hopSize + 1;
            if (numFrames < 1) numFrames = 1;
            
            // Accumulate spectra across frames
            var harmonicSpectrum = new float[fftSize / 2 + 1];
            var percussiveSpectrum = new float[fftSize / 2 + 1];
            var frameSpectra = new List<float[]>();
            
            for (int frame = 0; frame < numFrames; frame++)
            {
                int pos = frame * hopSize;
                
                // Prepare frame with window
                var frameSamples = new float[fftSize];
                for (int i = 0; i < fftSize && (pos + i) < samples.Length; i++)
                    frameSamples[i] = (float)samples[pos + i] * window[i];
                
                // FFT
                var realSpectrum = new float[fftSize / 2 + 1];
                var imagSpectrum = new float[fftSize / 2 + 1];
                fft.Direct(frameSamples, realSpectrum, imagSpectrum);
                
                // Magnitude spectrum
                var magnitude = new float[fftSize / 2 + 1];
                for (int i = 0; i < magnitude.Length; i++)
                    magnitude[i] = MathF.Sqrt(realSpectrum[i] * realSpectrum[i] + imagSpectrum[i] * imagSpectrum[i]);
                
                frameSpectra.Add(magnitude);
            }
            
            // Simple HPSS: separate by time characteristics
            // Harmonic = stable across frames (horizontal on spectrogram)
            // Percussive = transient (vertical on spectrogram)
            for (int bin = 0; bin < fftSize / 2 + 1; bin++)
            {
                var binValues = frameSpectra.Select(f => f[bin]).ToArray();
                var median = CalculateMedian(binValues);
                var stdDev = CalculateStdDev(binValues);
                
                // Stable frequencies -> harmonic (low stdDev)
                // Transient frequencies -> percussive (high stdDev)
                if (stdDev < median * 0.3f)
                {
                    harmonicSpectrum[bin] = median;
                    percussiveSpectrum[bin] = median * 0.1f;
                }
                else
                {
                    harmonicSpectrum[bin] = median * 0.2f;
                    percussiveSpectrum[bin] = median;
                }
            }
            
            // Convert to frequency bins and extract top frequencies
            // Harmonic: first 5 from 0-190 Hz bands (30 Hz intervals), remaining 5 from >190 Hz
            var harmonicLowFreqs = ExtractLowFrequencyBands(harmonicSpectrum, fftSize, sampleRate, 5);
            var harmonicHighFreqs = ExtractTopFrequenciesInRange(harmonicSpectrum, fftSize, sampleRate, 5, 190, 8000);
            var harmonicFreqs = new List<double[]>();
            harmonicFreqs.AddRange(harmonicLowFreqs);
            harmonicFreqs.AddRange(harmonicHighFreqs);
            
            // Percussive: standard top 10
            var percussiveFreqs = ExtractTopFrequencies(percussiveSpectrum, fftSize, sampleRate, 10);
            var allFreqs = ExtractTopFrequencies(
                frameSpectra.SelectMany(f => f).Take(fftSize / 2 + 1).ToArray(), 
                fftSize, sampleRate, 50);
            
            analysis.HarmonicFrequencies = harmonicFreqs;
            analysis.PercussiveFrequencies = percussiveFreqs;
            analysis.DominantFrequencies = allFreqs;
            
            // Pad to 10 entries
            while (analysis.HarmonicFrequencies.Count < 10)
                analysis.HarmonicFrequencies.Add(new[] { 0.0, -100.0 });
            while (analysis.PercussiveFrequencies.Count < 10)
                analysis.PercussiveFrequencies.Add(new[] { 0.0, -100.0 });
            
            // Calculate spectral features from first frame
            var fftBins = SpectrumToFrequencyBins(frameSpectra[0], sampleRate, fftSize);
            analysis.SpectralFlatness = CalculateSpectralFlatness(fftBins);
            analysis.SpectralCentroid = CalculateSpectralCentroid(fftBins);
            analysis.ZeroCrossingRate = CalculateZeroCrossingRate(samples);
            analysis.NoiseType = analysis.SpectralFlatness < 0.3 ? "tonal" : "noise";
            
            // Energy bands
            var avgSpectrum = new float[fftSize / 2 + 1];
            for (int i = 0; i < avgSpectrum.Length; i++)
                avgSpectrum[i] = frameSpectra.Average(f => f[i]);
            
            var avgBins = SpectrumToFrequencyBins(avgSpectrum, sampleRate, fftSize);
            analysis.LowFreqEnergy = CalculateBandEnergy(avgBins, 20, 250);
            analysis.MidFreqEnergy = CalculateBandEnergy(avgBins, 250, 2000);
            analysis.HighFreqEnergy = CalculateBandEnergy(avgBins, 2000, 8000);
            
            return analysis;
        }
        
        private float[] CreateHanningWindow(int size)
        {
            var w = new float[size];
            for (int i = 0; i < size; i++)
                w[i] = 0.5f * (1 - MathF.Cos(2 * MathF.PI * i / (size - 1)));
            return w;
        }
        
        private float CalculateMedian(float[] values)
        {
            var sorted = values.OrderBy(v => v).ToArray();
            int mid = sorted.Length / 2;
            return sorted.Length % 2 == 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
        }
        
        private float CalculateStdDev(float[] values)
        {
            var avg = values.Average();
            var sumSq = values.Sum(v => (v - avg) * (v - avg));
            return MathF.Sqrt(sumSq / values.Length);
        }
        
        private List<double[]> ExtractTopFrequencies(float[] spectrum, int fftSize, int sampleRate, int count)
        {
            var freqs = new List<(double freq, double db)>();
            var nyquist = sampleRate / 2;
            
            for (int i = 1; i < spectrum.Length; i++)
            {
                var freq = i * nyquist / spectrum.Length;
                var db = 20 * Math.Log10(spectrum[i] + 1e-10);
                freqs.Add((freq, db));
            }
            
            // Take top frequencies from full spectrum
            return freqs
                .OrderByDescending(f => f.db)
                .Take(count)
                .Select(f => new[] { f.freq, f.db })
                .ToList();
        }
        
        /// <summary>
        /// Extracts top frequencies from specific low-frequency bands (0-190 Hz).
        /// Takes top 1 from each band: 0-70, 70-100, 100-130, 130-160, 160-190
        /// </summary>
        private List<double[]> ExtractLowFrequencyBands(float[] spectrum, int fftSize, int sampleRate, int count)
        {
            var freqs = new List<(double freq, double db)>();
            var nyquist = sampleRate / 2;
            
            for (int i = 1; i < spectrum.Length; i++)
            {
                var freq = i * nyquist / spectrum.Length;
                var db = 20 * Math.Log10(spectrum[i] + 1e-10);
                freqs.Add((freq, db));
            }
            
            // Define bands: first 0-70 Hz, then 30 Hz intervals 70-190 Hz
            // Return in specific order: band1 (0-70), band2 (70-100), band3 (100-130), band4 (130-160), band5 (160-190)
            // If no frequency in band, add placeholder [0, -100]
            var bands = new[] { (0, 70), (70, 100), (100, 130), (130, 160), (160, 190) };
            var result = new List<double[]>();
            
            foreach (var (minFreq, maxFreq) in bands)
            {
                var bandFreqs = freqs.Where(f => f.freq >= minFreq && f.freq < maxFreq)
                                    .OrderByDescending(f => f.db)
                                    .ToList();
                
                if (bandFreqs.Any())
                {
                    var top = bandFreqs.First();
                    result.Add(new[] { top.freq, top.db });
                }
                else
                {
                    // Add placeholder to preserve band order
                    result.Add(new[] { 0.0, -100.0 });
                }
            }
            
            return result.Take(count).ToList();
        }
        
        /// <summary>
        /// Extracts top frequencies from a specific frequency range
        /// </summary>
        private List<double[]> ExtractTopFrequenciesInRange(float[] spectrum, int fftSize, int sampleRate, int count, double minFreq, double maxFreq)
        {
            var freqs = new List<(double freq, double db)>();
            var nyquist = sampleRate / 2;
            
            for (int i = 1; i < spectrum.Length; i++)
            {
                var freq = i * nyquist / spectrum.Length;
                if (freq >= minFreq && freq < maxFreq)
                {
                    var db = 20 * Math.Log10(spectrum[i] + 1e-10);
                    freqs.Add((freq, db));
                }
            }
            
            return freqs
                .OrderByDescending(f => f.db)
                .Take(count)
                .Select(f => new[] { f.freq, f.db })
                .ToList();
        }
        
        private List<FrequencyBin> SpectrumToFrequencyBins(float[] spectrum, int sampleRate, int fftSize)
        {
            var bins = new List<FrequencyBin>();
            var nyquist = sampleRate / 2;
            
            for (int i = 1; i < spectrum.Length; i++)
            {
                var freq = i * nyquist / spectrum.Length;
                var db = 20 * Math.Log10(spectrum[i] + 1e-10);
                bins.Add(new FrequencyBin { Frequency = freq, Amplitude = spectrum[i], AmplitudeDb = db });
            }
            
            return bins;
        }
        
        private List<FrequencyBin> PerformFFT(double[] samples, int fftSize, int sampleRate)
        {
            var result = new List<FrequencyBin>();
            
            // Simple DFT implementation (for production, use optimized FFT library)
            // Process in overlapping windows
            int hopSize = fftSize / 2;
            int numWindows = (samples.Length - fftSize) / hopSize + 1;
            
            var amplitudeSums = new double[fftSize / 2];
            
            for (int w = 0; w < numWindows; w++)
            {
                int start = w * hopSize;
                
                // Apply Hamming window
                var windowed = new double[fftSize];
                for (int i = 0; i < fftSize && (start + i) < samples.Length; i++)
                {
                    double window = 0.54 - 0.46 * Math.Cos(2 * Math.PI * i / (fftSize - 1));
                    windowed[i] = samples[start + i] * window;
                }
                
                // Compute DFT for each frequency bin
                for (int k = 0; k < fftSize / 2; k++)
                {
                    double real = 0, imag = 0;
                    for (int n = 0; n < fftSize; n++)
                    {
                        double angle = -2 * Math.PI * k * n / fftSize;
                        real += windowed[n] * Math.Cos(angle);
                        imag += windowed[n] * Math.Sin(angle);
                    }
                    
                    double magnitude = Math.Sqrt(real * real + imag * imag) / fftSize;
                    amplitudeSums[k] += magnitude;
                }
            }
            
            // Average across windows and convert to frequency bins
            for (int k = 1; k < fftSize / 2; k++) // Skip DC component (k=0)
            {
                double freq = (double)k * sampleRate / fftSize;
                if (freq <= 8000) // Only up to 8kHz
                {
                    double avgMagnitude = amplitudeSums[k] / numWindows;
                    double amplitudeDb = 20 * Math.Log10(avgMagnitude + 1e-10);
                    
                    result.Add(new FrequencyBin
                    {
                        Frequency = freq,
                        Amplitude = avgMagnitude,
                        AmplitudeDb = amplitudeDb
                    });
                }
            }
            
            return result;
        }
        
        private double CalculateBandEnergy(List<FrequencyBin> fft, double lowFreq, double highFreq)
        {
            var bandBins = fft.Where(f => f.Frequency >= lowFreq && f.Frequency <= highFreq);
            if (!bandBins.Any()) return 0;
            
            return bandBins.Average(f => f.Amplitude);
        }
        
        private double CalculateSpectralCentroid(List<FrequencyBin> fft)
        {
            double sumWeightedFreq = fft.Sum(f => f.Frequency * f.Amplitude);
            double sumAmplitude = fft.Sum(f => f.Amplitude);
            
            return sumAmplitude > 0 ? sumWeightedFreq / sumAmplitude : 0;
        }
        
        private double CalculateSpectralFlatness(List<FrequencyBin> fft)
        {
            if (!fft.Any()) return 0;
            
            double geometricMean = Math.Exp(fft.Average(f => Math.Log(f.Amplitude + 1e-10)));
            double arithmeticMean = fft.Average(f => f.Amplitude);
            
            return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
        }
        
        private double CalculateZeroCrossingRate(double[] samples)
        {
            int crossings = 0;
            for (int i = 1; i < samples.Length; i++)
            {
                if ((samples[i] >= 0) != (samples[i - 1] >= 0))
                    crossings++;
            }
            
            return (double)crossings / samples.Length;
        }
        
        private class FrequencyBin
        {
            public double Frequency { get; set; }
            public double Amplitude { get; set; }
            public double AmplitudeDb { get; set; }
        }
        
        private string ClassifyNoise(double avgDb, FrequencyAnalysis freq)
        {
            if (avgDb < 30)
                return "Silent";
            if (avgDb < 50)
                return "Quiet";
            if (avgDb < 70)
                return "Normal";
            if (avgDb < 85)
                return "Loud";
            if (freq.LowFreqEnergy > 0.5)
                return "Engine Noise";
            if (freq.MidFreqEnergy > 0.5)
                return "Wind Noise";
            return "Very Loud";
        }
        
        private string CompressAudioData(double[] samples)
        {
            try
            {
                // Subsample and quantize for transmission
                // Take every 16th sample and convert to 8-bit
                const int subsampleFactor = 16;
                var subsampleCount = Math.Min(samples.Length / subsampleFactor, 500); // Max 500 bytes
                var compressed = new byte[subsampleCount];
                
                for (int i = 0; i < subsampleCount; i++)
                {
                    var sample = samples[i * subsampleFactor];
                    // Convert to 8-bit (0-255, 128 is 0)
                    compressed[i] = (byte)Math.Clamp((sample + 1.0) * 127.5, 0, 255);
                }
                
                return Convert.ToBase64String(compressed);
            }
            catch
            {
                return "";
            }
        }
        
        /// <summary>
        /// Calculates audio quality score (0-100) based on spectral analysis
        /// 100 = perfect vehicle sounds, 0 = contaminated by music/speech
        /// 
        /// Music detection criteria:
        /// - High spectral flatness (>0.3) = music/white noise
        /// - Energy concentrated in 1-4 kHz band (>40%) = speech/music
        /// - Too many harmonic peaks (>15) = music
        /// - Low zero-crossing rate = tonal signal (music)
        /// </summary>
        private float CalculateAudioQuality(double[] samples)
        {
            try
            {
                if (samples.Length < 2048) return 85f; // Quiet room default
                
                // 1. Calculate RMS (volume) - PRIMARY METRIC
                double rms = Math.Sqrt(samples.Select(s => s * s).Average());
                float rmsDb = (float)(20 * Math.Log10(rms + 0.0001));
                
                // SILENCE DETECTION: Very quiet environment (no music/interference)
                // RMS < -55dB = excellent for recording (no interference)
                // RMS -55 to -40dB = good (some ambient noise)
                // RMS > -35dB = suspicious (likely music/speech)
                float silenceScore;
                if (rmsDb < -55f)
                    silenceScore = 98f; // Excellent silence (perfect for recording)
                else if (rmsDb < -48f)
                    silenceScore = 92f; // Very good silence
                else if (rmsDb < -40f)
                    silenceScore = 85f; // Good silence  
                else if (rmsDb < -30f)
                    silenceScore = 70f; // Moderate noise
                else
                    silenceScore = 35f; // Likely interference (music/speech)
                
                // 2. Calculate spectral flatness (music detection)
                // Music has flat spectrum, silence/tonal has peaks
                double[] magnitudes = samples.Select(Math.Abs).ToArray();
                double geoMean = Math.Exp(magnitudes.Where(m => m > 0.0001).Select(m => Math.Log(m)).Average());
                double arithMean = magnitudes.Average();
                double flatness = arithMean > 0 ? geoMean / arithMean : 0;
                
                // Flatness > 0.5 indicates music/white noise
                float flatnessScore = flatness > 0.5f ? 30f : flatness < 0.2f ? 90f : (float)(90 - flatness * 120);
                
                // 3. Dynamic range (music has high dynamic range)
                double maxVal = magnitudes.Max();
                double minVal = magnitudes.Where(m => m > 0.0001).DefaultIfEmpty(0.0001).Min();
                double dynamicRange = maxVal > 0 ? 20 * Math.Log10(maxVal / minVal) : 0;
                
                // Very high dynamic range (>50dB) suggests music
                float rangeScore = dynamicRange > 50 ? 40f : dynamicRange < 20 ? 85f : (float)(85 - (dynamicRange - 20));
                
                // 4. Peak count in time domain (music has regular peaks)
                int regularPeaks = 0;
                for (int i = 10; i < samples.Length - 10; i++)
                {
                    if (samples[i] > 0.3 && samples[i] > samples[i-5] && samples[i] > samples[i+5])
                        regularPeaks++;
                }
                // Too many regular peaks = music
                float peakScore = regularPeaks > 100 ? 35f : regularPeaks < 20 ? 90f : 70f;
                
                // Weighted scoring emphasizing silence detection
                // Silence (low RMS) is the best indicator of no interference
                float totalScore = silenceScore * 0.70f +      // 70% weight on volume/silence (primary)
                                  flatnessScore * 0.15f +      // 15% on spectral flatness
                                  rangeScore * 0.10f +          // 10% on dynamic range
                                  peakScore * 0.05f;            // 5% on peak regularity
                
                return Math.Max(0, Math.Min(100, totalScore));
            }
            catch (Exception ex)
            {
                // _logger.Debug($"[AUDIO] Quality calculation error: {ex.Message}");
                return 85f; // Assume good quality (quiet room) on error
            }
        }
    }
}
