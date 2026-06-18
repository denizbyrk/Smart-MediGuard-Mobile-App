namespace SmartMediGuard.API.DTOs;

public class RegisterDto {

    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public int? Age { get; set; }
}

public class LoginDto {

    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto {

    public string Token { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int UserId { get; set; }
}

public class UpdateProfileDto {

    public string Name { get; set; } = string.Empty;
}