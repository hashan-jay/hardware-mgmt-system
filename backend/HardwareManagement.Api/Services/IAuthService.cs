using HardwareManagement.Api.DTOs;

namespace HardwareManagement.Api.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<UserDto?> GetUserAsync(int userId);
}
