using System;
using System.Collections.Generic;
using System.Linq;
using NWaves.Signals;
using NWaves.Transforms;

namespace llcar.Services
{
    public class AudioQualityAnalyzer
    {
        private readonly int _sr, _fftSize, _hopSize;
        private readonly RealFft _fft;
        private readonly float[] _spectrum, _window;
        private readonly Queue<float> _history = new(10);
        
        public AudioQualityAnalyzer(int sr = 16000, int fftSize = 2048, int hopSize = 512)
        {
            _sr = sr; _fftSize = fftSize; _hopSize = hopSize;
            _fft = new RealFft(fftSize);
            _spectrum = new float[fftSize / 2 + 1];
            _window = CreateHanning(fftSize);
        }

        public AudioQualityResult AnalyzeOneSecond(double[] samples)
        {
            var results = new List<AudioQualityResult>();
            for (int pos = 0; pos < samples.Length - _fftSize; pos += _hopSize)
            {
                var frame = samples.Skip(pos).Take(_fftSize).Select(s => (float)s).ToArray();
                results.Add(AnalyzeFrame(frame));
            }
            
            if (!results.Any()) return new AudioQualityResult { IsUsable = false };
            
            var usableRatio = results.Count(r => r.IsUsable) / (float)results.Count;
            return new AudioQualityResult
            {
                IsUsable = usableRatio > 0.7f,
                Confidence = usableRatio,
                SpectralFlatness = Median(results.Select(r => r.SpectralFlatness)),
                DynamicRange = Median(results.Select(r => r.DynamicRange)),
                HarmonicComplexity = Median(results.Select(r => r.HarmonicComplexity)),
                EnergyRatio = Median(results.Select(r => r.EnergyRatio)),
                DominantFrequency = Median(results.Select(r => r.DominantFrequency)),
                Reason = usableRatio > 0.7f ? $"OK ({results.Count(r=>r.IsUsable)}/{results.Count})" : $"BAD ({results.Count(r=>r.IsUsable)}/{results.Count})"
            };
        }

        private AudioQualityResult AnalyzeFrame(float[] frame)
        {
            for (int i = 0; i < frame.Length; i++) frame[i] *= _window[i];
            
            var realSpectrum = new float[_fftSize / 2 + 1];
            var imagSpectrum = new float[_fftSize / 2 + 1];
            _fft.Direct(frame, realSpectrum, imagSpectrum);
            
            for (int i = 0; i < _spectrum.Length; i++)
                _spectrum[i] = MathF.Sqrt(realSpectrum[i] * realSpectrum[i] + imagSpectrum[i] * imagSpectrum[i]);
            
            var flatness = CalcFlatness();
            var dynamic = CalcDynamicRange();
            var complexity = CalcComplexity();
            var energyRatio = CalcEnergyRatio();
            
            var score = (flatness < 0.35f ? 1 : 0) + (dynamic < 18f ? 1 : 0) + 
                       (complexity < 4f ? 1 : 0) + (energyRatio < 0.35f ? 1 : 0);
            
            var result = new AudioQualityResult
            {
                IsUsable = score >= 3, 
                SpectralFlatness = flatness, 
                DynamicRange = dynamic,
                HarmonicComplexity = complexity, 
                EnergyRatio = energyRatio,
                DominantFrequency = FindDominantFreq()
            };
            
            // Debug metrics - commented out to reduce log spam
            // Log.Debug($"[AUDIO_METRICS] flat:{flatness:F2} dyn:{dynamic:F1}dB peaks:{complexity:F0} energy:{energyRatio:F2} score:{score}/4 usable:{result.IsUsable}");
            
            return result;
        }

        private float CalcFlatness()
        {
            var valid = _spectrum.Where(m => m > 1e-5f).ToArray();
            if (valid.Length < 10) return 0;
            var geo = Math.Exp(valid.Select(m => Math.Log(m)).Sum() / valid.Length);
            return (float)(geo / (valid.Average() + 1e-4f));
        }

        private float CalcDynamicRange()
        {
            // Use percentile-based calculation to avoid extreme values in silence
            var sorted = _spectrum.Where(m => m > 1e-6f).OrderBy(m => m).ToArray();
            if (sorted.Length < 10) return 0;
            
            // 95th percentile / 5th percentile
            var p95 = sorted[(int)(sorted.Length * 0.95)];
            var p5 = sorted[(int)(sorted.Length * 0.05)];
            
            return (float)(20 * Math.Log10(p95 / (p5 + 1e-10)));
        }

        private float CalcComplexity()
        {
            // Higher threshold to filter noise peaks
            var max = _spectrum.Max();
            var thresh = Math.Max(_spectrum.Average() * 4, max * 0.1f);
            int peaks = 0;
            for (int i = 2; i < _spectrum.Length - 2; i++)
                if (_spectrum[i] > thresh && _spectrum[i] > _spectrum[i-1] && _spectrum[i] > _spectrum[i+1] &&
                    _spectrum[i] > _spectrum[i-2] && _spectrum[i] > _spectrum[i+2]) peaks++;
            return peaks;
        }

        private float CalcEnergyRatio()
        {
            var nyq = _sr / 2;
            var low = Math.Clamp((int)(1000 * _spectrum.Length / nyq), 0, _spectrum.Length - 1);
            var high = Math.Clamp((int)(4000 * _spectrum.Length / nyq), 0, _spectrum.Length - 1);
            var musicE = _spectrum.Skip(low).Take(high - low + 1).Select(m => m * m).Sum();
            var totalE = _spectrum.Select(m => m * m).Sum();
            return totalE > 0 ? (float)(musicE / totalE) : 0;
        }

        private float FindDominantFreq()
        {
            var idx = Array.IndexOf(_spectrum, _spectrum.Max());
            return idx * (_sr / 2) / _spectrum.Length;
        }

        private float[] CreateHanning(int size)
        {
            var w = new float[size];
            for (int i = 0; i < size; i++) w[i] = 0.5f * (1 - MathF.Cos(2 * MathF.PI * i / (size - 1)));
            return w;
        }

        private float Median(IEnumerable<float> vals)
        {
            var s = vals.OrderBy(x => x).ToList();
            return s.Count % 2 == 0 ? (s[s.Count/2-1] + s[s.Count/2]) / 2 : s[s.Count/2];
        }

        public void Reset() => _history.Clear();
    }

    public class AudioQualityResult
    {
        public bool IsUsable { get; set; }
        public float Confidence { get; set; }
        public float SpectralFlatness { get; set; }
        public float DynamicRange { get; set; }
        public float HarmonicComplexity { get; set; }
        public float EnergyRatio { get; set; }
        public float DominantFrequency { get; set; }
        public string Reason { get; set; } = "";
        
        public override string ToString() => 
            $"{(IsUsable ? "✓" : "✗")} {Reason} (flat:{SpectralFlatness:F2}, peaks:{HarmonicComplexity:F0}, dom:{DominantFrequency:F0}Hz)";
    }
}
