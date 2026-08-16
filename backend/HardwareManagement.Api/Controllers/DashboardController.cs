using HardwareManagement.Api.Data;
using HardwareManagement.Api.DTOs;
using HardwareManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HardwareManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DashboardController(AppDbContext db) : ControllerBase
{
    private static readonly TimeZoneInfo OfficeZone = TimeZoneInfo.FindSystemTimeZoneById(
        OperatingSystem.IsWindows() ? "India Standard Time" : "Asia/Kolkata");

    private sealed record ItemSnapshot(
        int ComponentId,
        int BrandId,
        bool Working,
        bool Issued,
        int? CurrentEmployeeId,
        DateTime CreatedAt,
        DateTime? OriginalIssuedDate,
        DateTime? HandedDate,
        bool IsNewAcquisition,
        bool Reissued);

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Get()
    {
        var components = await db.HardwareComponents
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Name)
            .Select(x => new { x.Id, x.Name })
            .ToListAsync();

        var brands = await db.Brands
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .Select(x => new { x.Id, x.Name, ComponentName = x.HardwareComponent!.Name })
            .ToListAsync();

        var items = await db.HardwareItems
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .Select(x => new ItemSnapshot(
                x.Brand!.HardwareComponentId,
                x.BrandId,
                x.WorkingStatus == ItemWorkingStatus.Working,
                x.CurrentEmployeeId != null || (x.HandedTo != null && x.HandedTo != ""),
                x.CurrentEmployeeId,
                x.CreatedAt,
                x.OriginalIssuedDate,
                x.HandedDate,
                x.IsNewAcquisition,
                x.PersonChangeReason != null && x.PersonChangeReason != ""))
            .ToListAsync();

        var employees = await db.Employees
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .Select(x => new { x.Id, x.FullName })
            .ToListAsync();

        var analytics = components.Select(component =>
        {
            var rows = items.Where(x => x.ComponentId == component.Id).ToList();
            var issued = rows.Count(x => x.Issued);
            var stock = rows.Count(x => !x.Issued);
            return new ComponentAnalyticsDto(
                component.Id,
                component.Name,
                rows.Count,
                issued,
                stock,
                rows.Count(x => !x.Issued && x.Working),
                rows.Count(x => !x.Working),
                rows.Count(x => x.Issued && !x.Working));
        })
        .OrderByDescending(x => x.ItemCount)
        .ThenBy(x => x.Name)
        .ToList();

        var holders = employees
            .Select(employee => new EmployeeLoadDto(
                employee.Id,
                employee.FullName,
                items.Count(x => x.CurrentEmployeeId == employee.Id)))
            .OrderByDescending(x => x.ItemCount)
            .ThenBy(x => x.FullName)
            .ToList();

        var brandShares = brands
            .Select(brand =>
            {
                var rows = items.Where(x => x.BrandId == brand.Id).ToList();
                return new BrandShareDto(
                    brand.Id,
                    brand.Name,
                    brand.ComponentName,
                    rows.Count,
                    rows.Count(x => x.Issued),
                    rows.Count(x => !x.Issued),
                    rows.Count(x => !x.Working));
            })
            .Where(x => x.ItemCount > 0)
            .OrderByDescending(x => x.ItemCount)
            .ThenBy(x => x.Name)
            .ToList();

        var today = ToOfficeDate(DateTime.UtcNow);
        var weeklyTrend = BuildWeeklyTrend(items, today);
        var dailyPulse = BuildDailyPulse(items, today);
        var activityPulse = await BuildActivityPulseAsync(today);
        var recentScans = await BuildRecentScansAsync();

        var issuedItems = items.Count(x => x.Issued);
        var inStockItems = items.Count(x => !x.Issued);
        var issuedNotWorking = items.Count(x => x.Issued && !x.Working);
        var workingStock = items.Count(x => !x.Issued && x.Working);
        var notWorking = items.Count(x => !x.Working);
        var employeesWithHardware = holders.Count(x => x.ItemCount > 0);
        var scannedToday = await db.InventoryScanItems
            .CountAsync(x => x.IsPresent && x.InventoryScan != null && x.InventoryScan.AuditDate == today);

        var dto = new DashboardDto(
            components.Count,
            brands.Count,
            items.Count,
            items.Count(x => x.Working),
            notWorking,
            items.Count(x => x.IsNewAcquisition),
            scannedToday,
            issuedItems,
            inStockItems,
            issuedNotWorking,
            workingStock,
            employees.Count,
            employeesWithHardware,
            analytics,
            holders.Where(x => x.ItemCount > 0),
            BuildInsights(analytics, issuedNotWorking, workingStock, employees.Count, employeesWithHardware, items.Count, weeklyTrend),
            weeklyTrend,
            dailyPulse,
            brandShares,
            recentScans,
            activityPulse);

        return Ok(dto);
    }

    private async Task<List<ScanPulseDto>> BuildRecentScansAsync()
    {
        return await db.InventoryScans
            .AsNoTracking()
            .Where(scan => scan.AuditDate != null)
            .OrderByDescending(scan => scan.AuditDate)
            .Take(14)
            .Select(scan => new ScanPulseDto(
                scan.Id,
                scan.Title,
                scan.AuditDate ?? scan.StartedAt,
                "Open",
                scan.ScanItems.Count(item => item.IsPresent),
                0,
                scan.ScanItems.Count(item => item.IsPresent && item.WorkingStatus == ItemWorkingStatus.Working),
                scan.ScanItems.Count(item => item.IsPresent && item.WorkingStatus == ItemWorkingStatus.NotWorking)))
            .ToListAsync();
    }

    private async Task<List<ActivityPointDto>> BuildActivityPulseAsync(DateTime today)
    {
        var start = today.AddDays(-13);
        var startUtc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(start, DateTimeKind.Unspecified), OfficeZone);
        var logs = await db.AuditLogs
            .AsNoTracking()
            .Where(x => x.CreatedAt >= startUtc)
            .Select(x => new { x.CreatedAt, x.Action })
            .ToListAsync();

        return Enumerable.Range(0, 14)
            .Select(offset =>
            {
                var day = start.AddDays(offset);
                var rows = logs.Where(x => ToOfficeDate(x.CreatedAt) == day).ToList();
                return new ActivityPointDto(
                    day.ToString("dd MMM"),
                    day.ToString("yyyy-MM-dd"),
                    rows.Count,
                    rows.Count(x => x.Action == "Create"),
                    rows.Count(x => x.Action is "Update" or "Complete"),
                    rows.Count(x => x.Action == "Scan"));
            })
            .ToList();
    }

    private static List<TrendPointDto> BuildWeeklyTrend(IReadOnlyCollection<ItemSnapshot> items, DateTime today)
    {
        var thisWeek = WeekStart(today);
        return Enumerable.Range(0, 12)
            .Select(offset =>
            {
                var week = thisWeek.AddDays((offset - 11) * 7);
                var end = week.AddDays(7);
                var added = items.Count(x => InRange(ToOfficeDate(x.CreatedAt), week, end));
                var issued = items.Count(x => FirstIssuedOn(x) is { } issuedOn && InRange(issuedOn, week, end));
                var reissued = items.Count(x => ReissuedOn(x) is { } reissuedOn && InRange(reissuedOn, week, end));
                return new TrendPointDto(
                    week.ToString("dd MMM"),
                    week.ToString("yyyy-MM-dd"),
                    added,
                    issued,
                    reissued);
            })
            .ToList();
    }

    private static List<DayPulseDto> BuildDailyPulse(IReadOnlyCollection<ItemSnapshot> items, DateTime today)
    {
        var start = today.AddDays(-13);
        return Enumerable.Range(0, 14)
            .Select(offset =>
            {
                var day = start.AddDays(offset);
                return new DayPulseDto(
                    day.ToString("dd MMM"),
                    day.ToString("yyyy-MM-dd"),
                    items.Count(x => ToOfficeDate(x.CreatedAt) == day),
                    items.Count(x => FirstIssuedOn(x) == day),
                    items.Count(x => ReissuedOn(x) == day));
            })
            .ToList();
    }

    private static IEnumerable<string> BuildInsights(
        IReadOnlyCollection<ComponentAnalyticsDto> analytics,
        int issuedNotWorking,
        int workingStock,
        int employeeCount,
        int employeesWithHardware,
        int totalItems,
        IReadOnlyCollection<TrendPointDto> weeklyTrend)
    {
        var insights = new List<string>();

        if (issuedNotWorking > 0)
            insights.Add($"{issuedNotWorking} issued device{(issuedNotWorking == 1 ? "" : "s")} not working. Repair or replace so staff are not blocked.");

        foreach (var component in analytics.Where(x => x.IssuedCount > 0 && x.WorkingStockCount == 0).Take(3))
            insights.Add($"No working spare for {component.Name} ({component.IssuedCount} issued). Add stock before the next failure.");

        var empty = analytics.Where(x => x.ItemCount == 0).Select(x => x.Name).ToList();
        if (empty.Count > 0)
            insights.Add($"No inventory yet for {string.Join(", ", empty)}. Record incoming units in Inventory before issuing.");

        var surplus = analytics.Where(x => x.IssuedCount == 0 && x.InStockCount >= 2).Take(2);
        foreach (var component in surplus)
            insights.Add($"{component.Name} has {component.InStockCount} unused units sitting in stock.");

        if (employeeCount > 0 && employeesWithHardware < employeeCount)
            insights.Add($"{employeeCount - employeesWithHardware} employee{(employeeCount - employeesWithHardware == 1 ? " has" : "s have")} no issued hardware.");

        if (workingStock > 0)
            insights.Add($"{workingStock} working item{(workingStock == 1 ? " is" : "s are")} in stock and ready to issue.");

        var recent = weeklyTrend.TakeLast(4).ToList();
        var recentAdded = recent.Sum(x => x.Added);
        var recentIssued = recent.Sum(x => x.Issued);
        if (recentIssued > recentAdded && workingStock == 0 && recentIssued > 0)
            insights.Add($"Issues outpaced new stock over the last 4 weeks ({recentIssued} first issues vs {recentAdded} added) with no working spare left.");

        if (insights.Count == 0 && totalItems > 0)
            insights.Add("No urgent repair or replenishment actions right now.");

        return insights.Take(6);
    }

    private static DateTime? FirstIssuedOn(ItemSnapshot item)
    {
        var date = item.OriginalIssuedDate ?? item.HandedDate;
        return date?.Date;
    }

    private static DateTime? ReissuedOn(ItemSnapshot item) =>
        item.Reissued ? item.HandedDate?.Date : null;

    private static bool InRange(DateTime date, DateTime startInclusive, DateTime endExclusive) =>
        date >= startInclusive && date < endExclusive;

    private static DateTime WeekStart(DateTime date)
    {
        var offset = ((int)date.DayOfWeek + 6) % 7;
        return date.AddDays(-offset);
    }

    private static DateTime ToOfficeDate(DateTime value)
    {
        if (value.Kind == DateTimeKind.Utc)
            return TimeZoneInfo.ConvertTimeFromUtc(value, OfficeZone).Date;

        if (value.Kind == DateTimeKind.Local)
            return TimeZoneInfo.ConvertTime(value, OfficeZone).Date;

        return value.Date;
    }
}
