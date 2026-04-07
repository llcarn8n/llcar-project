namespace llcar.Services.ObdProtocol;

/// <summary>
/// Adaptive timing modes
/// </summary>
public enum AdaptiveTimingMode
{
    /// <summary>Adaptive timing disabled</summary>
    Off,
    
    /// <summary>ELM327 adaptive timing mode 1</summary>
    ElmAt1,
    
    /// <summary>ELM327 adaptive timing mode 2</summary>
    ElmAt2,
    
    /// <summary>Software-based adaptive timing (recommended)</summary>
    Software
}

/// <summary>
/// Adaptive timing handler for optimizing ELM327 response timeouts
/// Based on AndrOBD's AdaptiveTiming implementation
/// </summary>
public class AdaptiveTiming
{
    // Constants
    private const int ELM_TIMEOUT_MAX = 1000;      // Maximum timeout in ms
    private const int ELM_TIMEOUT_DEFAULT = 200;   // Default timeout in ms
    private const int ELM_TIMEOUT_RES = 4;         // Resolution for adjustments in ms
    private const int ELM_TIMEOUT_MIN_DEFAULT = 12; // Minimum timeout in ms

    private int _elmTimeoutMin = ELM_TIMEOUT_MIN_DEFAULT;
    private int _elmTimeoutLrnLow = ELM_TIMEOUT_MIN_DEFAULT;
    private int _elmMsgTimeout = ELM_TIMEOUT_DEFAULT;
    private AdaptiveTimingMode _mode = AdaptiveTimingMode.Off;

    /// <summary>
    /// Current adaptive timing mode
    /// </summary>
    public AdaptiveTimingMode Mode
    {
        get => _mode;
        set
        {
            if (_mode != value)
            {
                Log.Debug($"AdaptiveTiming: {_mode} -> {value}");
                _mode = value;
                Initialize();
            }
        }
    }

    /// <summary>
    /// Current message timeout in milliseconds
    /// </summary>
    public int CurrentTimeoutMs => _elmMsgTimeout;

    /// <summary>
    /// Minimum configured timeout
    /// </summary>
    public int MinTimeoutMs
    {
        get => _elmTimeoutMin;
        set
        {
            Log.Debug($"AdaptiveTiming: Min timeout {_elmTimeoutMin} -> {value}");
            _elmTimeoutMin = value;
        }
    }

    /// <summary>
    /// Minimum learned timeout (from vehicle responses)
    /// </summary>
    public int LearnedMinTimeoutMs => _elmTimeoutLrnLow;

    /// <summary>
    /// Initializes the timing handler based on current mode
    /// </summary>
    public void Initialize()
    {
        if (_mode == AdaptiveTimingMode.Software)
        {
            // Reset learned minimum
            _elmTimeoutLrnLow = _elmTimeoutMin;
            // Set default timeout
            _elmMsgTimeout = ELM_TIMEOUT_DEFAULT;
            
            Log.Debug($"AdaptiveTiming: Initialized - timeout={_elmMsgTimeout}ms, min={_elmTimeoutMin}ms");
        }
        else if (_mode == AdaptiveTimingMode.ElmAt1 || _mode == AdaptiveTimingMode.ElmAt2)
        {
            // Let ELM handle timing
            _elmMsgTimeout = ELM_TIMEOUT_DEFAULT;
        }
    }

    /// <summary>
    /// Adapts the timeout based on response timing
    /// </summary>
    /// <param name="increaseTimeout">True if timeout should be increased (timeout occurred)</param>
    public void Adapt(bool increaseTimeout)
    {
        if (_mode != AdaptiveTimingMode.Software) return;

        if (increaseTimeout)
        {
            // Increase timeout since we may expect answers too fast
            if (_elmMsgTimeout + ELM_TIMEOUT_RES < ELM_TIMEOUT_MAX)
            {
                _elmMsgTimeout += ELM_TIMEOUT_RES;
                // Update learned minimum since we timed out
                _elmTimeoutLrnLow = Math.Max(_elmTimeoutMin, _elmMsgTimeout);
                
                Log.Debug($"AdaptiveTiming: Increased timeout to {_elmMsgTimeout}ms (learned min: {_elmTimeoutLrnLow}ms)");
            }
        }
        else
        {
            // Decrease timeout towards minimum limit
            if (_elmMsgTimeout - ELM_TIMEOUT_RES >= _elmTimeoutLrnLow)
            {
                _elmMsgTimeout -= ELM_TIMEOUT_RES;
                
                Log.Debug($"AdaptiveTiming: Decreased timeout to {_elmMsgTimeout}ms");
            }
        }
    }

    /// <summary>
    /// Records a successful response timing for learning
    /// </summary>
    /// <param name="responseTimeMs">Actual response time in milliseconds</param>
    public void RecordSuccessfulResponse(int responseTimeMs)
    {
        if (_mode != AdaptiveTimingMode.Software) return;

        // Add small margin to response time
        var targetTimeout = responseTimeMs + 20;
        
        // Only update if significantly different and above minimum
        if (targetTimeout >= _elmTimeoutMin && targetTimeout < _elmMsgTimeout - ELM_TIMEOUT_RES)
        {
            _elmMsgTimeout = targetTimeout;
            
            // Update learned minimum if this is lower
            if (targetTimeout > _elmTimeoutMin && targetTimeout < _elmTimeoutLrnLow)
            {
                _elmTimeoutLrnLow = targetTimeout;
                Log.Debug($"AdaptiveTiming: Learned min timeout = {_elmTimeoutLrnLow}ms");
            }
        }
    }

    /// <summary>
    /// Gets the ELM AT ST command value (timeout in 4ms increments)
    /// </summary>
    public int GetElmTimeoutValue()
    {
        return _elmMsgTimeout / 4;
    }

    /// <summary>
    /// Resets the timing to defaults
    /// </summary>
    public void Reset()
    {
        _elmMsgTimeout = ELM_TIMEOUT_DEFAULT;
        _elmTimeoutLrnLow = _elmTimeoutMin;
        Log.Debug($"AdaptiveTiming: Reset to defaults");
    }
}
