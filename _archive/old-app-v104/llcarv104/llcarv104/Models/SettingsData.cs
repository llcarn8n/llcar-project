using CommunityToolkit.Mvvm.ComponentModel;
using llcar.Services;

namespace llcar.Models
{
    /// <summary>
    /// Application settings data model
    /// </summary>
    public partial class SettingsData : ObservableObject
    {
        private string _selectedAdapter = "";
        private bool _recordNoise = true;  // Audio recording enabled by default
        private bool _hasConfiguredBluetooth = false;
        private string _selectedBrandId = "generic";
        private string _serverUrl = "http://device.llcar.ru";
        private string _mobileNumber = "";
        private string _email = "";
        private string _vin = "";
        private string _clientHash = "";
        private bool _enableLocationTracking = true;
        private bool _autoConnectToOBD2 = true;
        private int _uploadIntervalSeconds = 3;
        private int _accelerometerSampleRate = 50;
        private bool _useClassicBluetooth = false;  // BLE mode by default
        private string _language = "ru";
        private string _selectedBrandName = "";
        private string _selectedModelId = "";
        private string _selectedModelName = "";
        private int _selectedYear = 0;
        private double _wheelRadius = 21.0;  // Default wheel radius in inches (Li L7)
        private bool _showAllBluetoothDevices = true;  // Always show all BT devices without ELM327 filter
        
        // Logging settings
        private LogLevel _logLevel = LogLevel.Verbose;  // Default: Verbose for full debugging
        private bool _autoSendLogsOnCrash = true;
        private int _maxLogFileSizeMB = 10;
        private int _logRetentionDays = 7;

        public bool ShowAllBluetoothDevices
        {
            get => _showAllBluetoothDevices;
            set => SetProperty(ref _showAllBluetoothDevices, value);
        }

        public string Language
        {
            get => _language;
            set => SetProperty(ref _language, value);
        }

        public string SelectedBrandName
        {
            get => _selectedBrandName;
            set => SetProperty(ref _selectedBrandName, value);
        }

        public string SelectedModelId
        {
            get => _selectedModelId;
            set => SetProperty(ref _selectedModelId, value);
        }

        public string SelectedModelName
        {
            get => _selectedModelName;
            set => SetProperty(ref _selectedModelName, value);
        }

        public int SelectedYear
        {
            get => _selectedYear;
            set => SetProperty(ref _selectedYear, value);
        }

        public string SelectedAdapter
        {
            get => _selectedAdapter;
            set => SetProperty(ref _selectedAdapter, value);
        }

        public bool RecordNoise
        {
            get => _recordNoise;
            set => SetProperty(ref _recordNoise, value);
        }

        public bool HasConfiguredBluetooth
        {
            get => _hasConfiguredBluetooth;
            set => SetProperty(ref _hasConfiguredBluetooth, value);
        }

        public string SelectedBrandId
        {
            get => _selectedBrandId;
            set => SetProperty(ref _selectedBrandId, value);
        }

        public string ServerUrl
        {
            get => _serverUrl;
            set => SetProperty(ref _serverUrl, value);
        }

        public string MobileNumber
        {
            get => _mobileNumber;
            set => SetProperty(ref _mobileNumber, value);
        }

        public string Email
        {
            get => _email;
            set => SetProperty(ref _email, value);
        }

        public string Vin
        {
            get => _vin;
            set => SetProperty(ref _vin, value);
        }

        public string ClientHash
        {
            get => _clientHash;
            set => SetProperty(ref _clientHash, value);
        }

        public bool EnableLocationTracking
        {
            get => _enableLocationTracking;
            set => SetProperty(ref _enableLocationTracking, value);
        }

        public int UploadIntervalSeconds
        {
            get => _uploadIntervalSeconds;
            set => SetProperty(ref _uploadIntervalSeconds, value);
        }

        public int AccelerometerSampleRate
        {
            get => _accelerometerSampleRate;
            set => SetProperty(ref _accelerometerSampleRate, value);
        }

        public bool UseClassicBluetooth
        {
            get => _useClassicBluetooth;
            set => SetProperty(ref _useClassicBluetooth, value);
        }

        public bool AutoConnectToOBD2
        {
            get => _autoConnectToOBD2;
            set => SetProperty(ref _autoConnectToOBD2, value);
        }

        public double WheelRadius
        {
            get => _wheelRadius;
            set => SetProperty(ref _wheelRadius, value);
        }

        // Logging settings
        public LogLevel LogLevel
        {
            get => _logLevel;
            set => SetProperty(ref _logLevel, value);
        }

        public bool AutoSendLogsOnCrash
        {
            get => _autoSendLogsOnCrash;
            set => SetProperty(ref _autoSendLogsOnCrash, value);
        }

        public int MaxLogFileSizeMB
        {
            get => _maxLogFileSizeMB;
            set => SetProperty(ref _maxLogFileSizeMB, value);
        }

        public int LogRetentionDays
        {
            get => _logRetentionDays;
            set => SetProperty(ref _logRetentionDays, value);
        }
    }
}
