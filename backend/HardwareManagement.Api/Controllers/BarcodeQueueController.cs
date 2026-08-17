using HardwareManagement.Api.Data;
using HardwareManagement.Api.DTOs;
using HardwareManagement.Api.Extensions;
using HardwareManagement.Api.Models;
using HardwareManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HardwareManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/barcode-queue")]
public class BarcodeQueueController(AppDbContext db, IAuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BarcodeQueueDto>>> GetAll()
    {
        var items = await MapQuery().OrderByDescending(x => x.CreatedAt).ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<BarcodeQueueDto>> Queue([FromBody] QueueBarcodeRequest request)
    {
        var item = await db.HardwareItems
            .Include(x => x.Brand!).ThenInclude(x => x.HardwareComponent)
            .FirstOrDefaultAsync(x => x.Id == request.HardwareItemId && !x.IsDeleted);
        if (item is null)
            return NotFound(new { message = "Hardware item not found." });

        var existing = await db.BarcodeQueueItems
            .FirstOrDefaultAsync(x => x.HardwareItemId == item.Id && x.Status == BarcodeQueueStatus.Queued);
        if (existing is not null)
            return Conflict(new { message = $"{item.UniqueCode} is already in the print queue." });

        var defaultSize = await db.PrintSizes
            .Where(x => !x.IsDeleted && x.IsDefault && x.Printer!.IsSelected && !x.Printer.IsDeleted)
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync();

        var entity = new BarcodeQueueItem
        {
            HardwareItemId = item.Id,
            PrintSizeId = defaultSize?.Id,
            Status = BarcodeQueueStatus.Queued,
            CreatedByUserId = User.GetUserId()
        };

        db.BarcodeQueueItems.Add(entity);
        await db.SaveChangesAsync();
        await audit.LogAsync(
            User.GetUserId(),
            "Create",
            "BarcodeQueue",
            entity.Id,
            $"Queued barcode '{item.UniqueCode}'");

        var dto = await MapQuery().FirstAsync(x => x.Id == entity.Id);
        return Created($"/api/barcode-queue/{entity.Id}", dto);
    }

    [HttpPut("{id:int}/size")]
    public async Task<IActionResult> AssignSize(int id, [FromBody] UpdateQueueSizeRequest request)
    {
        var entity = await db.BarcodeQueueItems.FirstOrDefaultAsync(x => x.Id == id && x.Status == BarcodeQueueStatus.Queued);
        if (entity is null) return NotFound(new { message = "Queued barcode not found." });

        var size = await db.PrintSizes
            .Include(x => x.Printer)
            .FirstOrDefaultAsync(x => x.Id == request.PrintSizeId && !x.IsDeleted);
        if (size is null || size.Printer is null || size.Printer.IsDeleted)
            return BadRequest(new { message = "Select a print size that belongs to the selected printer." });
        if (!size.Printer.IsSelected)
            return BadRequest(new { message = "That size does not match the currently selected printer." });

        entity.PrintSizeId = size.Id;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/printed")]
    public async Task<IActionResult> MarkPrinted(int id)
    {
        var entity = await db.BarcodeQueueItems.FirstOrDefaultAsync(x => x.Id == id && x.Status == BarcodeQueueStatus.Queued);
        if (entity is null) return NotFound(new { message = "Queued barcode not found." });

        entity.Status = BarcodeQueueStatus.Printed;
        entity.PrintedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Remove(int id)
    {
        var entity = await db.BarcodeQueueItems.FirstOrDefaultAsync(x => x.Id == id && x.Status == BarcodeQueueStatus.Queued);
        if (entity is null) return NotFound(new { message = "Queued barcode not found." });

        db.BarcodeQueueItems.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private IQueryable<BarcodeQueueDto> MapQuery() =>
        db.BarcodeQueueItems
            .AsNoTracking()
            .Where(x => x.Status == BarcodeQueueStatus.Queued)
            .Select(x => new BarcodeQueueDto(
                x.Id,
                x.HardwareItemId,
                x.HardwareItem!.UniqueCode,
                x.HardwareItem.Brand!.HardwareComponent!.Name,
                x.HardwareItem.Brand.Name,
                x.PrintSizeId,
                x.PrintSize != null ? x.PrintSize.Name : null,
                x.PrintSize != null ? x.PrintSize.WidthMm : null,
                x.PrintSize != null ? x.PrintSize.HeightMm : null,
                x.PrintSize != null ? x.PrintSize.PrinterId : null,
                x.Status.ToString(),
                x.CreatedAt));
}
