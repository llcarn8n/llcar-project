using llcar.Models;

namespace llcar.Services;

public class MicrophoneService
{
    private bool _isListening = false;
    private readonly TimeSpan _updateInterval = TimeSpan.FromMilliseconds(100);
    private CancellationTokenSource? _cts;
    private bool _isRecording = false;

    public bool IsListening => _isListening;
    public bool IsRecording => _isRecording;

    public event EventHandler<Models.MicrophoneData>? DataReceived;

    public enum MicrophoneStatus
    {
        NotSupported,
        NotListening,
        Listening
    }

    public async Task<bool> StartListeningAsync()
    {
        try
        {
            _cts = new CancellationTokenSource();

            while (!_cts.Token.IsCancellationRequested)
            {
                await Task.Delay(_updateInterval, _cts.Token);

                var microphoneData = await GetMicrophoneDataAsync();
                DataReceived?.Invoke(this, microphoneData);
            }

            return true;
        }
        catch (Exception ex)
        {
            Log.Debug($"Error in MicrophoneService: {ex.Message}");
            _isListening = false;
            _isRecording = false;
            return false;
        }
    }

    public void StopListening()
    {
        _cts?.Cancel();
        _isListening = false;
        _isRecording = false;
    }

    public async Task<Models.MicrophoneData> GetMicrophoneDataAsync()
    {
        return await Task.Run(() => new Models.MicrophoneData
        {
            VolumeLevel = 0,
            NoiseClassification = "Silent",
            Decibels = 0
        });
    }

    public bool IsSupported()
    {
        return true;
    }

    public MicrophoneStatus GetStatus()
    {
        return _isListening ? MicrophoneStatus.Listening : MicrophoneStatus.NotListening;
    }
}
