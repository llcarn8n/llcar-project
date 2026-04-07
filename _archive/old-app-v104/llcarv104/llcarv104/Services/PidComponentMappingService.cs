using System.Globalization;

namespace llcar.Services
{
    /// <summary>
    /// Сервис для загрузки и управления соответствием PID и компонентов SVG
    /// </summary>
    public interface IPidComponentMappingService
    {
        /// <summary>
        /// Загрузить маппинг из CSV
        /// </summary>
        Task LoadMappingAsync();
        
        /// <summary>
        /// Получить компоненты для указанного PID
        /// </summary>
        IEnumerable<PidComponentMapping> GetComponentsForPid(string pid);
        
        /// <summary>
        /// Получить все маппинги
        /// </summary>
        IReadOnlyList<PidComponentMapping> GetAllMappings();
        
        /// <summary>
        /// Получить PIDs для указанного компонента
        /// </summary>
        IEnumerable<string> GetPidsForComponent(string componentId);
        
        /// <summary>
        /// Событие обновления маппинга
        /// </summary>
        event EventHandler? MappingLoaded;
    }
    
    /// <summary>
    /// Запись маппинга PID к компоненту
    /// </summary>
    public class PidComponentMapping
    {
        public string Pid { get; set; } = "";
        public string ComponentId { get; set; } = "";
        public string ComponentName { get; set; } = "";
        public int DisplayPriority { get; set; }
        public string UnitOverride { get; set; } = "";
        public string Notes { get; set; } = "";
    }
    
    /// <summary>
    /// Реализация сервиса маппинга
    /// </summary>
    public class PidComponentMappingService : IPidComponentMappingService
    {
        private List<PidComponentMapping> _mappings = new();
        private bool _isLoaded = false;
        private readonly SemaphoreSlim _loadLock = new(1, 1);
        
        public event EventHandler? MappingLoaded;
        
        public async Task LoadMappingAsync()
        {
            if (_isLoaded) return;
            
            await _loadLock.WaitAsync();
            try
            {
                if (_isLoaded) return;
                
                try
                {
                    using var stream = await FileSystem.OpenAppPackageFileAsync("pid_component_mapping.csv");
                    using var reader = new StreamReader(stream);
                    _mappings = await ParseCsvAsync(reader);
                    _isLoaded = true;
                    
                    MappingLoaded?.Invoke(this, EventArgs.Empty);
                }
                catch (Exception ex)
                {
                    Log.Debug($"Error loading PID mapping: {ex.Message}");
                    // Загружаем дефолтные маппинги
                    LoadDefaultMappings();
                }
            }
            finally
            {
                _loadLock.Release();
            }
        }
        
        private async Task<List<PidComponentMapping>> ParseCsvAsync(StreamReader reader)
        {
            var mappings = new List<PidComponentMapping>();
            string? line;
            bool isHeader = true;
            
            while ((line = await reader.ReadLineAsync()) != null)
            {
                // Skip comments and empty lines
                if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
                    continue;
                
                // Skip header
                if (isHeader)
                {
                    isHeader = false;
                    continue;
                }
                
                var parts = line.Split(',');
                if (parts.Length >= 5)
                {
                    var mapping = new PidComponentMapping
                    {
                        Pid = parts[0].Trim(),
                        ComponentId = parts[1].Trim(),
                        ComponentName = parts[2].Trim(),
                        DisplayPriority = int.TryParse(parts[3].Trim(), out var priority) ? priority : 99,
                        UnitOverride = parts[4].Trim(),
                        Notes = parts.Length > 5 ? parts[5].Trim() : ""
                    };
                    mappings.Add(mapping);
                }
            }
            
            return mappings;
        }
        
        private void LoadDefaultMappings()
        {
            _mappings = new List<PidComponentMapping>
            {
                new() { Pid = "010C", ComponentId = "engine", ComponentName = "Engine", DisplayPriority = 1, UnitOverride = "rpm" },
                new() { Pid = "0105", ComponentId = "cooling", ComponentName = "Cooling", DisplayPriority = 2, UnitOverride = "°C" },
                new() { Pid = "010D", ComponentId = "front_wheels", ComponentName = "Front Wheels", DisplayPriority = 3, UnitOverride = "km/h" },
                new() { Pid = "012F", ComponentId = "fuel", ComponentName = "Fuel", DisplayPriority = 4, UnitOverride = "%" },
                new() { Pid = "0142", ComponentId = "battery", ComponentName = "Battery", DisplayPriority = 5, UnitOverride = "V" },
                new() { Pid = "015B", ComponentId = "obc", ComponentName = "OBC", DisplayPriority = 6, UnitOverride = "A" },
            };
            _isLoaded = true;
        }
        
        public IEnumerable<PidComponentMapping> GetComponentsForPid(string pid)
        {
            if (!_isLoaded)
                LoadMappingAsync().Wait();
            
            return _mappings.Where(m => m.Pid.Equals(pid, StringComparison.OrdinalIgnoreCase))
                           .OrderBy(m => m.DisplayPriority);
        }
        
        public IReadOnlyList<PidComponentMapping> GetAllMappings()
        {
            if (!_isLoaded)
                LoadMappingAsync().Wait();
            
            return _mappings.AsReadOnly();
        }
        
        public IEnumerable<string> GetPidsForComponent(string componentId)
        {
            if (!_isLoaded)
                LoadMappingAsync().Wait();
            
            return _mappings.Where(m => m.ComponentId.Equals(componentId, StringComparison.OrdinalIgnoreCase))
                           .Select(m => m.Pid)
                           .Distinct();
        }
    }
}
