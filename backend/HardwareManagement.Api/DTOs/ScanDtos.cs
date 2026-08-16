using HardwareManagement.Api.Models;

namespace HardwareManagement.Api.DTOs;

public record CreateScanRequest(string Title, string? Notes);

public record ScanItemRequest(string UniqueCode, ItemWorkingStatus WorkingStatus, string? Notes = null);

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
    string? ScannedCode = null);

public record ConfirmScanResponse(
    ScanItemDto ScanItem,
    ItemDto Item,
    bool ItemWasCreated,
    string UniqueCode);

public record UpdateScanItemRequest(bool IsPresent, ItemWorkingStatus WorkingStatus, string? Notes);

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
    int NotWorkingCount);

public record ScanDetailDto(
    int Id,
    string Title,
    string? Notes,
    string Status,
    DateTime StartedAt,
    DateTime? CompletedAt,
    string CreatedBy,
    IEnumerable<ScanItemDto> ScannedItems,
    IEnumerable<MissingItemDto> MissingItems);

public record ScanItemDto(
    int Id,
    int HardwareItemId,
    string UniqueCode,
    string ComponentName,
    string BrandName,
    bool IsPresent,
    string WorkingStatus,
    DateTime ScannedAt,
    string? Notes,
    bool ItemWasCreated = false);

public record MissingItemDto(
    int HardwareItemId,
    string UniqueCode,
    string ComponentName,
    string BrandName,
    string WorkingStatus);
