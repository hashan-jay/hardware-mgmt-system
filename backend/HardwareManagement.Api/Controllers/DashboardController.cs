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
    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Get()
    {
        var components = await db.HardwareComponents
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Name)
            .Select(x => new { x.Id, x.Name })
            .ToListAsync();

        var items = await db.HardwareItems
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .Select(x => new
            {
                ComponentId = x.Brand!.HardwareComponentId,
                Working = x.WorkingStatus == ItemWorkingStatus.Working,
                Issued = x.CurrentEmployeeId != null || (x.HandedTo != null && x.HandedTo != ""),
                x.CurrentEmployeeId,
                HolderName = x.CurrentEmployee != null ? x.CurrentEmployee.FullName : x.HandedTo
            })
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

        var issuedItems = items.Count(x => x.Issued);
        var inStockItems = items.Count(x => !x.Issued);
        var issuedNotWorking = items.Count(x => x.Issued && !x.Working);
        var workingStock = items.Count(x => !x.Issued && x.Working);
        var notWorking = items.Count(x => !x.Working);
        var employeesWithHardware = holders.Count(x => x.ItemCount > 0);

        var dto = new DashboardDto(
            components.Count,
            await db.Brands.CountAsync(x => !x.IsDeleted),
            items.Count,
            items.Count(x => x.Working),
            notWorking,
            await db.HardwareItems.CountAsync(x => !x.IsDeleted && x.IsNewAcquisition),
            await db.InventoryScans.CountAsync(x => x.Status == ScanStatus.InProgress),
            issuedItems,
            inStockItems,
            issuedNotWorking,
            workingStock,
            employees.Count,
            employeesWithHardware,
            analytics,
            holders.Where(x => x.ItemCount > 0),
            BuildInsights(analytics, issuedNotWorking, workingStock, employees.Count, employeesWithHardware, items.Count));

        return Ok(dto);
    }

    private static IEnumerable<string> BuildInsights(
        IReadOnlyCollection<ComponentAnalyticsDto> analytics,
        int issuedNotWorking,
        int workingStock,
        int employeeCount,
        int employeesWithHardware,
        int totalItems)
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

        if (insights.Count == 0 && totalItems > 0)
            insights.Add("No urgent repair or replenishment actions right now.");

        return insights.Take(6);
    }
}
