using System.Text.Json.Serialization;

namespace llcar.Models
{
    public class VehicleModel
    {
        public string Name { get; set; } = string.Empty;
        public string ModelYear { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string Trim { get; set; } = string.Empty;
        public string EngineType { get; set; } = string.Empty;
        public int Year { get; set; }
        public double FuelEfficiency { get; set; }
        public string VehicleID { get; set; } = string.Empty;
        
        [JsonIgnore]
        public List<ComponentModel> Components { get; set; } = [];
        
        [JsonIgnore]
        public PerformanceMetrics Performance { get; set; } = new();
        
        public override string ToString() => $"{Make} {Model} {Year}";
    }
}
