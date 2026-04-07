namespace llcar.Services.ObdProtocol;

/// <summary>
/// OBD connection states (based on AndrOBD's state machine)
/// </summary>
public enum ObdState
{
    /// <summary>Not connected or undefined state</summary>
    Undefined,
    
    /// <summary>Initializing adapter</summary>
    Initializing,
    
    /// <summary>Adapter initialized</summary>
    Initialized,
    
    /// <summary>Detecting ECU addresses</summary>
    EcuDetect,
    
    /// <summary>ECU detection complete</summary>
    EcuDetected,
    
    /// <summary>Connecting to vehicle</summary>
    Connecting,
    
    /// <summary>Connected and ready</summary>
    Connected,
    
    /// <summary>No data received from ECU</summary>
    NoData,
    
    /// <summary>Communication stopped</summary>
    Stopped,
    
    /// <summary>Disconnected</summary>
    Disconnected,
    
    /// <summary>Bus/communication error</summary>
    BusError,
    
    /// <summary>Data error</summary>
    DataError,
    
    /// <summary>General error state</summary>
    Error
}

/// <summary>
/// OBD Service modes (SAE J1979)
/// </summary>
public enum ObdService : byte
{
    /// <summary>No active service</summary>
    None = 0x00,
    
    /// <summary>Current data - Mode 01</summary>
    CurrentData = 0x01,
    
    /// <summary>Freeze frame data - Mode 02</summary>
    FreezeFrame = 0x02,
    
    /// <summary>Read stored DTCs - Mode 03</summary>
    ReadTroubleCodes = 0x03,
    
    /// <summary>Clear DTCs - Mode 04</summary>
    ClearTroubleCodes = 0x04,
    
    /// <summary>O2 sensor test results - Mode 05</summary>
    O2SensorTest = 0x05,
    
    /// <summary>Monitor test results - Mode 06</summary>
    MonitorTest = 0x06,
    
    /// <summary>Pending DTCs - Mode 07</summary>
    PendingTroubleCodes = 0x07,
    
    /// <summary>Control operation - Mode 08</summary>
    ControlOperation = 0x08,
    
    /// <summary>Vehicle information - Mode 09</summary>
    VehicleInfo = 0x09,
    
    /// <summary>Permanent DTCs - Mode 0A</summary>
    PermanentTroubleCodes = 0x0A
}

/// <summary>
/// ELM327 protocol types
/// </summary>
public enum ElmProtocol
{
    Automatic = 0,
    J1850PWM = 1,
    J1850VPW = 2,
    ISO9141_2 = 3,
    ISO14230_4_Slow = 4,
    ISO14230_4_Fast = 5,
    ISO15765_4_CAN_11bit_500k = 6,
    ISO15765_4_CAN_29bit_500k = 7,
    ISO15765_4_CAN_11bit_250k = 8,
    ISO15765_4_CAN_29bit_250k = 9,
    SAEJ1939_CAN_29bit_250k = 10,
    User1_CAN_11bit_125k = 11,
    User2_CAN_11bit_50k = 12
}

/// <summary>
/// Negative Response Codes (NRC) - ISO 14229
/// </summary>
public enum NegativeResponseCode : byte
{
    GeneralReject = 0x10,
    ServiceNotSupported = 0x11,
    SubFunctionNotSupported = 0x12,
    IncorrectMessageLength = 0x13,
    ResponseTooLong = 0x14,
    BusyRepeatRequest = 0x21,
    ConditionsNotCorrect = 0x22,
    RequestSequenceError = 0x24,
    NoResponseFromSubnet = 0x25,
    FailurePreventsExecution = 0x26,
    RequestOutOfRange = 0x31,
    SecurityAccessDenied = 0x33,
    InvalidKey = 0x35,
    ExceededNumberOfAttempts = 0x36,
    RequiredTimeDelayNotExpired = 0x37,
    UploadDownloadNotAccepted = 0x70,
    TransferDataSuspended = 0x71,
    GeneralProgrammingFailure = 0x72,
    WrongBlockSequenceCounter = 0x73,
    ResponsePending = 0x78,
    SubFunctionNotSupportedInSession = 0x7E,
    ServiceNotSupportedInSession = 0x7F
}

/// <summary>
/// State change event args
/// </summary>
public class ObdStateChangedEventArgs : EventArgs
{
    public ObdState OldState { get; set; }
    public ObdState NewState { get; set; }
    public string? Message { get; set; }
}
