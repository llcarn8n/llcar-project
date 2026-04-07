using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace llcar.Services;

/// <summary>
/// Converts byte[] to JSON array of integers instead of Base64 string
/// </summary>
public class ByteArrayToJsonArrayConverter : JsonConverter<byte[]>
{
    public override byte[]? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return null;
            
        if (reader.TokenType == JsonTokenType.String)
        {
            // Handle Base64 string
            return Convert.FromBase64String(reader.GetString()!);
        }
        
        if (reader.TokenType == JsonTokenType.StartArray)
        {
            // Handle JSON array of integers
            var bytes = new System.Collections.Generic.List<byte>();
            while (reader.Read())
            {
                if (reader.TokenType == JsonTokenType.EndArray)
                    break;
                if (reader.TokenType == JsonTokenType.Number)
                    bytes.Add(reader.GetByte());
            }
            return bytes.ToArray();
        }
        
        throw new JsonException("Expected string or array for byte[]");
    }

    public override void Write(Utf8JsonWriter writer, byte[] value, JsonSerializerOptions options)
    {
        if (value == null)
        {
            writer.WriteNullValue();
            return;
        }
        
        // Write as JSON array of integers
        writer.WriteStartArray();
        foreach (var b in value)
        {
            writer.WriteNumberValue(b);
        }
        writer.WriteEndArray();
    }
}
