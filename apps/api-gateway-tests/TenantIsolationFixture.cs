using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using Testcontainers.PostgreSql;
using Xunit;

namespace ApiGateway.Tests;

/// <summary>
/// Sobe um Postgres real (com pgvector), aplica TODAS as migrations de
/// infra/migrations e seeda dois médicos (tenants) com um paciente cada, mais
/// dados clínicos do paciente do médico B. Expõe o gateway via
/// WebApplicationFactory e helpers para mintar JWT de médico e consultar o banco.
///
/// O objetivo é provar o ISOLAMENTO DE TENANT: médico A nunca lê/altera dado do
/// paciente do médico B. Foi exatamente o modo de falha dos 7 IDOR de 2026-06-08.
/// </summary>
public sealed class TenantIsolationFixture : IAsyncLifetime
{
    // pgvector/pgvector traz vector + uuid-ossp + pgcrypto (migration 0001 exige).
    private readonly PostgreSqlContainer _pg = new PostgreSqlBuilder()
        .WithImage("pgvector/pgvector:pg16")
        .WithDatabase("cerebro_v3_test")
        .Build();

    public const string JwtSecret = "test-secret-tenant-isolation-0123456789-abcdefghij";
    public const string InternalToken = "test-internal-token";

    private WebApplicationFactory<Program> _factory = default!;
    public string ConnectionString { get; private set; } = "";

    // ── IDs seedados (preenchidos no InitializeAsync) ──
    public Guid UsuarioA { get; } = Guid.NewGuid();
    public Guid UsuarioB { get; } = Guid.NewGuid();
    public Guid MedicoA { get; } = Guid.NewGuid();
    public Guid MedicoB { get; } = Guid.NewGuid();
    public Guid PacienteA { get; } = Guid.NewGuid(); // cliente_id do paciente do médico A
    public Guid PacienteB { get; } = Guid.NewGuid(); // cliente_id do paciente do médico B
    public string PacienteBEmail { get; } = "paciente.b@example.com";

    public Guid PrescricaoB { get; } = Guid.NewGuid();   // prescrição ATIVA do paciente B
    public Guid PrescricaoA { get; } = Guid.NewGuid();   // prescrição do paciente A (controle +)
    public Guid NotificacaoB { get; } = Guid.NewGuid();  // notificação do médico B

    public async Task InitializeAsync()
    {
        await _pg.StartAsync();
        ConnectionString = _pg.GetConnectionString();

        await ApplyMigrationsAsync();
        await SeedAsync();

        // Override via env vars (separador __): prioridade acima de appsettings e,
        // com ambiente "Testing", os user-secrets (Development-only) não carregam.
        // ConfigureAppConfiguration no WebApplicationFactory não vencia o appsettings.
        Environment.SetEnvironmentVariable("ConnectionStrings__Postgres", ConnectionString);
        Environment.SetEnvironmentVariable("Jwt__Secret", JwtSecret);
        Environment.SetEnvironmentVariable("Jwt__Issuer", "cerebro-amigo");
        Environment.SetEnvironmentVariable("Jwt__Audience", "dashboard");
        Environment.SetEnvironmentVariable("INTERNAL_API_TOKEN", InternalToken);
        Environment.SetEnvironmentVariable("EXPOSE_ERROR_DETAILS", "true");

        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.UseEnvironment("Testing"));
    }

    public async Task DisposeAsync()
    {
        _factory?.Dispose();
        await _pg.DisposeAsync();
    }

    // ── HttpClient autenticado como um médico (JWT no formato do TokenService) ──
    public HttpClient ClientForMedico(Guid usuarioId)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", MintMedicoToken(usuarioId));
        return client;
    }

    private static string MintMedicoToken(Guid usuarioId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuarioId.ToString()),
            new Claim("role", "medico"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };
        var token = new JwtSecurityToken(
            issuer: "cerebro-amigo",
            audience: "dashboard",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<NpgsqlConnection> OpenDbAsync()
    {
        var conn = new NpgsqlConnection(ConnectionString);
        await conn.OpenAsync();
        return conn;
    }

    // ── Aplica infra/migrations/0*.sql em ordem ──
    private async Task ApplyMigrationsAsync()
    {
        var dir = FindMigrationsDir();
        var files = Directory.GetFiles(dir, "0*.sql")
            // 0036 cria roles/grants de infra referenciando o dono de PROD
            // (cerebroadmin), que não existe no container. É ortogonal ao schema
            // que os testes exercitam — os testes rodam como superuser do container.
            .Where(f => !Path.GetFileName(f).Contains("least_privilege_roles"))
            .OrderBy(f => f).ToArray();
        await using var conn = new NpgsqlConnection(ConnectionString);
        await conn.OpenAsync();
        foreach (var file in files)
        {
            var sql = await File.ReadAllTextAsync(file);
            await using var cmd = new NpgsqlCommand(sql, conn);
            try { await cmd.ExecuteNonQueryAsync(); }
            catch (Exception ex)
            {
                throw new InvalidOperationException(
                    $"Falha ao aplicar migration {Path.GetFileName(file)}: {ex.Message}", ex);
            }
        }
    }

    private static string FindMigrationsDir()
    {
        var d = new DirectoryInfo(AppContext.BaseDirectory);
        while (d is not null)
        {
            var candidate = Path.Combine(d.FullName, "infra", "migrations");
            if (Directory.Exists(candidate)) return candidate;
            d = d.Parent;
        }
        throw new DirectoryNotFoundException(
            "Não encontrei infra/migrations subindo a partir de " + AppContext.BaseDirectory);
    }

    // ── Seed: 2 tenants + dados clínicos do paciente B + controle do paciente A ──
    private async Task SeedAsync()
    {
        await using var conn = new NpgsqlConnection(ConnectionString);
        await conn.OpenAsync();

        async Task Exec(string sql, params object[] p)
        {
            await using var cmd = new NpgsqlCommand(sql, conn);
            for (var i = 0; i < p.Length; i++)
                cmd.Parameters.AddWithValue("p" + i, p[i]);
            await cmd.ExecuteNonQueryAsync();
        }

        // usuarios (role medico) + medicos
        await Exec(@"INSERT INTO usuarios (id, email, senha_hash, nome, role)
                     VALUES (@p0,'medico.a@example.com','x','Médico A','medico'),
                            (@p1,'medico.b@example.com','x','Médico B','medico')",
            UsuarioA, UsuarioB);
        await Exec(@"INSERT INTO medicos (id, usuario_id, nome, crm)
                     VALUES (@p0,@p1,'Médico A','CRM-A'),
                            (@p2,@p3,'Médico B','CRM-B')",
            MedicoA, UsuarioA, MedicoB, UsuarioB);

        // clientes + pacientes (1 por médico)
        await Exec(@"INSERT INTO clientes (id, email, nome)
                     VALUES (@p0,'paciente.a@example.com','Paciente A'),
                            (@p1,@p2,'Paciente B')",
            PacienteA, PacienteB, PacienteBEmail);
        await Exec(@"INSERT INTO pacientes (cliente_id, medico_responsavel_id)
                     VALUES (@p0,@p1),(@p2,@p3)",
            PacienteA, MedicoA, PacienteB, MedicoB);

        // prescrições: B (alvo do ataque) e A (controle positivo)
        await Exec(@"INSERT INTO prescricoes (id, paciente_id, medico_id, medicamento, dose_descricao, ativa)
                     VALUES (@p0,@p1,@p2,'Sertralina 50mg','1x ao dia',TRUE)",
            PrescricaoB, PacienteB, MedicoB);
        await Exec(@"INSERT INTO prescricoes (id, paciente_id, medico_id, medicamento, dose_descricao, ativa)
                     VALUES (@p0,@p1,@p2,'Escitalopram 10mg','1x ao dia',TRUE)",
            PrescricaoA, PacienteA, MedicoA);

        // evento de prescrição do paciente B (alvo do GET historico cross-tenant)
        await Exec(@"INSERT INTO prescricao_eventos (paciente_id, medico_id, prescricao_id, tipo, medicamento)
                     VALUES (@p0,@p1,@p2,'adicao','Sertralina 50mg')",
            PacienteB, MedicoB, PrescricaoB);

        // notificação do médico B (alvo do marcar-lida cross-tenant)
        await Exec(@"INSERT INTO notificacoes_medico (id, medico_id, paciente_id, severidade, tipo, titulo, mensagem, lida)
                     VALUES (@p0,@p1,@p2,'critico','crise','Alerta','Paciente B em risco',FALSE)",
            NotificacaoB, MedicoB, PacienteB);
    }
}

[CollectionDefinition("tenant")]
public sealed class TenantCollection : ICollectionFixture<TenantIsolationFixture> { }
