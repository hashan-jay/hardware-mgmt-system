namespace HardwareManagement.Api.DTOs;

public record CreateBrandRequest(string Name, string? Code = null);

public record UpdateBrandRequest(string Name, string Code);

public record BrandDto(
    int Id,
    int HardwareComponentId,
    string Name,
    string Code,
    int ItemCount,
    int ExistingItemCount,
    int NewItemCount,
    DateTime CreatedAt);

public record BrandDetailDto(
    int Id,
    int HardwareComponentId,
    string ComponentName,
    string ComponentCodePrefix,
    string Name,
    string Code,
    DateTime CreatedAt,
    IEnumerable<ItemDto> Items);
