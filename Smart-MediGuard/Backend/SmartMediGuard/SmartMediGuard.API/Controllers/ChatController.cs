using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Net.Http.Headers;

namespace SmartMediGuard.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase {

    private readonly IConfiguration configuration;
    private readonly IHttpClientFactory httpClientFactory;

    public ChatController(IConfiguration configuration, IHttpClientFactory httpClientFactory) {

        this.configuration = configuration;
        this.httpClientFactory = httpClientFactory;
    }

    //text chat assistant
    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] ChatRequest request) {

        if (string.IsNullOrEmpty(request.Message)) return BadRequest("Message cannot be empty.");

        var openRouterConfig = this.configuration.GetSection("OpenRouter");
        var apiKey = openRouterConfig["ApiKey"];
        var model = openRouterConfig["Model"];
        var url = openRouterConfig["BaseUrl"];

        var client = this.httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        client.DefaultRequestHeaders.Add("HTTP-Referer", "https://smartmediguard.local");
        client.DefaultRequestHeaders.Add("X-Title", "Smart MediGuard");

        var requestBody = new {

            model = model,
            messages = new[] {

                //give role and info to AI
                new { role = "system", content = "You are the Smart MediGuard AI Assistant. You help users manage medication reminders, dosages, and health logs. Keep answers concise, helpful, friendly, and always include a brief disclaimer if critical health advice is given." },
                new { role = "user", content = request.Message }
            }
        };

        var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        try {

            var response = await client.PostAsync(url, jsonContent);

            if (!response.IsSuccessStatusCode) {

                var errorDetails = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, $"OpenRouter Error: {errorDetails}");
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);

            var aiReply = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return Ok(new { reply = aiReply });
        }

        catch (Exception ex) {

            return StatusCode(500, $"Internal Server Error: {ex.Message}");
        }
    }

    //prescription vision scanner
    [HttpPost("scan-prescription")]
    public async Task<IActionResult> ScanPrescription([FromBody] ScanRequest request) {

        if (string.IsNullOrEmpty(request.ImageBase64)) return BadRequest("No image data provided.");

        var openRouterConfig = this.configuration.GetSection("OpenRouter");
        var apiKey = openRouterConfig["ApiKey"];
        var url = openRouterConfig["BaseUrl"];

        var client = this.httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var requestBody = new {

            model = "google/gemini-2.5-flash",
            response_format = new { type = "json_object" },
            messages = new object[] {
                new {
                    role = "system",
                    content = "You extract text from prescription labels and medical bottles. Return a raw JSON object containing these keys with data typed precisely as indicated: { \"name\": string, \"dosage\": number_in_mg, \"frequency\": string (must pick only from: 'Once daily', 'Twice daily', 'Three times daily', 'Every other day', 'As needed'), \"time\": string (e.g. '08:00 AM'), \"quantity\": number_of_pills_integer }. If a value cannot be found or read, omit it or set it to null."
                },
                new {
                    role = "user",
                    content = new List<object> {
                        new { type = "text", text = "Analyze this prescription image and return the data object map directly." },
                        new { type = "image_url", image_url = new { url = $"data:image/jpeg;base64,{request.ImageBase64}" } }
                    }
                }
            }
        };

        var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        try {

            var response = await client.PostAsync(url, jsonContent);
            if (!response.IsSuccessStatusCode) {
            
                var err = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, $"OpenRouter Vision Error: {err}");
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);

            var jsonTextReply = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return Content(jsonTextReply, "application/json");
        }

        catch (Exception ex) {
            
            return StatusCode(500, $"Internal Scan Processing Error: {ex.Message}");
        }
    }
}

public class ChatRequest {

    public string Message { get; set; } = string.Empty;
}

public class ScanRequest {

    public string ImageBase64 { get; set; } = string.Empty;
}