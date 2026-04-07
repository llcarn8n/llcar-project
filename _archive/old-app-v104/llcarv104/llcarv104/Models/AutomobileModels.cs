namespace llcar.Models;

/// <summary>
/// Represents a car brand
/// </summary>
public class CarBrand
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public List<CarModel> Models { get; set; } = new();
}

/// <summary>
/// Represents a car model
/// </summary>
public class CarModel
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public List<CarGeneration> Generations { get; set; } = new();
}

/// <summary>
/// Represents a car generation
/// </summary>
public class CarGeneration
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public List<CarEquipment> Equipments { get; set; } = new();
}

/// <summary>
/// Represents a car equipment/trim level with ratings
/// </summary>
public class CarEquipment
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public CarRatings Ratings { get; set; } = new();
}

/// <summary>
/// Car performance ratings
/// </summary>
public class CarRatings
{
    public double Gas { get; set; }
    public double Brake { get; set; }
    public double Steering { get; set; }
    public double Noise { get; set; }
    public double Comfort { get; set; }
}

/// <summary>
/// Root object for automobile database
/// </summary>
public class AutomobileDatabase
{
    public List<CarBrand> Brands { get; set; } = new();
}