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
[Route("api")]
public class BrandsController(AppDbContext db, IAuditService audit) : ControllerBase
{
    [HttpGet("components/{componentId:int}/brands")]
    public async Task<ActionResult<IEnumerable<BrandDto>>> GetByComponent(int componentId)
    {
        var exists = await db.HardwareComponents.AnyAsync(x => x.Id == componentId && !x.IsDeleted);
        if (!exists) return NotFound(new { message = "Component not found." });

        var brands = await db.Brands
            .AsNoTracking()
            .Where(x => x.HardwareComponentId == componentId && !x.IsDeleted)
            .OrderBy(x => x.Name)
            .Select(x => new BrandDto(
                x.Id,
                x.HardwareComponentId,
                x.Name,
                x.Code,
                x.Items.Count(i => !i.IsDeleted),
                x.Items.Count(i => !i.IsDeleted && !i.IsNewAcquisition),
                x.Items.Count(i => !i.IsDeleted && i.IsNewAcquisition),
                x.CreatedAt))
            .ToListAsync();

        return Ok(brands);
    }

    [HttpGet("brands/{id:int}")]
    public async Task<ActionResult<BrandDetailDto>> GetById(int id)
    {
        var brand = await db.Brands
            .AsNoTracking()
            .Where(x => x.Id == id && !x.IsDeleted)
            .Select(x => new BrandDetailDto(
                x.Id,
                x.HardwareComponentId,
                x.HardwareComponent!.Name,
                x.HardwareComponent.CodePrefix,
                x.Name,
                x.Code,
                x.CreatedAt,
                x.Items.Where(i => !i.IsDeleted).OrderBy(i => i.IsNewAcquisition).ThenBy(i => i.SequenceNumber)
                    .Select(i => new ItemDto(
                        i.Id,
                        i.BrandId,
                        i.UniqueCode,
                        i.SequenceNumber,
                        i.IsNewAcquisition,
                        i.WorkingStatus.ToString(),
                        i.Notes,
                        x.HardwareComponent.Name,
                        x.Name,
                        i.CreatedAt,
                        i.CurrentEmployee != null ? i.CurrentEmployee.FullName : i.HandedTo,
                        i.HandedDate,
                        i.ReplacedItemCode,
                        i.ReplacedPerson,
                        i.ReplacedTo,
                        i.ReplacedDate,
                        i.OriginalEmployeeId,
                        i.OriginalEmployee != null ? i.OriginalEmployee.FullName : null,
                        i.CurrentEmployeeId,
                        i.CurrentEmployee != null ? i.CurrentEmployee.FullName : null,
                        i.NotWorkingReason,
                        i.PersonChangeReason,
                        i.OriginalIssuedDate,
                        i.CurrentEmployee != null && i.CurrentEmployee.Department != null
                            ? i.CurrentEmployee.Department.Name
                            : null,
                        i.OriginalEmployee != null && i.OriginalEmployee.Department != null
                            ? i.OriginalEmployee.Department.Name
                            : null))))
            .FirstOrDefaultAsync();

        return brand is null ? NotFound() : Ok(brand);
    }

    [HttpPost("components/{componentId:int}/brands")]
    public async Task<ActionResult<BrandDto>> Create(int componentId, [FromBody] CreateBrandRequest request)
    {
        var component = await db.HardwareComponents.FirstOrDefaultAsync(x => x.Id == componentId && !x.IsDeleted);
        if (component is null) return NotFound(new { message = "Component not found." });

        var name = request.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "Brand name is required." });

        var nameExists = await db.Brands.AnyAsync(x =>
            x.HardwareComponentId == componentId && !x.IsDeleted && x.Name.ToLower() == name.ToLower());
        if (nameExists)
            return Conflict(new { message = $"Brand '{name}' already exists for this component." });

        var code = await CodeGenerator.UniqueBrandCodeAsync(db, componentId, name, request.Code);

        var entity = new Brand
        {
            HardwareComponentId = componentId,
            Name = name,
            Code = code,
            CreatedByUserId = User.GetUserId()
        };

        db.Brands.Add(entity);
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Create", "Brand", entity.Id,
            $"Created brand '{entity.Name}' ({entity.Code}) under {component.Name}");

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new BrandDto(
            entity.Id, entity.HardwareComponentId, entity.Name, entity.Code, 0, 0, 0, entity.CreatedAt));
    }

    [HttpPut("brands/{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBrandRequest request)
    {
        var entity = await db.Brands.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entity is null) return NotFound();

        var code = request.Code.Trim().ToUpperInvariant();
        var exists = await db.Brands.AnyAsync(x =>
            x.HardwareComponentId == entity.HardwareComponentId && !x.IsDeleted && x.Code == code && x.Id != id);
        if (exists)
            return Conflict(new { message = $"Brand code '{code}' already exists for this component." });

        entity.Name = request.Name.Trim();
        entity.Code = code;
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Update", "Brand", entity.Id,
            $"Updated brand '{entity.Name}' ({entity.Code})");

        return NoContent();
    }

    [HttpDelete("brands/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await db.Brands.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entity is null) return NotFound();

        entity.IsDeleted = true;
        var items = await db.HardwareItems.Where(x => x.BrandId == id && !x.IsDeleted).ToListAsync();
        foreach (var item in items) item.IsDeleted = true;

        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Delete", "Brand", entity.Id,
            $"Deleted brand '{entity.Name}' and related items");

        return NoContent();
    }
}
