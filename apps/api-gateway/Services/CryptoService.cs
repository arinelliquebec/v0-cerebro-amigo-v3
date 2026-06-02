using System.Security.Cryptography;
using System.Text;

namespace ApiGateway.Services;

/// <summary>
/// Decifra dados cifrados pelo módulo Python <c>app.core.crypto</c> (ADR-018).
///
/// Formato: <c>v1:base64(nonce || tag || ciphertext)</c>
/// Algoritmo: AES-256-GCM, nonce = 12 bytes, tag = 16 bytes (incluído no ciphertext).
/// Chave: SHA-256(<c>ENCRYPTION_KEY</c>).
///
/// Modo legacy: se <c>ENCRYPTION_KEY</c> não estiver definida, retorna o texto
/// sem alteração (backward compatibility com dados legados).
/// </summary>
public class CryptoService(IConfiguration cfg)
{
    private static readonly string VersionPrefix = "v1:";

    public string? Decrypt(string? ciphertext)
    {
        if (string.IsNullOrEmpty(ciphertext))
            return ciphertext;

        var key = cfg["ENCRYPTION_KEY"];
        if (string.IsNullOrEmpty(key))
            return ciphertext; // modo legacy

        if (!ciphertext.StartsWith(VersionPrefix))
            return ciphertext; // dado legado (plaintext)

        var payload = Convert.FromBase64String(ciphertext[VersionPrefix.Length..]);
        if (payload.Length < 28) // nonce(12) + tag(16)
            throw new CryptographicException("ciphertext muito curto");

        var nonce = payload[..12];
        var encrypted = payload[12..];

        using var aes = new AesGcm(DeriveKey(key), 16);
        var plaintext = new byte[encrypted.Length - 16]; // tag está no final
        aes.Decrypt(nonce, encrypted[..^16], encrypted[^16..], plaintext);

        return Encoding.UTF8.GetString(plaintext);
    }

    private static byte[] DeriveKey(string raw)
    {
        return SHA256.HashData(Encoding.UTF8.GetBytes(raw));
    }
}
