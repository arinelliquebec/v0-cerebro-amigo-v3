using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ApiGateway.Hubs;

// =============================================================================
// Hub SignalR para o chat da Rede Social (DM + grupos).
//
// Protocolo:
//   - Ao conectar, o cliente entra em todos os grupos (conversas) de que é membro.
//   - Para enviar mensagem: POST REST → gateway grava + BroadcastAsync → clientes recebem.
//   - O hub NÃO faz INSERT direto — o endpoint REST é o ponto de entrada.
//   - Eventos client → server: JoinConversas, MarcarLido, Digitando.
//   - Eventos server → client: NovaMensagem, MensagemRemovida, Digitando.
//
// Auth: requer JWT (RequireAuthorization). userId extraído do claim "sub".
// =============================================================================
[Authorize]
public class ChatHub : Hub
{
    /// <summary>
    /// Chamado pelo cliente após conectar: entra nos grupos das conversas informadas.
    /// O cliente obtém a lista de IDs via GET /api/v1/rede/chat/conversas.
    /// </summary>
    public async Task JoinConversas(string[] conversaIds)
    {
        foreach (var id in conversaIds)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"chat:{id}");
        }
    }

    /// <summary>
    /// Indicação de que o usuário está digitando em uma conversa.
    /// Reenvia para os demais membros do grupo (exceto o remetente).
    /// </summary>
    public async Task Digitando(string conversaId)
    {
        var userId = Context.User?.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId)) return;

        await Clients.OthersInGroup($"chat:{conversaId}")
            .SendAsync("Digitando", new { conversaId, userId });
    }

    /// <summary>
    /// Marca leitura até a última mensagem. Emite evento para os demais membros.
    /// </summary>
    public async Task MarcarLido(string conversaId)
    {
        var userId = Context.User?.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId)) return;

        await Clients.OthersInGroup($"chat:{conversaId}")
            .SendAsync("Lido", new { conversaId, userId });
    }

    public override Task OnDisconnectedAsync(Exception? exception) =>
        base.OnDisconnectedAsync(exception);
}
