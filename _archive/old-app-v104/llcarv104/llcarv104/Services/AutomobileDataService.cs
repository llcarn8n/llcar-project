using System.Text.Json;
using llcar.Models;

namespace llcar.Services;

/// <summary>
/// Service for loading and managing automobile database
/// </summary>
public interface IAutomobileDataService
{
    Task<AutomobileDatabase> LoadDatabaseAsync();
    List<CarBrand> GetBrands();
    List<CarModel> GetModels(string brandId);
    List<CarGeneration> GetGenerations(string brandId, string modelId);
    List<CarEquipment> GetEquipments(string brandId, string modelId, string generationId);
    CarEquipment? GetEquipment(string brandId, string modelId, string generationId, string equipmentId);
}

public class AutomobileDataService : IAutomobileDataService
{
    private AutomobileDatabase? _database;
    private readonly SemaphoreSlim _loadLock = new(1, 1);

    public async Task<AutomobileDatabase> LoadDatabaseAsync()
    {
        if (_database != null)
            return _database;

        await _loadLock.WaitAsync();
        try
        {
            if (_database != null)
                return _database;

            using var stream = await FileSystem.OpenAppPackageFileAsync("automobiles.json");
            using var reader = new StreamReader(stream);
            var json = await reader.ReadToEndAsync();
            
            _database = JsonSerializer.Deserialize<AutomobileDatabase>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? new AutomobileDatabase();

            return _database;
        }
        finally
        {
            _loadLock.Release();
        }
    }

    public List<CarBrand> GetBrands()
    {
        return _database?.Brands ?? new List<CarBrand>();
    }

    public List<CarModel> GetModels(string brandId)
    {
        var brand = _database?.Brands.FirstOrDefault(b => b.Id == brandId);
        return brand?.Models ?? new List<CarModel>();
    }

    public List<CarGeneration> GetGenerations(string brandId, string modelId)
    {
        var brand = _database?.Brands.FirstOrDefault(b => b.Id == brandId);
        var model = brand?.Models.FirstOrDefault(m => m.Id == modelId);
        return model?.Generations ?? new List<CarGeneration>();
    }

    public List<CarEquipment> GetEquipments(string brandId, string modelId, string generationId)
    {
        var brand = _database?.Brands.FirstOrDefault(b => b.Id == brandId);
        var model = brand?.Models.FirstOrDefault(m => m.Id == modelId);
        var generation = model?.Generations.FirstOrDefault(g => g.Id == generationId);
        return generation?.Equipments ?? new List<CarEquipment>();
    }

    public CarEquipment? GetEquipment(string brandId, string modelId, string generationId, string equipmentId)
    {
        var brand = _database?.Brands.FirstOrDefault(b => b.Id == brandId);
        var model = brand?.Models.FirstOrDefault(m => m.Id == modelId);
        var generation = model?.Generations.FirstOrDefault(g => g.Id == generationId);
        return generation?.Equipments.FirstOrDefault(e => e.Id == equipmentId);
    }
}