using llcar.Models;
using System.IO;

namespace llcar.Services
{
    /// <summary>
    /// Service for loading and saving app settings
    /// </summary>
    public interface ISettingsService
    {
        /// <summary>
        /// Loads settings from storage
        /// </summary>
        Task<llcar.Models.SettingsData?> LoadSettingsAsync();
        
        /// <summary>
        /// Saves settings to storage
        /// </summary>
        Task SaveSettingsAsync(llcar.Models.SettingsData settings);
        
        /// <summary>
        /// Returns true if VIN is configured
        /// </summary>
        bool HasClientIdentity(llcar.Models.SettingsData settings);
    }
    
    /// <summary>
    /// Implementation of settings service
    /// </summary>
    public class SettingsService : ISettingsService
    {
        private readonly string _settingsFilePath;
        
        public SettingsService()
        {
            _settingsFilePath = Path.Combine(FileSystem.Current.AppDataDirectory, "settings.json");
        }
        
        public async Task<llcar.Models.SettingsData?> LoadSettingsAsync()
        {
            try
            {
                Log.Debug($"[SETTINGS_SERVICE] Loading settings from: {_settingsFilePath}");
                Log.Debug($"[SETTINGS_SERVICE] File exists: {File.Exists(_settingsFilePath)}");
                if (File.Exists(_settingsFilePath))
                {
                    string json = await File.ReadAllTextAsync(_settingsFilePath);
                    Log.Debug($"[SETTINGS_SERVICE] Loaded JSON: {json}");
                    var settings = System.Text.Json.JsonSerializer.Deserialize<llcar.Models.SettingsData>(json);
                    Log.Debug($"[SETTINGS_SERVICE] Deserialized - VIN: {settings?.Vin}, Mobile: {settings?.MobileNumber}");
                    return settings;
                }
            }
            catch (Exception ex)
            {
                Log.Debug($"[SETTINGS_SERVICE] Error loading settings: {ex.Message}");
            }
            return null;
        }
        
        public async Task SaveSettingsAsync(llcar.Models.SettingsData settings)
        {
            try
            {
                Log.Debug($"[SETTINGS_SERVICE] Saving settings to: {_settingsFilePath}");
                Log.Debug($"[SETTINGS_SERVICE] VIN: {settings.Vin}, Mobile: {settings.MobileNumber}");
                string json = System.Text.Json.JsonSerializer.Serialize(settings);
                Log.Debug($"[SETTINGS_SERVICE] JSON: {json}");
                await File.WriteAllTextAsync(_settingsFilePath, json);
                Log.Debug("[SETTINGS_SERVICE] Settings saved successfully");
            }
            catch (Exception ex)
            {
                Log.Debug($"[SETTINGS_SERVICE] Error saving settings: {ex.Message}");
            }
        }
        
        public bool HasClientIdentity(llcar.Models.SettingsData settings)
        {
            // Client identity now only requires VIN (read from OBD2)
            return !string.IsNullOrWhiteSpace(settings.Vin);
        }
    }
}
