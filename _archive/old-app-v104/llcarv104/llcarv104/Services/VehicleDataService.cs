using System.Collections.ObjectModel;
using llcar.Models;

namespace llcar.Services;

public class VehicleData
{
    public ObservableCollection<ComponentModel> Components { get; set; } = new();
    public PerformanceMetrics Performance { get; set; } = new();
    public SensorData SensorData { get; set; } = new();
}

public class VehicleDataService
{
    public async Task<VehicleData> GetVehicleDataAsync()
    {
        var vehicleData = new VehicleData
        {
            Components = new ObservableCollection<ComponentModel>
            {
                new ComponentModel { ID = 1, Name = "Engine", HealthScore = 92, Status = "Good" },
                new ComponentModel { ID = 2, Name = "Transmission", HealthScore = 88, Status = "Good" },
                new ComponentModel { ID = 3, Name = "Brakes", HealthScore = 85, Status = "Good" },
                new ComponentModel { ID = 4, Name = "Suspension", HealthScore = 78, Status = "Fair" },
                new ComponentModel { ID = 5, Name = "Tires", HealthScore = 90, Status = "Good" },
                new ComponentModel { ID = 6, Name = "Battery", HealthScore = 95, Status = "Good" },
                new ComponentModel { ID = 7, Name = "Cooling System", HealthScore = 82, Status = "Good" },
                new ComponentModel { ID = 8, Name = "Electronics", HealthScore = 75, Status = "Fair" }
            },
            Performance = new PerformanceMetrics
            {
                GasEfficiency = 28,
                BrakePerformance = 75,
                SteeringResponsiveness = 88,
                NoiseLevels = 70,
                VehicleComfort = 85
            },
            SensorData = new SensorData
            {
                Timestamp = DateTime.UtcNow,
                OBD2 = new OBD2Data
                {
                    EngineStatus = true,
                    Speed = 0,
                    FuelLevel = 100,
                    RPM = 0,
                    EngineTemperature = 90,
                    ThrottlePosition = 0,
                    CheckEngineLight = "Off",
                    FuelEfficiency = 0
                },
                Accelerometer = new Models.AccelerometerData
                {
                    X = 0,
                    Y = 0,
                    Z = 9.8
                },
                Microphone = new MicrophoneData
                {
                    VolumeLevel = 0,
                    NoiseClassification = "Silent",
                    Decibels = 0
                }
            }
        };

        return await Task.FromResult(vehicleData);
    }

    public async Task<string> GetMaintenanceContentAsync()
    {
        try
        {
            var fileStream = await FileSystem.OpenAppPackageFileAsync("maintenance.html");
            using var reader = new StreamReader(fileStream);
            return await reader.ReadToEndAsync();
        }
        catch
        {
            return @"<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Vehicle Maintenance Guide</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            margin: 0;
            background-color: #f5f5f5;
        }
        .header {
            background-color: #1E88E5;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .section {
            background-color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h2 {
            color: #1E88E5;
            margin-top: 0;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class='header'>
        <h1>🚗 Vehicle Maintenance Guide</h1>
    </div>
    <p><strong>Could not load maintenance guide from assets. Please ensure the maintenance.html file is included in your project.</strong></p>
</body>
</html>";
        }
    }
}
