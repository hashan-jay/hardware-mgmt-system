namespace HardwareManagement.Api.Services;

public static class OfficeClock
{
    public static readonly TimeZoneInfo Zone = TimeZoneInfo.FindSystemTimeZoneById(
        OperatingSystem.IsWindows() ? "India Standard Time" : "Asia/Kolkata");

    public static DateTime ToOfficeDate(DateTime value)
    {
        if (value.Kind == DateTimeKind.Utc)
            return TimeZoneInfo.ConvertTimeFromUtc(value, Zone).Date;

        if (value.Kind == DateTimeKind.Local)
            return TimeZoneInfo.ConvertTime(value, Zone).Date;

        return value.Date;
    }

    public static (DateTime StartUtc, DateTime EndUtc) InclusiveRangeUtc(DateTime fromDate, DateTime toDate)
    {
        var start = DateTime.SpecifyKind(fromDate.Date, DateTimeKind.Unspecified);
        var end = DateTime.SpecifyKind(toDate.Date.AddDays(1), DateTimeKind.Unspecified);
        return (
            TimeZoneInfo.ConvertTimeToUtc(start, Zone),
            TimeZoneInfo.ConvertTimeToUtc(end, Zone));
    }
}
