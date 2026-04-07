using llcar.Models;
using llcar.Models.QtpCompression;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace llcar.Services
{
    /// <summary>
    /// Service for communicating with the llcar server
    /// </summary>
    public interface IServerCommunicationService
    {
        /// <summary>
        /// Registers the client with the server
        /// </summary>
        Task<bool> RegisterClientAsync(ClientRegistration registration, CancellationToken ct = default);
        
        /// <summary>
        /// Server URL
        /// </summary>
        string ServerUrl { get; set; }
        
        /// <summary>
        /// Last error message
        /// </summary>
        string? LastError { get; }
        
        /// <summary>
        /// Tests server connectivity
        /// </summary>
        Task<bool> TestConnectivityAsync(CancellationToken ct = default);
        
        /// <summary>
        /// Sends QTP packets to server
        /// </summary>
        Task<bool> SendQtpPacketsAsync(List<QtpPacket> packets, CancellationToken ct = default);
        
        /// <summary>
        /// Sends aggregated data packet (JSON string) to server
        /// </summary>
        Task<bool> SendAggregatedDataAsync(string jsonData, CancellationToken ct = default);
        
        /// <summary>
        /// Sends logs to server
        /// </summary>
        Task<bool> SendLogsAsync(object logPayload, CancellationToken ct = default);

        /// <summary>
        /// Sends log file as multipart/form-data to server
        /// </summary>
        Task<bool> SendLogsFileAsync(string filePath, Dictionary<string, string> formData, CancellationToken ct = default);
    }
    
    public class ServerCommunicationService : IServerCommunicationService
    {
        private readonly HttpClient _httpClient;
        private string _serverUrl = "http://device.llcar.ru";
        private string? _lastError;
        
        public string ServerUrl 
        { 
            get => _serverUrl;
            set 
            { 
                _serverUrl = value?.TrimEnd('/') ?? "http://device.llcar.ru";
                // Don't change BaseAddress after HttpClient is created - it throws InvalidOperationException
                // We'll use the full URL in requests instead
            }
        }
        
        public string? LastError => _lastError;
        
        public ServerCommunicationService()
        {
            Log.Info($"[SERVER] Initializing ServerCommunicationService");
            Log.Info($"[SERVER] Default server URL: {_serverUrl}");
            
            _httpClient = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(30),
                BaseAddress = new Uri(_serverUrl)
            };
            
            _httpClient.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));
                
            Log.Debug($"[SERVER] HttpClient initialized with base address: {_httpClient.BaseAddress}");
            Log.Debug($"[SERVER] Timeout: {_httpClient.Timeout.TotalSeconds}s");
        }
        
        /// <summary>
        /// Tests server connectivity
        /// </summary>
        public async Task<bool> TestConnectivityAsync(CancellationToken ct = default)
        {
            try
            {
                Log.Debug($"[SERVER] Testing connectivity to: {ServerUrl}");
                
                // Try to reach the root endpoint
                var url = $"{ServerUrl}/";
                var response = await _httpClient.GetAsync(url, ct);
                
                Log.Debug($"[SERVER] Connectivity test result: {(int)response.StatusCode} {response.ReasonPhrase}");
                
                // Even if we get 404 or other error, connection worked
                return true;
            }
            catch (HttpRequestException ex)
            {
                Log.Error($"[SERVER] ✗ Connectivity test failed: {ex.Message}");
                Log.Debug($"[SERVER] Inner exception: {ex.InnerException?.Message}");
                return false;
            }
            catch (Exception ex)
            {
                Log.Error($"[SERVER] ✗ Connectivity test error: {ex.Message}");
                return false;
            }
        }
        
        public async Task<bool> RegisterClientAsync(ClientRegistration registration, CancellationToken ct = default)
        {
            try
            {
                _lastError = null;
                var url = $"{ServerUrl}/addcl";
                
                Log.Debug($"Registering client at: {url}");
                
                var response = await _httpClient.PostAsJsonAsync(url, registration, ct);
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync(ct);
                    Log.Debug($"Client registered successfully: {content}");
                    return true;
                }
                
                _lastError = $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase}";
                Log.Debug($"Client registration failed: {_lastError}");
                return false;
            }
            catch (TaskCanceledException)
            {
                _lastError = "Request timeout";
                Log.Debug("Client registration timeout");
                return false;
            }
            catch (Exception ex)
            {
                _lastError = ex.Message;
                Log.Debug($"Client registration error: {ex.Message}");
                return false;
            }
        }
        
        public async Task<bool> SendPidDataAsync(PidDataBatch batch, CancellationToken ct = default)
        {
            try
            {
                _lastError = null;
                var url = $"{ServerUrl}/add";
                
                // Log the data being sent
                Log.Debug($"Sending {batch.data.Count} PID records to {url}");
                
                var json = JsonSerializer.Serialize(batch, new JsonSerializerOptions 
                { 
                    PropertyNamingPolicy = null  // Keep original property names
                });
                Log.Debug($"JSON: {json}");
                
                var response = await _httpClient.PostAsJsonAsync(url, batch, ct);
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync(ct);
                    Log.Debug($"Data sent successfully: {content}");
                    return true;
                }
                
                var errorContent = await response.Content.ReadAsStringAsync(ct);
                _lastError = $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase} - {errorContent}";
                Log.Debug($"Send data failed: {_lastError}");
                return false;
            }
            catch (TaskCanceledException)
            {
                _lastError = "Request timeout";
                Log.Debug("Send data timeout");
                return false;
            }
            catch (Exception ex)
            {
                _lastError = ex.Message;
                Log.Debug($"Send data error: {ex.Message}");
                return false;
            }
        }
        
        public async Task<bool> SendBackgroundDataAsync(BackgroundDataPacket packet, CancellationToken ct = default)
        {
            try
            {
                _lastError = null;
                var url = $"{ServerUrl}/add_full";
                
                Log.Debug($"Sending background data packet to {url}");
                
                var response = await _httpClient.PostAsJsonAsync(url, packet, ct);
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync(ct);
                    Log.Debug($"Background data sent successfully: {content}");
                    return true;
                }
                
                // Fallback to PID-only format if /add_full is not supported
                var errorContent = await response.Content.ReadAsStringAsync(ct);
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    Log.Debug("Full data endpoint not found, falling back to PID-only format");
                    return false; // Let caller decide to use PID batch
                }
                
                _lastError = $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase} - {errorContent}";
                Log.Debug($"Send background data failed: {_lastError}");
                return false;
            }
            catch (TaskCanceledException)
            {
                _lastError = "Request timeout";
                Log.Debug("Send background data timeout");
                return false;
            }
            catch (Exception ex)
            {
                _lastError = ex.Message;
                Log.Debug($"Send background data error: {ex.Message}");
                return false;
            }
        }
        
        public PidDataBatch ConvertToPidBatch(BackgroundDataPacket packet, string clientHash)
        {
            var batch = new PidDataBatch
            {
                thash = clientHash,
                data = new List<PidDataPoint>()
            };
            
            // Convert OBD2 PID readings
            foreach (var reading in packet.PidReadings)
            {
                int pidNumeric = 0;
                try
                {
                    if (!string.IsNullOrEmpty(reading.Pid))
                    {
                        var pidHex = reading.Pid.Replace("0x", "").Replace("0X", "");
                        if (!int.TryParse(pidHex, System.Globalization.NumberStyles.HexNumber, null, out pidNumeric))
                        {
                            pidNumeric = 0;
                        }
                    }
                }
                catch
                {
                    pidNumeric = 0;
                }

                // Convert value to integer (multiply by 1000 for 3 decimal precision)
                var valInt = (int)(reading.ConvertedValue * 1000);

                batch.data.Add(new PidDataPoint
                {
                    dt = reading.Timestamp.ToString("yyyy-MM-dd HH:mm:ss"),
                    pid = pidNumeric,
                    val = valInt,
                    ecu = reading.EcuAddress
                });
            }
            
            // Add accelerometer data as special PIDs (using high PID numbers)
            if (packet.AccelerometerData.SampleCount > 0)
            {
                var accel = packet.AccelerometerData;
                var timestamp = packet.Timestamp.ToString("yyyy-MM-dd HH:mm:ss");
                
                // Use PID range 60000+ for accelerometer data
                batch.data.Add(new PidDataPoint { dt = timestamp, pid = 60001, val = (int)(accel.AvgX * 1000) });
                batch.data.Add(new PidDataPoint { dt = timestamp, pid = 60002, val = (int)(accel.AvgY * 1000) });
                batch.data.Add(new PidDataPoint { dt = timestamp, pid = 60003, val = (int)(accel.AvgZ * 1000) });
                batch.data.Add(new PidDataPoint { dt = timestamp, pid = 60004, val = (int)(Math.Max(accel.MaxX, Math.Max(accel.MaxY, accel.MaxZ)) * 1000) });
                batch.data.Add(new PidDataPoint { dt = timestamp, pid = 60005, val = (int)(Math.Max(accel.StdDevX, Math.Max(accel.StdDevY, accel.StdDevZ)) * 1000) });
                batch.data.Add(new PidDataPoint { dt = timestamp, pid = 60006, val = (int)accel.VibrationLevel });
            }
            
            // Add audio data as special PIDs (using PID range 61000+)
            if (packet.AudioData != null)
            {
                var audio = packet.AudioData;
                var timestamp = packet.Timestamp.ToString("yyyy-MM-dd HH:mm:ss");
                
                batch.data.Add(new PidDataPoint { dt = timestamp, pid = 61001, val = (int)(audio.AvgDecibels * 1000) });
                batch.data.Add(new PidDataPoint { dt = timestamp, pid = 61002, val = (int)(audio.PeakDecibels * 1000) });
            }
            
            // Add location data as special PIDs (using PID range 62000+)
            if (packet.Location != null)
            {
                var loc = packet.Location;
                var timestamp = packet.Timestamp.ToString("yyyy-MM-dd HH:mm:ss");
                
                // Latitude * 1000000 (for 6 decimal precision)
                batch.data.Add(new PidDataPoint { dt = timestamp, pid = 62001, val = (int)(loc.Latitude * 1000000) });
                // Longitude * 1000000
                batch.data.Add(new PidDataPoint { dt = timestamp, pid = 62002, val = (int)(loc.Longitude * 1000000) });
                // Speed km/h * 100
                if (loc.Speed.HasValue)
                    batch.data.Add(new PidDataPoint { dt = timestamp, pid = 62003, val = (int)(loc.Speed.Value * 100) });
            }
            
            return batch;
        }
        
        /// <summary>
        /// Sends batch of compressed data packets (bulk upload)
        /// Endpoint: POST /add_cb
        /// </summary>
        public async Task<bool> SendCompressedBatchAsync(CompressedBatch batch, CancellationToken ct = default)
        {
            try
            {
                _lastError = null;
                var url = $"{ServerUrl}/add_cb"; // Compressed batch endpoint
                
                Log.Debug($"[SERVER] ==========================================");
                Log.Debug($"[SERVER] Sending compressed batch ({batch.D.Count} packets) to {url}");
                Log.Debug($"[SERVER] Client hash: {batch.H}");
                
                var json = JsonSerializer.Serialize(batch, new JsonSerializerOptions 
                { 
                    PropertyNamingPolicy = null
                });
                
                Log.Debug($"[SERVER] JSON payload size: {json.Length} bytes");
                Log.Debug($"[SERVER] JSON preview: {json.Substring(0, Math.Min(200, json.Length))}...");
                
                // Log request details
                Log.Debug($"[SERVER] Request URL: {url}");
                Log.Debug($"[SERVER] Request method: POST");
                Log.Debug($"[SERVER] Content-Type: application/json");
                
                var startTime = DateTime.Now;
                var response = await _httpClient.PostAsJsonAsync(url, batch, ct);
                var duration = DateTime.Now - startTime;
                
                Log.Debug($"[SERVER] Response received in {duration.TotalMilliseconds}ms");
                Log.Debug($"[SERVER] Response status: {(int)response.StatusCode} {response.ReasonPhrase}");
                
                // Read response content regardless of success/failure
                var content = await response.Content.ReadAsStringAsync(ct);
                Log.Debug($"[SERVER] Response content: {content}");
                Log.Debug($"[SERVER] Response content length: {content?.Length ?? 0} bytes");
                
                if (response.IsSuccessStatusCode)
                {
                    Log.Info($"[SERVER] ✓ Compressed batch sent successfully");
                    Log.Debug($"[SERVER] ==========================================");
                    return true;
                }
                
                _lastError = $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase} - {content}";
                Log.Error($"[SERVER] ✗ Send compressed batch failed: {_lastError}");
                Log.Debug($"[SERVER] ==========================================");
                return false;
            }
            catch (TaskCanceledException tex)
            {
                _lastError = $"Request timeout after 30 seconds";
                Log.Error($"[SERVER] ✗ Timeout: {tex.Message}");
                Log.Debug($"[SERVER] ==========================================");
                return false;
            }
            catch (HttpRequestException httpex)
            {
                _lastError = $"HTTP Error: {httpex.Message}";
                Log.Error($"[SERVER] ✗ HTTP Request Error: {httpex.Message}");
                Log.Debug($"[SERVER] Inner exception: {httpex.InnerException?.Message}");
                Log.Debug($"[SERVER] ==========================================");
                return false;
            }
            catch (Exception ex)
            {
                _lastError = ex.Message;
                Log.Error($"[SERVER] ✗ Send compressed batch error: {ex.Message}");
                Log.Debug($"[SERVER] Stack trace: {ex.StackTrace}");
                Log.Debug($"[SERVER] ==========================================");
                return false;
            }
        }
        
        /// <summary>
        public async Task<bool> SendAggregatedDataAsync(string jsonData, CancellationToken ct = default)
        {
            try
            {
                Log.Debug($"[SERVER] Sending aggregated data: {jsonData.Length} bytes");
                
                var content = new StringContent(jsonData, Encoding.UTF8, "application/json");
                var url = $"{ServerUrl}/api/v1/aggregated/upload";
                
                var response = await _httpClient.PostAsync(url, content, ct);
                
                if (response.IsSuccessStatusCode)
                {
                    Log.Info($"[SERVER] ✓ Aggregated data sent successfully");
                    return true;
                }
                
                var errorContent = await response.Content.ReadAsStringAsync(ct);
                _lastError = $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase} - {errorContent}";
                Log.Error($"[SERVER] ✗ Send aggregated data failed: {_lastError}");
                return false;
            }
            catch (Exception ex)
            {
                _lastError = ex.Message;
                Log.Error($"[SERVER] ✗ Send aggregated data error: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Sends QTP packets to server
        /// </summary>
        public async Task<bool> SendQtpPacketsAsync(List<QtpPacket> packets, CancellationToken ct = default)
        {
            try
            {
                _lastError = null;
                var url = $"{ServerUrl}/add";
                
                Log.Debug($"[SERVER] Sending {packets.Count} QTP packets to {url}");
                
                // Serialize packets to JSON
                var options = new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNamingPolicy = null,
                    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never  // Include null fields
                };
                // Serialize byte[] as JSON array of integers, not Base64
                options.Converters.Add(new ByteArrayToJsonArrayConverter());
                
                var json = System.Text.Json.JsonSerializer.Serialize(packets, options);
                
                Log.Debug($"[SERVER] QTP JSON size: {json.Length} bytes");
                // Find and print just the ecu_mask part for verification
                var ecuMaskIdx = json.IndexOf("ecu_mask");
                if (ecuMaskIdx >= 0)
                {
                    var ecuMaskPart = json.Substring(ecuMaskIdx, Math.Min(20, json.Length - ecuMaskIdx));
                    Log.Debug($"[SERVER] QTP JSON ecu_mask part: ...{ecuMaskPart}...");
                }
                
                // Check for PID fields in JSON
                var p0cIdx = json.IndexOf("p0C_0");
                var p0dIdx = json.IndexOf("p0D_0");
                Log.Debug($"[SERVER] QTP JSON contains p0C_0: {p0cIdx >= 0}, p0D_0: {p0dIdx >= 0}");
                if (p0cIdx >= 0)
                {
                    var p0cPart = json.Substring(p0cIdx, Math.Min(30, json.Length - p0cIdx));
                    Log.Debug($"[SERVER] QTP JSON p0C_0 part: {p0cPart}...");
                }
                if (p0dIdx >= 0)
                {
                    var p0dPart = json.Substring(p0dIdx, Math.Min(30, json.Length - p0dIdx));
                    Log.Debug($"[SERVER] QTP JSON p0D_0 part: {p0dPart}...");
                }
                
                Log.Debug($"[SERVER] QTP JSON preview: {json.Substring(0, Math.Min(500, json.Length))}...");
                
                // Log ecu_mask for each packet
                foreach (var pkt in packets)
                {
                    Log.Debug($"[SERVER] Packet ecu_mask: {pkt.EcuMask} (data keys: {pkt.Data.Count})");
                }
                
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var startTime = DateTime.Now;
                var response = await _httpClient.PostAsync(url, content, ct);
                var duration = DateTime.Now - startTime;
                
                Log.Debug($"[SERVER] QTP response in {duration.TotalMilliseconds:F0}ms: {(int)response.StatusCode}");
                
                if (response.IsSuccessStatusCode)
                {
                    Log.Info($"[SERVER] ✓ QTP upload successful: {packets.Count} packets");
                    return true;
                }
                
                var errorContent = await response.Content.ReadAsStringAsync(ct);
                _lastError = $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase} - {errorContent}";
                Log.Error($"[SERVER] ✗ QTP upload failed: {_lastError}");
                return false;
            }
            catch (Exception ex)
            {
                _lastError = ex.Message;
                Log.Error($"[SERVER] ✗ Send QTP packets error: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendLogsAsync(object logPayload, CancellationToken ct = default)
        {
            try
            {
                _lastError = null;
                var url = $"{ServerUrl}/logs";
                
                Log.Debug($"[SERVER] Sending logs to {url}");
                
                var json = System.Text.Json.JsonSerializer.Serialize(logPayload, new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(url, content, ct);
                
                Log.Debug($"[SERVER] Logs response: {(int)response.StatusCode}");
                
                if (response.IsSuccessStatusCode)
                {
                    Log.Debug("[SERVER] ✓ Logs uploaded successfully");
                    return true;
                }
                
                var errorContent = await response.Content.ReadAsStringAsync(ct);
                _lastError = $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase} - {errorContent}";
                Log.Error($"[SERVER] ✗ Logs upload failed: {_lastError}");
                return false;
            }
            catch (Exception ex)
            {
                _lastError = ex.Message;
                Log.Error($"[SERVER] ✗ Send logs error: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendLogsFileAsync(string filePath, Dictionary<string, string> formData, CancellationToken ct = default)
        {
            try
            {
                _lastError = null;
                var url = $"{ServerUrl}/logs";
                
                Log.Debug($"[SERVER] Sending log file to {url}");
                
                using var content = new MultipartFormDataContent();
                
                // Add the file
                var fileContent = new StreamContent(File.OpenRead(filePath));
                fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/zip");
                content.Add(fileContent, "log_file", Path.GetFileName(filePath));
                
                // Add form data
                foreach (var kvp in formData)
                {
                    content.Add(new StringContent(kvp.Value), kvp.Key);
                }
                
                var response = await _httpClient.PostAsync(url, content, ct);
                
                Log.Debug($"[SERVER] Logs file response: {(int)response.StatusCode}");
                
                if (response.IsSuccessStatusCode)
                {
                    Log.Debug("[SERVER] ✓ Logs file uploaded successfully");
                    return true;
                }
                
                var errorContent = await response.Content.ReadAsStringAsync(ct);
                _lastError = $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase} - {errorContent}";
                Log.Error($"[SERVER] ✗ Logs file upload failed: {_lastError}");
                return false;
            }
            catch (Exception ex)
            {
                _lastError = ex.Message;
                Log.Error($"[SERVER] ✗ Send logs file error: {ex.Message}");
                return false;
            }
        }
    }
}
