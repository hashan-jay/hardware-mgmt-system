namespace HardwareManagement.Api.DTOs;

public record CreateEmployeeRequest(string FullName);

public record UpdateEmployeeRequest(string FullName);

public record EmployeeDto(int Id, string FullName, DateTime CreatedAt)
{
    public static EmployeeDto From(HardwareManagement.Api.Models.Employee employee) =>
        new(employee.Id, employee.FullName, employee.CreatedAt);
}
