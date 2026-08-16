namespace HardwareManagement.Api.DTOs;

public record CreateComponentRequest(string Name, string? CodePrefix = null, string? Description = null);

public record UpdateComponentRequest(string Name, string CodePrefix, string? Description);

public record ComponentDto(
    int Id,
    string Name,
    string CodePrefix,
    string? Description,
    int BrandCount,
    int ItemCount,
    DateTime CreatedAt);

public record ComponentDetailDto(
    int Id,
    string Name,
    string CodePrefix,
    string? Description,
    DateTime CreatedAt,
    IEnumerable<BrandDto> Brands);
