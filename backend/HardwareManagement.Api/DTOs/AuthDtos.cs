using HardwareManagement.Api.Models;

namespace HardwareManagement.Api.DTOs;

public record LoginRequest(string Username, string Password);

public record LoginResponse(string Token, UserDto User);

public record UserDto(int Id, string Username, string FullName, string Role);

public record CreateUserRequest(string Username, string Password, string FullName, UserRole Role);
