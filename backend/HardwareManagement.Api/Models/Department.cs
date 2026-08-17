namespace HardwareManagement.Api.Models;

public class Department
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedByUserId { get; set; }
    public bool IsDeleted { get; set; }

    public User? CreatedByUser { get; set; }
    public ICollection<Employee> Employees { get; set; } = [];
}
