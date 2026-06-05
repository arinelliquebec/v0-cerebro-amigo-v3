using Amazon.S3;
using Amazon.S3.Model;
using ApiGateway.Data;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ApiGateway.Endpoints;

/// <summary>
/// Upload de fotos da rede social (ADR-031). Padrão presigned: o navegador sobe
/// a imagem DIRETO para o S3 (PUT presigned), e o gateway só assina URLs — não
/// trafega o binário. As imagens ficam num bucket PRIVADO (S3_BUCKET_SOCIAL);
/// a exibição usa GET presigned de curta duração via /rede/midia (só médico
/// logado vê). Sem PII de paciente (regra da rede).
/// </summary>
public static class RedeFotoEndpoints
{
    private static readonly HashSet<string> TiposImagem =
        new(StringComparer.OrdinalIgnoreCase) { "image/jpeg", "image/png", "image/webp" };

    public static void Map(WebApplication app)
    {
        var g = app.MapGroup("/api/v1/rede").WithTags("rede-foto").RequireAuthorization();

        // Presigned PUT — navegador sobe direto pro S3. Devolve a key a guardar no post.
        g.MapPost("/posts/foto-presign", async (
            [FromBody] FotoPresignRequest req, AppDbContext db, ClaimsPrincipal user,
            IAmazonS3 s3, IConfiguration cfg) =>
        {
            var medicoId = await ResolveMedicoId(db, user);
            if (medicoId is null) return Results.Forbid();

            var contentType = (req.ContentType ?? "").Trim().ToLowerInvariant();
            if (!TiposImagem.Contains(contentType))
                return Results.BadRequest(new { error = "tipo_invalido", aceitos = TiposImagem.ToArray() });

            var bucket = cfg["S3_BUCKET_SOCIAL"];
            if (string.IsNullOrWhiteSpace(bucket))
                return Results.Json(new { error = "bucket_nao_configurado" }, statusCode: 503);

            var ext = contentType switch { "image/png" => "png", "image/webp" => "webp", _ => "jpg" };
            var key = $"posts/{medicoId}/{Guid.NewGuid():N}.{ext}";

            var uploadUrl = await s3.GetPreSignedURLAsync(new GetPreSignedUrlRequest
            {
                BucketName = bucket,
                Key = key,
                Verb = HttpVerb.PUT,
                ContentType = contentType,
                Expires = DateTime.UtcNow.AddMinutes(5),
            });
            return Results.Ok(new { uploadUrl, key, contentType });
        });

        // Serve a mídia: 302 → GET presigned (objeto privado). Só chaves de posts.
        g.MapGet("/midia/{**key}", async (
            string key, AppDbContext db, ClaimsPrincipal user, IAmazonS3 s3, IConfiguration cfg) =>
        {
            var medicoId = await ResolveMedicoId(db, user);
            if (medicoId is null) return Results.Forbid();

            var bucket = cfg["S3_BUCKET_SOCIAL"];
            if (string.IsNullOrWhiteSpace(bucket)) return Results.NotFound();
            // Restringe ao namespace de posts (evita leitura arbitrária do bucket).
            if (string.IsNullOrWhiteSpace(key) || !key.StartsWith("posts/")) return Results.NotFound();

            var url = await s3.GetPreSignedURLAsync(new GetPreSignedUrlRequest
            {
                BucketName = bucket,
                Key = key,
                Verb = HttpVerb.GET,
                Expires = DateTime.UtcNow.AddMinutes(10),
            });
            return Results.Redirect(url);
        });
    }

    private static async Task<Guid?> ResolveMedicoId(AppDbContext db, ClaimsPrincipal user)
    {
        var sub = user.FindFirst("sub")?.Value;
        if (!Guid.TryParse(sub, out var userId)) return null;
        return await db.Database.ExecuteScalarAsync<Guid?>(
            "SELECT id FROM medicos WHERE usuario_id = {0}", userId);
    }
}

public record FotoPresignRequest(string ContentType);
