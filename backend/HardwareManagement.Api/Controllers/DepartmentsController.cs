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
public class DepartmentsController(AppDbContext db, IAuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DepartmentDto>>> GetAll()
    {
        var departments = await db.Departments
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Name)
            .Select(x => new DepartmentDto(
                x.Id,
                x.Name,
                x.CreatedAt,
                x.Employees.Count(employee => !employee.IsDeleted)))
            .ToListAsync();

        return Ok(departments);
    }

    [HttpPost]
    public async Task<ActionResult<DepartmentDto>> Create([FromBody] CreateDepartmentRequest request)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "Department name is required." });

        var exists = await db.Departments.AnyAsync(x => !x.IsDeleted && x.Name.ToLower() == name.ToLower());
        if (exists)
            return Conflict(new { message = $"Department '{name}' already exists." });

        var entity = new Department
        {
            Name = name,
            CreatedByUserId = User.GetUserId()
        };

        db.Departments.Add(entity);
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Create", "Department", entity.Id, $"Created department '{entity.Name}'");

        return Created($"/api/departments/{entity.Id}", DepartmentDto.From(entity));
    }
}
