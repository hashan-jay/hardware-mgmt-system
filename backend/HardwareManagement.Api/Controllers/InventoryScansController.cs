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
public class InventoryScansController(AppDbContext db, IAuditService audit, ScanAuditService scans) : ControllerBase
{
    [HttpGet("log")]
    public async Task<ActionResult<ScanLogDto>> Log([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        if (from == default || to == default)
            return BadRequest(new { message = "Start date and end date are required." });

        try
        {
            return Ok(await scans.GetLogAsync(from, to));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("record")]
    public async Task<ActionResult<ScanItemDto>> Record([FromBody] ScanItemRequest request)
    {
        try
        {
            var line = await scans.RecordTodayAsync(
                User.GetUserId(),
                request.UniqueCode,
                request.WorkingStatus,
                request.Notes,
                request.NotWorkingReason);

            await audit.LogAsync(User.GetUserId(), "Scan", "InventoryScanItem", line.Id,
                $"Scanned '{line.UniqueCode}' on {scans.Today():yyyy-MM-dd} as {request.WorkingStatus}");

            return Ok(line);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
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
}
