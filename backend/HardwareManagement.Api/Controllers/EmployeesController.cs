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
public class EmployeesController(AppDbContext db, IAuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetAll()
    {
        var employees = await db.Employees
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.FullName)
            .Select(x => new EmployeeDto(
                x.Id,
                x.FullName,
                x.CreatedAt,
                x.DepartmentId,
                x.Department != null ? x.Department.Name : null))
            .ToListAsync();

        return Ok(employees);
    }

    [HttpPost]
    public async Task<ActionResult<EmployeeDto>> Create([FromBody] CreateEmployeeRequest request)
    {
        var name = request.FullName?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "Employee name is required." });

        var department = await db.Departments.FirstOrDefaultAsync(x => x.Id == request.DepartmentId && !x.IsDeleted);
        if (department is null)
            return BadRequest(new { message = "Select a department for this employee." });

        var exists = await db.Employees.AnyAsync(x => !x.IsDeleted && x.FullName.ToLower() == name.ToLower());
        if (exists)
            return Conflict(new { message = $"Employee '{name}' already exists." });

        var entity = new Employee
        {
            FullName = name,
            DepartmentId = department.Id,
            CreatedByUserId = User.GetUserId()
        };

        db.Employees.Add(entity);
        await db.SaveChangesAsync();
        await audit.LogAsync(
            User.GetUserId(),
            "Create",
            "Employee",
            entity.Id,
            $"Created employee '{entity.FullName}' in '{department.Name}'");

        return Created($"/api/employees/{entity.Id}", EmployeeDto.From(entity, department.Name));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEmployeeRequest request)
    {
        var entity = await db.Employees.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entity is null) return NotFound();

        var name = request.FullName?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "Employee name is required." });

        var department = await db.Departments.FirstOrDefaultAsync(x => x.Id == request.DepartmentId && !x.IsDeleted);
        if (department is null)
            return BadRequest(new { message = "Select a department for this employee." });

        var exists = await db.Employees.AnyAsync(x =>
            !x.IsDeleted && x.FullName.ToLower() == name.ToLower() && x.Id != id);
        if (exists)
            return Conflict(new { message = $"Employee '{name}' already exists." });

        entity.FullName = name;
        entity.DepartmentId = department.Id;
        await db.SaveChangesAsync();
        await audit.LogAsync(
            User.GetUserId(),
            "Update",
            "Employee",
            entity.Id,
            $"Updated employee '{entity.FullName}' in '{department.Name}'");

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await db.Employees.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entity is null) return NotFound();

        var assigned = await db.HardwareItems.AnyAsync(x =>
            !x.IsDeleted && (x.OriginalEmployeeId == id || x.CurrentEmployeeId == id));
        if (assigned)
            return Conflict(new { message = "This employee is assigned to hardware and cannot be deleted." });

        entity.IsDeleted = true;
        await db.SaveChangesAsync();
        await audit.LogAsync(User.GetUserId(), "Delete", "Employee", entity.Id, $"Deleted employee '{entity.FullName}'");

        return NoContent();
    }
}
