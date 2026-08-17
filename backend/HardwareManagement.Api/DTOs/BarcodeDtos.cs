namespace HardwareManagement.Api.DTOs;

public record CreatePrinterRequest(string Name);

public record LabelPrinterDto(int Id, string Name, bool IsSelected, DateTime CreatedAt, int SizeCount)
{
    public static LabelPrinterDto From(HardwareManagement.Api.Models.LabelPrinter printer, int sizeCount = 0) =>
        new(printer.Id, printer.Name, printer.IsSelected, printer.CreatedAt, sizeCount);
}

public record CreatePrintSizeRequest(string Name, decimal WidthMm, decimal HeightMm, bool IsDefault = false);

public record PrintSizeDto(
    int Id,
    int PrinterId,
    string Name,
    decimal WidthMm,
    decimal HeightMm,
    bool IsDefault)
{
    public static PrintSizeDto From(HardwareManagement.Api.Models.PrintSize size) =>
        new(size.Id, size.PrinterId, size.Name, size.WidthMm, size.HeightMm, size.IsDefault);
}

public record QueueBarcodeRequest(int HardwareItemId);

public record UpdateQueueSizeRequest(int PrintSizeId);

public record BarcodeQueueDto(
    int Id,
    int HardwareItemId,
    string UniqueCode,
    string ComponentName,
    string BrandName,
    int? PrintSizeId,
    string? PrintSizeName,
    decimal? WidthMm,
    decimal? HeightMm,
    int? PrinterId,
    string Status,
    DateTime CreatedAt);
