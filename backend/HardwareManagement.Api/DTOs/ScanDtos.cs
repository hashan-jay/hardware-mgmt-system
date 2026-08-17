using HardwareManagement.Api.Models;

namespace HardwareManagement.Api.DTOs;

public record CreateScanRequest(string Title, string? Notes);

public record ScanItemRequest(
    string UniqueCode,
    ItemWorkingStatus WorkingStatus,
    string? Notes = null,
    string? NotWorkingReason = null);

public record ParseBarcodeRequest(string ScannedCode);

public record ParseBarcodeResponse(
    string ScannedCode,
    int SequenceNumber,
    bool IsNewAcquisition,
    string? SuggestedComponentPrefix,
    string? SuggestedBrandCode,
    int? MatchedComponentId,
    string? MatchedComponentName,
    int? MatchedBrandId,
    string? MatchedBrandName,
    string PreviewUniqueCode);

public record ConfirmScanRequest(
    int BrandId,
    int SequenceNumber,
    bool IsNewAcquisition,
    ItemWorkingStatus WorkingStatus = ItemWorkingStatus.Working,
    string? Notes = null,
    string? ScannedCode = null,
    string? NotWorkingReason = null);

public record ConfirmScanResponse(
    ScanItemDto ScanItem,
    ItemDto Item,
    bool ItemWasCreated,
    string UniqueCode);

public record UpdateScanItemRequest(
    ItemWorkingStatus WorkingStatus,
    string? Notes,
    string? NotWorkingReason = null);

public record ScanDto(
    int Id,
    string Title,
    string? Notes,
    string Status,
    DateTime StartedAt,
    DateTime? CompletedAt,
    string CreatedBy,
    int ScannedCount,
    int MissingCount,
    int WorkingCount,
    int NotWorkingCount,
    int ExpectedCount = 0,
    int NewlyFoundCount = 0);

public record ScanDetailDto(
    int Id,
    string Title,
    string? Notes,
    string Status,
    DateTime StartedAt,
    DateTime? CompletedAt,
    string CreatedBy,
    int ExpectedCount,
    int ScannedCount,
    int MissingCount,
    int NewlyFoundCount,
    int WorkingCount,
    int NotWorkingCount,
    IEnumerable<ScanItemDto> ScannedItems,
    IEnumerable<ScanItemDto> MissingItems,
    IEnumerable<ScanItemDto> ExtraFoundItems);

public record ScanItemDto(
    int Id,
    int HardwareItemId,
    string UniqueCode,
    string ComponentName,
    string BrandName,
    int? ComponentId,
    int? CurrentEmployeeId,
    string? HolderName,
    bool Issued,
    bool IsPresent,
    bool IsExpected,
    bool ItemWasCreated,
    string WorkingStatus,
    string? NotWorkingReason,
    DateTime? ScannedAt,
    string? Notes,
    string? OriginalEmployeeName,
    DateTime? OriginalIssuedDate,
    DateTime? HandedDate,
    int? ScanId = null,
    string? ScanTitle = null,
    DateTime? ScanStartedAt = null,
    string? HolderDepartment = null,
    string? OriginalEmployeeDepartment = null);

public record ScanLogDto(
    DateTime From,
    DateTime To,
    bool IsToday,
    int InSystemCount,
    int ScannedCount,
    int MissingCount,
    IEnumerable<ScanItemDto> ScannedItems,
    IEnumerable<ScanItemDto> MissingItems);

public record ScanReportTotalsDto(
    int AuditCount,
    int InSystemEntered,
    int Scanned,
    int Misplaced,
    int ExtraFound,
    int UniqueMisplaced,
    int UniqueScanned);

public record ScanReportCategoryDto(
    int? ComponentId,
    string Name,
    int UniqueExpected,
    int UniqueScanned,
    int UniqueMisplaced,
    int MissingOccurrences);

public record ScanReportEmployeeDto(
    int? EmployeeId,
    string Name,
    int UniqueAssigned,
    int UniqueScanned,
    int UniqueMisplaced,
    int MissingOccurrences);

public record ScanReportDto(
    DateTime From,
    DateTime To,
    int? ComponentId,
    int? EmployeeId,
    int CompletedScanCount,
    int InProgressScanCount,
    ScanReportTotalsDto Totals,
    IEnumerable<ScanDto> Scans,
    IEnumerable<ScanReportCategoryDto> Categories,
    IEnumerable<ScanReportEmployeeDto> Employees,
    IEnumerable<ScanItemDto> ScannedItems,
    IEnumerable<ScanItemDto> MissingItems);
