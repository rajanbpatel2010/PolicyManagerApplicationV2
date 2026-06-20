namespace PolicyManager.API.Helpers;

public static class FYHelper
{
    /// <summary>
    /// Gets the start date of the current Indian Financial Year (April 1st).
    /// </summary>
    public static DateTime GetCurrentFYStart()
    {
        var today = DateTime.UtcNow;
        int fyStartYear = today.Month >= 4 ? today.Year : today.Year - 1;
        return new DateTime(fyStartYear, 4, 1, 0, 0, 0, DateTimeKind.Utc);
    }

    /// <summary>
    /// Gets the end date of the current Indian Financial Year (March 31st).
    /// </summary>
    public static DateTime GetCurrentFYEnd()
    {
        return GetCurrentFYStart().AddYears(1).AddDays(-1);
    }

    public static (DateTime Start, DateTime End) GetCurrentFYRange()
    {
        return (GetCurrentFYStart(), GetCurrentFYEnd());
    }

    /// <summary>
    /// Gets just the start year of the current FY (e.g. 2026 if current FY is Apr 2026 - Mar 2027).
    /// </summary>
    public static int GetCurrentFYStartYear()
    {
        var today = DateTime.UtcNow;
        return today.Month >= 4 ? today.Year : today.Year - 1;
    }

    /// <summary>
    /// Gets the start and end dates for a specific Financial Year (e.g., "2024-25").
    /// </summary>
    public static (DateTime Start, DateTime End) GetFYRange(string fyLabel)
    {
        // Example label: "2024-25"
        var parts = fyLabel.Split('-');
        if (parts.Length == 2 && int.TryParse(parts[0], out int startYear))
        {
            var start = new DateTime(startYear, 4, 1, 0, 0, 0, DateTimeKind.Utc);
            var end = start.AddYears(1).AddDays(-1);
            return (start, end);
        }
        return (GetCurrentFYStart(), GetCurrentFYEnd());
    }
}
