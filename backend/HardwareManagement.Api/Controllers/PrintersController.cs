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
[Route("api/printers")]
public class PrintersController(AppDbContext db, IAuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LabelPrinterDto>>> GetAll()
    {
        var printers = await db.LabelPrinters
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Name)
            .Select(x => new LabelPrinterDto(
                x.Id,
                x.Name,
                x.IsSelected,
                x.CreatedAt,
                x.Sizes.Count(size => !size.IsDeleted)))
            .ToListAsync();

        return Ok(printers);
    }

    [HttpPost]
    public async Task<ActionResult<LabelPrinterDto>> Create([FromBody] CreatePrinterRequest request)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "Printer name is required." });

        var exists = await db.LabelPrinters.AnyAsync(x => !x.IsDeleted && x.Name.ToLower() == name.ToLower());
        if (exists)
            return Conflict(new { message = $"Printer '{name}' already exists." });

        var selectedExists = await db.LabelPrinters.AnyAsync(x => !x.IsDeleted && x.IsSelected);
        var entity = new LabelPrinter
        {
            Name = name,
            IsSelected = !selectedExists,
            CreatedByUserId = User.GetUserId()
        };

        db.LabelPrinters.Add(entity);
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Create", "LabelPrinter", entity.Id, $"Added printer '{entity.Name}'");

        return Created($"/api/printers/{entity.Id}", LabelPrinterDto.From(entity));
    }

    [HttpPost("{id:int}/select")]
    public async Task<IActionResult> Select(int id)
    {
        var printer = await db.LabelPrinters.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (printer is null) return NotFound(new { message = "Printer not found." });

        var selected = await db.LabelPrinters.Where(x => !x.IsDeleted && x.IsSelected).ToListAsync();
        foreach (var item in selected)
            item.IsSelected = false;

        printer.IsSelected = true;
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Update", "LabelPrinter", printer.Id, $"Selected printer '{printer.Name}'");

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var printer = await db.LabelPrinters.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (printer is null) return NotFound(new { message = "Printer not found." });

        var sizeIds = await db.PrintSizes
            .Where(x => x.PrinterId == id && !x.IsDeleted)
            .Select(x => x.Id)
            .ToListAsync();

        var queued = await db.BarcodeQueueItems
            .Where(x => x.Status == BarcodeQueueStatus.Queued && x.PrintSizeId != null && sizeIds.Contains(x.PrintSizeId.Value))
            .ToListAsync();
        foreach (var item in queued)
            item.PrintSizeId = null;

        var sizes = await db.PrintSizes.Where(x => x.PrinterId == id && !x.IsDeleted).ToListAsync();
        foreach (var size in sizes)
            size.IsDeleted = true;

        printer.IsDeleted = true;
        printer.IsSelected = false;
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Delete", "LabelPrinter", printer.Id, $"Deleted printer '{printer.Name}'");

        return NoContent();
    }

    [HttpGet("{printerId:int}/sizes")]
    public async Task<ActionResult<IEnumerable<PrintSizeDto>>> GetSizes(int printerId)
    {
        var exists = await db.LabelPrinters.AnyAsync(x => x.Id == printerId && !x.IsDeleted);
        if (!exists) return NotFound(new { message = "Printer not found." });

        var sizes = await db.PrintSizes
            .AsNoTracking()
            .Where(x => x.PrinterId == printerId && !x.IsDeleted)
            .OrderByDescending(x => x.IsDefault)
            .ThenBy(x => x.Name)
            .Select(x => new PrintSizeDto(x.Id, x.PrinterId, x.Name, x.WidthMm, x.HeightMm, x.IsDefault))
            .ToListAsync();

        return Ok(sizes);
    }

    [HttpPost("{printerId:int}/sizes")]
    public async Task<ActionResult<PrintSizeDto>> CreateSize(int printerId, [FromBody] CreatePrintSizeRequest request)
    {
        var printer = await db.LabelPrinters.FirstOrDefaultAsync(x => x.Id == printerId && !x.IsDeleted);
        if (printer is null) return NotFound(new { message = "Printer not found." });

        var name = request.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "Size name is required." });
        if (request.WidthMm <= 0 || request.HeightMm <= 0)
            return BadRequest(new { message = "Width and height must be greater than zero." });

        var exists = await db.PrintSizes.AnyAsync(x =>
            x.PrinterId == printerId && !x.IsDeleted && x.Name.ToLower() == name.ToLower());
        if (exists)
            return Conflict(new { message = $"Size '{name}' already exists for this printer." });

        var hasDefault = await db.PrintSizes.AnyAsync(x => x.PrinterId == printerId && !x.IsDeleted && x.IsDefault);
        var entity = new PrintSize
        {
            PrinterId = printerId,
            Name = name,
            WidthMm = decimal.Round(request.WidthMm, 2),
            HeightMm = decimal.Round(request.HeightMm, 2),
            IsDefault = request.IsDefault || !hasDefault,
            CreatedByUserId = User.GetUserId()
        };

        if (entity.IsDefault)
        {
            var defaults = await db.PrintSizes.Where(x => x.PrinterId == printerId && !x.IsDeleted && x.IsDefault).ToListAsync();
            foreach (var size in defaults)
                size.IsDefault = false;
        }

        db.PrintSizes.Add(entity);
        await db.SaveChangesAsync();
        await audit.LogAsync(
            User.GetUserId(),
            "Create",
            "PrintSize",
            entity.Id,
            $"Added print size '{entity.Name}' ({entity.WidthMm}x{entity.HeightMm}mm) for '{printer.Name}'");

        return Created($"/api/printers/{printerId}/sizes/{entity.Id}", PrintSizeDto.From(entity));
    }

    [HttpPost("sizes/{id:int}/default")]
    public async Task<IActionResult> SetDefaultSize(int id)
    {
        var size = await db.PrintSizes.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (size is null) return NotFound(new { message = "Print size not found." });

        var defaults = await db.PrintSizes
            .Where(x => x.PrinterId == size.PrinterId && !x.IsDeleted && x.IsDefault)
            .ToListAsync();
        foreach (var item in defaults)
            item.IsDefault = false;

        size.IsDefault = true;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("sizes/{id:int}")]
    public async Task<IActionResult> DeleteSize(int id)
    {
        var size = await db.PrintSizes.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (size is null) return NotFound(new { message = "Print size not found." });

        var queued = await db.BarcodeQueueItems
            .Where(x => x.Status == BarcodeQueueStatus.Queued && x.PrintSizeId == id)
            .ToListAsync();
        foreach (var item in queued)
            item.PrintSizeId = null;

        size.IsDeleted = true;
        size.IsDefault = false;
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Delete", "PrintSize", size.Id, $"Deleted print size '{size.Name}'");

        return NoContent();
    }
}
