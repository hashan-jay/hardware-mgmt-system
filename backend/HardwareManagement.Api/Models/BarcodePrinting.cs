namespace HardwareManagement.Api.Models;

public class LabelPrinter
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsSelected { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedByUserId { get; set; }
    public bool IsDeleted { get; set; }

    public User? CreatedByUser { get; set; }
    public ICollection<PrintSize> Sizes { get; set; } = [];
}

public class PrintSize
{
    public int Id { get; set; }
    public int PrinterId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal WidthMm { get; set; }
    public decimal HeightMm { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedByUserId { get; set; }
    public bool IsDeleted { get; set; }

    public LabelPrinter? Printer { get; set; }
    public User? CreatedByUser { get; set; }
    public ICollection<BarcodeQueueItem> QueueItems { get; set; } = [];
}

public class BarcodeQueueItem
{
    public int Id { get; set; }
    public int HardwareItemId { get; set; }
    public int? PrintSizeId { get; set; }
    public BarcodeQueueStatus Status { get; set; } = BarcodeQueueStatus.Queued;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PrintedAt { get; set; }
    public int CreatedByUserId { get; set; }

    public HardwareItem? HardwareItem { get; set; }
    public PrintSize? PrintSize { get; set; }
    public User? CreatedByUser { get; set; }
}
