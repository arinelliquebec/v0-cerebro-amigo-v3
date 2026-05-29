using ApiGateway.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace ApiGateway.Auth;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

/// <summary>
/// PBKDF2 com salt — versão simples sem dependências externas.
/// Em produção considere migrar para argon2 (libsodium) ou bcrypt.
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 100_000;

    public string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password, salt, Iterations, HashAlgorithmName.SHA256, HashSize);

        var bytes = new byte[SaltSize + HashSize];
        Buffer.BlockCopy(salt, 0, bytes, 0, SaltSize);
        Buffer.BlockCopy(hash, 0, bytes, SaltSize, HashSize);
        return Convert.ToBase64String(bytes);
    }

    public bool Verify(string password, string base64)
    {
        try
        {
            var bytes = Convert.FromBase64String(base64);
            if (bytes.Length != SaltSize + HashSize) return false;

            var salt = bytes[..SaltSize];
            var expected = bytes[SaltSize..];
            var actual = Rfc2898DeriveBytes.Pbkdf2(
                password, salt, Iterations, HashAlgorithmName.SHA256, HashSize);

            return CryptographicOperations.FixedTimeEquals(expected, actual);
        }
        catch
        {
            return false;
        }
    }
}

public class TokenService(IConfiguration config)
{
    public string GenerateForUser(Usuario user)
    {
        var secret = config["Jwt:Secret"]
                     ?? throw new InvalidOperationException("Jwt:Secret obrigatório");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("name", user.Nome),
            new Claim("role", user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"] ?? "agentes-empresa",
            audience: config["Jwt:Audience"] ?? "dashboard",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
