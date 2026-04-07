using System.Text.Json.Serialization;

namespace llcar.Models
{
    public class SensorData
    {
        public DateTime Timestamp { get; set; }
        
        public OBD2Data OBD2 { get; set; } = new();
        public AccelerometerData Accelerometer { get; set; } = new();
        public MicrophoneData Microphone { get; set; } = new();
        
        public override string ToString() => $"{Timestamp:yyyy-MM-dd HH:mm:ss}";
    }
    
    public class OBD2Data
    {
        public bool EngineStatus { get; set; }
        public double Speed { get; set; }
        public double FuelLevel { get; set; }
        public double RPM { get; set; }
        public double EngineTemperature { get; set; }
        public double ThrottlePosition { get; set; }
        public string CheckEngineLight { get; set; } = string.Empty;
        public double FuelEfficiency { get; set; }
        public string? RawResponse { get; set; }
    }
    
    public class AccelerometerData
    {
        public double X { get; set; }
        public double Y { get; set; }
        public double Z { get; set; }
        public double Magnitude => Math.Sqrt(X * X + Y * Y + Z * Z);
        public double VibrationLevel => Magnitude * 10;
    }
    
    public class MicrophoneData
    {
        public double VolumeLevel { get; set; }
        public string NoiseClassification { get; set; } = string.Empty;
        public double Decibels { get; set; }
    }

    /// <summary>
    /// Represents a server notice/message
    /// </summary>
    public class ServerNotice
    {
        public string Title { get; set; } = "";
        public string Message { get; set; } = "";
        public DateTime Timestamp { get; set; }
        public string Type { get; set; } = "Info"; // Info, Warning, Error, Success

        public ServerNotice()
        {
            Timestamp = DateTime.Now;
        }

        public ServerNotice(string title, string message, string type = "Info")
        {
            Title = title;
            Message = message;
            Type = type;
            Timestamp = DateTime.Now;
        }
    }
}
