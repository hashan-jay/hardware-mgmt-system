namespace HardwareManagement.Api.DTOs;

public record CreateEmployeeRequest(string FullName, int DepartmentId);

public record UpdateEmployeeRequest(string FullName, int DepartmentId);

public record EmployeeDto(int Id, string FullName, DateTime CreatedAt, int? DepartmentId, string? DepartmentName)
{
    public static EmployeeDto From(
        HardwareManagement.Api.Models.Employee employee,
        string? departmentName = null) =>
        new(
            employee.Id,
            employee.FullName,
            employee.CreatedAt,
            employee.DepartmentId,
            departmentName ?? employee.Department?.Name);
}
