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
using Amazon.S3;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
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
            // Comparação constante-time (timing-attack safe) via CryptographicOperations
            return !string.IsNullOrEmpty(expected)
                && CryptographicOperations.FixedTimeEquals(
                    System.Text.Encoding.UTF8.GetBytes(token),
                    System.Text.Encoding.UTF8.GetBytes(expected));
        }));

    // Admin master (#1 = dono da plataforma, role='owner').
    // Gerado pelo seed original (role='admin') e promovido via migration 0010.
    options.AddPolicy("owner", policy =>
        policy.RequireClaim("role", "owner"));

    // Admins gerais + owner: acesso de leitura ao painel admin.
    options.AddPolicy("admin_geral", policy =>
        policy.RequireAssertion(ctx =>
            ctx.User.HasClaim("role", "owner") || ctx.User.HasClaim("role", "admin")));
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
builder.Services.AddSingleton<LoginRateLimiter>();
builder.Services.AddSingleton<CryptoService>();
builder.Services.AddScoped<ITenantContext, TenantContext>();

// Teleconsulta (vídeo P2P): credencial TURN efêmera + relay de sinalização
// em memória (singleton — pareia os 2 peers por consulta_id). Não trafega
// mídia nem persiste sinalização (SDP/ICE têm IP = PII).
builder.Services.AddSingleton<TurnCredentialService>();
builder.Services.AddSingleton<TeleconsultaSignalingHub>();

builder.Services.AddMemoryCache();

// HTTP clients
builder.Services.AddHttpClient(); // factory genérico

builder.Services.AddHttpClient<ResendClient>()
    .AddStandardResilienceHandler();

builder.Services.AddHttpClient<MemedClient>()
    .AddStandardResilienceHandler();

// CfmClient: SEM StandardResilienceHandler — o scrape do CFM pela Infosimples
// leva até ~60s (o total-timeout padrão de 30s mataria). Retries MANUAIS (3x, 1s)
// controlados no CfmClient — o StandardResilienceHandler duplicaria chamadas PAGAS.
builder.Services.AddHttpClient<CfmClient>();

// AsaasClient: SEM StandardResilienceHandler — retry automático em POST /payments
// criaria COBRANÇA DUPLICADA (mesmo motivo do CfmClient). Idempotência fica a
// cargo do fluxo (1 cobrança por chamada do médico).
builder.Services.AddHttpClient<AsaasClient>();

// OrchestratorStreamClient — proxy SSE para o orchestrator-py
builder.Services.AddOrchestratorStreamClient(builder.Configuration);

// HttpClient nomeado para agents-py (chamadas on-demand de agentes)
builder.Services.AddHttpClient("agents-py", client =>
{
    var url = builder.Configuration["AGENTS_PY_URL"] ?? "http://agents-py:8082";
    client.BaseAddress = new Uri(url);
    // Diário de voz: agents-py faz polling do Transcribe até transcribe_timeout_s
    // (120s) + chamada Claude. Gateway precisa esperar mais que isso, senão aborta
    // a transcrição no meio. Margem para o Claude por cima dos 120s.
    client.Timeout = TimeSpan.FromSeconds(150);
});

// -----------------------------------------------------------------------------
// OpenAPI 3.1 (nativo no .NET 10)
// -----------------------------------------------------------------------------
builder.Services.AddSignalR();

// S3 (rede social — fotos dos posts). Credenciais: IAM role (prod) / mount
// ~/.aws (dev). Bucket privado em S3_BUCKET_SOCIAL.
builder.Services.AddSingleton<IAmazonS3>(_ =>
    new AmazonS3Client(Amazon.RegionEndpoint.GetBySystemName(
        builder.Configuration["AWS_REGION"] ?? "sa-east-1")));

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

        var exposeDetails = app.Environment.IsDevelopment()
            && string.Equals(
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
MemedEndpoints.Map(app);
MedicamentosEndpoints.Map(app);
NotificacoesEndpoints.Map(app);
PacienteAuthEndpoints.Map(app);
PortalPacienteEndpoints.Map(app);
PortalAgendaEndpoints.Map(app);
app.MapPortalConversation();
CheckinsEndpoints.Map(app);
EscalasEndpoints.Map(app);
ExamesEndpoints.Map(app);
RenovacoesEndpoints.Map(app);
InteracoesEndpoints.Map(app);
CobrancasEndpoints.Map(app);
BlindagemEndpoints.Map(app);
RoiEndpoints.Map(app);
RagEndpoints.Map(app);
InsightsEndpoints.Map(app);
ConsultasEndpoints.Map(app);
TeleconsultaEndpoints.Map(app);
EscribaEndpoints.Map(app);
CriseEndpoints.Map(app);
FilaAtencaoEndpoints.Map(app);
EvolucaoEndpoints.Map(app);
CondutasEndpoints.Map(app);
ConfigEndpoints.Map(app);
EscalacaoEndpoints.Map(app);
ComunicacaoEndpoints.Map(app);
MensagensEndpoints.Map(app);
PromptsEndpoints.Map(app);
AdminEndpoints.Map(app);
SeedEndpoint.Map(app);
SeedDemoEndpoint.Map(app);

app.Run();
