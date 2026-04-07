using CommunityToolkit.Mvvm.ComponentModel;
using llcar.Services;

namespace llcar.Models;

/// <summary>
/// ViewModel for displaying feature check status in UI
/// </summary>
public partial class FeatureCheckViewModel : ObservableObject
{
    [ObservableProperty]
    private string _featureId = "";
    
    [ObservableProperty]
    private string _featureName = "";
    
    [ObservableProperty]
    private string _category = "";
    
    [ObservableProperty]
    private bool _isTriggered;
    
    [ObservableProperty]
    private string _statusText = "Норма";
    
    [ObservableProperty]
    private string _statusColor = "#34C759"; // Green
    
    [ObservableProperty]
    private string? _aIExplanation;
    
    [ObservableProperty]
    private double? _confidence;
    
    [ObservableProperty]
    private bool _hasAIAnalysis;
    
    [ObservableProperty]
    private List<string> _possibleCauses = new();
    
    [ObservableProperty]
    private List<string> _recommendations = new();
    
    [ObservableProperty]
    private DateTime _lastEvaluated;
    
    [ObservableProperty]
    private double? _deviationPercent;
    
    [ObservableProperty]
    private bool _isVerified;
    
    public void UpdateFromResult(FeatureEvaluationResult result, AIAnalysis? aiAnalysis)
    {
        IsTriggered = result.IsTriggered;
        StatusText = result.Severity switch
        {
            FeatureSeverity.Critical => "Критично",
            FeatureSeverity.Warning => "Внимание",
            FeatureSeverity.Info => "Инфо",
            _ => "Норма"
        };
        StatusColor = result.Severity switch
        {
            FeatureSeverity.Critical => "#FF3B30", // Red
            FeatureSeverity.Warning => "#FF9500", // Orange
            FeatureSeverity.Info => "#0A84FF", // Blue
            _ => "#34C759" // Green
        };
        LastEvaluated = result.Timestamp;
        
        if (aiAnalysis != null)
        {
            HasAIAnalysis = true;
            AIExplanation = aiAnalysis.Explanation;
            Confidence = aiAnalysis.Confidence;
            PossibleCauses = aiAnalysis.PossibleCauses ?? new List<string>();
            Recommendations = aiAnalysis.Recommendations ?? new List<string>();
        }
    }
}
