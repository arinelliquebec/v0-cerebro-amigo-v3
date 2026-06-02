using System.Collections.Concurrent;

namespace ApiGateway.Auth;

/// <summary>
/// Rate limiter em memória para tentativas de login.
/// 
/// Política: até 5 tentativas falhas em 15 minutos por e-mail.
/// Após o 5º erro, o e-mail fica bloqueado por 15 minutos.
/// 
/// Como é in-memory, funciona apenas em single-node (EC2 t3).
/// Para multi-node (load balancer com múltiplas instâncias),
/// migrar para Redis DistributedCache ou similar.
/// </summary>
public class LoginRateLimiter
{
    private readonly record struct AttemptState(int Count, DateTime WindowStart, DateTime? BlockedUntil);

    private readonly ConcurrentDictionary<string, AttemptState> _store = new();
    private readonly TimeSpan _window = TimeSpan.FromMinutes(15);
    private readonly int _maxAttempts = 5;

    /// <summary>
    /// Registra uma tentativa falha. Retorna true se o e-mail ficou bloqueado.
    /// </summary>
    public bool RecordFailure(string email)
    {
        var key = email.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;

        _store.AddOrUpdate(key,
            _ => new AttemptState(1, now, null),
            (_, existing) =>
            {
                // Janela expirou → reinicia contagem
                if (now - existing.WindowStart > _window)
                {
                    return new AttemptState(1, now, null);
                }

                var newCount = existing.Count + 1;
                var blocked = newCount >= _maxAttempts ? now.Add(_window) : existing.BlockedUntil;
                return new AttemptState(newCount, existing.WindowStart, blocked);
            });

        return IsBlocked(email);
    }

    /// <summary>
    /// Registra um login bem-sucedido (limpa o contador).
    /// </summary>
    public void RecordSuccess(string email)
    {
        _store.TryRemove(email.Trim().ToLowerInvariant(), out _);
    }

    /// <summary>
    /// Verifica se o e-mail está bloqueado no momento.
    /// </summary>
    public bool IsBlocked(string email)
    {
        var key = email.Trim().ToLowerInvariant();
        if (!_store.TryGetValue(key, out var state))
            return false;

        var now = DateTime.UtcNow;

        // Janela expirou → limpa
        if (now - state.WindowStart > _window)
        {
            _store.TryRemove(key, out _);
            return false;
        }

        return state.BlockedUntil.HasValue && state.BlockedUntil.Value > now;
    }

    /// <summary>
    /// Limpa entradas expiradas (útil para evitar crescimento infinito do dictionary).
    /// Chamada ocasionalmente pelo caller (ex.: a cada N requests ou via timer).
    /// </summary>
    public void Prune()
    {
        var now = DateTime.UtcNow;
        foreach (var kv in _store)
        {
            if (now - kv.Value.WindowStart > _window)
                _store.TryRemove(kv.Key, out _);
        }
    }
}
