namespace HardwareManagement.Api.DTOs;

public record CreateDepartmentRequest(string Name);

public record DepartmentDto(int Id, string Name, DateTime CreatedAt, int EmployeeCount)
{
    public static DepartmentDto From(HardwareManagement.Api.Models.Department department, int employeeCount = 0) =>
        new(department.Id, department.Name, department.CreatedAt, employeeCount);
}
