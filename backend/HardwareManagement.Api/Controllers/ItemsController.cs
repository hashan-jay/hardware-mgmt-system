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
public class ItemsController(AppDbContext db, IAuditService audit) : ControllerBase
{
    [HttpGet("items")]
    public async Task<ActionResult<IEnumerable<ItemDto>>> GetAll()
    {
        var items = await MapItemQuery().ToListAsync();
        return Ok(items.OrderByDescending(x => x.CreatedAt));
    }

    [HttpGet("brands/{brandId:int}/items")]
    public async Task<ActionResult<IEnumerable<ItemDto>>> GetByBrand(int brandId)
    {
        var brandExists = await db.Brands.AnyAsync(x => x.Id == brandId && !x.IsDeleted);
        if (!brandExists) return NotFound(new { message = "Brand not found." });

        var items = await MapItemQuery()
            .Where(x => x.BrandId == brandId)
            .ToListAsync();

        return Ok(items.OrderBy(x => x.IsNewAcquisition).ThenBy(x => x.SequenceNumber));
    }

    [HttpGet("items/{id:int}")]
    public async Task<ActionResult<ItemDto>> GetById(int id)
    {
        var item = await MapItemQuery()
            .FirstOrDefaultAsync(x => x.Id == id);

        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("items/by-code/{code}")]
    public async Task<ActionResult<ItemDto>> GetByCode(string code)
    {
        var item = await MapItemQuery()
            .FirstOrDefaultAsync(x => x.UniqueCode == code.Trim().ToUpperInvariant());

        return item is null ? NotFound(new { message = "Item not found." }) : Ok(item);
    }

    [HttpPost("brands/{brandId:int}/items")]
    public async Task<ActionResult<ItemDto>> Create(int brandId, [FromBody] CreateItemRequest request)
    {
        var brand = await db.Brands
            .Include(x => x.HardwareComponent)
            .FirstOrDefaultAsync(x => x.Id == brandId && !x.IsDeleted);

        if (brand?.HardwareComponent is null || brand.HardwareComponent.IsDeleted)
            return NotFound(new { message = "Brand not found." });

        var uniqueCode = request.UniqueCode?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(uniqueCode))
            return BadRequest(new { message = "Barcode is required." });

        var codeExists = await db.HardwareItems.AnyAsync(x => x.UniqueCode == uniqueCode && !x.IsDeleted);
        if (codeExists)
            return Conflict(new { message = $"Barcode '{uniqueCode}' already exists." });

        if (request.WorkingStatus == ItemWorkingStatus.NotWorking &&
            string.IsNullOrWhiteSpace(request.NotWorkingReason))
            return BadRequest(new { message = "A reason is required when the item is not working." });

        var nextSequence = await db.HardwareItems
            .Where(x => x.BrandId == brandId)
            .Select(x => (int?)x.SequenceNumber)
            .MaxAsync() ?? 0;

        var entity = new HardwareItem
        {
            BrandId = brandId,
            UniqueCode = uniqueCode,
            SequenceNumber = CodeGenerator.SequenceFromCode(uniqueCode, nextSequence + 1),
            IsNewAcquisition = request.IsNewAcquisition,
            WorkingStatus = request.WorkingStatus,
            Notes = request.Notes?.Trim(),
            NotWorkingReason = request.WorkingStatus == ItemWorkingStatus.NotWorking
                ? request.NotWorkingReason?.Trim()
                : null,
            CreatedByUserId = User.GetUserId()
        };

        db.HardwareItems.Add(entity);
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Create", "HardwareItem", entity.Id,
            $"Added inventory item '{entity.UniqueCode}'");

        entity.Brand = brand;
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, ItemDto.From(entity));
    }

    [HttpPut("items/{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateItemRequest request)
    {
        var entity = await db.HardwareItems.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entity is null) return NotFound();

        if (request.WorkingStatus == ItemWorkingStatus.NotWorking &&
            string.IsNullOrWhiteSpace(request.NotWorkingReason))
            return BadRequest(new { message = "A reason is required when the item is not working." });

        if (!string.IsNullOrWhiteSpace(request.UniqueCode))
        {
            var uniqueCode = request.UniqueCode.Trim().ToUpperInvariant();
            var codeTaken = await db.HardwareItems.AnyAsync(x =>
                x.Id != id && x.UniqueCode == uniqueCode && !x.IsDeleted);
            if (codeTaken)
                return Conflict(new { message = $"Barcode '{uniqueCode}' already belongs to another item." });

            entity.UniqueCode = uniqueCode;
        }

        entity.WorkingStatus = request.WorkingStatus;
        entity.NotWorkingReason = request.WorkingStatus == ItemWorkingStatus.NotWorking
            ? request.NotWorkingReason?.Trim()
            : entity.NotWorkingReason;
        entity.Notes = request.Notes?.Trim();
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Update", "HardwareItem", entity.Id,
            $"Updated item '{entity.UniqueCode}' status to {entity.WorkingStatus}");

        return NoContent();
    }

    [HttpPost("items/{id:int}/issue")]
    public async Task<IActionResult> Issue(int id, [FromBody] IssueItemRequest request)
    {
        var entity = await db.HardwareItems.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entity is null) return NotFound();

        var employee = await db.Employees.FirstOrDefaultAsync(x => x.Id == request.EmployeeId && !x.IsDeleted);
        if (employee is null)
            return BadRequest(new { message = "Selected employee was not found." });

        if (entity.CurrentEmployeeId == employee.Id)
            return BadRequest(new { message = "This item is already issued to that employee." });

        if (entity.CurrentEmployeeId is null)
        {
            entity.OriginalEmployeeId = employee.Id;
            entity.CurrentEmployeeId = employee.Id;
            entity.HandedTo = employee.FullName;
            entity.HandedDate = DateTime.Today;
            entity.OriginalIssuedDate = DateTime.Today;
            await db.SaveChangesAsync();
            await audit.LogAsync(User.GetUserId(), "Update", "HardwareItem", entity.Id,
                $"Issued '{entity.UniqueCode}' to '{employee.FullName}'");
            return NoContent();
        }

        var reason = request.Reason?.Trim();
        if (string.IsNullOrWhiteSpace(reason))
            return BadRequest(new { message = "A reason is required to issue this item to a different person." });

        entity.OriginalEmployeeId ??= entity.CurrentEmployeeId;
        entity.OriginalIssuedDate ??= entity.HandedDate;
        entity.CurrentEmployeeId = employee.Id;
        entity.PersonChangeReason = reason;
        entity.HandedTo = employee.FullName;
        entity.HandedDate = DateTime.Today;
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Update", "HardwareItem", entity.Id,
            $"Reissued '{entity.UniqueCode}' to '{employee.FullName}'");

        return NoContent();
    }

    [HttpPost("items/{id:int}/change-person")]
    public async Task<IActionResult> ChangePerson(int id, [FromBody] ChangePersonRequest request)
    {
        var entity = await db.HardwareItems
            .Include(x => x.OriginalEmployee)
            .Include(x => x.CurrentEmployee)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entity is null) return NotFound();

        var reason = request.Reason?.Trim();
        if (string.IsNullOrWhiteSpace(reason))
            return BadRequest(new { message = "A reason is required to change the person." });

        var employee = await db.Employees.FirstOrDefaultAsync(x => x.Id == request.EmployeeId && !x.IsDeleted);
        if (employee is null)
            return BadRequest(new { message = "Selected employee was not found." });

        if (entity.CurrentEmployeeId == employee.Id)
            return BadRequest(new { message = "Select a different employee than the current person." });

        entity.OriginalEmployeeId ??= entity.CurrentEmployeeId;
        entity.OriginalIssuedDate ??= entity.HandedDate;
        entity.CurrentEmployeeId = employee.Id;
        entity.PersonChangeReason = reason;
        entity.HandedTo = employee.FullName;
        entity.HandedDate = DateTime.Today;
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Update", "HardwareItem", entity.Id,
            $"Changed person for '{entity.UniqueCode}' to '{employee.FullName}'");

        return NoContent();
    }

    [HttpDelete("items/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await db.HardwareItems.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entity is null) return NotFound();

        entity.IsDeleted = true;
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Delete", "HardwareItem", entity.Id,
            $"Deleted item '{entity.UniqueCode}'");

        return NoContent();
    }

    private IQueryable<ItemDto> MapItemQuery() =>
        db.HardwareItems
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .Select(x => new ItemDto(
                x.Id,
                x.BrandId,
                x.UniqueCode,
                x.SequenceNumber,
                x.IsNewAcquisition,
                x.WorkingStatus.ToString(),
                x.Notes,
                x.Brand!.HardwareComponent!.Name,
                x.Brand.Name,
                x.CreatedAt,
                x.CurrentEmployee != null ? x.CurrentEmployee.FullName : x.HandedTo,
                x.HandedDate,
                x.ReplacedItemCode,
                x.ReplacedPerson,
                x.ReplacedTo,
                x.ReplacedDate,
                x.OriginalEmployeeId,
                x.OriginalEmployee != null ? x.OriginalEmployee.FullName : null,
                x.CurrentEmployeeId,
                x.CurrentEmployee != null ? x.CurrentEmployee.FullName : null,
                x.NotWorkingReason,
                x.PersonChangeReason,
                x.OriginalIssuedDate,
                x.CurrentEmployee != null && x.CurrentEmployee.Department != null
                    ? x.CurrentEmployee.Department.Name
                    : null,
                x.OriginalEmployee != null && x.OriginalEmployee.Department != null
                    ? x.OriginalEmployee.Department.Name
                    : null));
}
