using LLama;
using LLama.Common;
using llcar.Models;
using System.Text;
using System.Text.Json;
using Core.Logger;

namespace llcar.Services;

/// <summary>
/// Service for AI analysis using local Qwen model
/// </summary>
public interface ILLMService
{
    /// <summary>
    /// Initialize the model (load from file)
    /// </summary>
    Task InitializeAsync(CancellationToken ct = default);
    
    /// <summary>
    /// Analyze deviation using AI
    /// </summary>
    Task<AIAnalysis?> AnalyzeDeviationAsync(
        DiagnosticFeature feature,
        AggregatedDataPacket currentData,
        AggregationResponse? similarData,
        RuleEvaluationResult ruleResult,
        CancellationToken ct = default);
    
    /// <summary>
    /// Check if model is loaded and ready
    /// </summary>
    bool IsInitialized { get; }
}

/// <summary>
/// Local LLM service using Qwen GGUF model
/// </summary>
public class LLMService : ILLMService
{
    private readonly ServiceLogger _logger;
    private LLamaWeights? _weights;
    private LLamaContext? _context;
    private InteractiveExecutor? _executor;
    private bool _isInitialized = false;
    private readonly string _modelPath;
    
    public bool IsInitialized => _isInitialized;
    
    public LLMService(ServiceLogger logger)
    {
        _logger = logger;
        
        // Model file in project root
        _modelPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "Qwen3.5-2B-UD-Q5_K_XL.gguf");
        
        _logger.Debug($"[LLM] Model path: {_modelPath}");
    }
    
    public async Task InitializeAsync(CancellationToken ct = default)
    {
        if (_isInitialized) return;
        
        try
        {
            _logger.Information("[LLM] Initializing Qwen model...");
            
            // Check if model exists
            if (!File.Exists(_modelPath))
            {
                _logger.Error("[LLM] Model file not found: {ModelPath}", _modelPath);
                return;
            }
            
            var modelSize = new FileInfo(_modelPath).Length / (1024 * 1024);
            _logger.Information($"[LLM] Model size: {modelSize} MB");
            
            // Model parameters optimized for mobile
            var parameters = new ModelParams(_modelPath)
            {
                ContextSize = 4096,
                GpuLayerCount = 0,  // CPU only for mobile compatibility
                Threads = 4,        // Limit threads for mobile
                BatchSize = 512
            };
            
            _logger.Debug("[LLM] Loading model weights...");
            _weights = await LLamaWeights.LoadFromFileAsync(parameters);
            
            _logger.Debug("[LLM] Creating context...");
            _context = _weights.CreateContext(parameters);
            
            _logger.Debug("[LLM] Creating executor...");
            _executor = new InteractiveExecutor(_context);
            
            _isInitialized = true;
            _logger.Information("[LLM] Qwen model initialized successfully");
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "[LLM] Error initializing model");
            _isInitialized = false;
        }
    }
    
    public async Task<AIAnalysis?> AnalyzeDeviationAsync(
        DiagnosticFeature feature,
        AggregatedDataPacket currentData,
        AggregationResponse? similarData,
        RuleEvaluationResult ruleResult,
        CancellationToken ct = default)
    {
        if (!_isInitialized || _executor == null)
        {
            _logger.Warning("[LLM] Model not initialized, skipping AI analysis");
            return null;
        }
        
        try
        {
            _logger.Debug($"[LLM] Analyzing feature: {feature.Name}");
            
            var prompt = BuildPrompt(feature, currentData, similarData, ruleResult);
            
            var inferenceParams = new InferenceParams
            {
                MaxTokens = 1024,
                Temperature = 0.3f,  // Lower = more focused
                AntiPrompts = new[] { "<|im_end|>", "Human:", "Assistant:" }
            };
            
            var response = new StringBuilder();
            await foreach (var token in _executor.InferAsync(prompt, inferenceParams))
            {
                ct.ThrowIfCancellationRequested();
                response.Append(token);
            }
            
            var analysis = ParseResponse(response.ToString());
            _logger.Debug($"[LLM] Analysis complete. Status: {analysis?.Status}, Confidence: {analysis?.Confidence}");
            
            return analysis;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "[LLM] Error during analysis");
            return null;
        }
    }
    
    private string BuildPrompt(
        DiagnosticFeature feature,
        AggregatedDataPacket currentData,
        AggregationResponse? similarData,
        RuleEvaluationResult ruleResult)
    {
        var template = GetPromptTemplate(feature.Category);
        
        var currentParams = FormatCurrentParameters(currentData);
        var similarInfo = similarData?.SimilarRecordsFound > 0 
            ? $"Найдено {similarData.SimilarRecordsFound} похожих записей" 
            : "Нет данных для сравнения";
        
        return template
            .Replace("{feature_name}", feature.Name)
            .Replace("{feature_description}", feature.Description ?? "")
            .Replace("{current_parameters}", currentParams)
            .Replace("{similar_data_info}", similarInfo)
            .Replace("{triggered_rules}", string.Join(", ", ruleResult.TriggeredRules));
    }
    
    private string GetPromptTemplate(string category)
    {
        return category.ToLower() switch
        {
            "engine" => @"<|im_start|>system
Ты - эксперт по автомобильным двигателям. Анализируй отклонения параметров двигателя.
Ответь строго в JSON формате без markdown:
{ ""status"": ""normal|warning|critical"", ""confidence"": 0.0-1.0, ""explanation"": ""..."", ""possible_causes"": [""...""], ""recommendations"": [""...""] }
<|im_end|>
<|im_start|>user
Признак: {feature_name}
Описание: {feature_description}
Текущие параметры:
{current_parameters}
Сработавшие правила: {triggered_rules}
Данные с других авто: {similar_data_info}
Что именно вышло за пределы нормы и почему?
<|im_end|>
<|im_start|>assistant",

            "suspension" => @"<|im_start|>system
Ты - эксперт по автомобильной подвеске. Анализируй вибрации и удары.
Ответь строго в JSON формате:
{ ""status"": ""normal|warning|critical"", ""confidence"": 0.0-1.0, ""explanation"": ""..."", ""possible_causes"": [""...""], ""recommendations"": [""...""] }
<|im_end|>
<|im_start|>user
Признак: {feature_name}
Текущие параметры подвески:
{current_parameters}
Сработавшие правила: {triggered_rules}
Анализ вибрации и причины отклонения?
<|im_end|>
<|im_start|>assistant",

            "brakes" => @"<|im_start|>system
Ты - эксперт по тормозным системам.
Ответь строго в JSON формате:
{ ""status"": ""normal|warning|critical"", ""confidence"": 0.0-1.0, ""explanation"": ""..."", ""possible_causes"": [""...""], ""recommendations"": [""...""] }
<|im_end|>
<|im_start|>user
Признак: {feature_name}
Параметры торможения:
{current_parameters}
Что не так с тормозами?
<|im_end|>
<|im_start|>assistant",

            "electrical" => @"<|im_start|>system
Ты - автоэлектрик. Анализируй электрические параметры.
Ответь строго в JSON формате:
{ ""status"": ""normal|warning|critical"", ""confidence"": 0.0-1.0, ""explanation"": ""..."", ""possible_causes"": [""...""], ""recommendations"": [""...""] }
<|im_end|>
<|im_start|>user
Признак: {feature_name}
Электрические параметры:
{current_parameters}
В чем проблема с электрикой?
<|im_end|>
<|im_start|>assistant",

            _ => @"<|im_start|>system
Ты - автомобильный диагност. Анализируй отклонения параметров.
Ответь строго в JSON формате:
{ ""status"": ""normal|warning|critical"", ""confidence"": 0.0-1.0, ""explanation"": ""..."", ""possible_causes"": [""...""], ""recommendations"": [""...""] }
<|im_end|>
<|im_start|>user
Признак: {feature_name}
Текущие параметры:
{current_parameters}
Сработавшие правила: {triggered_rules}
Объясни отклонение.
<|im_end|>
<|im_start|>assistant"
        };
    }
    
    private string FormatCurrentParameters(AggregatedDataPacket data)
    {
        var sb = new StringBuilder();
        
        // OBD2
        foreach (var kvp in data.OBD2Stats)
        {
            var avg = kvp.Value.Avg / 1000.0;
            var min = kvp.Value.Min / 1000.0;
            var max = kvp.Value.Max / 1000.0;
            sb.AppendLine($"- {kvp.Key}: среднее={avg:F2}, min={min:F2}, max={max:F2}");
        }
        
        // Accelerometer
        if (data.AccelerometerStats.Any())
        {
            sb.AppendLine("Акселерометр:");
            foreach (var kvp in data.AccelerometerStats)
            {
                var avg = kvp.Value.Avg / 1000.0;
                sb.AppendLine($"  {kvp.Key}: {avg:F3} m/s²");
            }
        }
        
        // Context
        sb.AppendLine($"Контекст: {data.Context.RoadType}, {data.Context.Season}, {data.Context.AccelerationState}");
        
        return sb.ToString();
    }
    
    private AIAnalysis? ParseResponse(string response)
    {
        try
        {
            // Extract JSON from response
            var jsonMatch = System.Text.RegularExpressions.Regex.Match(
                response, 
                @"\{[^{}]*\}");
            
            if (!jsonMatch.Success)
            {
                _logger.Warning("[LLM] No JSON found in response");
                return null;
            }
            
            var json = jsonMatch.Value;
            var analysis = JsonSerializer.Deserialize<AIAnalysis>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            
            return analysis;
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "[LLM] Error parsing AI response");
            return new AIAnalysis
            {
                Status = "unknown",
                Confidence = 0.0,
                Explanation = "Не удалось разобрать ответ AI",
                PossibleCauses = new List<string>(),
                Recommendations = new List<string>()
            };
        }
    }
}
