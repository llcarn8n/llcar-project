using llcar.Models;
using System.Text.Json;

namespace llcar.Services
{
    public interface IBrandInitializationService
    {
        Task<List<AutomobileBrand>> GetAvailableBrandsAsync();
        Task<AutomobileBrand?> GetBrandByIdAsync(string brandId);
        Task<List<InitializationCommand>> GetInitializationCommandsAsync(string brandId);
        Task<AutomobileBrand?> GetDefaultBrandAsync();
    }

    public class BrandInitializationService : IBrandInitializationService
    {
        private BrandInitializationConfig? _config;
        private readonly SemaphoreSlim _loadLock = new(1, 1);

        public async Task<List<AutomobileBrand>> GetAvailableBrandsAsync()
        {
            await EnsureConfigLoadedAsync();
            return _config?.brands ?? new List<AutomobileBrand>();
        }

        public async Task<AutomobileBrand?> GetBrandByIdAsync(string brandId)
        {
            await EnsureConfigLoadedAsync();
            return _config?.brands.FirstOrDefault(b => b.id.Equals(brandId, StringComparison.OrdinalIgnoreCase));
        }

        public async Task<List<InitializationCommand>> GetInitializationCommandsAsync(string brandId)
        {
            var brand = await GetBrandByIdAsync(brandId);
            return brand?.initializationCommands ?? new List<InitializationCommand>();
        }

        public async Task<AutomobileBrand?> GetDefaultBrandAsync()
        {
            await EnsureConfigLoadedAsync();
            // Return Generic brand as default, or first brand if Generic not found
            return _config?.brands.FirstOrDefault(b => b.id == "generic") 
                ?? _config?.brands.FirstOrDefault();
        }

        private async Task EnsureConfigLoadedAsync()
        {
            if (_config != null) return;

            await _loadLock.WaitAsync();
            try
            {
                if (_config != null) return;

                string json = string.Empty;
                bool loaded = false;

                // Try to load from Maui assets (works on all platforms including Android)
                try
                {
                    using var stream = await FileSystem.OpenAppPackageFileAsync("BrandInitializationConfig.json");
                    using var reader = new StreamReader(stream);
                    json = await reader.ReadToEndAsync();
                    loaded = true;
                    Log.Debug("BrandInitializationService: Loaded config from Maui assets");
                }
                catch (Exception ex)
                {
                    Log.Debug($"BrandInitializationService: Failed to load from assets: {ex.Message}");
                }

                // Fallback to file system paths
                if (!loaded)
                {
                    var configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "BrandInitializationConfig.json");
                    
                    if (!File.Exists(configPath))
                    {
                        configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Resources", "Raw", "BrandInitializationConfig.json");
                    }
                    
                    if (!File.Exists(configPath))
                    {
                        configPath = Path.Combine(FileSystem.Current.AppDataDirectory, "BrandInitializationConfig.json");
                    }
                    
                    if (File.Exists(configPath))
                    {
                        json = await File.ReadAllTextAsync(configPath);
                        loaded = true;
                        Log.Debug($"BrandInitializationService: Loaded config from file: {configPath}");
                    }
                }
                
                if (!loaded || string.IsNullOrEmpty(json))
                {
                    Log.Debug("BrandInitializationService: Config file not found, using default");
                    _config = CreateDefaultConfig();
                    return;
                }

                _config = JsonSerializer.Deserialize<BrandInitializationConfig>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (_config == null)
                {
                    Log.Debug("BrandInitializationService: Failed to deserialize config, using default");
                    _config = CreateDefaultConfig();
                }
                else
                {
                    Log.Debug($"BrandInitializationService: Loaded {_config.brands?.Count ?? 0} brands");
                }
            }
            catch (Exception ex)
            {
                Log.Debug($"BrandInitializationService: Error loading brand config: {ex.Message}");
                _config = CreateDefaultConfig();
            }
            finally
            {
                _loadLock.Release();
            }
        }

        private BrandInitializationConfig CreateDefaultConfig()
        {
            return new BrandInitializationConfig
            {
                version = "1.0",
                lastUpdated = DateTime.Now.ToString("yyyy-MM-dd"),
                description = "Default brand configuration",
                brands = new List<AutomobileBrand>
                {
                    new AutomobileBrand
                    {
                        id = "generic",
                        name = "Generic/Universal",
                        country = "International",
                        modelYears = "2023-2026",
                        protocols = new List<string> { "CAN", "ISO 15765-4" },
                        initializationCommands = new List<InitializationCommand>
                        {
                            new InitializationCommand { step = 1, command = "ATZ", description = "Reset adapter", expectedResponse = "ELM327", timeoutMs = 2000 },
                            new InitializationCommand { step = 2, command = "ATE0", description = "Echo off", expectedResponse = "OK", timeoutMs = 500 },
                            new InitializationCommand { step = 3, command = "ATL0", description = "Linefeeds off", expectedResponse = "OK", timeoutMs = 500 },
                            new InitializationCommand { step = 4, command = "ATS0", description = "Spaces off", expectedResponse = "OK", timeoutMs = 500 },
                            new InitializationCommand { step = 5, command = "ATAT1", description = "Adaptive timing on", expectedResponse = "OK", timeoutMs = 500 },
                            new InitializationCommand { step = 6, command = "ATSP6", description = "CAN protocol (11-bit, 500kbps)", expectedResponse = "OK", timeoutMs = 500 },
                            new InitializationCommand { step = 7, command = "ATH1", description = "Headers on", expectedResponse = "OK", timeoutMs = 500 },
                            new InitializationCommand { step = 8, command = "ATCAF1", description = "CAN auto formatting on", expectedResponse = "OK", timeoutMs = 500 },
                            new InitializationCommand { step = 9, command = "0100", description = "Query supported PIDs", expectedResponse = "41 00", timeoutMs = 1500 }
                        },
                        notes = "Generic initialization with CAN protocol (11-bit, 500kbps). For modern vehicles 2008+ using ISO 15765-4 CAN."
                    }
                }
            };
        }
    }

    public class BrandInitializationConfig
    {
        public string version { get; set; } = "1.0";
        public string lastUpdated { get; set; } = DateTime.Now.ToString("yyyy-MM-dd");
        public string description { get; set; } = "";
        public List<AutomobileBrand> brands { get; set; } = new();
        public List<int> supportedYears { get; set; } = new();
        public string defaultProtocol { get; set; } = "CAN";
        public List<CommonPID> commonPIDs { get; set; } = new();
    }

    public class CommonPID
    {
        public string pid { get; set; } = "";
        public string description { get; set; } = "";
        public string formula { get; set; } = "";
    }
}