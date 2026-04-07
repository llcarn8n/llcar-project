using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace llcar.Services
{
    /// <summary>
    /// Service for tracking Bluetooth connection reconnect status across ViewModels
    /// </summary>
    public class BluetoothReconnectService : INotifyPropertyChanged
    {
        private static BluetoothReconnectService? _instance;
        public static BluetoothReconnectService Instance => _instance ??= new BluetoothReconnectService();

        private bool _isReconnecting;
        private int _currentAttempt;
        private int _maxAttempts = 3;
        private bool _hasFailed;

        public bool IsReconnecting
        {
            get => _isReconnecting;
            set
            {
                if (_isReconnecting != value)
                {
                    _isReconnecting = value;
                    OnPropertyChanged();
                }
            }
        }

        public int CurrentAttempt
        {
            get => _currentAttempt;
            set
            {
                if (_currentAttempt != value)
                {
                    _currentAttempt = value;
                    OnPropertyChanged();
                }
            }
        }

        public int MaxAttempts
        {
            get => _maxAttempts;
            set
            {
                if (_maxAttempts != value)
                {
                    _maxAttempts = value;
                    OnPropertyChanged();
                }
            }
        }

        public bool HasFailed
        {
            get => _hasFailed;
            set
            {
                if (_hasFailed != value)
                {
                    _hasFailed = value;
                    OnPropertyChanged();
                }
            }
        }

        public event PropertyChangedEventHandler? PropertyChanged;

        protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        public void Reset()
        {
            IsReconnecting = false;
            CurrentAttempt = 0;
            HasFailed = false;
        }

        public void StartReconnect(int attemptNumber)
        {
            IsReconnecting = true;
            CurrentAttempt = attemptNumber;
            HasFailed = false;
        }

        public void FailReconnect()
        {
            IsReconnecting = false;
            HasFailed = true;
        }
    }
}
