using System.Text.Json.Serialization;

namespace llcar.Models;

/// <summary>
/// Response from aggregation query
/// </summary>
public class AggregationResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = "";
    
    [JsonPropertyName("similar_records_found")]
    public int SimilarRecordsFound { get; set; }
    
    [JsonPropertyName("parameters")]
    public Dictionary<string, object>? Parameters { get; set; }
    
    [JsonPropertyName("similar_data")]
    public List<SimilarDataRecord>? SimilarData { get; set; }
    
    [JsonPropertyName("filters_applied")]
    public Dictionary<string, object>? FiltersApplied { get; set; }
    
    [JsonPropertyName("message")]
    public string? Message { get; set; }
}

/// <summary>
/// Similar data record from server
/// </summary>
public class SimilarDataRecord
{
    [JsonPropertyName("parameters_json")]
    public Dictionary<string, object>? ParametersJson { get; set; }
    
    [JsonPropertyName("calculated_at")]
    public DateTime CalculatedAt { get; set; }
}
