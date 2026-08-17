namespace HardwareManagement.Api.DTOs;

public record DashboardDto(
    int ComponentCount,
    int BrandCount,
    int TotalItems,
    int WorkingItems,
    int NotWorkingItems,
    int NewAcquisitionItems,
    int ActiveScanCount,
    int IssuedItems,
    int InStockItems,
    int IssuedNotWorkingItems,
    int WorkingStockItems,
    int EmployeeCount,
    int EmployeesWithHardware,
    IEnumerable<ComponentAnalyticsDto> Components,
    IEnumerable<EmployeeLoadDto> Holders,
    IEnumerable<string> Insights,
    IEnumerable<TrendPointDto> WeeklyTrend,
    IEnumerable<DayPulseDto> DailyPulse,
    IEnumerable<BrandShareDto> BrandShares,
    IEnumerable<ScanPulseDto> RecentScans,
    IEnumerable<ActivityPointDto> ActivityPulse);

public record ComponentAnalyticsDto(
    int Id,
    string Name,
    int ItemCount,
    int IssuedCount,
    int InStockCount,
    int WorkingStockCount,
    int NotWorkingCount,
    int IssuedNotWorkingCount);

public record EmployeeLoadDto(int EmployeeId, string FullName, int ItemCount, string? DepartmentName = null);

public record TrendPointDto(string Label, string WeekStart, int Added, int Issued, int Reissued);

public record DayPulseDto(string Label, string Date, int Added, int Issued, int Reissued);

public record BrandShareDto(
    int Id,
    string Name,
    string ComponentName,
    int ItemCount,
    int IssuedCount,
    int InStockCount,
    int NotWorkingCount);

public record ScanPulseDto(
    int Id,
    string Title,
    DateTime StartedAt,
    string Status,
    int ScannedCount,
    int MissingCount,
    int WorkingCount,
    int NotWorkingCount);

public record ActivityPointDto(string Label, string Date, int Total, int Creates, int Updates, int Scans);

public record ComponentSummaryDto(int Id, string Name, string CodePrefix, int BrandCount, int ItemCount);

public record AuditLogDto(
    int Id,
    string Username,
    string Action,
    string EntityType,
    int? EntityId,
    string Details,
    DateTime CreatedAt);
