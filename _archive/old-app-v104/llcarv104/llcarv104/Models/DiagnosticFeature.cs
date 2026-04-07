using System.Text.Json.Serialization;

namespace llcar.Models;

/// <summary>
/// Diagnostic feature (user-defined rule)
/// </summary>
public class DiagnosticFeature
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";
    
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    
    [JsonPropertyName("category")]
    public string Category { get; set; } = "engine"; // engine, suspension, brakes, transmission, electrical
    
    [JsonPropertyName("rule_json")]
    public string RuleJson { get; set; } = "";
    
    [JsonPropertyName("is_enabled")]
    public bool IsEnabled { get; set; } = true;
    
    [JsonPropertyName("is_verified")]
    public bool IsVerified { get; set; } = false;
    
    [JsonPropertyName("is_local")]
    public bool IsLocal { get; set; } = false;
    
    [JsonPropertyName("author_hash")]
    public string? AuthorHash { get; set; }
    
    [JsonPropertyName("version")]
    public int Version { get; set; } = 1;
    
    [JsonPropertyName("use_ai_analysis")]
    public bool UseAIAnalysis { get; set; } = false;
    
    [JsonPropertyName("ai_prompt_template")]
    public string? AIPromptTemplate { get; set; }
    
    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [JsonPropertyName("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Feature evaluation history
/// </summary>
public class FeatureEvaluation
{
    [JsonPropertyName("id")]
    public long Id { get; set; }
    
    [JsonPropertyName("feature_id")]
    public string FeatureId { get; set; } = "";
    
    [JsonPropertyName("client_hash")]
    public string ClientHash { get; set; } = "";
    
    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }
    
    [JsonPropertyName("computed_value")]
    public double? ComputedValue { get; set; }
    
    [JsonPropertyName("expected_range")]
    public Dictionary<string, double>? ExpectedRange { get; set; }
    
    [JsonPropertyName("deviation_percent")]
    public double? DeviationPercent { get; set; }
    
    [JsonPropertyName("status")]
    public int Status { get; set; } // 0=Normal, 1=Warning, 2=Critical
    
    [JsonPropertyName("confidence")]
    public double? Confidence { get; set; }
    
    [JsonPropertyName("ai_analysis")]
    public AIAnalysis? AIAnalysis { get; set; }
    
    [JsonPropertyName("context")]
    public Dictionary<string, object>? Context { get; set; }
}

/// <summary>
/// AI analysis result
/// </summary>
public class AIAnalysis
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = "normal";
    
    [JsonPropertyName("confidence")]
    public double Confidence { get; set; }
    
    [JsonPropertyName("explanation")]
    public string? Explanation { get; set; }
    
    [JsonPropertyName("possible_causes")]
    public List<string>? PossibleCauses { get; set; }
    
    [JsonPropertyName("recommendations")]
    public List<string>? Recommendations { get; set; }
}

/// <summary>
/// Feature sync metadata
/// </summary>
public class FeatureSyncMetadata
{
    [JsonPropertyName("last_sync")]
    public DateTime LastSync { get; set; }
    
    [JsonPropertyName("features_count")]
    public int FeaturesCount { get; set; }
}
