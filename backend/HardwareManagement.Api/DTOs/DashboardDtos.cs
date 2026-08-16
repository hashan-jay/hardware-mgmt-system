namespace HardwareManagement.Api.DTOs;

public record DashboardDto(
    int ComponentCount,
    int BrandCount,
    int TotalItems,
    int WorkingItems,
    int NotWorkingItems,
    int NewAcquisitionItems,
    int ActiveScanCount,
    IEnumerable<ComponentSummaryDto> Components);

public record ComponentSummaryDto(int Id, string Name, string CodePrefix, int BrandCount, int ItemCount);

public record AuditLogDto(
    int Id,
    string Username,
    string Action,
    string EntityType,
    int? EntityId,
    string Details,
    DateTime CreatedAt);
