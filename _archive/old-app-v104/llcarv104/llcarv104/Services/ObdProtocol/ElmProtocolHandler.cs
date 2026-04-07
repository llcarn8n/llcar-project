using System.Text;
using System.Text.RegularExpressions;
using System.Threading;

namespace llcar.Services.ObdProtocol;

/// <summary>
/// Main ELM327 protocol handler - based on AndrOBD's ElmProt
/// Manages the state machine, command queue, and response handling
/// </summary>
public class ElmProtocolHandler
{
    private readonly ObdCommandQueue _commandQueue = new();
    private readonly AdaptiveTiming _adaptiveTiming = new();
    private readonly PidDiscovery _pidDiscovery = new();
    private readonly DiagnosticTroubleCodeHandler _dtcHandler = new();
    
    private ObdState _state = ObdState.Undefined;
    private ObdService _currentService = ObdService.None;
    private ElmProtocol _preferredProtocol = ElmProtocol.Automatic;
    
    private string _lastTxMessage = "";
    private string _lastRxMessage = "";
    private bool _responsePending = false;
    private int _charsExpected = 0;
    
    private readonly StringBuilder _multilineBuffer = new();
    private int _lastMsgId = 0;
    
    // CAN ERROR tracking - thread-safe
    private int _consecutiveCanErrors = 0;
    private const int CanErrorThreshold = 10;
    private readonly object _canErrorLock = new object();
    private DateTime _lastCanErrorTime = DateTime.MinValue;
    private readonly TimeSpan _canErrorWindow = TimeSpan.FromSeconds(30);

    // Initialization tracking to prevent multiple simultaneous initializations
    private DateTime _lastInitializationAttempt = DateTime.MinValue;
    private readonly TimeSpan _initializationCooldown = TimeSpan.FromSeconds(10);
    private bool _isInitializing = false;

    /// <summary>
    /// Current state of the OBD connection
    /// </summary>
    public ObdState State
    {
        get => _state;
        private set
        {
            if (_state != value)
            {
                var oldState = _state;
                _state = value;
                Log.Debug($"ElmProtocol: {oldState} -> {value}");
                
                // Reset initialization flag when reaching terminal states
                if (value == ObdState.Connected || value == ObdState.EcuDetected || 
                    value == ObdState.Error || value == ObdState.BusError)
                {
                    _isInitializing = false;
                }
                
                StateChanged?.Invoke(this, new ObdStateChangedEventArgs 
                { 
                    OldState = oldState, 
                    NewState = value 
                });
            }
        }
    }

    /// <summary>
    /// Current OBD service mode
    /// </summary>
    public ObdService CurrentService => _currentService;

    /// <summary>
    /// Adaptive timing handler
    /// </summary>
    public AdaptiveTiming AdaptiveTiming => _adaptiveTiming;

    /// <summary>
    /// PID discovery handler
    /// </summary>
    public PidDiscovery PidDiscovery => _pidDiscovery;

    /// <summary>
    /// DTC handler
    /// </summary>
    public DiagnosticTroubleCodeHandler DtcHandler => _dtcHandler;

    /// <summary>
    /// Command queue
    /// </summary>
    public ObdCommandQueue CommandQueue => _commandQueue;

    /// <summary>
    /// True if connected and ready
    /// </summary>
    public bool IsReady => State == ObdState.Connected || State == ObdState.EcuDetected;

    /// <summary>
    /// Event raised when state changes
    /// </summary>
    public event EventHandler<ObdStateChangedEventArgs>? StateChanged;

    /// <summary>
    /// Event raised when a data PID is received
    /// </summary>
    public event EventHandler<PidDataReceivedEventArgs>? PidDataReceived;

    /// <summary>
    /// Event raised when raw data is received
    /// </summary>
    public event EventHandler<RawDataReceivedEventArgs>? RawDataReceived;
    
    /// <summary>
    /// Event raised when 10 consecutive CAN ERRORs are received - indicates bus failure
    /// </summary>
    public event EventHandler? CanErrorLimitReached;

    /// <summary>
    /// Initializes the protocol handler with preferred protocol
    /// </summary>
    public void Initialize(ElmProtocol preferredProtocol = ElmProtocol.Automatic)
    {
        // Prevent multiple simultaneous initializations
        var timeSinceLastInit = DateTime.Now - _lastInitializationAttempt;
        if (_isInitializing && timeSinceLastInit < _initializationCooldown)
        {
            Log.Debug($"[ELM_HANDLER] Initialization already in progress (started {timeSinceLastInit.TotalSeconds:F1}s ago), skipping duplicate request");
            return;
        }
        
        _isInitializing = true;
        _lastInitializationAttempt = DateTime.Now;
        
        _preferredProtocol = preferredProtocol;
        _adaptiveTiming.Mode = AdaptiveTimingMode.Software;
        
        State = ObdState.Initializing;
        
        // Note: Don't reset error counter here - it should persist across initialization attempts
        // to detect persistent bus errors. Counter is only reset by:
        // 1. Successful data/OK response
        // 2. 30-second window expiration
        // 3. Explicit protocol Reset()
        
        // Queue initialization commands
        var initCommands = ObdCommand.CreateInitSequence(preferredProtocol);
        
        // Add ECU detection
        initCommands.Add(new ObdCommand("0100", "ECU Detection", TimeSpan.FromMilliseconds(1500)));
        
        _commandQueue.EnqueueRange(initCommands);
    }

    /// <summary>
    /// Resets the protocol handler
    /// </summary>
    public void Reset()
    {
        _commandQueue.Clear();
        _pidDiscovery.Clear();
        _dtcHandler.Clear();
        _adaptiveTiming.Reset();
        _currentService = ObdService.None;
        _responsePending = false;
        _charsExpected = 0;
        _multilineBuffer.Clear();
        ResetErrorCounter("protocol reset");
        State = ObdState.Undefined;
    }

    /// <summary>
    /// Starts PID data service
    /// </summary>
    public void StartDataService()
    {
        if (State != ObdState.EcuDetected && State != ObdState.Connected)
        {
            throw new InvalidOperationException("Must be in EcuDetected or Connected state");
        }

        _currentService = ObdService.CurrentData;
        
        // Start PID discovery
        var discoveryCommands = ObdCommand.CreatePidDiscoverySequence(ObdService.CurrentData);
        foreach (var cmd in discoveryCommands)
        {
            cmd.OnSuccess = (response) => 
            {
                // Extract PID from command
                if (cmd.Command.Length >= 4 && byte.TryParse(cmd.Command.Substring(2, 2), 
                    System.Globalization.NumberStyles.HexNumber, null, out byte startPid))
                {
                    _pidDiscovery.ParseBitmaskResponse(ObdService.CurrentData, startPid, response);
                }
            };
        }
        
        _commandQueue.EnqueueRange(discoveryCommands);
    }

    /// <summary>
    /// Requests the next PID in the rotation
    /// </summary>
    public ObdCommand? RequestNextPid()
    {
        if (!IsReady) return null;

        var nextPid = _pidDiscovery.GetNextPidToRequest();
        if (nextPid == null) return null;

        return ObdCommand.ServiceCommand(_currentService, nextPid.Pid, nextPid.Description);
    }

    /// <summary>
    /// Reads trouble codes from all sources
    /// </summary>
    public void ReadTroubleCodes()
    {
        var commands = DiagnosticTroubleCodeHandler.GetReadDtcCommands();
        
        foreach (var cmd in commands)
        {
            ObdService service = cmd.Command switch
            {
                "03" => ObdService.ReadTroubleCodes,
                "07" => ObdService.PendingTroubleCodes,
                "0A" => ObdService.PermanentTroubleCodes,
                _ => ObdService.ReadTroubleCodes
            };

            cmd.OnSuccess = (response) => _dtcHandler.ParseDtcResponse(response, service);
        }

        _commandQueue.EnqueueRange(commands);
    }

    /// <summary>
    /// Clears all trouble codes
    /// </summary>
    public void ClearTroubleCodes()
    {
        var cmd = DiagnosticTroubleCodeHandler.GetClearDtcCommand();
        cmd.OnSuccess = (_) =>
        {
            _dtcHandler.Clear();
            // Re-read codes to verify
            ReadTroubleCodes();
        };
        _commandQueue.Enqueue(cmd);
    }

    /// <summary>
    /// Gets the next command to send (if any)
    /// </summary>
    public ObdCommand? GetNextCommand()
    {
        // If queue has commands, use those
        if (_commandQueue.TryDequeue(out var queuedCmd))
        {
            return queuedCmd;
        }

        // If in data service mode and connected, request next PID
        if (_currentService != ObdService.None && State == ObdState.Connected)
        {
            return RequestNextPid();
        }

        return null;
    }

    /// <summary>
    /// Processes received data from the adapter
    /// </summary>
    public void ProcessReceivedData(string data)
    {
        // Logging disabled to reduce duplicates - data shown in Settings page only
        // Log.Debug($"[ELM_HANDLER] ProcessReceivedData called with: {data}");
        
        if (string.IsNullOrWhiteSpace(data)) 
        {
            Log.Debug("[ELM_HANDLER] Data is null or whitespace, returning");
            return;
        }

        // Allow prompt characters to pass through for early exit detection in multi-frame mode
        // Previously skipped here, but now needed for SendCommandWithMultiFrameSupportAsync
        
        Log.Debug($"[ELM_HANDLER] Firing RawDataReceived event");
        // Parse CAN response info and add RX prefix for clarity in logs
        string canInfo = ParseCanResponseInfo(data);
        string rxData = string.IsNullOrEmpty(canInfo) ? $"<<< {data}" : $"<<< {canInfo} {data}";
        RawDataReceived?.Invoke(this, new RawDataReceivedEventArgs { Data = rxData });
        Log.Debug($"[ELM_HANDLER] RawDataReceived event fired");

        // Handle based on response type
        var responseId = GetResponseId(data);
        Log.Debug($"[ELM_HANDLER] Response identified as: {responseId}");
        
        switch (responseId)
        {
            case ElmResponseId.Searching:
                State = State != ObdState.EcuDetect ? ObdState.Connecting : State;
                _lastRxMessage = data;
                break;

            case ElmResponseId.Unable:
            case ElmResponseId.BusError:
            case ElmResponseId.CanError:
            case ElmResponseId.BusInitError:
                State = ObdState.BusError;
                _lastRxMessage = data;
                
                // Track consecutive errors (thread-safe with time window)
                // Returns true if limit reached (should disconnect)
                if (TrackError("CAN/Bus Error"))
                {
                    // Limit reached - don't reinitialize, let disconnect happen
                    break;
                }
                
                // Queue reset only if limit not reached and not already initializing
                if (State != ObdState.Initializing)
                {
                    Initialize(_preferredProtocol);
                }
                break;

            case ElmResponseId.Error:
                State = ObdState.Error;
                _lastRxMessage = data;
                
                // Track consecutive errors (any ERROR response)
                // Returns true if limit reached (should disconnect)
                TrackError("Generic Error");
                break;

            case ElmResponseId.Stopped:
                _lastRxMessage = data;
                // Re-queue last command
                if (_commandQueue.CurrentCommand != null)
                {
                    _commandQueue.RetryCurrent();
                }
                break;

            case ElmResponseId.Model:
                // ELM adapter identified
                _lastRxMessage = data;
                break;

            case ElmResponseId.Prompt:
                HandlePrompt();
                break;

            case ElmResponseId.Ok:
                _lastRxMessage = data;
                _commandQueue.CompleteCurrent(data);
                // Reset CAN ERROR counter on successful response
                ResetErrorCounter("OK received");
                break;

            default:
                // Data response - don't reset error counter here
                // Only successful PID data (41xx) or OK should reset
                HandleDataResponse(data);
                break;
        }
    }

    /// <summary>
    /// Handles the prompt character (ready for next command)
    /// </summary>
    private void HandlePrompt()
    {
        // Check if there was a pending response
        if (_responsePending && !string.IsNullOrEmpty(_lastRxMessage))
        {
            ProcessDataMessage(_lastRxMessage);
        }

        // Complete current command
        _commandQueue.CompleteCurrent(_lastRxMessage);

        // Update state based on last response
        if (State == ObdState.Initializing)
        {
            // Check if initialization is complete
            if (_lastRxMessage.Contains("ELM") || _lastRxMessage.Contains("OK"))
            {
                // Still initializing, wait for more
            }
        }
        else if (State == ObdState.EcuDetect)
        {
            if (!string.IsNullOrEmpty(_lastRxMessage) && _lastRxMessage.Contains("41"))
            {
                State = ObdState.EcuDetected;
            }
        }

        // Clear pending flags
        _responsePending = false;
        _charsExpected = 0;
        _multilineBuffer.Clear();
    }

    /// <summary>
    /// Handles data responses
    /// </summary>
    private void HandleDataResponse(string data)
    {
        // Check for multiline indicator
        if (data.Contains(':'))
        {
            HandleMultilineResponse(data);
            return;
        }

        // Check for length indicator (e.g., "014" for 20 bytes)
        if (data.Length == 3 && data[0] == '0' && int.TryParse(data, System.Globalization.NumberStyles.HexNumber, null, out int length))
        {
            _charsExpected = length * 2;
            _responsePending = true;
            return;
        }

        // Single line data
        _lastRxMessage = data;
        _responsePending = false;
        
        // If this completes expected data, process it
        if (_charsExpected == 0 || data.Length >= _charsExpected)
        {
            ProcessDataMessage(data);
        }
    }

    /// <summary>
    /// Handles multiline responses
    /// </summary>
    private void HandleMultilineResponse(string data)
    {
        // Format: "0:XXXXXXXXXXXX" or "1:XXXXXXXXXXXX" etc.
        var match = Regex.Match(data, @"(\d+):(.*)");
        if (match.Success)
        {
            int lineNum = int.Parse(match.Groups[1].Value);
            string payload = match.Groups[2].Value.Trim();

            if (lineNum == 0)
            {
                // First line
                _multilineBuffer.Clear();
                _multilineBuffer.Append(payload);
            }
            else
            {
                // Continuation line
                _multilineBuffer.Append(payload);
            }

            _lastMsgId = lineNum;
            _responsePending = true;
        }
    }

    /// <summary>
    /// Processes a complete data message
    /// </summary>
    private void ProcessDataMessage(string message)
    {
        // Clean message
        var cleanMsg = message.Replace(" ", "").Replace(">", "");
        
        if (string.IsNullOrEmpty(cleanMsg)) return;

        // Check for service response
        if (cleanMsg.Length >= 2 && byte.TryParse(cleanMsg.Substring(0, 2), 
            System.Globalization.NumberStyles.HexNumber, null, out byte serviceByte))
        {
            // Check for negative response
            if (serviceByte == 0x7F)
            {
                HandleNegativeResponse(cleanMsg);
                return;
            }

            // Positive response: service + 0x40
            var actualService = (ObdService)(serviceByte & ~0x40);
            
            if (cleanMsg.Length >= 4)
            {
                byte pid = byte.Parse(cleanMsg.Substring(2, 2), System.Globalization.NumberStyles.HexNumber);
                string data = cleanMsg.Length > 4 ? cleanMsg.Substring(4) : "";

                // Fire event
                PidDataReceived?.Invoke(this, new PidDataReceivedEventArgs
                {
                    Service = actualService,
                    Pid = pid,
                    RawData = data,
                    FullMessage = cleanMsg
                });

                // Update state
                if (State == ObdState.EcuDetected)
                {
                    State = ObdState.Connected;
                }

                // Record successful response for adaptive timing
                _adaptiveTiming.Adapt(false);
            }
        }
    }

    /// <summary>
    /// Handles negative response codes
    /// </summary>
    private void HandleNegativeResponse(string message)
    {
        // Format: 7FSSCC where SS = service, CC = NRC
        if (message.Length >= 6)
        {
            byte service = byte.Parse(message.Substring(2, 2), System.Globalization.NumberStyles.HexNumber);
            byte nrc = byte.Parse(message.Substring(4, 2), System.Globalization.NumberStyles.HexNumber);
            
            Log.Debug($"ElmProtocol: Negative Response - Service 0x{service:X2}, NRC 0x{nrc:X2} ({(NegativeResponseCode)nrc})");

            // Handle based on NRC
            switch ((NegativeResponseCode)nrc)
            {
                case NegativeResponseCode.ResponsePending:
                    // Wait longer
                    _adaptiveTiming.Adapt(true);
                    break;
                    
                case NegativeResponseCode.ServiceNotSupported:
                case NegativeResponseCode.SubFunctionNotSupported:
                    // Skip this PID
                    _commandQueue.CompleteCurrent(message);
                    break;
                    
                case NegativeResponseCode.BusyRepeatRequest:
                    // Retry
                    _commandQueue.RetryCurrent();
                    break;
                    
                default:
                    State = ObdState.Error;
                    break;
            }
        }
    }

    /// <summary>
    /// Parses CAN response to extract ECU address and PID
    /// Format: 7EB06410080080011 where:
    /// - 7EB = ECU address (7EA-7EF for functional addressing, 7E8-7EF for physical)
    /// - 06 = length (6 bytes follow)
    /// - 41 = service response (0x01 + 0x40)
    /// - 00 = PID
    /// Returns: "[ECU:7EB PID:0x00]" or empty string if not a CAN response
    /// </summary>
    private static string ParseCanResponseInfo(string response)
    {
        try
        {
            // Check if it's a CAN response (starts with 7E0-7EF)
            if (response.Length < 6) return "";
            
            string header = response.Substring(0, 3);
            if (!header.StartsWith("7E")) return "";
            
            // Parse ECU address (last nibble of header: 0-9, A-F)
            char ecuNibble = header[2];
            if (!IsHexDigit(ecuNibble)) return "";
            
            int ecuId = Convert.ToInt32(ecuNibble.ToString(), 16);
            string ecuAddress = $"7E{ecuNibble}";
            
            // For OBD responses, the format is typically:
            // 7EXX41PPDD... where XX is length, 41 is service+0x40, PP is PID, DD is data
            // Or for service 09 (VIN): 7EXX49PPDD...
            if (response.Length >= 8)
            {
                // Try to extract PID from the response
                // Position after header (3 chars) + length byte (2 chars) = 5
                // Service response starts at position 5, takes 2 chars
                if (response.Length >= 7)
                {
                    string serviceByte = response.Substring(5, 2);
                    if (byte.TryParse(serviceByte, System.Globalization.NumberStyles.HexNumber, null, out byte service))
                    {
                        // Service response = request service + 0x40
                        // e.g., 0x41 means service 0x01, 0x49 means service 0x09
                        if ((service >= 0x41 && service <= 0x49) && response.Length >= 9)
                        {
                            string pidByte = response.Substring(7, 2);
                            if (byte.TryParse(pidByte, System.Globalization.NumberStyles.HexNumber, null, out byte pid))
                            {
                                return $"[ECU:{ecuAddress} PID:0x{pid:X2}]";
                            }
                        }
                    }
                }
            }
            
            // Return just ECU address if we can't parse PID
            return $"[ECU:{ecuAddress} PID:??]";
        }
        catch
        {
            return "";
        }
    }
    
    private static bool IsHexDigit(char c)
    {
        return (c >= '0' && c <= '9') || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f');
    }

    /// <summary>
    /// Identifies the type of ELM response
    /// </summary>
    private static ElmResponseId GetResponseId(string response)
    {
        if (string.IsNullOrEmpty(response)) return ElmResponseId.Unknown;

        var upper = response.ToUpper().Trim();
        
        // Debug logging for CAN ERROR detection
        if (upper.Contains("CAN"))
        {
            Log.Debug($"[ELM_HANDLER] GetResponseId: Data contains 'CAN': '{response}' -> Upper: '{upper}'");
        }

        if (upper.StartsWith(">")) return ElmResponseId.Prompt;
        if (upper.StartsWith("OK")) return ElmResponseId.Ok;
        if (upper.StartsWith("ELM")) return ElmResponseId.Model;
        if (upper.StartsWith("SEARCHING")) return ElmResponseId.Searching;
        // CAN/BUS errors must be checked before generic ERROR
        if (upper.Contains("CAN ERROR")) 
        {
            Log.Debug($"[ELM_HANDLER] GetResponseId: Detected CAN ERROR");
            return ElmResponseId.CanError;
        }
        if (upper.Contains("BUS ERROR")) return ElmResponseId.BusError;
        if (upper.StartsWith("UNABLE")) return ElmResponseId.Unable;
        if (upper.StartsWith("ERROR")) return ElmResponseId.Error;
        if (upper.Contains("BUSINIT")) return ElmResponseId.BusInitError;
        if (upper.StartsWith("BUSBUSY")) return ElmResponseId.BusBusy;
        if (upper.StartsWith("BUFFERFULL")) return ElmResponseId.BufferFull;
        if (upper.StartsWith("STOPPED")) return ElmResponseId.Stopped;
        if (upper.StartsWith("?")) return ElmResponseId.QuestionMark;

        return ElmResponseId.Data;
    }
    
    /// <summary>
    /// Thread-safe error tracking with 30-second window
    /// Returns true if error limit reached
    /// </summary>
    private bool TrackError(string errorType)
    {
        lock (_canErrorLock)
        {
            var now = DateTime.UtcNow;
            
            // Reset counter if last error was more than 30 seconds ago
            if (now - _lastCanErrorTime > _canErrorWindow)
            {
                _consecutiveCanErrors = 0;
                Log.Debug($"[ELM_HANDLER] Error window expired, resetting counter");
            }
            
            _consecutiveCanErrors++;
            _lastCanErrorTime = now;
            
            Log.Debug($"[ELM_HANDLER] {errorType} #{_consecutiveCanErrors}/{CanErrorThreshold}");
            
            if (_consecutiveCanErrors >= CanErrorThreshold)
            {
                Log.Debug($"[ELM_HANDLER] ERROR limit reached ({CanErrorThreshold}). Firing CanErrorLimitReached event.");
                CanErrorLimitReached?.Invoke(this, EventArgs.Empty);
                _consecutiveCanErrors = 0;
                return true;
            }
            return false;
        }
    }
    
    /// <summary>
    /// Thread-safe reset of error counter
    /// </summary>
    private void ResetErrorCounter(string reason)
    {
        lock (_canErrorLock)
        {
            if (_consecutiveCanErrors > 0)
            {
                _consecutiveCanErrors = 0;
                _lastCanErrorTime = DateTime.MinValue;
                Log.Debug($"[ELM_HANDLER] Error counter reset ({reason})");
            }
        }
    }
}

/// <summary>
/// ELM response identifiers
/// </summary>
public enum ElmResponseId
{
    Prompt,
    Ok,
    Model,
    Searching,
    Error,
    Unable,
    CanError,
    BusError,
    BusInitError,
    BusBusy,
    BufferFull,
    Stopped,
    QuestionMark,
    Data,
    Unknown
}

/// <summary>
/// Event args for PID data reception
/// </summary>
public class PidDataReceivedEventArgs : EventArgs
{
    public ObdService Service { get; set; }
    public byte Pid { get; set; }
    public string RawData { get; set; } = "";
    public string FullMessage { get; set; } = "";
}

/// <summary>
/// Event args for raw data reception
/// </summary>
public class RawDataReceivedEventArgs : EventArgs
{
    public string Data { get; set; } = "";
}
