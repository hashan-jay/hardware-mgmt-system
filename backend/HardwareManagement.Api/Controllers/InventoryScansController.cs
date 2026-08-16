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
[Route("api/[controller]")]
public class InventoryScansController(AppDbContext db, IAuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ScanDto>>> GetAll()
    {
        var scans = await db.InventoryScans
            .AsNoTracking()
            .OrderByDescending(x => x.StartedAt)
            .Select(x => new ScanDto(
                x.Id,
                x.Title,
                x.Notes,
                x.Status.ToString(),
                x.StartedAt,
                x.CompletedAt,
                x.CreatedByUser!.FullName,
                x.ScanItems.Count(i => i.IsPresent),
                0,
                x.ScanItems.Count(i => i.IsPresent && i.WorkingStatus == ItemWorkingStatus.Working),
                x.ScanItems.Count(i => i.IsPresent && i.WorkingStatus == ItemWorkingStatus.NotWorking)))
            .ToListAsync();

        var totalActiveItems = await db.HardwareItems.CountAsync(x => !x.IsDeleted);
        scans = scans.Select(s => s with
        {
            MissingCount = s.Status == nameof(ScanStatus.Completed)
                ? Math.Max(totalActiveItems - s.ScannedCount, 0)
                : 0
        }).ToList();

        return Ok(scans);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ScanDetailDto>> GetById(int id)
    {
        var scan = await db.InventoryScans
            .AsNoTracking()
            .Include(x => x.CreatedByUser)
            .Include(x => x.ScanItems)
                .ThenInclude(x => x.HardwareItem!)
                    .ThenInclude(x => x.Brand!)
                        .ThenInclude(x => x.HardwareComponent)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (scan is null) return NotFound();

        var scannedItemIds = scan.ScanItems.Select(x => x.HardwareItemId).ToHashSet();
        var missingItems = await db.HardwareItems
            .AsNoTracking()
            .Include(x => x.Brand!).ThenInclude(x => x.HardwareComponent)
            .Where(x => !x.IsDeleted && !scannedItemIds.Contains(x.Id))
            .OrderBy(x => x.UniqueCode)
            .Select(x => new MissingItemDto(
                x.Id,
                x.UniqueCode,
                x.Brand!.HardwareComponent!.Name,
                x.Brand.Name,
                x.WorkingStatus.ToString()))
            .ToListAsync();

        var detail = new ScanDetailDto(
            scan.Id,
            scan.Title,
            scan.Notes,
            scan.Status.ToString(),
            scan.StartedAt,
            scan.CompletedAt,
            scan.CreatedByUser!.FullName,
            scan.ScanItems.OrderByDescending(x => x.ScannedAt).Select(x => new ScanItemDto(
                x.Id,
                x.HardwareItemId,
                x.HardwareItem!.UniqueCode,
                x.HardwareItem.Brand!.HardwareComponent!.Name,
                x.HardwareItem.Brand.Name,
                x.IsPresent,
                x.WorkingStatus.ToString(),
                x.ScannedAt,
                x.Notes)),
            missingItems);

        return Ok(detail);
    }

    [HttpPost]
    public async Task<ActionResult<ScanDto>> Create([FromBody] CreateScanRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { message = "Title is required." });

        var entity = new InventoryScan
        {
            Title = request.Title.Trim(),
            Notes = request.Notes?.Trim(),
            CreatedByUserId = User.GetUserId()
        };

        db.InventoryScans.Add(entity);
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Create", "InventoryScan", entity.Id,
            $"Started inventory scan '{entity.Title}'");

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new ScanDto(
            entity.Id, entity.Title, entity.Notes, entity.Status.ToString(), entity.StartedAt,
            entity.CompletedAt, "You", 0, 0, 0, 0));
    }

    [HttpPost("parse-barcode")]
    public async Task<ActionResult<ParseBarcodeResponse>> ParseBarcode([FromBody] ParseBarcodeRequest request)
    {
        if (!BarcodeParser.TryParse(request.ScannedCode, out var parsed, out var error))
            return BadRequest(new { message = error });

        int? componentId = null;
        string? componentName = null;
        int? brandId = null;
        string? brandName = null;
        var preview = string.Empty;

        if (!string.IsNullOrWhiteSpace(parsed.ComponentPrefix))
        {
            var component = await db.HardwareComponents.AsNoTracking()
                .FirstOrDefaultAsync(x => !x.IsDeleted && x.CodePrefix == parsed.ComponentPrefix);

            if (component is not null)
            {
                componentId = component.Id;
                componentName = component.Name;

                if (!string.IsNullOrWhiteSpace(parsed.BrandCode))
                {
                    var brand = await db.Brands.AsNoTracking()
                        .FirstOrDefaultAsync(x =>
                            !x.IsDeleted &&
                            x.HardwareComponentId == component.Id &&
                            x.Code == parsed.BrandCode);

                    if (brand is not null)
                    {
                        brandId = brand.Id;
                        brandName = brand.Name;
                        preview = BarcodeParser.BuildUniqueCode(
                            component.CodePrefix, brand.Code, parsed.SequenceNumber, parsed.IsNewAcquisition);
                    }
                }

                if (string.IsNullOrEmpty(preview) && !string.IsNullOrWhiteSpace(parsed.BrandCode))
                {
                    preview = BarcodeParser.BuildUniqueCode(
                        component.CodePrefix, parsed.BrandCode, parsed.SequenceNumber, parsed.IsNewAcquisition);
                }
            }
            else if (!string.IsNullOrWhiteSpace(parsed.BrandCode))
            {
                preview = BarcodeParser.BuildUniqueCode(
                    parsed.ComponentPrefix!, parsed.BrandCode!, parsed.SequenceNumber, parsed.IsNewAcquisition);
            }
        }

        return Ok(new ParseBarcodeResponse(
            parsed.RawCode,
            parsed.SequenceNumber,
            parsed.IsNewAcquisition,
            parsed.ComponentPrefix,
            parsed.BrandCode,
            componentId,
            componentName,
            brandId,
            brandName,
            preview));
    }

    [HttpPost("{id:int}/scan-confirm")]
    public async Task<ActionResult<ConfirmScanResponse>> ConfirmScan(int id, [FromBody] ConfirmScanRequest request)
    {
        if (request.SequenceNumber <= 0)
            return BadRequest(new { message = "Sequence number must be a positive integer and cannot be changed." });

        var scan = await db.InventoryScans.FirstOrDefaultAsync(x => x.Id == id);
        if (scan is null) return NotFound(new { message = "Scan session not found." });
        if (scan.Status == ScanStatus.Completed)
            return BadRequest(new { message = "This scan session is already completed." });

        var brand = await db.Brands
            .Include(x => x.HardwareComponent)
            .FirstOrDefaultAsync(x => x.Id == request.BrandId && !x.IsDeleted);

        if (brand?.HardwareComponent is null || brand.HardwareComponent.IsDeleted)
            return BadRequest(new { message = "Selected brand was not found. Add the hardware component and brand first." });

        var uniqueCode = BarcodeParser.BuildUniqueCode(
            brand.HardwareComponent.CodePrefix,
            brand.Code,
            request.SequenceNumber,
            request.IsNewAcquisition);

        await using var transaction = await db.Database.BeginTransactionAsync();

        var item = await db.HardwareItems
            .Include(x => x.Brand!).ThenInclude(x => x.HardwareComponent)
            .FirstOrDefaultAsync(x => x.UniqueCode == uniqueCode && !x.IsDeleted);

        var itemWasCreated = false;

        if (item is null)
        {
            var sequenceTaken = await db.HardwareItems.AnyAsync(x =>
                x.BrandId == brand.Id &&
                !x.IsDeleted &&
                x.IsNewAcquisition == request.IsNewAcquisition &&
                x.SequenceNumber == request.SequenceNumber);

            if (sequenceTaken)
            {
                return Conflict(new
                {
                    message = $"Sequence #{request.SequenceNumber} already exists for {brand.HardwareComponent.Name} / {brand.Name}."
                });
            }

            item = new HardwareItem
            {
                BrandId = brand.Id,
                UniqueCode = uniqueCode,
                SequenceNumber = request.SequenceNumber,
                IsNewAcquisition = request.IsNewAcquisition,
                WorkingStatus = request.WorkingStatus,
                Notes = request.Notes?.Trim(),
                CreatedByUserId = User.GetUserId()
            };

            db.HardwareItems.Add(item);
            await db.SaveChangesAsync();
            itemWasCreated = true;

            await audit.LogAsync(User.GetUserId(), "Create", "HardwareItem", item.Id,
                $"Registered item '{item.UniqueCode}' from barcode scan (source: {request.ScannedCode ?? uniqueCode})");
        }
        else
        {
            // Keep item under its existing brand/code; working status can update from this scan.
            item.WorkingStatus = request.WorkingStatus;
            if (!string.IsNullOrWhiteSpace(request.Notes))
                item.Notes = request.Notes.Trim();
        }

        var existingScanItem = await db.InventoryScanItems
            .FirstOrDefaultAsync(x => x.InventoryScanId == id && x.HardwareItemId == item.Id);

        if (existingScanItem is not null)
        {
            existingScanItem.IsPresent = true;
            existingScanItem.WorkingStatus = request.WorkingStatus;
            existingScanItem.Notes = request.Notes?.Trim();
            existingScanItem.ScannedAt = DateTime.UtcNow;
        }
        else
        {
            existingScanItem = new InventoryScanItem
            {
                InventoryScanId = id,
                HardwareItemId = item.Id,
                IsPresent = true,
                WorkingStatus = request.WorkingStatus,
                Notes = request.Notes?.Trim()
            };
            db.InventoryScanItems.Add(existingScanItem);
        }

        await db.SaveChangesAsync();
        await transaction.CommitAsync();

        await audit.LogAsync(User.GetUserId(), "Scan", "InventoryScanItem", existingScanItem.Id,
            $"Confirmed scan '{uniqueCode}' in scan #{id} as {request.WorkingStatus} (created={itemWasCreated})");

        // Ensure navigation for response if we just created the item.
        item.Brand ??= brand;
        item.Brand.HardwareComponent ??= brand.HardwareComponent;

        var itemDto = ItemDto.From(item);

        var scanItemDto = new ScanItemDto(
            existingScanItem.Id,
            item.Id,
            item.UniqueCode,
            item.Brand.HardwareComponent.Name,
            item.Brand.Name,
            existingScanItem.IsPresent,
            existingScanItem.WorkingStatus.ToString(),
            existingScanItem.ScannedAt,
            existingScanItem.Notes,
            itemWasCreated);

        return Ok(new ConfirmScanResponse(scanItemDto, itemDto, itemWasCreated, uniqueCode));
    }

    [HttpPost("{id:int}/scan")]
    public async Task<ActionResult<ScanItemDto>> ScanItem(int id, [FromBody] ScanItemRequest request)
    {
        var scan = await db.InventoryScans.FirstOrDefaultAsync(x => x.Id == id);
        if (scan is null) return NotFound(new { message = "Scan session not found." });
        if (scan.Status == ScanStatus.Completed)
            return BadRequest(new { message = "This scan session is already completed." });

        var code = request.UniqueCode.Trim().ToUpperInvariant();
        var item = await db.HardwareItems
            .Include(x => x.Brand!).ThenInclude(x => x.HardwareComponent)
            .FirstOrDefaultAsync(x => x.UniqueCode == code && !x.IsDeleted);

        if (item is null)
            return NotFound(new
            {
                message = $"No hardware item found for '{code}'. Register this barcode from Hardware first."
            });

        var existing = await db.InventoryScanItems
            .FirstOrDefaultAsync(x => x.InventoryScanId == id && x.HardwareItemId == item.Id);

        if (existing is not null)
        {
            existing.IsPresent = true;
            existing.WorkingStatus = request.WorkingStatus;
            existing.Notes = request.Notes?.Trim();
            existing.ScannedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new InventoryScanItem
            {
                InventoryScanId = id,
                HardwareItemId = item.Id,
                IsPresent = true,
                WorkingStatus = request.WorkingStatus,
                Notes = request.Notes?.Trim()
            };
            db.InventoryScanItems.Add(existing);
        }

        item.WorkingStatus = request.WorkingStatus;
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Scan", "InventoryScanItem", existing.Id,
            $"Scanned '{item.UniqueCode}' in scan #{id} as {request.WorkingStatus}");

        return Ok(new ScanItemDto(
            existing.Id,
            item.Id,
            item.UniqueCode,
            item.Brand!.HardwareComponent!.Name,
            item.Brand.Name,
            existing.IsPresent,
            existing.WorkingStatus.ToString(),
            existing.ScannedAt,
            existing.Notes));
    }

    [HttpPut("{scanId:int}/items/{scanItemId:int}")]
    public async Task<IActionResult> UpdateScanItem(int scanId, int scanItemId, [FromBody] UpdateScanItemRequest request)
    {
        var scanItem = await db.InventoryScanItems
            .Include(x => x.HardwareItem)
            .FirstOrDefaultAsync(x => x.Id == scanItemId && x.InventoryScanId == scanId);

        if (scanItem is null) return NotFound();

        scanItem.IsPresent = request.IsPresent;
        scanItem.WorkingStatus = request.WorkingStatus;
        scanItem.Notes = request.Notes?.Trim();

        if (scanItem.HardwareItem is not null && !scanItem.HardwareItem.IsDeleted)
            scanItem.HardwareItem.WorkingStatus = request.WorkingStatus;

        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Update", "InventoryScanItem", scanItem.Id,
            $"Updated scan item #{scanItemId} present={request.IsPresent}, status={request.WorkingStatus}");

        return NoContent();
    }

    [HttpPost("{id:int}/complete")]
    public async Task<ActionResult<ScanDetailDto>> Complete(int id)
    {
        var scan = await db.InventoryScans.FirstOrDefaultAsync(x => x.Id == id);
        if (scan is null) return NotFound();
        if (scan.Status == ScanStatus.Completed)
            return BadRequest(new { message = "Scan is already completed." });

        scan.Status = ScanStatus.Completed;
        scan.CompletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Complete", "InventoryScan", scan.Id,
            $"Completed inventory scan '{scan.Title}'");

        return await GetById(id);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var scan = await db.InventoryScans.FirstOrDefaultAsync(x => x.Id == id);
        if (scan is null) return NotFound();

        db.InventoryScans.Remove(scan);
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Delete", "InventoryScan", id,
            $"Deleted inventory scan '{scan.Title}'");

        return NoContent();
    }
}
