using System.Text.Json;

namespace ApiGateway.Models;

// ============================== Entidades ==============================

public class Cliente
{
    public Guid Id { get; set; }
    public string WaId { get; set; } = null!;
    public string? Nome { get; set; }
    public string? Email { get; set; }
    public JsonDocument? Contexto { get; set; } // JSONB
    public DateTime CriadoEm { get; set; }
}

public class Conversa
{
    public Guid Id { get; set; }
    public Guid ClienteId { get; set; }
    public string Status { get; set; } = "aberta";
    public string? Intencao { get; set; }
    public DateTime CriadaEm { get; set; }
}

public class Mensagem
{
    public Guid Id { get; set; }
    public Guid ConversaId { get; set; }
    public string Papel { get; set; } = null!;     // user | assistant | system
    public string Conteudo { get; set; } = null!;
    public string? ModeloUsado { get; set; }       // haiku | sonnet | opus
    public int? TokensIn { get; set; }
    public int? TokensOut { get; set; }
    public decimal? CustoUsd { get; set; }
    public DateTime CriadaEm { get; set; }
}

public class Agente
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = null!;
    public string SystemPrompt { get; set; } = null!;
    public string ModeloDefault { get; set; } = "sonnet";
    public bool Ativo { get; set; } = true;
    public DateTime AtualizadoEm { get; set; }
}

public class Pagamento
{
    public Guid Id { get; set; }
    public string MercadoPagoId { get; set; } = null!;
    public Guid? ConversaId { get; set; }
    public string Status { get; set; } = null!;
    public decimal Valor { get; set; }
    public string Descricao { get; set; } = null!;
    public DateTime CriadoEm { get; set; }
    public DateTime? AprovadoEm { get; set; }
}

public class NotaFiscal
{
    public Guid Id { get; set; }
    public Guid PagamentoId { get; set; }
    public string NfeIoId { get; set; } = null!;
    public string? UrlPdf { get; set; }
    public string Status { get; set; } = null!; // pendente | emitida | erro
    public DateTime CriadaEm { get; set; }
}

public class Usuario
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string SenhaHash { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public string Role { get; set; } = "admin";
    public DateTime CriadoEm { get; set; }
    public DateTime? UltimoLogin { get; set; }
}

// ============================== DTOs ==============================

public record LoginRequest(string Email, string Senha);
public record LoginResponse(string Token, string Nome, string Role);

public record CreatePreferenceRequest(
    string Titulo,
    decimal Valor,
    Guid? ConversaId,
    string? CustomerEmail);

public record CreatePreferenceResponse(string InitPoint, string PreferenceId);

public record EmitirNfRequest(Guid PagamentoId);

public record AtualizarAgenteRequest(
    string? SystemPrompt,
    string? ModeloDefault,
    bool? Ativo);

public record MetricasResponse(
    int ConversasHoje,
    int ConversasMes,
    decimal CustoLlmHoje,
    decimal CustoLlmMes,
    double TaxaAutonoma,
    int TotalClientes);
