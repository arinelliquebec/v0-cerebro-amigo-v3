// =============================================================================
// Cérebro Amigo — API Gateway (.NET 10 Minimal API)
// =============================================================================
// Responsabilidades:
//   - Autenticação (JWT médico + paciente)
//   - REST CRUD transacional (pacientes, prescrições, check-ins, insights…)
//   - Proxy SSE para o orchestrator-py (conversa paciente↔IA)
//   - E-mail transacional via Resend (magic links)
//   - OpenAPI 3.1 nativo
//
// Não chama LLM. LLM é responsabilidade exclusiva de orchestrator-py e
// agents-py via AWS Bedrock (ADR-008). Sem Azure, sem ANTHROPIC_API_KEY.
// =============================================================================

using ApiGateway.Auth;
using ApiGateway.Data;
using ApiGateway.Endpoints;
using ApiGateway.Features.Portal.Conversation;
using ApiGateway.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// -----------------------------------------------------------------------------
// EF Core 10 + Npgsql
// -----------------------------------------------------------------------------
// Prioridade de connection string:
//   1. ConnectionStrings:Postgres  (dev local / appsettings)
//   2. ConnectionStrings:Default   (legado)
//   3. POSTGRES_DSN                (env var — docker-compose / EC2)
var postgresConn =
    builder.Configuration.GetConnectionString("Postgres")
    ?? builder.Configuration.GetConnectionString("Default")
    ?? builder.Configuration["POSTGRES_DSN"]
    ?? throw new InvalidOperationException(
        "Connection string do Postgres não configurada. " +
        "Defina ConnectionStrings:Postgres, ConnectionStrings:Default ou POSTGRES_DSN.");

{
    var bootLogger = LoggerFactory.Create(b => b.AddConsole())
        .CreateLogger("Bootstrap");
    var sanitized = System.Text.RegularExpressions.Regex.Replace(
        postgresConn,
        @"(Password|password|pwd)=[^;]*",
        "$1=***");
    bootLogger.LogInformation("Postgres connection configurada: {Conn}", sanitized);
}

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(postgresConn).UseSnakeCaseNamingConvention());

// -----------------------------------------------------------------------------
// Autenticação JWT
// -----------------------------------------------------------------------------
var jwtSecret = builder.Configuration["Jwt:Secret"]
                ?? builder.Configuration["JWT_SECRET"]
                ?? throw new InvalidOperationException("Jwt:Secret / JWT_SECRET obrigatório");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Mantém nomes curtos do JWT (sub, role, email, name) sem remapear para
        // URNs longos do System.Security.Claims. user.FindFirst("sub") funciona.
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "cerebro-amigo",
            ValidAudiences = [
                builder.Configuration["Jwt:Audience"] ?? "dashboard",
                "portal-paciente"
            ],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            NameClaimType = "sub",
            RoleClaimType = "role",
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("paciente", policy =>
        policy.RequireClaim("role", "paciente"));

    // Policy para endpoints chamados por serviços internos (Python → .NET).
    // Valida header: Authorization: Bearer ${INTERNAL_API_TOKEN}
    options.AddPolicy("internal", policy =>
        policy.RequireAssertion(ctx =>
        {
            var cfg = ctx.Resource as HttpContext
                ?? throw new InvalidOperationException();
            var token = cfg.Request.Headers["Authorization"]
                .ToString().Replace("Bearer ", "").Trim();
            var expected = builder.Configuration["INTERNAL_API_TOKEN"] ?? "";
            return !string.IsNullOrEmpty(expected) && token == expected;
        }));
});

// -----------------------------------------------------------------------------
// CORS para o frontend Next.js
// -----------------------------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("dashboard", policy =>
    {
        var origens = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
                      ?? ["http://localhost:3000"];
        policy.WithOrigins(origens)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// -----------------------------------------------------------------------------
// Serviços de domínio
// -----------------------------------------------------------------------------
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<TokenService>();
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITenantContext, TenantContext>();

// HTTP clients
builder.Services.AddHttpClient(); // factory genérico

builder.Services.AddHttpClient<ResendClient>()
    .AddStandardResilienceHandler();

// OrchestratorStreamClient — proxy SSE para o orchestrator-py
builder.Services.AddOrchestratorStreamClient(builder.Configuration);

// HttpClient nomeado para agents-py (chamadas on-demand de agentes)
builder.Services.AddHttpClient("agents-py", client =>
{
    var url = builder.Configuration["AGENTS_PY_URL"] ?? "http://agents-py:8082";
    client.BaseAddress = new Uri(url);
    client.Timeout = TimeSpan.FromSeconds(60);
});

// -----------------------------------------------------------------------------
// OpenAPI 3.1 (nativo no .NET 10)
// -----------------------------------------------------------------------------
builder.Services.AddOpenApi("v1", options =>
{
    options.AddDocumentTransformer((document, _, _) =>
    {
        document.Info.Title = "Cérebro Amigo — API Gateway";
        document.Info.Version = "v1";
        document.Info.Description = "API transacional do Cérebro Amigo V3. Não chama LLM.";
        return Task.CompletedTask;
    });
});

// -----------------------------------------------------------------------------
// Build e pipeline
// -----------------------------------------------------------------------------
var app = builder.Build();

app.MapOpenApi();

if (app.Environment.IsDevelopment())
    app.MapGet("/", () => Results.Redirect("/openapi/v1.json"));

// -----------------------------------------------------------------------------
// Tratamento global de exceção
// -----------------------------------------------------------------------------
// `EXPOSE_ERROR_DETAILS=true` inclui mensagem e tipo no body — útil em dev,
// mas vaza implementação em prod. Use o trace_id para correlacionar logs.
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var feature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var ex = feature?.Error;
        var logger = context.RequestServices.GetRequiredService<ILoggerFactory>()
            .CreateLogger("GlobalExceptionHandler");

        var traceId = context.TraceIdentifier;
        logger.LogError(ex,
            "Exceção não tratada em {Method} {Path} (trace {TraceId})",
            context.Request.Method, context.Request.Path, traceId);

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";

        var exposeDetails = string.Equals(
            builder.Configuration["EXPOSE_ERROR_DETAILS"], "true",
            StringComparison.OrdinalIgnoreCase);

        var payload = exposeDetails
            ? new
            {
                error = "internal_server_error",
                message = ex?.Message,
                type = ex?.GetType().FullName,
                trace_id = traceId,
            }
            : (object)new
            {
                error = "internal_server_error",
                trace_id = traceId,
            };

        await context.Response.WriteAsJsonAsync(payload);
    });
});

app.UseCors("dashboard");
app.UseAuthentication();
app.UseAuthorization();

// Liveness e readiness
app.MapGet("/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();
app.MapGet("/ready", async (AppDbContext db) =>
{
    try
    {
        await db.Database.CanConnectAsync();
        return Results.Ok(new { status = "ready" });
    }
    catch
    {
        return Results.StatusCode(503);
    }
}).AllowAnonymous();

// Endpoints
AuthEndpoints.Map(app);
AgentesEndpoints.Map(app);
PacientesPsiqEndpoints.Map(app);
PrescricoesEndpoints.Map(app);
MedicamentosEndpoints.Map(app);
NotificacoesEndpoints.Map(app);
PacienteAuthEndpoints.Map(app);
PortalPacienteEndpoints.Map(app);
app.MapPortalConversation();
CheckinsEndpoints.Map(app);
InsightsEndpoints.Map(app);
SeedEndpoint.Map(app);

app.Run();
