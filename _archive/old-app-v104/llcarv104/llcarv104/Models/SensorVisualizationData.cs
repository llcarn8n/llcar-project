namespace llcar.Models
{
    /// <summary>
    /// Данные для визуализации датчиков в UI панелях
    /// </summary>
    public class SensorVisualizationData
    {
        // Accelerometer data
        public double AccelX { get; set; }
        public double AccelY { get; set; }
        public double AccelZ { get; set; }
        public double AccelMax { get; set; }
        
        // Audio data
        public double AudioAvgDb { get; set; }
        public double AudioPeakDb { get; set; }
        public double? EngineFreq { get; set; }
        public double? WheelFreq { get; set; }
        
        // Classification
        public string NoiseType { get; set; } = "silence";
        
        // Localization
        public string Language { get; set; } = "ru";
    }
}
