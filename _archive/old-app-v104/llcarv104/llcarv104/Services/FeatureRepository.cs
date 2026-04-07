using llcar.Models;
using SQLite;
using SQLitePCL;

namespace llcar.Services;

/// <summary>
/// Repository for diagnostic features
/// </summary>
public interface IFeatureRepository
{
    /// <summary>
    /// Get all features (local and synced)
    /// </summary>
    Task<List<DiagnosticFeature>> GetAllAsync();
    
    /// <summary>
    /// Get enabled features only
    /// </summary>
    Task<List<DiagnosticFeature>> GetEnabledAsync();
    
    /// <summary>
    /// Get feature by ID
    /// </summary>
    Task<DiagnosticFeature?> GetByIdAsync(string id);
    
    /// <summary>
    /// Save feature (insert or update)
    /// </summary>
    Task SaveAsync(DiagnosticFeature feature);
    
    /// <summary>
    /// Delete feature
    /// </summary>
    Task DeleteAsync(string id);
    
    /// <summary>
    /// Get local changes since last sync
    /// </summary>
    Task<List<DiagnosticFeature>> GetLocalChangesAsync(DateTime since);
    
    /// <summary>
    /// Save synced features from server
    /// </summary>
    Task SaveSyncedFeaturesAsync(List<DiagnosticFeature> features);
    
    /// <summary>
    /// Save evaluation history
    /// </summary>
    Task SaveEvaluationAsync(FeatureEvaluation evaluation);
    
    /// <summary>
    /// Get evaluation history for feature
    /// </summary>
    Task<List<FeatureEvaluation>> GetEvaluationHistoryAsync(string featureId, int limit = 100);
    
    /// <summary>
    /// Get sync metadata
    /// </summary>
    Task<FeatureSyncMetadata?> GetSyncMetadataAsync();
    
    /// <summary>
    /// Save sync metadata
    /// </summary>
    Task SaveSyncMetadataAsync(FeatureSyncMetadata metadata);
}

/// <summary>
/// SQLite implementation of feature repository
/// </summary>
public class FeatureRepository : IFeatureRepository
{
    private readonly SQLiteAsyncConnection _database;
    
    public FeatureRepository(SQLiteAsyncConnection database)
    {
        _database = database;
        InitializeAsync().Wait();
    }
    
    private async Task InitializeAsync()
    {
        await _database.CreateTableAsync<DiagnosticFeatureEntity>();
        await _database.CreateTableAsync<FeatureEvaluationEntity>();
        await _database.CreateTableAsync<FeatureSyncMetadataEntity>();
    }
    
    public async Task<List<DiagnosticFeature>> GetAllAsync()
    {
        var entities = await _database.Table<DiagnosticFeatureEntity>().ToListAsync();
        return entities.Select(MapToModel).ToList();
    }
    
    public async Task<List<DiagnosticFeature>> GetEnabledAsync()
    {
        var entities = await _database.Table<DiagnosticFeatureEntity>()
            .Where(f => f.IsEnabled)
            .ToListAsync();
        return entities.Select(MapToModel).ToList();
    }
    
    public async Task<DiagnosticFeature?> GetByIdAsync(string id)
    {
        var entity = await _database.Table<DiagnosticFeatureEntity>()
            .Where(f => f.Id == id)
            .FirstOrDefaultAsync();
        return entity != null ? MapToModel(entity) : null;
    }
    
    public async Task SaveAsync(DiagnosticFeature feature)
    {
        var entity = MapToEntity(feature);
        entity.UpdatedAt = DateTime.UtcNow;
        
        var existing = await _database.Table<DiagnosticFeatureEntity>()
            .Where(f => f.Id == feature.Id)
            .FirstOrDefaultAsync();
        
        if (existing != null)
        {
            entity.CreatedAt = existing.CreatedAt;
            await _database.UpdateAsync(entity);
        }
        else
        {
            await _database.InsertAsync(entity);
        }
    }
    
    public async Task DeleteAsync(string id)
    {
        await _database.Table<DiagnosticFeatureEntity>()
            .Where(f => f.Id == id)
            .DeleteAsync();
    }
    
    public async Task<List<DiagnosticFeature>> GetLocalChangesAsync(DateTime since)
    {
        var entities = await _database.Table<DiagnosticFeatureEntity>()
            .Where(f => f.IsLocal && f.UpdatedAt > since)
            .ToListAsync();
        return entities.Select(MapToModel).ToList();
    }
    
    public async Task SaveSyncedFeaturesAsync(List<DiagnosticFeature> features)
    {
        foreach (var feature in features.Where(f => !f.IsLocal))
        {
            await SaveAsync(feature);
        }
    }
    
    public async Task SaveEvaluationAsync(FeatureEvaluation evaluation)
    {
        var entity = new FeatureEvaluationEntity
        {
            FeatureId = evaluation.FeatureId,
            ClientHash = evaluation.ClientHash,
            Timestamp = evaluation.Timestamp,
            ComputedValue = evaluation.ComputedValue,
            ExpectedRangeJson = System.Text.Json.JsonSerializer.Serialize(evaluation.ExpectedRange),
            DeviationPercent = evaluation.DeviationPercent,
            Status = evaluation.Status,
            Confidence = evaluation.Confidence,
            AIAnalysisJson = System.Text.Json.JsonSerializer.Serialize(evaluation.AIAnalysis),
            ContextJson = System.Text.Json.JsonSerializer.Serialize(evaluation.Context)
        };
        
        await _database.InsertAsync(entity);
    }
    
    public async Task<List<FeatureEvaluation>> GetEvaluationHistoryAsync(string featureId, int limit = 100)
    {
        var entities = await _database.Table<FeatureEvaluationEntity>()
            .Where(e => e.FeatureId == featureId)
            .OrderByDescending(e => e.Timestamp)
            .Take(limit)
            .ToListAsync();
        
        return entities.Select(e => new FeatureEvaluation
        {
            Id = e.Id,
            FeatureId = e.FeatureId,
            ClientHash = e.ClientHash,
            Timestamp = e.Timestamp,
            ComputedValue = e.ComputedValue,
            ExpectedRange = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, double>>(e.ExpectedRangeJson),
            DeviationPercent = e.DeviationPercent,
            Status = e.Status,
            Confidence = e.Confidence,
            AIAnalysis = System.Text.Json.JsonSerializer.Deserialize<AIAnalysis>(e.AIAnalysisJson),
            Context = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(e.ContextJson)
        }).ToList();
    }
    
    public async Task<FeatureSyncMetadata?> GetSyncMetadataAsync()
    {
        var entity = await _database.Table<FeatureSyncMetadataEntity>().FirstOrDefaultAsync();
        if (entity == null) return null;
        
        return new FeatureSyncMetadata
        {
            LastSync = entity.LastSync,
            FeaturesCount = entity.FeaturesCount
        };
    }
    
    public async Task SaveSyncMetadataAsync(FeatureSyncMetadata metadata)
    {
        var entity = new FeatureSyncMetadataEntity
        {
            Id = 1,
            LastSync = metadata.LastSync,
            FeaturesCount = metadata.FeaturesCount
        };
        
        var existing = await _database.Table<FeatureSyncMetadataEntity>().FirstOrDefaultAsync();
        if (existing != null)
        {
            await _database.UpdateAsync(entity);
        }
        else
        {
            await _database.InsertAsync(entity);
        }
    }
    
    // Mapping methods
    private DiagnosticFeature MapToModel(DiagnosticFeatureEntity entity)
    {
        return new DiagnosticFeature
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
            Category = entity.Category,
            RuleJson = entity.RuleJson,
            IsEnabled = entity.IsEnabled,
            IsVerified = entity.IsVerified,
            IsLocal = entity.IsLocal,
            AuthorHash = entity.AuthorHash,
            Version = entity.Version,
            UseAIAnalysis = entity.UseAIAnalysis,
            AIPromptTemplate = entity.AIPromptTemplate,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }
    
    private DiagnosticFeatureEntity MapToEntity(DiagnosticFeature model)
    {
        return new DiagnosticFeatureEntity
        {
            Id = model.Id,
            Name = model.Name,
            Description = model.Description,
            Category = model.Category,
            RuleJson = model.RuleJson,
            IsEnabled = model.IsEnabled,
            IsVerified = model.IsVerified,
            IsLocal = model.IsLocal,
            AuthorHash = model.AuthorHash,
            Version = model.Version,
            UseAIAnalysis = model.UseAIAnalysis,
            AIPromptTemplate = model.AIPromptTemplate,
            CreatedAt = model.CreatedAt,
            UpdatedAt = model.UpdatedAt
        };
    }
}

// SQLite entities
public class DiagnosticFeatureEntity
{
    [PrimaryKey]
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string Category { get; set; } = "";
    public string RuleJson { get; set; } = "";
    public bool IsEnabled { get; set; }
    public bool IsVerified { get; set; }
    public bool IsLocal { get; set; }
    public string? AuthorHash { get; set; }
    public int Version { get; set; }
    public bool UseAIAnalysis { get; set; }
    public string? AIPromptTemplate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class FeatureEvaluationEntity
{
    [PrimaryKey, AutoIncrement]
    public long Id { get; set; }
    public string FeatureId { get; set; } = "";
    public string ClientHash { get; set; } = "";
    public DateTime Timestamp { get; set; }
    public double? ComputedValue { get; set; }
    public string? ExpectedRangeJson { get; set; }
    public double? DeviationPercent { get; set; }
    public int Status { get; set; }
    public double? Confidence { get; set; }
    public string? AIAnalysisJson { get; set; }
    public string? ContextJson { get; set; }
}

public class FeatureSyncMetadataEntity
{
    [PrimaryKey]
    public int Id { get; set; }
    public DateTime LastSync { get; set; }
    public int FeaturesCount { get; set; }
}
