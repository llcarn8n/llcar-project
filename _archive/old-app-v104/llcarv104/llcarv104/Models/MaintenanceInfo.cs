using System.Text.Json.Serialization;

namespace llcar.Models
{
    public class MaintenanceInfo
    {
        public int ID { get; set; }
        public string ComponentName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string TypicalIssues { get; set; } = string.Empty;
        public string MaintenanceProcedure { get; set; } = string.Empty;
        public DateTime LastMaintenance { get; set; }
        public double Cost { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PartNumber { get; set; } = string.Empty;
        
        public bool IsUrgent => Status.ToLower() == "urgent";
        
        public override string ToString() => $"{ComponentName} - {Status}";
    }
}
