namespace HardwareManagement.Api.Models;

public class InventoryScanItem
{
    public int Id { get; set; }
    public int InventoryScanId { get; set; }
    public int HardwareItemId { get; set; }
    public bool IsPresent { get; set; } = true;
    public ItemWorkingStatus WorkingStatus { get; set; } = ItemWorkingStatus.Working;
    public DateTime ScannedAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }

    public InventoryScan? InventoryScan { get; set; }
    public HardwareItem? HardwareItem { get; set; }
}
