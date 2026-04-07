namespace llcar.Services.ObdProtocol;

/// <summary>
/// Represents an OBD command to be sent
/// </summary>
public class ObdCommand
{
    /// <summary>Command string (e.g., "010C" for RPM)</summary>
    public string Command { get; set; } = "";
    
    /// <summary>Description for logging</summary>
    public string Description { get; set; } = "";
    
    /// <summary>Timeout for response</summary>
    public TimeSpan Timeout { get; set; } = TimeSpan.FromMilliseconds(500);
    
    /// <summary>Number of retry attempts</summary>
    public int MaxRetries { get; set; } = 2;
    
    /// <summary>Current retry count</summary>
    public int RetryCount { get; set; } = 0;
    
    /// <summary>Expected response patterns (null = any response)</summary>
    public string[]? ExpectedResponses { get; set; }
    
    /// <summary>Callback when response is received</summary>
    public Func<string, bool>? ResponseValidator { get; set; }
    
    /// <summary>Callback for successful completion</summary>
    public Action<string>? OnSuccess { get; set; }
    
    /// <summary>Callback for failure</summary>
    public Action<Exception>? OnFailure { get; set; }
    
    /// <summary>Priority command (sent before others in queue)</summary>
    public bool IsPriority { get; set; }
    
    /// <summary>Time when command was sent</summary>
    public DateTime? SentTime { get; set; }
    
    /// <summary>Command creation time</summary>
    public DateTime CreatedTime { get; set; } = DateTime.UtcNow;

    public ObdCommand() { }

    public ObdCommand(string command, string description = "", TimeSpan? timeout = null)
    {
        Command = command;
        Description = description;
        Timeout = timeout ?? TimeSpan.FromMilliseconds(500);
    }

    /// <summary>
    /// Creates an AT command
    /// </summary>
    public static ObdCommand AtCommand(string atCommand, string description = "", TimeSpan? timeout = null)
    {
        return new ObdCommand($"AT{atCommand}", description, timeout);
    }

    /// <summary>
    /// Creates an OBD service request command
    /// </summary>
    public static ObdCommand ServiceCommand(ObdService service, byte pid, string description = "")
    {
        var cmd = $"{(byte)service:X2}{pid:X2}";
        return new ObdCommand(cmd, description, TimeSpan.FromMilliseconds(200));
    }

    /// <summary>
    /// Creates an initialization command sequence
    /// </summary>
    public static List<ObdCommand> CreateInitSequence(ElmProtocol preferredProtocol = ElmProtocol.Automatic)
    {
        // Default to CAN 11-bit 500k for modern vehicles if Automatic is selected
        // Automatic (ATSP0) can cause issues with some adapters
        var protocolToUse = preferredProtocol == ElmProtocol.Automatic 
            ? ElmProtocol.ISO15765_4_CAN_11bit_500k 
            : preferredProtocol;
        
        var commands = new List<ObdCommand>
        {
            // Reset adapter
            new ObdCommand("ATZ", "Reset adapter", TimeSpan.FromSeconds(3))
            {
                ExpectedResponses = new[] { "ELM", "OK", ">" }
            },
            
            // Echo off
            new ObdCommand("ATE0", "Echo off", TimeSpan.FromMilliseconds(200))
            {
                ExpectedResponses = new[] { "OK", ">" }
            },
            
            // Linefeeds off
            new ObdCommand("ATL0", "Linefeeds off", TimeSpan.FromMilliseconds(200))
            {
                ExpectedResponses = new[] { "OK", ">" }
            },
            
            // Spaces off
            new ObdCommand("ATS0", "Spaces off", TimeSpan.FromMilliseconds(200))
            {
                ExpectedResponses = new[] { "OK", ">" }
            },
            
            // Headers on (for ECU detection)
            new ObdCommand("ATH1", "Headers on", TimeSpan.FromMilliseconds(200))
            {
                ExpectedResponses = new[] { "OK", ">" }
            },
            
            // Set protocol - use CAN 11-bit 500k by default for modern vehicles
            new ObdCommand($"ATSP{(int)protocolToUse}", $"Set protocol {protocolToUse}", TimeSpan.FromMilliseconds(500))
            {
                ExpectedResponses = new[] { "OK", ">" }
            }
        };

        return commands;
    }

    /// <summary>
    /// Creates a PID discovery command sequence
    /// </summary>
    public static List<ObdCommand> CreatePidDiscoverySequence(ObdService service)
    {
        var commands = new List<ObdCommand>();
        
        // Query supported PIDs at offsets 0x00, 0x20, 0x40, 0x60, 0x80, 0xA0, 0xC0, 0xE0
        for (byte pid = 0x00; pid <= 0xE0; pid += 0x20)
        {
            var cmd = ServiceCommand(service, pid, $"Query supported PIDs at 0x{pid:X2}");
            cmd.Timeout = TimeSpan.FromMilliseconds(1500);
            commands.Add(cmd);
        }

        return commands;
    }
}

/// <summary>
/// Thread-safe command queue for OBD communication
/// </summary>
public class ObdCommandQueue
{
    private readonly Queue<ObdCommand> _queue = new();
    private readonly List<ObdCommand> _priorityQueue = new();
    private readonly object _lock = new();
    private ObdCommand? _currentCommand;

    /// <summary>
    /// Event raised when a command is queued
    /// </summary>
    public event EventHandler<ObdCommand>? CommandQueued;

    /// <summary>
    /// Event raised when queue is empty
    /// </summary>
    public event EventHandler? QueueEmpty;

    /// <summary>
    /// Gets the current command being processed
    /// </summary>
    public ObdCommand? CurrentCommand
    {
        get
        {
            lock (_lock)
            {
                return _currentCommand;
            }
        }
    }

    /// <summary>
    /// Gets the number of pending commands
    /// </summary>
    public int Count
    {
        get
        {
            lock (_lock)
            {
                return _queue.Count + _priorityQueue.Count + (_currentCommand != null ? 1 : 0);
            }
        }
    }

    /// <summary>
    /// Clears all pending commands
    /// </summary>
    public void Clear()
    {
        lock (_lock)
        {
            _queue.Clear();
            _priorityQueue.Clear();
            _currentCommand = null;
        }
    }

    /// <summary>
    /// Enqueues a command
    /// </summary>
    public void Enqueue(ObdCommand command)
    {
        lock (_lock)
        {
            if (command.IsPriority)
            {
                _priorityQueue.Add(command);
            }
            else
            {
                _queue.Enqueue(command);
            }
        }
        CommandQueued?.Invoke(this, command);
    }

    /// <summary>
    /// Enqueues multiple commands
    /// </summary>
    public void EnqueueRange(IEnumerable<ObdCommand> commands)
    {
        foreach (var cmd in commands)
        {
            Enqueue(cmd);
        }
    }

    /// <summary>
    /// Tries to dequeue the next command
    /// </summary>
    public bool TryDequeue(out ObdCommand? command)
    {
        lock (_lock)
        {
            // Check priority queue first
            if (_priorityQueue.Count > 0)
            {
                command = _priorityQueue[0];
                _priorityQueue.RemoveAt(0);
                _currentCommand = command;
                command.SentTime = DateTime.UtcNow;
                return true;
            }

            // Then check regular queue
            if (_queue.Count > 0)
            {
                command = _queue.Dequeue();
                _currentCommand = command;
                command.SentTime = DateTime.UtcNow;
                return true;
            }

            // Queue is empty
            _currentCommand = null;
            command = null;
            QueueEmpty?.Invoke(this, EventArgs.Empty);
            return false;
        }
    }

    /// <summary>
    /// Marks the current command as complete
    /// </summary>
    public void CompleteCurrent(string response)
    {
        lock (_lock)
        {
            _currentCommand?.OnSuccess?.Invoke(response);
            _currentCommand = null;
        }
    }

    /// <summary>
    /// Retries the current command if retries remain
    /// </summary>
    public bool RetryCurrent()
    {
        lock (_lock)
        {
            if (_currentCommand == null) return false;
            
            _currentCommand.RetryCount++;
            if (_currentCommand.RetryCount <= _currentCommand.MaxRetries)
            {
                // Put back at front of queue
                _priorityQueue.Insert(0, _currentCommand);
                _currentCommand = null;
                return true;
            }
            
            // Max retries exceeded
            _currentCommand = null;
            return false;
        }
    }

    /// <summary>
    /// Peeks at the next command without removing it
    /// </summary>
    public ObdCommand? Peek()
    {
        lock (_lock)
        {
            if (_priorityQueue.Count > 0)
                return _priorityQueue[0];
            
            return _queue.Count > 0 ? _queue.Peek() : null;
        }
    }
}
