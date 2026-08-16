namespace HardwareManagement.Api.Models;

public class InventoryScanItem
{
    public int Id { get; set; }
    public int InventoryScanId { get; set; }
    public int HardwareItemId { get; set; }
    public bool IsPresent { get; set; }
    public bool IsExpected { get; set; } = true;
    public bool ItemWasCreated { get; set; }
    public ItemWorkingStatus WorkingStatus { get; set; } = ItemWorkingStatus.Working;
    public DateTime? ScannedAt { get; set; }
    public string? Notes { get; set; }
    public string? UniqueCode { get; set; }
    public string? ComponentName { get; set; }
    public string? BrandName { get; set; }
    public int? ComponentId { get; set; }
    public int? CurrentEmployeeId { get; set; }
    public string? HolderName { get; set; }
    public bool Issued { get; set; }
    public string? NotWorkingReason { get; set; }
    public string? OriginalEmployeeName { get; set; }
    public DateTime? OriginalIssuedDate { get; set; }
    public DateTime? HandedDate { get; set; }

    public InventoryScan? InventoryScan { get; set; }
    public HardwareItem? HardwareItem { get; set; }
}
