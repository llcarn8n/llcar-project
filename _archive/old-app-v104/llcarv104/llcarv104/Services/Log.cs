using System;
using System.Collections.Generic;
using System.Threading;

namespace llcar.Services;

/// <summary>
/// Static logging helper for easy access from anywhere in the app.
/// Delegates to ILoggingService internally.
/// </summary>
public static class Log
{
    private static ILoggingService? _loggingService;
    private static readonly object _lock = new();
    private static readonly Queue<LogEntry> _buffer = new();
    private const int MaxBufferSize = 1000;

    private struct LogEntry
    {
        public LogLevel Level;
        public string Message;
        public DateTime Timestamp;
    }

    /// <summary>
    /// Initialize the static logger with an ILoggingService instance.
    /// Should be called once during app startup (e.g., in MauiProgram.cs).
    /// </summary>
    public static void Initialize(ILoggingService loggingService)
    {
        lock (_lock)
        {
            _loggingService = loggingService;
            
            // Flush any buffered messages
            while (_buffer.Count > 0)
            {
                var entry = _buffer.Dequeue();
                WriteToService(entry.Level, entry.Message);
            }
        }
    }

    /// <summary>
    /// Check if logger is initialized
    /// </summary>
    public static bool IsInitialized => _loggingService != null;

    private static void Write(LogLevel level, string message)
    {
        lock (_lock)
        {
            if (_loggingService != null)
            {
                WriteToService(level, message);
            }
            else
            {
                // Buffer messages until logger is initialized
                if (_buffer.Count < MaxBufferSize)
                {
                    _buffer.Enqueue(new LogEntry 
                    { 
                        Level = level, 
                        Message = message,
                        Timestamp = DateTime.Now 
                    });
                }
                
                // Also write to debug output as fallback
                System.Diagnostics.Debug.WriteLine($"[{level}] {message}");
            }
        }
    }

    private static void WriteToService(LogLevel level, string message)
    {
        try
        {
            switch (level)
            {
                case LogLevel.Error:
                    _loggingService?.LogError(message);
                    break;
                case LogLevel.Warning:
                    _loggingService?.LogWarning(message);
                    break;
                case LogLevel.Info:
                    _loggingService?.LogInfo(message);
                    break;
                case LogLevel.Debug:
                case LogLevel.Verbose:
                    _loggingService?.LogDebug(message);
                    break;
            }
        }
        catch
        {
            // Silent fail - can't log logging errors
            System.Diagnostics.Debug.WriteLine($"[LOG_ERROR] Failed to write log: {message}");
        }
    }

    /// <summary>
    /// Log error message
    /// </summary>
    public static void Error(string message)
    {
        Write(LogLevel.Error, message);
    }

    /// <summary>
    /// Log error message with exception
    /// </summary>
    public static void Error(string message, Exception ex)
    {
        Write(LogLevel.Error, $"{message} - Exception: {ex.Message}");
    }

    /// <summary>
    /// Log warning message
    /// </summary>
    public static void Warning(string message)
    {
        Write(LogLevel.Warning, message);
    }

    /// <summary>
    /// Log info message
    /// </summary>
    public static void Info(string message)
    {
        Write(LogLevel.Info, message);
    }

    /// <summary>
    /// Log debug message
    /// </summary>
    public static void Debug(string message)
    {
        Write(LogLevel.Debug, message);
    }

    /// <summary>
    /// Log verbose message
    /// </summary>
    public static void Verbose(string message)
    {
        Write(LogLevel.Verbose, message);
    }
}
