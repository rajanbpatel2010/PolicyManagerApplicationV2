using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PolicyManager.API.Helpers;

/// <summary>
/// Utility class for generating and validating JWT tokens.
/// </summary>
public static class JwtHelper
{
    public static string GenerateToken(
        int userId,
        string email,
        string fullName,
        string role,
        IConfiguration configuration,
        bool rememberMe = false)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!));

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, fullName),
            new(ClaimTypes.Role, role),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        double expirationMinutes = Convert.ToDouble(jwtSettings["ExpirationInMinutes"]);
        if (rememberMe)
        {
            // Extend session to 7 days if "Remember Me" is checked
            expirationMinutes = 7 * 24 * 60;
        }

        var expiration = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: expiration,
            signingCredentials: new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Extracts the user ID from the ClaimsPrincipal.
    /// </summary>
    public static int? GetUserIdFromClaims(ClaimsPrincipal user)
    {
        var claim = user.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null ? int.Parse(claim.Value) : null;
    }

    public static string? GetEmailFromClaims(ClaimsPrincipal user)
        => user.FindFirst(ClaimTypes.Email)?.Value;

    public static string? GetRoleFromClaims(ClaimsPrincipal user)
        => user.FindFirst(ClaimTypes.Role)?.Value;
}
