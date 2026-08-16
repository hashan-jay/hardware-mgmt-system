using HardwareManagement.Api.Data;
using HardwareManagement.Api.DTOs;
using HardwareManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HardwareManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AuditLogsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetAll([FromQuery] int take = 200)
    {
        take = Math.Clamp(take, 1, 1000);

        var logs = await db.AuditLogs
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(take)
            .Select(x => new AuditLogDto(
                x.Id,
                x.User!.Username,
                x.Action,
                x.EntityType,
                x.EntityId,
                x.Details,
                x.CreatedAt))
            .ToListAsync();

        return Ok(logs);
    }
}
