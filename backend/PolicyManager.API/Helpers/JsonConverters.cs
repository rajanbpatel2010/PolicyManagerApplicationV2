using System.Text.Json;
using System.Text.Json.Serialization;
using System.Globalization;

namespace PolicyManager.API.Helpers;

public class DateTimeUtcConverter : JsonConverter<DateTime>
{
    private const string DateFormat = "yyyy-MM-dd";

    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var str = reader.GetString();
        if (string.IsNullOrEmpty(str)) return default;

        // Try parsing as ISO date string (YYYY-MM-DD)
        if (DateTime.TryParseExact(str, DateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            return DateTime.SpecifyKind(date, DateTimeKind.Utc);
        }

        // Fallback to default parsing but specify UTC
        if (DateTime.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
        {
            return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
        }

        return default;
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        // Treat as UTC without shifting if Kind is Unspecified
        var utcDate = value.Kind == DateTimeKind.Unspecified 
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc) 
            : value.ToUniversalTime();
            
        writer.WriteStringValue(utcDate.ToString("yyyy-MM-ddTHH:mm:ssZ"));
    }
}

public class NullableDateTimeUtcConverter : JsonConverter<DateTime?>
{
    private const string DateFormat = "yyyy-MM-dd";

    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var str = reader.GetString();
        if (string.IsNullOrEmpty(str)) return null;

        if (DateTime.TryParseExact(str, DateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            return DateTime.SpecifyKind(date, DateTimeKind.Utc);
        }

        if (DateTime.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
        {
            return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
        }

        return null;
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value.HasValue)
        {
            var val = value.Value;
            var utcDate = val.Kind == DateTimeKind.Unspecified 
                ? DateTime.SpecifyKind(val, DateTimeKind.Utc) 
                : val.ToUniversalTime();

            writer.WriteStringValue(utcDate.ToString("yyyy-MM-ddTHH:mm:ssZ"));
        }
        else
        {
            writer.WriteNullValue();
        }
    }
}
