namespace llcar.Models
{
    public enum CheckStatusType
    {
        Normal,
        Warning,
        Critical,
        Unknown
    }

    public class CheckStatusItem
    {
        public string Name { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public CheckStatusType Status { get; set; }
        public string StatusText => Status switch
        {
            CheckStatusType.Normal => "✓ Норма",
            CheckStatusType.Warning => "⚠ Внимание",
            CheckStatusType.Critical => "✕ Критично",
            CheckStatusType.Unknown => "? Неизвестно",
            _ => string.Empty
        };
        public string StatusColor => Status switch
        {
            CheckStatusType.Normal => "#34C759",
            CheckStatusType.Warning => "#FF9500",
            CheckStatusType.Critical => "#FF3B30",
            CheckStatusType.Unknown => "#8E8E93",
            _ => "#8E8E93"
        };
        public bool HasValue => !string.IsNullOrEmpty(Value);
    }

    public class CheckCategory
    {
        public string Title { get; set; } = string.Empty;
        public List<CheckStatusItem> Items { get; set; } = new();
    }
}
