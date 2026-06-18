using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartMediGuard.API.Data;
using SmartMediGuard.API.DTOs;
using SmartMediGuard.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SmartMediGuard.API.Services;

public class AuthService {

    private readonly AppDbContext db;
    private readonly IConfiguration config;

    public AuthService(AppDbContext db, IConfiguration config) {

        this.db = db;
        this.config = config;
    }

    //register
    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto) {

        //if email already registered
        if (await this.db.Users.AnyAsync(u => u.Email == dto.Email))
            return null;

        var user = new User {

            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Age = dto.Age,
        };

        this.db.Users.Add(user);
        await this.db.SaveChangesAsync();

        return new AuthResponseDto {

            Token = GenerateToken(user),
            Name = user.Name,
            UserId = user.Id
        };
    }

    //login
    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto) {

        var user = await this.db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user == null) return null;
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash)) return null;

        return new AuthResponseDto {

            Token = GenerateToken(user),
            Name = user.Name,
            UserId = user.Id
        };
    }

    //delete account
    public async Task<bool> DeleteAccountAsync(int userId) {

        var user = await this.db.Users.FindAsync(userId);
        if (user == null) return false;

        user.IsActive  = false;
        user.UpdatedAt = DateTime.UtcNow;

        await this.db.Medications
            .Where(m => m.UserId == userId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(m => m.IsActive,   false)
                .SetProperty(m => m.UpdatedAt,  DateTime.UtcNow));

        await this.db.SaveChangesAsync();
        return true;
    }

    //update profile
    public async Task<bool> UpdateProfileAsync(int userId, string name) {

        var user = await this.db.Users.FindAsync(userId);
        if (user == null) return false;
        user.Name      = name;
        user.UpdatedAt = DateTime.UtcNow;
        await this.db.SaveChangesAsync();
        return true;
    }

    //JWT token generation
    private string GenerateToken(User user) {

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(this.config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[] {

            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim(ClaimTypes.Name, user.Name),
        };

        var token = new JwtSecurityToken(
            issuer: this.config["Jwt:Issuer"],
            audience: this.config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}