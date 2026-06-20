using Microsoft.EntityFrameworkCore;
using PolicyManager.API.Data;
using PolicyManager.API.DTOs;
using PolicyManager.API.Models;
using System.Net.Http.Json;
using System.Text.Json;

namespace PolicyManager.API.Services;

public class GeminiOrchestratorService : IGeminiOrchestratorService
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AppDbContext _context;
    private readonly ILogger<GeminiOrchestratorService> _logger;

    public GeminiOrchestratorService(
        IConfiguration configuration, 
        IHttpClientFactory httpClientFactory,
        AppDbContext context,
        ILogger<GeminiOrchestratorService> logger)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _context = context;
        _logger = logger;
    }

    public async Task<PolicyExtractionResultDto> ExtractPolicyDetailsAsync(byte[] fileBytes, string mimeType)
    {
        var apiKey = _configuration["GeminiApi:ApiKey"];
        var model = _configuration["GeminiApi:Model"] ?? "gemini-1.5-flash";
        var endpoint = _configuration["GeminiApi:Endpoint"] ?? "https://generativelanguage.googleapis.com/v1beta/models";
        var url = $"{endpoint}/{model}:generateContent?key={apiKey}";

        var prompt = @"
Extract insurance policy details from this image/document. 
Return a JSON object with the following structure:
{
  ""policyNumber"": { ""value"": ""..."", ""confidence"": 0.95 },
  ""policyHolderName"": { ""value"": ""..."", ""confidence"": 0.9 },
  ""companyName"": { ""value"": ""..."", ""confidence"": 0.85 },
  ""policyTypeName"": { ""value"": ""..."", ""confidence"": 0.8 },
  ""premiumAmount"": { ""value"": 1234.50, ""confidence"": 0.98 },
  ""startDate"": { ""value"": ""2024-01-01"", ""confidence"": 0.9 },
  ""endDate"": { ""value"": ""2025-01-01"", ""confidence"": 0.9 },
  ""installmentType"": { ""value"": ""Monthly"", ""confidence"": 0.85 },
  ""coverageAmount"": { ""value"": 1000000, ""confidence"": 0.9 }
}
Ensure dates are in YYYY-MM-DD format. If a field is not found, use null for value and 0 for confidence.
";

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { text = prompt },
                        new { inline_data = new { mime_type = mimeType, data = Convert.ToBase64String(fileBytes) } }
                    }
                }
            },
            generationConfig = new { response_mime_type = "application/json" }
        };

        var client = _httpClientFactory.CreateClient();
        var response = await client.PostAsJsonAsync(url, requestBody);
        
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError($"Gemini API Error: {error}");
            throw new Exception("AI Extraction failed.");
        }

        var jsonResponse = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(jsonResponse);
        var text = doc.RootElement.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();

        var result = JsonSerializer.Deserialize<PolicyExtractionResultDto>(text!, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
        result.RawJson = text!;
        
        // Calculate overall confidence
        var confidences = new List<float> { 
            result.PolicyNumber.Confidence, result.PolicyHolderName.Confidence, 
            result.PremiumAmount.Confidence, result.StartDate.Confidence 
        };
        result.OverallConfidence = confidences.Average();

        return result;
    }

    public async Task<string> QueryPortfolioAsync(string query, int userId)
    {
        var apiKey = _configuration["GeminiApi:ApiKey"];
        var model = _configuration["GeminiApi:Model"] ?? "gemini-1.5-flash";
        var endpoint = _configuration["GeminiApi:Endpoint"] ?? "https://generativelanguage.googleapis.com/v1beta/models";
        var url = $"{endpoint}/{model}:generateContent?key={apiKey}";

        // Fetch context: User's policies and family members
        var policies = await _context.Policies
            .Include(p => p.PolicyType)
            .Include(p => p.FamilyMember)
            .Where(p => p.CreatedByUserId == userId && !p.IsDeleted)
            .Select(p => new {
                p.PolicyNumber,
                p.PolicyHolderName,
                PolicyType = p.PolicyType!.Name,
                p.PremiumAmount,
                p.NextInstallmentDate,
                p.Status,
                FamilyMember = p.FamilyMember != null ? p.FamilyMember.Name : "Self"
            })
            .ToListAsync();

        var contextJson = JsonSerializer.Serialize(policies);
        var prompt = $@"
You are a helpful Insurance Portfolio Assistant. Below is the JSON data of the user's insurance policies.
Answer the user's question based ONLY on this data. If you don't know the answer, say you don't know.
Be concise and professional.

Portfolio Data:
{contextJson}

User Question: {query}
";

        var requestBody = new
        {
            contents = new[] { new { parts = new[] { new { text = prompt } } } }
        };

        var client = _httpClientFactory.CreateClient();
        var response = await client.PostAsJsonAsync(url, requestBody);
        
        if (!response.IsSuccessStatusCode) return "I'm sorry, I'm having trouble accessing your portfolio right now.";

        var jsonResponse = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(jsonResponse);
        return doc.RootElement.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? "No response from AI.";
    }
}
