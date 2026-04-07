namespace llcar.Models;

/// <summary>
/// Represents a vehicle model
/// </summary>
public class AutomobileModel
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string BrandId { get; set; } = string.Empty;
    public int StartYear { get; set; }
    public int EndYear { get; set; }
    public List<string> Engines { get; set; } = new();
    public string Description { get; set; } = string.Empty;
}