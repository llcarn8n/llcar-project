using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace llcar.Services;

/// <summary>
/// Levels of logging detail
/// </summary>
public enum LogLevel
{
    Error = 0,      // Only errors and crashes
    Warning = 1,    // + Warnings
    Info = 2,       // + Important events (connection, server upload)
    Debug = 3,      // + Debug details
    Verbose = 4     // Everything including TX/RX frames
}

/// <summary>
/// Logging service with file storage and level-based filtering
/// </summary>
public interface ILoggingService
{
    LogLevel CurrentLevel { get; set; }
    
    void LogError(string message, Exception? ex = null);
    void LogWarning(string message);
    void LogInfo(string message);
    void LogDebug(string message);
    void LogVerbose(string message);
    
    Task<string> GetLogFilePathAsync();
    Task<long> GetLogFileSizeAsync();
    Task<int> GetLogEntryCountAsync();
    Task ClearLogsAsync();
    Task<bool> SendLogsToServerAsync(string? userComment = null);
}

/// <summary>
/// File-based logging service with rotation
/// </summary>
public class LoggingService : ILoggingService
{
    private readonly string _logDirectory;
    private readonly string _currentLogFile;
    private readonly string _archiveLogFile;
    private readonly object _lock = new();
    private LogLevel _currentLevel;
    private readonly IServerCommunicationService? _serverService;
    private const long MaxFileSize = 30 * 1024 * 1024; // 30 MB - rotate when reached
    private const int MaxRetentionDays = 7;
    private const long MaxTotalLogsSize = 200 * 1024 * 1024; // 200 MB max for all logs
    
    public LogLevel CurrentLevel 
    { 
        get => _currentLevel;
        set => _currentLevel = value;
    }
    
    public LoggingService(IServerCommunicationService? serverService = null)
    {
        _serverService = serverService;
        _logDirectory = Path.Combine(FileSystem.AppDataDirectory, "logs");
        Directory.CreateDirectory(_logDirectory);
        
        // Default: Verbose for all builds (user requested full logging)
        _currentLevel = LogLevel.Verbose;
        
        // Ring Buffer: only 2 files (current + archive)
        _currentLogFile = Path.Combine(_logDirectory, "llcar_current.log");
        _archiveLogFile = Path.Combine(_logDirectory, "llcar_archive.log.gz");
        
        // Check and rotate on startup if needed
        CheckAndRotateLogOnStartup();
        
        // Clean old logs on startup
        _ = Task.Run(CleanupOldLogsAsync);
        
        // Start periodic rotation check (every 5 minutes)
        _ = Task.Run(PeriodicRotationCheckAsync);
    }
    
    private void WriteLog(string level, string message)
    {
        try
        {
            var timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");
            var logEntry = $"[{timestamp}] [{level}] {message}{Environment.NewLine}";
            
            lock (_lock)
            {
                try
                {
                    // Check rotation BEFORE writing
                    if (File.Exists(_currentLogFile))
                    {
                        var fileInfo = new FileInfo(_currentLogFile);
                        // Refresh to get accurate size
                        fileInfo.Refresh();
                        if (fileInfo.Length > MaxFileSize)
                        {
                            // Write rotation marker before rotating
                            File.AppendAllText(_currentLogFile, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] [INFO] Log file reached {fileInfo.Length / 1024 / 1024}MB, rotating...{Environment.NewLine}");
                            RotateLogInternal();
                        }
                    }
                    
                    File.AppendAllText(_currentLogFile, logEntry);
                }
                catch (Exception ex)
                {
                    // Write to Android log so we can see the error
                    Android.Util.Log.Error("LLCAR_LOG", $"Failed to write/rotate log: {ex.GetType().Name}: {ex.Message}");
                    throw; // Re-throw to be caught by outer catch
                }
            }
        }
        catch (Exception ex)
        {
            // Last resort: write to Android log
            Android.Util.Log.Error("LLCAR_LOG", $"WriteLog failed: {ex.GetType().Name}: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Internal rotation logic - MUST be called inside lock (_lock)
    /// </summary>
    private void RotateLogInternal()
    {
        try
        {
            // Ring Buffer: delete old archive if exists
            if (File.Exists(_archiveLogFile))
            {
                try
                {
                    File.Delete(_archiveLogFile);
                    Android.Util.Log.Info("LLCAR_LOG", "Deleted old archive file");
                }
                catch (Exception ex)
                {
                    Android.Util.Log.Error("LLCAR_LOG", $"Failed to delete old archive: {ex.Message}");
                    // Continue anyway - we'll overwrite it
                }
            }
            
            // Move current to temp
            var tempFile = _currentLogFile + ".temp";
            try
            {
                File.Move(_currentLogFile, tempFile);
                Android.Util.Log.Info("LLCAR_LOG", $"Moved current log to temp: {tempFile}");
            }
            catch (Exception ex)
            {
                Android.Util.Log.Error("LLCAR_LOG", $"Failed to move log to temp: {ex.Message}");
                throw;
            }
            
            // Create new empty current file immediately so logging continues
            try
            {
                File.WriteAllText(_currentLogFile, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] [INFO] Log rotated, new file created{Environment.NewLine}");
                Android.Util.Log.Info("LLCAR_LOG", "Created new current log file");
            }
            catch (Exception ex)
            {
                Android.Util.Log.Error("LLCAR_LOG", $"Failed to create new log file: {ex.Message}");
                // Try to restore the temp file
                try
                {
                    if (File.Exists(tempFile) && !File.Exists(_currentLogFile))
                    {
                        File.Move(tempFile, _currentLogFile);
                        Android.Util.Log.Info("LLCAR_LOG", "Restored temp file to current");
                    }
                }
                catch (Exception restoreEx)
                {
                    Android.Util.Log.Error("LLCAR_LOG", $"Failed to restore temp file: {restoreEx.Message}");
                }
                throw;
            }
            
            // Compress old log in background
            _ = Task.Run(() =>
            {
                try
                {
                    Android.Util.Log.Info("LLCAR_LOG", $"Starting compression of {tempFile} to {_archiveLogFile}");
                    CompressLogFile(tempFile, _archiveLogFile);
                    File.Delete(tempFile);
                    Android.Util.Log.Info("LLCAR_LOG", $"Log rotation complete. Archive: {_archiveLogFile}");
                    
                    // Write to new log file about successful rotation
                    lock (_lock)
                    {
                        File.AppendAllText(_currentLogFile, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] [INFO] Previous log archived to {Path.GetFileName(_archiveLogFile)}{Environment.NewLine}");
                    }
                }
                catch (Exception ex)
                {
                    Android.Util.Log.Error("LLCAR_LOG", $"Failed to compress log: {ex.GetType().Name}: {ex.Message}");
                    // Try to restore temp file as uncompressed archive
                    try
                    {
                        if (File.Exists(tempFile) && !File.Exists(_archiveLogFile))
                        {
                            File.Move(tempFile, _archiveLogFile.Replace(".gz", ""));
                            Android.Util.Log.Info("LLCAR_LOG", "Saved uncompressed archive instead");
                        }
                    }
                    catch (Exception restoreEx)
                    {
                        Android.Util.Log.Error("LLCAR_LOG", $"Failed to save uncompressed: {restoreEx.Message}");
                    }
                }
            });
        }
        catch (Exception ex)
        {
            Android.Util.Log.Error("LLCAR_LOG", $"RotateLogInternal failed: {ex.GetType().Name}: {ex.Message}");
            throw; // Re-throw so caller knows rotation failed
        }
    }
    
    /// <summary>
    /// Public rotation method for external calls - acquires lock
    /// </summary>
    private void RotateLog()
    {
        try
        {
            lock (_lock)
            {
                RotateLogInternal();
            }
        }
        catch (Exception ex)
        {
            Android.Util.Log.Error("LLCAR_LOG", $"RotateLog failed: {ex.GetType().Name}: {ex.Message}");
        }
    }
    
    private void CompressLogFile(string sourceFile, string destFile)
    {
        using (var sourceStream = File.OpenRead(sourceFile))
        using (var destStream = File.Create(destFile))
        using (var gzipStream = new GZipStream(destStream, CompressionLevel.Optimal))
        {
            sourceStream.CopyTo(gzipStream);
        }
    }
    
    public void LogError(string message, Exception? ex = null)
    {
        var fullMessage = ex != null ? $"{message} | Exception: {ex.GetType().Name}: {ex.Message}" : message;
        WriteLog("ERROR", fullMessage);
        
        // Also write to Android log for critical errors
        Log.Debug($"[ERROR] {fullMessage}");
    }
    
    public void LogWarning(string message)
    {
        if (_currentLevel >= LogLevel.Warning)
        {
            WriteLog("WARN", message);
        }
    }
    
    public void LogInfo(string message)
    {
        if (_currentLevel >= LogLevel.Info)
        {
            WriteLog("INFO", message);
        }
    }
    
    public void LogDebug(string message)
    {
        if (_currentLevel >= LogLevel.Debug)
        {
            WriteLog("DEBUG", message);
        }
    }
    
    public void LogVerbose(string message)
    {
        if (_currentLevel >= LogLevel.Verbose)
        {
            WriteLog("VERBOSE", message);
        }
    }
    
    public Task<string> GetLogFilePathAsync()
    {
        return Task.FromResult(_currentLogFile);
    }
    
    public Task<long> GetLogFileSizeAsync()
    {
        lock (_lock)
        {
            if (File.Exists(_currentLogFile))
            {
                var info = new FileInfo(_currentLogFile);
                return Task.FromResult(info.Length);
            }
            return Task.FromResult(0L);
        }
    }
    
    public Task<int> GetLogEntryCountAsync()
    {
        lock (_lock)
        {
            if (File.Exists(_currentLogFile))
            {
                var lines = File.ReadAllLines(_currentLogFile);
                return Task.FromResult(lines.Length);
            }
            return Task.FromResult(0);
        }
    }
    
    public Task ClearLogsAsync()
    {
        lock (_lock)
        {
            try
            {
                // Delete current log
                if (File.Exists(_currentLogFile))
                {
                    File.Delete(_currentLogFile);
                }
                
                // Delete all rotated logs
                var allLogs = Directory.GetFiles(_logDirectory, "llcar_*.log");
                foreach (var log in allLogs)
                {
                    File.Delete(log);
                }
            }
            catch { }
        }
        return Task.CompletedTask;
    }
    
    public async Task<string> ExportLogsAsync()
    {
        var zipPath = Path.Combine(FileSystem.CacheDirectory, $"llcar_logs_{DateTime.Now:yyyyMMdd_HHmmss}.zip");
        
        lock (_lock)
        {
            var allLogs = Directory.GetFiles(_logDirectory, "llcar_*.log");
            using (var zipArchive = ZipFile.Open(zipPath, ZipArchiveMode.Create))
            {
                foreach (var log in allLogs)
                {
                    zipArchive.CreateEntryFromFile(log, Path.GetFileName(log));
                }
            }
        }
        
        return zipPath;
    }
    
    public async Task<bool> SendLogsToServerAsync(string? userComment = null)
    {
        try
        {
            if (_serverService == null) return false;
            
            // CRITICAL: Ensure all buffered data is written to disk before reading
            // Force flush file system buffers for the log file
            if (File.Exists(_currentLogFile))
            {
                try
                {
                    using (var fs = new FileStream(_currentLogFile, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                    {
                        fs.Flush(true); // Flush OS buffers to disk
                    }
                }
                catch (Exception ex)
                {
                    Android.Util.Log.Warn("LLCAR_LOG", $"Could not flush log file: {ex.Message}");
                }
            }
            
            // Create ZIP archive with current log and archive log
            var zipPath = Path.Combine(FileSystem.CacheDirectory, $"llcar_logs_{DateTime.Now:yyyyMMdd_HHmmss}.zip");
            
            lock (_lock)
            {
                using (var zipArchive = ZipFile.Open(zipPath, ZipArchiveMode.Create))
                {
                    // Add current log file (compressed)
                    if (File.Exists(_currentLogFile))
                    {
                        zipArchive.CreateEntryFromFile(_currentLogFile, "llcar_current.log");
                    }
                    
                    // Add archive log file (already compressed, just copy)
                    if (File.Exists(_archiveLogFile))
                    {
                        zipArchive.CreateEntryFromFile(_archiveLogFile, "llcar_archive.log.gz");
                    }
                }
            }
            
            // Prepare form data
            var timestamp = DateTime.UtcNow.ToString("O"); // ISO 8601 format
            var deviceInfo = System.Text.Json.JsonSerializer.Serialize(new
            {
                version = AppInfo.Version.ToString(),
                platform = DeviceInfo.Platform.ToString(),
                model = DeviceInfo.Model,
                client_hash = "unknown" // Will be set by server or we can get it from settings
            });
            
            var formData = new Dictionary<string, string>
            {
                { "timestamp", timestamp },
                { "device_info", deviceInfo },
                { "user_comment", userComment ?? "" }
            };
            
            // Send as multipart/form-data
            bool success = await _serverService.SendLogsFileAsync(zipPath, formData);
            
            // Clean up temp zip
            if (File.Exists(zipPath))
            {
                File.Delete(zipPath);
            }
            
            if (success)
            {
                LogInfo("Logs sent to server successfully");
            }
            else
            {
                LogError("Failed to send logs to server");
            }
            
            return success;
        }
        catch (Exception ex)
        {
            LogError("Failed to send logs to server", ex);
            return false;
        }
    }
    
    private Task CleanupOldLogsAsync()
    {
        try
        {
            // Delete old logs by date (excluding our ring buffer files)
            var cutoff = DateTime.Now.AddDays(-MaxRetentionDays);
            var allLogs = Directory.GetFiles(_logDirectory, "llcar_*.log*");
            
            foreach (var log in allLogs)
            {
                try
                {
                    // Skip ring buffer files
                    var fileName = Path.GetFileName(log);
                    if (fileName == "llcar_current.log" || fileName == "llcar_archive.log.gz")
                        continue;
                    
                    var fileInfo = new FileInfo(log);
                    if (fileInfo.CreationTime < cutoff)
                    {
                        File.Delete(log);
                    }
                }
                catch { }
            }
            
            // Check total logs size (excluding ring buffer)
            var allLogFiles = Directory.GetFiles(_logDirectory, "llcar_*.log")
                .Where(f => Path.GetFileName(f) != "llcar_current.log")
                .ToArray();
            long totalSize = allLogFiles.Sum(f => new FileInfo(f).Length);
            
            if (totalSize > MaxTotalLogsSize)
            {
                // Sort by age, delete oldest until under limit
                var sortedFiles = allLogFiles
                    .Select(f => new FileInfo(f))
                    .OrderBy(f => f.CreationTime)
                    .ToList();
                
                foreach (var file in sortedFiles)
                {
                    if (totalSize <= MaxTotalLogsSize * 0.8) // Keep 80% of limit
                        break;
                    
                    try
                    {
                        totalSize -= file.Length;
                        file.Delete();
                    }
                    catch { }
                }
            }
        }
        catch { }
        
        return Task.CompletedTask;
    }
    
    private void CheckAndRotateLogOnStartup()
    {
        try
        {
            Android.Util.Log.Info("LLCAR_LOG", $"Checking log file on startup: {_currentLogFile}");
            
            if (File.Exists(_currentLogFile))
            {
                var fileInfo = new FileInfo(_currentLogFile);
                fileInfo.Refresh();
                
                Android.Util.Log.Info("LLCAR_LOG", $"Current log file size: {fileInfo.Length / 1024}KB / {MaxFileSize / 1024}KB limit");
                
                if (fileInfo.Length > MaxFileSize)
                {
                    Android.Util.Log.Info("LLCAR_LOG", $"Log file oversized ({fileInfo.Length / 1024 / 1024}MB > {MaxFileSize / 1024 / 1024}MB), rotating on startup...");
                    RotateLog();
                }
                else
                {
                    Android.Util.Log.Info("LLCAR_LOG", "Log file size OK, no rotation needed");
                }
            }
            else
            {
                Android.Util.Log.Info("LLCAR_LOG", "No existing log file found, will create new");
            }
        }
        catch (Exception ex)
        {
            Android.Util.Log.Error("LLCAR_LOG", $"Failed to check/rotate log on startup: {ex.GetType().Name}: {ex.Message}");
        }
    }
    
    private async Task PeriodicRotationCheckAsync()
    {
        while (true)
        {
            try
            {
                await Task.Delay(TimeSpan.FromMinutes(5));
                
                if (File.Exists(_currentLogFile))
                {
                    var fileInfo = new FileInfo(_currentLogFile);
                    fileInfo.Refresh(); // Get fresh size
                    
                    Android.Util.Log.Debug("LLCAR_LOG", $"Periodic check: log file size = {fileInfo.Length / 1024}KB / {MaxFileSize / 1024}KB limit");
                    
                    if (fileInfo.Length > MaxFileSize)
                    {
                        Android.Util.Log.Info("LLCAR_LOG", $"Log file reached {fileInfo.Length / 1024 / 1024}MB, triggering rotation...");
                        RotateLog();
                    }
                }
            }
            catch (Exception ex)
            {
                Android.Util.Log.Error("LLCAR_LOG", $"Periodic rotation check failed: {ex.GetType().Name}: {ex.Message}");
            }
        }
    }
}
