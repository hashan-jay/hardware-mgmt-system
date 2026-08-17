using HardwareManagement.Api.Models;

namespace HardwareManagement.Api.DTOs;

public record CreateItemRequest(
    string UniqueCode,
    ItemWorkingStatus WorkingStatus = ItemWorkingStatus.Working,
    string? NotWorkingReason = null,
    string? Notes = null,
    bool IsNewAcquisition = false);

public record UpdateItemRequest(
    ItemWorkingStatus WorkingStatus,
    string? UniqueCode = null,
    string? NotWorkingReason = null,
    string? Notes = null);

public record IssueItemRequest(int EmployeeId, string? Reason = null);

public record ChangePersonRequest(int EmployeeId, string Reason);

public record ItemDto(
    int Id,
    int BrandId,
    string UniqueCode,
    int SequenceNumber,
    bool IsNewAcquisition,
    string WorkingStatus,
    string? Notes,
    string ComponentName,
    string BrandName,
    DateTime CreatedAt,
    string? HandedTo,
    DateTime? HandedDate,
    string? ReplacedItemCode,
    string? ReplacedPerson,
    string? ReplacedTo,
    DateTime? ReplacedDate,
    int? OriginalEmployeeId,
    string? OriginalEmployeeName,
    int? CurrentEmployeeId,
    string? CurrentEmployeeName,
    string? NotWorkingReason,
    string? PersonChangeReason,
    DateTime? OriginalIssuedDate,
    string? CurrentEmployeeDepartment = null,
    string? OriginalEmployeeDepartment = null)
{
    public static ItemDto From(HardwareItem item) => new(
        item.Id,
        item.BrandId,
        item.UniqueCode,
        item.SequenceNumber,
        item.IsNewAcquisition,
        item.WorkingStatus.ToString(),
        item.Notes,
        item.Brand!.HardwareComponent!.Name,
        item.Brand.Name,
        item.CreatedAt,
        item.CurrentEmployee?.FullName ?? item.HandedTo,
        item.HandedDate,
        item.ReplacedItemCode,
        item.ReplacedPerson,
        item.ReplacedTo,
        item.ReplacedDate,
        item.OriginalEmployeeId,
        item.OriginalEmployee?.FullName,
        item.CurrentEmployeeId,
        item.CurrentEmployee?.FullName,
        item.NotWorkingReason,
        item.PersonChangeReason,
        item.OriginalIssuedDate,
        item.CurrentEmployee?.Department?.Name,
        item.OriginalEmployee?.Department?.Name);
}
