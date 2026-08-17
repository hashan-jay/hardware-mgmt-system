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
        var items = await LoadQueuedAsync();
        return Ok(items.Select(ToDto));
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

        entity.HardwareItem = item;
        entity.PrintSize = defaultSize;
        return Created($"/api/barcode-queue/{entity.Id}", ToDto(entity));
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

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Remove(int id)
    {
        var entity = await db.BarcodeQueueItems.FirstOrDefaultAsync(x => x.Id == id && x.Status == BarcodeQueueStatus.Queued);
        if (entity is null) return NotFound(new { message = "Queued barcode not found." });

        db.BarcodeQueueItems.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<List<BarcodeQueueItem>> LoadQueuedAsync() =>
        await db.BarcodeQueueItems
            .AsNoTracking()
            .Where(x => x.Status == BarcodeQueueStatus.Queued)
            .Include(x => x.HardwareItem!).ThenInclude(x => x.Brand!).ThenInclude(x => x.HardwareComponent)
            .Include(x => x.PrintSize)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

    private static BarcodeQueueDto ToDto(BarcodeQueueItem item) => new(
        item.Id,
        item.HardwareItemId,
        item.HardwareItem?.UniqueCode ?? "",
        item.HardwareItem?.Brand?.HardwareComponent?.Name ?? "",
        item.HardwareItem?.Brand?.Name ?? "",
        item.PrintSizeId,
        item.PrintSize?.Name,
        item.PrintSize?.WidthMm,
        item.PrintSize?.HeightMm,
        item.PrintSize?.PrinterId,
        "Queued",
        item.CreatedAt);
}
