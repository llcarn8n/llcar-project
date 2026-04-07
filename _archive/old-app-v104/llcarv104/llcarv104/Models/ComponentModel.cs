using System.Text.Json.Serialization;

namespace llcar.Models
{
    public class ComponentModel
    {
        public int ID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string PartNumber { get; set; } = string.Empty;
        public double HealthScore { get; set; }
        public string Status { get; set; } = string.Empty;
        
        [JsonIgnore]
        public List<MaintenanceInfo> MaintenanceHistory { get; set; } = [];
        
        public override string ToString() => $"{Name} ({Status})";
    }
}
