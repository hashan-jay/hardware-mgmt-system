namespace HardwareManagement.Api.Models;

public class HardwareItem
{
    public int Id { get; set; }
    public int BrandId { get; set; }
    public string UniqueCode { get; set; } = string.Empty;
    public int SequenceNumber { get; set; }
    public bool IsNewAcquisition { get; set; }
    public ItemWorkingStatus WorkingStatus { get; set; } = ItemWorkingStatus.Working;
    public string? Notes { get; set; }
    public string? HandedTo { get; set; }
    public DateTime? HandedDate { get; set; }
    public string? ReplacedItemCode { get; set; }
    public string? ReplacedPerson { get; set; }
    public string? ReplacedTo { get; set; }
    public DateTime? ReplacedDate { get; set; }
    public int? OriginalEmployeeId { get; set; }
    public int? CurrentEmployeeId { get; set; }
    public string? NotWorkingReason { get; set; }
    public string? PersonChangeReason { get; set; }
    public DateTime? OriginalIssuedDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedByUserId { get; set; }
    public bool IsDeleted { get; set; }

    public Brand? Brand { get; set; }
    public User? CreatedByUser { get; set; }
    public Employee? OriginalEmployee { get; set; }
    public Employee? CurrentEmployee { get; set; }
    public ICollection<InventoryScanItem> ScanItems { get; set; } = [];
}
