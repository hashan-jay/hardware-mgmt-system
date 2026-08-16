namespace HardwareManagement.Api.Models;

public class InventoryScan
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public ScanStatus Status { get; set; } = ScanStatus.InProgress;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public int CreatedByUserId { get; set; }

    public User? CreatedByUser { get; set; }
    public ICollection<InventoryScanItem> ScanItems { get; set; } = [];
}
