namespace HardwareManagement.Api.Models;

public class Brand
{
    public int Id { get; set; }
    public int HardwareComponentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedByUserId { get; set; }
    public bool IsDeleted { get; set; }

    public HardwareComponent? HardwareComponent { get; set; }
    public User? CreatedByUser { get; set; }
    public ICollection<HardwareItem> Items { get; set; } = [];
}
