namespace llcar.Models
{
    /// <summary>
    /// Vehicle data point for database storage
    /// Supports OBD2 PIDs, Audio, and Accelerometer data
    /// </summary>
    public class VehicleDataPoint
    {
        /// <summary>Unique ID</summary>
        public long Id { get; set; }
        
        /// <summary>Timestamp when data was collected (UTC)</summary>
        public DateTime Timestamp { get; set; }
        
        /// <summary>Data type: "obd2", "audio", "accel"</summary>
        public string DataType { get; set; } = "";
        
        /// <summary>PID or parameter name (e.g., "0C" for RPM, "avg_db" for audio)</summary>
        public string Parameter { get; set; } = "";
        
        /// <summary>Numeric value</summary>
        public double Value { get; set; }
        
        /// <summary>Unit of measurement</summary>
        public string? Unit { get; set; }
        
        /// <summary>JSON encoded additional data (frequencies, peaks, etc.)</summary>
        public string? ExtendedData { get; set; }
        
        /// <summary>Quality flag (0=bad, 1=good)</summary>
        public int Quality { get; set; } = 1;
        
        /// <summary>ECU address that provided this data (e.g., "7EB", "7EC")</summary>
        public string? EcuAddress { get; set; }
    }
    
    /// <summary>
    /// Audio frequency data for storage
    /// </summary>
    public class AudioFrequencyData
    {
        /// <summary>Dominant frequencies [freq_hz, amplitude_db]</summary>
        public List<double[]> DominantFrequencies { get; set; } = new();
        
        /// <summary>Low frequency energy (20-250 Hz)</summary>
        public double LowFreqEnergy { get; set; }
        
        /// <summary>Mid frequency energy (250-2000 Hz)</summary>
        public double MidFreqEnergy { get; set; }
        
        /// <summary>High frequency energy (2000-8000 Hz)</summary>
        public double HighFreqEnergy { get; set; }
        
        /// <summary>Spectral centroid</summary>
        public double SpectralCentroid { get; set; }
        
        /// <summary>Noise type classification</summary>
        public string NoiseType { get; set; } = "";
    }
    
    /// <summary>
    /// Accelerometer frequency data for storage
    /// </summary>
    public class AccelFrequencyData
    {
        /// <summary>X axis frequencies</summary>
        public List<FrequencyAmplitude> XFrequencies { get; set; } = new();
        
        /// <summary>Y axis frequencies</summary>
        public List<FrequencyAmplitude> YFrequencies { get; set; } = new();
        
        /// <summary>Z axis frequencies</summary>
        public List<FrequencyAmplitude> ZFrequencies { get; set; } = new();
        
        /// <summary>X axis peaks</summary>
        public List<PeakData> XPeaks { get; set; } = new();
        
        /// <summary>Y axis peaks</summary>
        public List<PeakData> YPeaks { get; set; } = new();
        
        /// <summary>Z axis peaks</summary>
        public List<PeakData> ZPeaks { get; set; } = new();
    }
    
    /// <summary>
    /// Single frequency with amplitude
    /// </summary>
    public class FrequencyAmplitude
    {
        /// <summary>Frequency in Hz</summary>
        public double Frequency { get; set; }
        
        /// <summary>Amplitude</summary>
        public double Amplitude { get; set; }
    }
    
    /// <summary>
    /// Peak data with timestamp offset
    /// </summary>
    public class PeakData
    {
        /// <summary>Offset from start in milliseconds</summary>
        public int OffsetMs { get; set; }
        
        /// <summary>Peak value</summary>
        public double Value { get; set; }
    }
}
