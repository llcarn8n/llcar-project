using llcar.Models;
using System.Text.Json;
using Core.Logger;

namespace llcar.Services;

/// <summary>
/// Service for evaluating diagnostic features
/// </summary>
public interface IRulesEngineService
{
    Task<RuleEvaluationResult> EvaluateFeatureAsync(
        DiagnosticFeature feature,
        AggregatedDataPacket data,
        CancellationToken ct = default);
    
    Task<List<RuleEvaluationResult>> EvaluateFeaturesAsync(
        List<DiagnosticFeature> features,
        AggregatedDataPacket data,
        CancellationToken ct = default);
}

/// <summary>
/// Simplified implementation without RulesEngine dependency
/// </summary>
public class RulesEngineService : IRulesEngineService
{
    private readonly ServiceLogger _logger;
    private readonly Dictionary<string, DiagnosticFeature> _featureCache = new();
    
    public RulesEngineService(ServiceLogger logger)
    {
        _logger = logger;
    }
    
    public async Task<RuleEvaluationResult> EvaluateFeatureAsync(
        DiagnosticFeature feature,
        AggregatedDataPacket data,
        CancellationToken ct = default)
    {
        try
        {
            _logger.Debug($"[RULES] Evaluating feature: {feature.Name}");
            
            // Simplified evaluation - just return normal status
            // TODO: Implement real rule evaluation when RulesEngine package is fixed
            return new RuleEvaluationResult
            {
                FeatureId = feature.Id,
                ComputedValue = 0,
                Status = 0, // Normal
                Confidence = 1.0,
                Message = "Feature evaluation stub - RulesEngine not available"
            };
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "[RULES] Error evaluating feature: {FeatureName}", feature.Name);
            return new RuleEvaluationResult
            {
                FeatureId = feature.Id,
                Status = 0,
                Confidence = 0,
                Message = $"Evaluation error: {ex.Message}"
            };
        }
    }
    
    public async Task<List<RuleEvaluationResult>> EvaluateFeaturesAsync(
        List<DiagnosticFeature> features,
        AggregatedDataPacket data,
        CancellationToken ct = default)
    {
        var results = new List<RuleEvaluationResult>();
        
        foreach (var feature in features.Where(f => f.IsEnabled))
        {
            ct.ThrowIfCancellationRequested();
            var result = await EvaluateFeatureAsync(feature, data, ct);
            results.Add(result);
        }
        
        return results;
    }
}

/// <summary>
/// Workflow data structure for JSON parsing
/// </summary>
public class WorkflowData
{
    public string? WorkflowName { get; set; }
    public List<RuleData>? Rules { get; set; }
}

public class RuleData
{
    public string? RuleName { get; set; }
    public string? Expression { get; set; }
    public string? Severity { get; set; }
    public string? ErrorMessage { get; set; }
}
