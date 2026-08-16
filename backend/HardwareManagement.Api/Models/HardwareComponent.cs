namespace HardwareManagement.Api.Models;

public class HardwareComponent
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CodePrefix { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedByUserId { get; set; }
    public bool IsDeleted { get; set; }

    public User? CreatedByUser { get; set; }
    public ICollection<Brand> Brands { get; set; } = [];
}
