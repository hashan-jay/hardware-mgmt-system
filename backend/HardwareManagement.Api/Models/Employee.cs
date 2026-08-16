namespace HardwareManagement.Api.Models;

public class Employee
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedByUserId { get; set; }
    public bool IsDeleted { get; set; }

    public User? CreatedByUser { get; set; }
    public ICollection<HardwareItem> OriginalItems { get; set; } = [];
    public ICollection<HardwareItem> CurrentItems { get; set; } = [];
}
