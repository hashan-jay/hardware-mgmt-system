using HardwareManagement.Api.Data;
using HardwareManagement.Api.DTOs;
using HardwareManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HardwareManagement.Api.Services;

public class ScanAuditService(AppDbContext db)
{
    public DateTime Today() => OfficeClock.ToOfficeDate(DateTime.UtcNow);

    public async Task<ScanLogDto> GetLogAsync(DateTime fromDate, DateTime toDate)
    {
        if (toDate.Date < fromDate.Date)
            throw new ArgumentException("End date cannot be before start date.");

        var from = fromDate.Date;
        var to = toDate.Date;
        var today = Today();

        var days = await db.InventoryScans
            .AsNoTracking()
            .Include(x => x.ScanItems)
                .ThenInclude(x => x.HardwareItem!)
                    .ThenInclude(x => x.Brand!)
                        .ThenInclude(x => x.HardwareComponent)
            .Include(x => x.ScanItems)
                .ThenInclude(x => x.HardwareItem!)
                    .ThenInclude(x => x.CurrentEmployee!)
                        .ThenInclude(x => x.Department)
            .Include(x => x.ScanItems)
                .ThenInclude(x => x.HardwareItem!)
                    .ThenInclude(x => x.OriginalEmployee!)
                        .ThenInclude(x => x.Department)
            .Where(x => x.AuditDate != null && x.AuditDate >= from && x.AuditDate <= to)
            .OrderBy(x => x.AuditDate)
            .ToListAsync();

        var scanned = days
            .SelectMany(day => day.ScanItems.Where(x => x.IsPresent).Select(item => ToLine(item, day)))
            .OrderByDescending(x => x.ScannedAt)
            .ThenBy(x => x.UniqueCode)
            .ToList();

        var scannedIds = scanned.Select(x => x.HardwareItemId).ToHashSet();
        var liveItems = await LoadLiveItemsAsync();
        var missing = liveItems
            .Where(x => !scannedIds.Contains(x.Id))
            .Select(FromLiveItem)
            .OrderBy(x => x.UniqueCode)
            .ToList();

        return new ScanLogDto(
            from,
            to,
            from == today && to == today,
            liveItems.Count,
            scanned.Select(x => x.HardwareItemId).Distinct().Count(),
            missing.Count,
            scanned,
            missing);
    }

    public async Task<ScanItemDto> RecordTodayAsync(
        int userId,
        string uniqueCode,
        ItemWorkingStatus workingStatus,
        string? notes,
        string? notWorkingReason)
    {
        if (workingStatus == ItemWorkingStatus.NotWorking && string.IsNullOrWhiteSpace(notWorkingReason))
            throw new ArgumentException("A reason is required when marking an item not working during a scan.");

        var code = uniqueCode.Trim().ToUpperInvariant();
        var item = await db.HardwareItems
            .Include(x => x.Brand!).ThenInclude(x => x.HardwareComponent)
            .Include(x => x.CurrentEmployee)
                .ThenInclude(x => x!.Department)
            .Include(x => x.OriginalEmployee)
                .ThenInclude(x => x!.Department)
            .FirstOrDefaultAsync(x => x.UniqueCode == code && !x.IsDeleted);

        if (item is null)
            throw new KeyNotFoundException($"'{code}' is not in inventory. Register it under Inventory first, then scan it.");

        var day = await GetOrCreateTodayAsync(userId);
        var row = await db.InventoryScanItems
            .FirstOrDefaultAsync(x => x.InventoryScanId == day.Id && x.HardwareItemId == item.Id);

        if (row is null)
        {
            row = new InventoryScanItem
            {
                InventoryScanId = day.Id,
                HardwareItemId = item.Id,
                IsExpected = true,
                IsPresent = true
            };
            db.InventoryScanItems.Add(row);
        }

        ApplySnapshot(row, item);
        row.IsPresent = true;
        row.WorkingStatus = workingStatus;
        row.Notes = notes?.Trim();
        row.NotWorkingReason = workingStatus == ItemWorkingStatus.NotWorking
            ? notWorkingReason?.Trim()
            : row.NotWorkingReason;
        row.ScannedAt = DateTime.UtcNow;

        item.WorkingStatus = workingStatus;
        if (workingStatus == ItemWorkingStatus.NotWorking)
            item.NotWorkingReason = notWorkingReason?.Trim();

        await db.SaveChangesAsync();
        day.Title = $"Office scan {day.AuditDate:dd MMM yyyy}";
        return ToLine(row, day);
    }

    public async Task<InventoryScan> GetOrCreateTodayAsync(int userId)
    {
        var today = Today();
        var existing = await db.InventoryScans.FirstOrDefaultAsync(x => x.AuditDate == today);
        if (existing is not null)
            return existing;

        var created = new InventoryScan
        {
            Title = $"Office scan {today:dd MMM yyyy}",
            AuditDate = today,
            StartedAt = DateTime.UtcNow,
            CreatedByUserId = userId,
            SnapshotReady = true,
            Status = ScanStatus.InProgress
        };
        db.InventoryScans.Add(created);
        try
        {
            await db.SaveChangesAsync();
            return created;
        }
        catch (DbUpdateException)
        {
            db.Entry(created).State = EntityState.Detached;
            return await db.InventoryScans.FirstAsync(x => x.AuditDate == today);
        }
    }

    public static ScanItemDto ToLine(InventoryScanItem x, InventoryScan? scan = null) => new(
        x.Id,
        x.HardwareItemId,
        Coalesce(x.UniqueCode, x.HardwareItem?.UniqueCode),
        Coalesce(x.ComponentName, x.HardwareItem?.Brand?.HardwareComponent?.Name),
        Coalesce(x.BrandName, x.HardwareItem?.Brand?.Name),
        x.ComponentId ?? x.HardwareItem?.Brand?.HardwareComponentId,
        x.CurrentEmployeeId ?? x.HardwareItem?.CurrentEmployeeId,
        CoalesceOrNull(x.HolderName, x.HardwareItem?.CurrentEmployee?.FullName, x.HardwareItem?.HandedTo),
        x.Issued || x.HardwareItem?.CurrentEmployeeId != null || !string.IsNullOrWhiteSpace(x.HardwareItem?.HandedTo),
        x.IsPresent,
        x.IsExpected,
        x.ItemWasCreated,
        x.WorkingStatus.ToString(),
        x.NotWorkingReason ?? x.HardwareItem?.NotWorkingReason,
        x.ScannedAt,
        x.Notes,
        CoalesceOrNull(x.OriginalEmployeeName, x.HardwareItem?.OriginalEmployee?.FullName),
        x.OriginalIssuedDate ?? x.HardwareItem?.OriginalIssuedDate,
        x.HandedDate ?? x.HardwareItem?.HandedDate,
        scan?.Id,
        scan?.Title,
        scan?.AuditDate ?? scan?.StartedAt,
        x.HardwareItem?.CurrentEmployee?.Department?.Name,
        x.HardwareItem?.OriginalEmployee?.Department?.Name);

    private static ScanItemDto FromLiveItem(HardwareItem item) => new(
        0,
        item.Id,
        item.UniqueCode,
        item.Brand?.HardwareComponent?.Name ?? "",
        item.Brand?.Name ?? "",
        item.Brand?.HardwareComponentId,
        item.CurrentEmployeeId,
        CoalesceOrNull(item.CurrentEmployee?.FullName, item.HandedTo),
        item.CurrentEmployeeId != null || !string.IsNullOrWhiteSpace(item.HandedTo),
        false,
        true,
        false,
        item.WorkingStatus.ToString(),
        item.NotWorkingReason,
        null,
        item.Notes,
        item.OriginalEmployee?.FullName,
        item.OriginalIssuedDate,
        item.HandedDate,
        null,
        null,
        null,
        item.CurrentEmployee?.Department?.Name,
        item.OriginalEmployee?.Department?.Name);

    private async Task<List<HardwareItem>> LoadLiveItemsAsync() =>
        await db.HardwareItems
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .Include(x => x.Brand!).ThenInclude(x => x.HardwareComponent)
            .Include(x => x.CurrentEmployee)
                .ThenInclude(x => x!.Department)
            .Include(x => x.OriginalEmployee)
                .ThenInclude(x => x!.Department)
            .ToListAsync();

    private static void ApplySnapshot(InventoryScanItem row, HardwareItem item)
    {
        row.UniqueCode = item.UniqueCode;
        row.ComponentName = item.Brand?.HardwareComponent?.Name;
        row.BrandName = item.Brand?.Name;
        row.ComponentId = item.Brand?.HardwareComponentId;
        row.CurrentEmployeeId = item.CurrentEmployeeId;
        row.HolderName = item.CurrentEmployee?.FullName ?? item.HandedTo;
        row.Issued = item.CurrentEmployeeId != null || !string.IsNullOrWhiteSpace(item.HandedTo);
        row.OriginalEmployeeName = item.OriginalEmployee?.FullName;
        row.OriginalIssuedDate = item.OriginalIssuedDate;
        row.HandedDate = item.HandedDate;
    }

    private static string Coalesce(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
                return value.Trim();
        }

        return "";
    }

    private static string? CoalesceOrNull(params string?[] values)
    {
        var value = Coalesce(values);
        return value.Length == 0 ? null : value;
    }
}
