// =============================================================================
// API Gateway — .NET 10 Minimal API
// =============================================================================
// Responsabilidades:
//   - Autenticação (JWT) e autorização do dashboard
//   - Pagamentos (Mercado Pago)
//   - Nota fiscal (NFE.io)
//   - Leitura de conversas/métricas para o frontend Next.js
//   - OpenAPI 3.1 nativo
// =============================================================================

using ApiGateway.Auth;
using ApiGateway.Data;
using ApiGateway.Endpoints;
using ApiGateway.Features.Portal.Conversation;
using ApiGateway.Services;
using Azure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// -----------------------------------------------------------------------------
// Configuração — Key Vault em produção, user-secrets/env em dev
// -----------------------------------------------------------------------------
var keyVaultUri = builder.Configuration["KeyVault:Uri"];
if (!string.IsNullOrEmpty(keyVaultUri) && builder.Environment.IsProduction())
{
    builder.Configuration.AddAzureKeyVault(
        new Uri(keyVaultUri),
        new DefaultAzureCredential());
}

// -----------------------------------------------------------------------------
// Application Insights
// -----------------------------------------------------------------------------
builder.Services.AddApplicationInsightsTelemetry(options =>
{
    options.ConnectionString = builder.Configuration["APPLICATIONINSIGHTS_CONNECTION_STRING"];
});

// -----------------------------------------------------------------------------
// EF Core 10 + Npgsql
// -----------------------------------------------------------------------------
// Aceita várias formas de configurar a connection string, em ordem de prioridade:
//   1. ConnectionStrings:Postgres       (nome canônico, usado pelo dev local)
//   2. ConnectionStrings:Default        (nome legado, usado no ECS Fargate atual)
//   3. POSTGRES_CONN                    (env var bruta, usada pelo docker-compose)
// Sem esse fallback múltiplo, mudanças na infra exigem rebuild da imagem.
var postgresConn =
    builder.Configuration.GetConnectionString("Postgres")
    ?? builder.Configuration.GetConnectionString("Default")
    ?? builder.Configuration["POSTGRES_CONN"]
    ?? throw new InvalidOperationException(
        "Connection string do Postgres não configurada. Defina uma de: " +
        "ConnectionStrings:Postgres, ConnectionStrings:Default, ou POSTGRES_CONN.");

// Loga (sanitizado) qual foi resolvida — vital pra debug em produção.
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
                ?? throw new InvalidOperationException("Jwt:Secret obrigatório");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Mantém os claims com seus nomes curtos do JWT (sub, role, email, name)
        // em vez de mapear para os tipos longos do System.Security.Claims.
        // Sem isso, user.FindFirst("sub") retorna null porque o .NET o renomeia
        // para http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier.
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "agentes-empresa",
            ValidAudiences = new[] {
                builder.Configuration["Jwt:Audience"] ?? "dashboard",
                "portal-paciente"
            },
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            NameClaimType = "sub",
            RoleClaimType = "role",
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("paciente", policy =>
        policy.RequireClaim("role", "paciente"));
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
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<MercadoPagoClient>();
builder.Services.AddScoped<NfeIoClient>();
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();

// HTTP clients com resilience
builder.Services.AddHttpClient(); // factory genérico

builder.Services.AddHttpClient<MercadoPagoClient>(c =>
{
    c.BaseAddress = new Uri("https://api.mercadopago.com/");
    c.DefaultRequestHeaders.Add("Authorization",
        $"Bearer {builder.Configuration["MERCADO_PAGO_ACCESS_TOKEN"]}");
}).AddStandardResilienceHandler();

builder.Services.AddHttpClient<NfeIoClient>(c =>
{
    c.BaseAddress = new Uri("https://api.nfe.io/");
    c.DefaultRequestHeaders.Add("Authorization",
        builder.Configuration["NFEIO_API_KEY"]);
}).AddStandardResilienceHandler();

builder.Services.AddHttpClient<ResendClient>()
    .AddStandardResilienceHandler();

// OrchestratorStreamClient — proxy SSE pro orchestrator-py em Python
builder.Services.AddOrchestratorStreamClient(builder.Configuration);

// HttpClient nomeado pro agents-py (chamadas on-demand de agents)
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
        document.Info.Title = "Agentes Empresa — API Gateway";
        document.Info.Version = "v1";
        document.Info.Description = "API para dashboard, pagamentos e nota fiscal.";
        return Task.CompletedTask;
    });
});

// -----------------------------------------------------------------------------
// Build e pipeline
// -----------------------------------------------------------------------------
var app = builder.Build();

// OpenAPI em /openapi/v1.json
app.MapOpenApi();

if (app.Environment.IsDevelopment())
{
    // Em dev, expõe Scalar UI (mais moderna que Swagger)
    app.MapGet("/", () => Results.Redirect("/openapi/v1.json"));
}

// -----------------------------------------------------------------------------
// Tratamento global de exceção
// -----------------------------------------------------------------------------
// Sem esse middleware, exceções não tratadas viram 500 com Content-Length: 0,
// inutilizando qualquer tentativa de debug remoto. Aqui logamos via ILogger
// (stdout → CloudWatch / Application Insights) e devolvemos JSON estruturado.
//
// `EXPOSE_ERROR_DETAILS=true` no ambiente faz o corpo da resposta incluir a
// mensagem e o tipo da exceção — útil em dev/staging, MAS em produção real
// vaza implementação. Mantenha false em prod e use o trace_id (request id)
// para correlacionar com os logs.
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

// Endpoints
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

AuthEndpoints.Map(app);
PaymentEndpoints.Map(app);
NotaFiscalEndpoints.Map(app);
ConversasEndpoints.Map(app);
MetricasEndpoints.Map(app);
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