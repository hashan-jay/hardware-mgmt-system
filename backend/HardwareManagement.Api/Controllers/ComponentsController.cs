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
public class ComponentsController(AppDbContext db, IAuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ComponentDto>>> GetAll()
    {
        var items = await db.HardwareComponents
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Name)
            .Select(x => new ComponentDto(
                x.Id,
                x.Name,
                x.CodePrefix,
                x.Description,
                x.Brands.Count(b => !b.IsDeleted),
                x.Brands.Where(b => !b.IsDeleted).SelectMany(b => b.Items).Count(i => !i.IsDeleted),
                x.CreatedAt))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ComponentDetailDto>> GetById(int id)
    {
        var component = await db.HardwareComponents
            .AsNoTracking()
            .Where(x => x.Id == id && !x.IsDeleted)
            .Select(x => new ComponentDetailDto(
                x.Id,
                x.Name,
                x.CodePrefix,
                x.Description,
                x.CreatedAt,
                x.Brands.Where(b => !b.IsDeleted).OrderBy(b => b.Name).Select(b => new BrandDto(
                    b.Id,
                    b.HardwareComponentId,
                    b.Name,
                    b.Code,
                    b.Items.Count(i => !i.IsDeleted),
                    b.Items.Count(i => !i.IsDeleted && !i.IsNewAcquisition),
                    b.Items.Count(i => !i.IsDeleted && i.IsNewAcquisition),
                    b.CreatedAt))))
            .FirstOrDefaultAsync();

        return component is null ? NotFound() : Ok(component);
    }

    [HttpPost]
    public async Task<ActionResult<ComponentDto>> Create([FromBody] CreateComponentRequest request)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "Component name is required." });

        var nameExists = await db.HardwareComponents.AnyAsync(x =>
            !x.IsDeleted && x.Name.ToLower() == name.ToLower());
        if (nameExists)
            return Conflict(new { message = $"Component '{name}' already exists." });

        var prefix = await CodeGenerator.UniqueComponentPrefixAsync(db, name, request.CodePrefix);

        var entity = new HardwareComponent
        {
            Name = name,
            CodePrefix = prefix,
            Description = request.Description?.Trim(),
            CreatedByUserId = User.GetUserId()
        };

        db.HardwareComponents.Add(entity);
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Create", "HardwareComponent", entity.Id,
            $"Created component '{entity.Name}' ({entity.CodePrefix})");

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new ComponentDto(
            entity.Id, entity.Name, entity.CodePrefix, entity.Description, 0, 0, entity.CreatedAt));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateComponentRequest request)
    {
        var entity = await db.HardwareComponents.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entity is null) return NotFound();

        var prefix = request.CodePrefix.Trim().ToUpperInvariant();
        var exists = await db.HardwareComponents.AnyAsync(x => !x.IsDeleted && x.CodePrefix == prefix && x.Id != id);
        if (exists)
            return Conflict(new { message = $"Component code prefix '{prefix}' already exists." });

        entity.Name = request.Name.Trim();
        entity.CodePrefix = prefix;
        entity.Description = request.Description?.Trim();
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Update", "HardwareComponent", entity.Id,
            $"Updated component '{entity.Name}' ({entity.CodePrefix})");

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await db.HardwareComponents.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entity is null) return NotFound();

        entity.IsDeleted = true;
        var brands = await db.Brands.Where(x => x.HardwareComponentId == id && !x.IsDeleted).ToListAsync();
        foreach (var brand in brands)
        {
            brand.IsDeleted = true;
            var items = await db.HardwareItems.Where(x => x.BrandId == brand.Id && !x.IsDeleted).ToListAsync();
            foreach (var item in items) item.IsDeleted = true;
        }

        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Delete", "HardwareComponent", entity.Id,
            $"Deleted component '{entity.Name}' and related brands/items");

        return NoContent();
    }
}
