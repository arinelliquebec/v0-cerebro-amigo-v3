using ApiGateway.Auth;
using ApiGateway.Data;
using ApiGateway.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
            TokenService tokens) =>
        {
            var emailNorm = req.Email.Trim().ToLowerInvariant();
            var user = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == emailNorm);
            if (user is null || !hasher.Verify(req.Senha, user.SenhaHash))
            {
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

            user.UltimoLogin = DateTime.UtcNow;
            await db.SaveChangesAsync();

            var token = tokens.GenerateForUser(user);
            return Results.Ok(new LoginResponse(token, user.Nome, user.Role));
        })
        .AllowAnonymous()
        .WithSummary("Login no dashboard");
    }
}
