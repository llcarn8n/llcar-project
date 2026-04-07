using System.Text.Json.Serialization;

namespace llcar.Models
{
    /// <summary>
    /// Comprehensive data packet for background collection
    /// </summary>
    public class BackgroundDataPacket
    {
        /// <summary>Unique packet ID</summary>
        public Guid Id { get; set; } = Guid.NewGuid();
        
        /// <summary>Timestamp when data was collected</summary>
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        /// <summary>OBD2 PID data</summary>
        public List<PidReading> PidReadings { get; set; } = new();
        
        /// <summary>Accelerometer data (1 second compressed)</summary>
        public AccelerometerCompressedData AccelerometerData { get; set; } = new();
        
        /// <summary>Audio data (if recording enabled)</summary>
        public AudioData? AudioData { get; set; }
        
        /// <summary>Location data (if available)</summary>
        public LocationData? Location { get; set; }
        
        /// <summary>Device/Battery info</summary>
        public DeviceStatus DeviceStatus { get; set; } = new();
        
        /// <summary>Diagnostic Trouble Codes (optional, max 10)</summary>
        public List<DiagnosticTroubleCode>? DtcCodes { get; set; }
    }
    
    /// <summary>
    /// Diagnostic Trouble Code (DTC) from vehicle ECU
    /// </summary>
    public class DiagnosticTroubleCode
    {
        /// <summary>DTC code (e.g., "P0301", "B0023", "C0045", "U0100")</summary>
        public string Code { get; set; } = "";
        
        /// <summary>When the DTC was detected/read</summary>
        public DateTime Timestamp { get; set; }
        
        /// <summary>DTC category (P=Powertrain, B=Body, C=Chassis, U=Network)</summary>
        public char Category => string.IsNullOrEmpty(Code) ? ' ' : Code[0];
        
        /// <summary>True if this is a pending code (not yet confirmed)</summary>
        public bool IsPending { get; set; }
        
        /// <summary>True if this is a permanent code (cannot be cleared)</summary>
        public bool IsPermanent { get; set; }
    }
    
    /// <summary>
    /// Single PID reading
    /// </summary>
    public class PidReading
    {
        public string Pid { get; set; } = "";
        public string Mnemonic { get; set; } = "";
        public string Label { get; set; } = "";
        public double RawValue { get; set; }
        public double ConvertedValue { get; set; }
        public string Unit { get; set; } = "";
        public DateTime Timestamp { get; set; }
        /// <summary>ECU address that responded (e.g., "7EB", "7EC")</summary>
        public string EcuAddress { get; set; } = "";
    }
    
    /// <summary>
    /// Compressed accelerometer data for 1 second interval
    /// Contains vibration frequencies and peak values for each axis
    /// </summary>
    public class AccelerometerCompressedData
    {
        /// <summary>Start timestamp</summary>
        public DateTime StartTime { get; set; }
        
        /// <summary>End timestamp</summary>
        public DateTime EndTime { get; set; }
        
        /// <summary>Number of samples in this interval</summary>
        public int SampleCount { get; set; }
        
        /// <summary>Average X acceleration (m/s²)</summary>
        public double AvgX { get; set; }
        
        /// <summary>Average Y acceleration (m/s²)</summary>
        public double AvgY { get; set; }
        
        /// <summary>Average Z acceleration (m/s²)</summary>
        public double AvgZ { get; set; }
        
        /// <summary>Maximum X acceleration (m/s²)</summary>
        public double MaxX { get; set; }
        
        /// <summary>Maximum Y acceleration (m/s²)</summary>
        public double MaxY { get; set; }
        
        /// <summary>Maximum Z acceleration (m/s²)</summary>
        public double MaxZ { get; set; }
        
        /// <summary>Standard deviation X (vibration intensity)</summary>
        public double StdDevX { get; set; }
        
        /// <summary>Standard deviation Y (vibration intensity)</summary>
        public double StdDevY { get; set; }
        
        /// <summary>Standard deviation Z (vibration intensity)</summary>
        public double StdDevZ { get; set; }
        
        /// <summary>Vibration classification</summary>
        public VibrationLevel VibrationLevel { get; set; }
        
        /// <summary>Base64 encoded compressed raw samples (optional)</summary>
        public string? CompressedSamples { get; set; }
        
        /// <summary>
        /// Top 10 dominant vibration frequencies for X axis (longitudinal)
        /// Format: [frequency_hz, amplitude_x1000]
        /// </summary>
        public List<VibrationFrequency> XFrequencies { get; set; } = new();
        
        /// <summary>
        /// Top 10 dominant vibration frequencies for Y axis (lateral)
        /// Format: [frequency_hz, amplitude_x1000]
        /// </summary>
        public List<VibrationFrequency> YFrequencies { get; set; } = new();
        
        /// <summary>
        /// Top 10 dominant vibration frequencies for Z axis (vertical)
        /// Format: [frequency_hz, amplitude_x1000]
        /// </summary>
        public List<VibrationFrequency> ZFrequencies { get; set; } = new();
        
        /// <summary>
        /// Top 3 peak values for X axis in chronological order
        /// Format: [offset_ms, value_x1000]
        /// </summary>
        public List<AxisPeak> XPeaks { get; set; } = new();
        
        /// <summary>
        /// Top 3 peak values for Y axis in chronological order
        /// Format: [offset_ms, value_x1000]
        /// </summary>
        public List<AxisPeak> YPeaks { get; set; } = new();
        
        /// <summary>
        /// Top 3 peak values for Z axis in chronological order
        /// Format: [offset_ms, value_x1000]
        /// </summary>
        public List<AxisPeak> ZPeaks { get; set; } = new();
    }
    
    /// <summary>
    /// Vibration frequency with amplitude
    /// </summary>
    public class VibrationFrequency
    {
        /// <summary>Frequency in Hz</summary>
        public double Frequency { get; set; }
        
        /// <summary>Amplitude (m/s²)</summary>
        public double Amplitude { get; set; }
    }
    
    /// <summary>
    /// Single axis peak value
    /// </summary>
    public class AxisPeak
    {
        /// <summary>Offset from interval start in milliseconds</summary>
        public int OffsetMs { get; set; }
        
        /// <summary>Peak value (m/s²) - signed</summary>
        public double Value { get; set; }
    }
    
    public enum VibrationLevel
    {
        None = 0,
        Low = 1,
        Medium = 2,
        High = 3,
        Extreme = 4
    }
    
    /// <summary>
    /// Audio data from microphone
    /// </summary>
    public class AudioData
    {
        /// <summary>Timestamp</summary>
        public DateTime Timestamp { get; set; }
        
        /// <summary>Duration in milliseconds</summary>
        public int DurationMs { get; set; }
        
        /// <summary>Average decibel level</summary>
        public double AvgDecibels { get; set; }
        
        /// <summary>Peak decibel level</summary>
        public double PeakDecibels { get; set; }
        
        /// <summary>Base64 encoded audio data (compressed)</summary>
        public string? AudioBase64 { get; set; }
        
        /// <summary>Noise classification</summary>
        public string NoiseClassification { get; set; } = "";
        
        /// <summary>Frequency analysis (simplified)</summary>
        public FrequencyAnalysis? FrequencyData { get; set; }
        
        /// <summary>
        /// Audio quality score for this 1-second window (0-100)
        /// 100 = perfect vehicle sounds, 0 = heavily contaminated by music/speech
        /// </summary>
        public float QualityScore { get; set; } = 50;
    }
    
    public class FrequencyAnalysis
    {
        public double LowFreqEnergy { get; set; }      // 20-250 Hz
        public double MidFreqEnergy { get; set; }      // 250-2000 Hz
        public double HighFreqEnergy { get; set; }     // 2000-8000 Hz
        
        /// <summary>
        /// Top 10 dominant frequencies with amplitudes (legacy, backward compatibility)
        /// Format: [frequency_hz, amplitude_db]
        /// </summary>
        public List<double[]> DominantFrequencies { get; set; } = new();
        
        /// <summary>
        /// Top 10 percussive/transient frequencies (удары, стуки, шины)
        /// Stored in peak_X fields in database
        /// Format: [frequency_hz, amplitude_db]
        /// </summary>
        public List<double[]> PercussiveFrequencies { get; set; } = new();
        
        /// <summary>
        /// Top 10 harmonic frequencies (двигатель, свист, гармоники)
        /// Stored in freq_X fields in database
        /// Format: [frequency_hz, amplitude_db]
        /// </summary>
        public List<double[]> HarmonicFrequencies { get; set; } = new();
        
        /// <summary>
        /// Spectral centroid - "brightness" of sound
        /// </summary>
        public double SpectralCentroid { get; set; }
        
        /// <summary>
        /// Spectral flatness - 0=tonal(music/voice), 1=noisy
        /// </summary>
        public double SpectralFlatness { get; set; }
        
        /// <summary>
        /// Zero crossing rate - higher for noisy sounds
        /// </summary>
        public double ZeroCrossingRate { get; set; }
        
        /// <summary>
        /// Estimated noise type classification
        /// </summary>
        public string NoiseType { get; set; } = "unknown";
    }
    
    /// <summary>
    /// Audio filtering settings for noise reduction
    /// </summary>
    public class AudioFilterSettings
    {
        /// <summary>
        /// Enable voice/music suppression (80-8000 Hz band-stop)
        /// </summary>
        public bool SuppressVoiceAndMusic { get; set; } = false;
        
        /// <summary>
        /// Voice frequency range to suppress (Hz)
        /// </summary>
        public int VoiceLowCutoff { get; set; } = 85;    // Male voice starts ~85Hz
        public int VoiceHighCutoff { get; set; } = 255;   // Female voice ends ~255Hz
        
        /// <summary>
        /// Music frequency range to suppress (Hz)
        /// </summary>
        public int MusicLowCutoff { get; set; } = 250;    // Music fundamentals
        public int MusicHighCutoff { get; set; } = 4000;  // Music harmonics
        
        /// <summary>
        /// Keep only mechanical/road noise frequencies
        /// </summary>
        public bool KeepOnlyMechanicalNoise { get; set; } = true;
        
        /// <summary>
        /// Mechanical noise frequency bands to keep (Hz)
        /// </summary>
        public int[] MechanicalFreqBands { get; set; } = new[] 
        { 
            20, 50,      // Road noise, tire rumble
            100, 200,    // Engine low frequencies
            500, 1000,   // Mechanical vibrations
            2000, 4000   // High frequency squeaks/rattles
        };
        
        /// <summary>
        /// Minimum amplitude threshold (filter out quiet sounds)
        /// </summary>
        public double MinAmplitudeDb { get; set; } = -60;
        
        /// <summary>
        /// Spectral flatness threshold (0.0-1.0)
        /// Below this = tonal (music/voice), Above = noise (keep)
        /// </summary>
        public double SpectralFlatnessThreshold { get; set; } = 0.3;
    }
    
    /// <summary>
    /// Location/GPS data
    /// </summary>
    public class LocationData
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double? Altitude { get; set; }
        public double? Speed { get; set; }  // km/h
        public double? Heading { get; set; }
        public double? Accuracy { get; set; }
    }
    
    /// <summary>
    /// Device status information - simplified (battery only)
    /// </summary>
    public class DeviceStatus
    {
        /// <summary>Battery level 0-100%</summary>
        [JsonPropertyName("bat")]
        public double BatteryLevel { get; set; }
        
        /// <summary>Is device charging</summary>
        [JsonPropertyName("chg")]
        public bool IsCharging { get; set; }
    }
    
    /// <summary>
    /// Settings for background service
    /// </summary>
    public class BackgroundServiceSettings
    {
        /// <summary>Server URL for data upload</summary>
        public string ServerUrl { get; set; } = "http://device.llcar.ru";
        
        /// <summary>Enable/disable sound recording</summary>
        public bool EnableSoundRecording { get; set; } = false;
        
        /// <summary>Sound recording duration in milliseconds (default 1000ms)</summary>
        public int SoundRecordingDurationMs { get; set; } = 1000;
        
        /// <summary>Accelerometer sampling rate in Hz</summary>
        public int AccelerometerSampleRate { get; set; } = 50;
        
        /// <summary>OBD2 query interval in milliseconds</summary>
        public int Obd2QueryIntervalMs { get; set; } = 100;
        
        /// <summary>Data upload interval in seconds</summary>
        public int UploadIntervalSeconds { get; set; } = 3;
        
        /// <summary>Client hash (VIN + mobile)</summary>
        public string ClientHash { get; set; } = "";
        
        /// <summary>Mobile phone number</summary>
        public string MobileNumber { get; set; } = "";
        
        /// <summary>Email address</summary>
        public string Email { get; set; } = "";
        
        /// <summary>Vehicle VIN</summary>
        public string Vin { get; set; } = "";
        
        /// <summary>Enable GPS location tracking</summary>
        public bool EnableLocationTracking { get; set; } = true;
        
        /// <summary>Batch size for server uploads</summary>
        public int UploadBatchSize { get; set; } = 100;
        
        /// <summary>Maximum local storage size in MB</summary>
        public int MaxLocalStorageMb { get; set; } = 100;
        
        /// <summary>Enable compression for data upload</summary>
        public bool EnableCompression { get; set; } = true;
        
        /// <summary>Selected vehicle brand name</summary>
        public string SelectedBrandName { get; set; } = "";
        
        /// <summary>Selected vehicle model name</summary>
        public string SelectedModelName { get; set; } = "";
        
        /// <summary>Selected vehicle year</summary>
        public int SelectedYear { get; set; }
        
        /// <summary>Selected OBD2 Bluetooth adapter name</summary>
        public string SelectedAdapter { get; set; } = "";
    }
}
