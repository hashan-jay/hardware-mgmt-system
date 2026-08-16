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
            .Select(x => new ComponentSummaryDto(
                x.Id,
                x.Name,
                x.CodePrefix,
                x.Brands.Count(b => !b.IsDeleted),
                x.Brands.Where(b => !b.IsDeleted).SelectMany(b => b.Items).Count(i => !i.IsDeleted)))
            .ToListAsync();

        var items = db.HardwareItems.AsNoTracking().Where(x => !x.IsDeleted);

        var dto = new DashboardDto(
            components.Count,
            await db.Brands.CountAsync(x => !x.IsDeleted),
            await items.CountAsync(),
            await items.CountAsync(x => x.WorkingStatus == ItemWorkingStatus.Working),
            await items.CountAsync(x => x.WorkingStatus == ItemWorkingStatus.NotWorking),
            await items.CountAsync(x => x.IsNewAcquisition),
            await db.InventoryScans.CountAsync(x => x.Status == ScanStatus.InProgress),
            components);

        return Ok(dto);
    }
}
