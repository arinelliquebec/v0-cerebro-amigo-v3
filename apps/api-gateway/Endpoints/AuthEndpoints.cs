using ApiGateway.Auth;
using ApiGateway.Data;
using ApiGateway.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ApiGateway.Endpoints;

public static class AuthEndpoints
{
    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/auth").WithTags("auth");

        g.MapPost("/login", async (
            [FromBody] LoginRequest req,
            AppDbContext db,
            IPasswordHasher hasher,
            TokenService tokens,
            LoginRateLimiter rateLimiter) =>
        {
            var emailNorm = req.Email.Trim().ToLowerInvariant();

            // Rate limiting: bloqueio após 5 tentativas falhas em 15 min
            if (rateLimiter.IsBlocked(emailNorm))
                return Results.StatusCode(429);

            var user = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == emailNorm);
            if (user is null || !hasher.Verify(req.Senha, user.SenhaHash))
            {
                rateLimiter.RecordFailure(emailNorm);

                // Antes de devolver 401 genérico, verifica se o email pertence
                // ao portal do paciente. Se for o caso, devolve 409 com hint pra
                // o frontend redirecionar — pacientes confundem `/login` (médico)
                // com `/p/entrar` (paciente) com facilidade.
                var ehPaciente = await db.Database.SqlQueryRaw<int>(@"
                    SELECT 1 FROM pacientes_credenciais pc
                    LEFT JOIN clientes c ON c.id = pc.paciente_id
                    WHERE pc.email = {0} OR c.email = {0}
                    LIMIT 1", emailNorm).AnyAsync();
                if (ehPaciente)
                {
                    return Results.Json(
                        new { error = "wrong_portal", expected = "paciente", go = "/p/entrar" },
                        statusCode: 409);
                }
                return Results.Unauthorized();
            }

            rateLimiter.RecordSuccess(emailNorm);
            user.UltimoLogin = DateTime.UtcNow;

            // Migração gradual: hash legado PBKDF2 → bcrypt no próximo login OK
            if (hasher.NeedsRehash(user.SenhaHash))
            {
                user.SenhaHash = hasher.Hash(req.Senha);
            }

            await db.SaveChangesAsync();

            var token = tokens.GenerateForUser(user);
            return Results.Ok(new LoginResponse(token, user.Nome, user.Role));
        })
        .AllowAnonymous()
        .WithSummary("Login no dashboard");

        // GET /api/v1/auth/me — valida a sessão e retorna dados do médico logado.
        // Útil para o frontend verificar se a configuração está ok antes de
        // operações que dependem do registro em `medicos`.
        g.MapGet("/me", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var sub = user.FindFirst("sub")?.Value;
            if (!Guid.TryParse(sub, out var usuarioId))
                return Results.Forbid();

            var row = await db.Database.SqlQueryRaw<MedicoMeDto>(@"
                SELECT m.id AS medico_id, m.nome, m.crm, m.especialidade,
                       u.id AS usuario_id, u.email, u.role
                FROM medicos m
                JOIN usuarios u ON u.id = m.usuario_id
                WHERE m.usuario_id = {0}",
                usuarioId).FirstOrDefaultAsync();

            return row is null ? Results.Forbid() : Results.Ok(row);
        })
        .RequireAuthorization()
        .WithSummary("Perfil do médico logado (health-check de sessão)");
    }
}

public record MedicoMeDto(
    Guid MedicoId, string Nome, string Crm, string? Especialidade,
    Guid UsuarioId, string Email, string Role);
