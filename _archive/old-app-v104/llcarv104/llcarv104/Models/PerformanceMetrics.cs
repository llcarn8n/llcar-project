using System.Text.Json.Serialization;

namespace llcar.Models
{
    public class PerformanceMetrics
    {
        public double GasEfficiency { get; set; }
        public double BrakePerformance { get; set; }
        public double SteeringResponsiveness { get; set; }
        public double NoiseLevels { get; set; }
        public double VehicleComfort { get; set; }
        
        public double AverageRating => (GasEfficiency + BrakePerformance + SteeringResponsiveness + NoiseLevels + VehicleComfort) / 5;
        
        public bool IsAboveAverage => AverageRating >= 70;
        
        public override string ToString() => $"{AverageRating:F1}/100";
    }
}
