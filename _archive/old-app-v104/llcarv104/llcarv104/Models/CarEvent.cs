namespace llcar.Models
{
    public class CarEvent
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = "🔧";
        public DateTime Timestamp { get; set; } = DateTime.Now;
        public string Category { get; set; } = string.Empty;
    }
}
