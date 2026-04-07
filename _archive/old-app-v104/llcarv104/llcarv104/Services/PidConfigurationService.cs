using llcar.Models;
using System.Globalization;

namespace llcar.Services
{
    /// <summary>
    /// Service for loading and managing PID configurations from pids.csv
    /// </summary>
    public interface IPidConfigurationService
    {
        /// <summary>
        /// Loads PID configurations from the CSV file
        /// </summary>
        Task<List<PidConfiguration>> LoadConfigurationsAsync();
        
        /// <summary>
        /// Gets configurations for a specific service mode
        /// </summary>
        List<PidConfiguration> GetConfigurationsForService(string serviceMode);
        
        /// <summary>
        /// Gets configuration by PID hex string
        /// </summary>
        PidConfiguration? GetConfigurationByPid(string pid);
        
        /// <summary>
        /// Gets all loaded configurations
        /// </summary>
        List<PidConfiguration> GetAllConfigurations();
        
        /// <summary>
        /// Gets configurations grouped by update cycle for efficient querying
        /// </summary>
        Dictionary<int, List<PidConfiguration>> GetConfigurationsByUpdateCycle();
    }
    
    public class PidConfigurationService : IPidConfigurationService
    {
        private List<PidConfiguration> _configurations = new();
        private readonly SemaphoreSlim _loadLock = new(1, 1);
        private bool _isLoaded = false;
        
        public async Task<List<PidConfiguration>> LoadConfigurationsAsync()
        {
            await _loadLock.WaitAsync();
            try
            {
                if (_isLoaded)
                    return _configurations;
                
                var csvPath = Path.Combine(FileSystem.Current.AppDataDirectory, "pids.csv");
                
                // Check if file exists in app data, if not copy from resources
                if (!File.Exists(csvPath))
                {
                    await CopyDefaultPidsFileAsync(csvPath);
                }
                
                if (File.Exists(csvPath))
                {
                    await ParseCsvFileAsync(csvPath);
                }
                
                _isLoaded = true;
                Log.Debug($"Loaded {_configurations.Count} PID configurations");
                return _configurations;
            }
            finally
            {
                _loadLock.Release();
            }
        }
        
        private async Task CopyDefaultPidsFileAsync(string destinationPath)
        {
            try
            {
                // Try to copy from bundled resources
                using var stream = await FileSystem.OpenAppPackageFileAsync("pids.csv");
                using var reader = new StreamReader(stream);
                var content = await reader.ReadToEndAsync();
                await File.WriteAllTextAsync(destinationPath, content);
            }
            catch (Exception ex)
            {
                Log.Debug($"Could not copy default pids.csv: {ex.Message}");
            }
        }
        
        private async Task ParseCsvFileAsync(string csvPath)
        {
            var lines = await File.ReadAllLinesAsync(csvPath);
            
            if (lines.Length < 2)
            {
                Log.Debug("PID CSV file is empty or has no data rows");
                return;
            }
            
            // Parse header
            var headers = ParseCsvLine(lines[0]);
            
            // Create column index mapping
            var columnMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            for (int i = 0; i < headers.Length; i++)
            {
                columnMap[headers[i].Trim()] = i;
            }
            
            // Parse data rows
            for (int i = 1; i < lines.Length; i++)
            {
                try
                {
                    var columns = ParseCsvLine(lines[i]);
                    if (columns.Length < 5) continue;
                    
                    var config = new PidConfiguration
                    {
                        Service = GetColumnValue(columns, columnMap, "svc"),
                        Pid = GetColumnValue(columns, columnMap, "pid"),
                        Offset = ParseInt(GetColumnValue(columns, columnMap, "ofs")),
                        Length = ParseInt(GetColumnValue(columns, columnMap, "len")),
                        BitOffset = ParseInt(GetColumnValue(columns, columnMap, "bit_offset")),
                        BitLength = ParseInt(GetColumnValue(columns, columnMap, "bit_length")),
                        BitMask = GetColumnValue(columns, columnMap, "bit_mask"),
                        Formula = GetColumnValue(columns, columnMap, "formula"),
                        Format = GetColumnValue(columns, columnMap, "format"),
                        Min = ParseNullableDouble(GetColumnValue(columns, columnMap, "min")),
                        Max = ParseNullableDouble(GetColumnValue(columns, columnMap, "max")),
                        UpdateCycleMs = ParseInt(GetColumnValue(columns, columnMap, "update_cycle_ms")),
                        Mnemonic = GetColumnValue(columns, columnMap, "mnemonic"),
                        Label = GetColumnValue(columns, columnMap, "label"),
                        Description = GetColumnValue(columns, columnMap, "description"),
                        FormulaRemark = GetColumnValue(columns, columnMap, "formula_remark"),
                        Options = GetColumnValue(columns, columnMap, "options"),
                        Remarks = GetColumnValue(columns, columnMap, "remark2")
                    };
                    
                    // Set default update cycle if not specified (0 or empty means 1000ms)
                    if (config.UpdateCycleMs <= 0)
                        config.UpdateCycleMs = 1000;
                    
                    _configurations.Add(config);
                }
                catch (Exception ex)
                {
                    Log.Debug($"Error parsing PID row {i}: {ex.Message}");
                }
            }
        }
        
        private string[] ParseCsvLine(string line)
        {
            var result = new List<string>();
            bool inQuotes = false;
            var currentField = new System.Text.StringBuilder();
            
            foreach (char c in line)
            {
                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == '\t' && !inQuotes)
                {
                    result.Add(currentField.ToString().Trim());
                    currentField.Clear();
                }
                else
                {
                    currentField.Append(c);
                }
            }
            
            result.Add(currentField.ToString().Trim());
            return result.ToArray();
        }
        
        private string GetColumnValue(string[] columns, Dictionary<string, int> columnMap, string columnName)
        {
            if (columnMap.TryGetValue(columnName, out int index) && index < columns.Length)
            {
                return columns[index]?.Trim() ?? "";
            }
            return "";
        }
        
        private int ParseInt(string value)
        {
            if (int.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out int result))
                return result;
            return 0;
        }
        
        private double? ParseNullableDouble(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;
            if (double.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out double result))
                return result;
            return null;
        }
        
        public List<PidConfiguration> GetConfigurationsForService(string serviceMode)
        {
            return _configurations
                .Where(c => c.Service.Contains(serviceMode, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }
        
        public PidConfiguration? GetConfigurationByPid(string pid)
        {
            return _configurations
                .FirstOrDefault(c => c.Pid.Equals(pid, StringComparison.OrdinalIgnoreCase));
        }
        
        public List<PidConfiguration> GetAllConfigurations()
        {
            return _configurations.ToList();
        }
        
        public Dictionary<int, List<PidConfiguration>> GetConfigurationsByUpdateCycle()
        {
            return _configurations
                .GroupBy(c => c.UpdateCycleMs)
                .ToDictionary(g => g.Key, g => g.ToList());
        }
    }
}
