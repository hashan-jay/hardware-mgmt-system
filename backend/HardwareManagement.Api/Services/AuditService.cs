using HardwareManagement.Api.Data;
using HardwareManagement.Api.Models;

namespace HardwareManagement.Api.Services;

public class AuditService(AppDbContext db) : IAuditService
{
    public async Task LogAsync(int userId, string action, string entityType, int? entityId, string details)
    {
        db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }
}
