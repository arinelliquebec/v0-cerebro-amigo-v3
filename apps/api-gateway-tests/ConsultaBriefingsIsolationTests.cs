using System.Net;
using System.Text.Json;
using Npgsql;
using Xunit;

namespace ApiGateway.Tests;

/// <summary>
/// Hub de briefings pré-consulta (GET /api/v1/consultas/briefings, ADR-059). Esse
/// endpoint cruza DUAS tabelas (consultas + insights) — prova que o médico atacante
/// (A) só vê as PRÓPRIAS consultas e o PRÓPRIO insight, nunca os da vítima (B), e
/// que o gate de feature bloqueia plano nulo. Cada teste seeda médicos próprios
/// (assinatura ativa isola a variável "plano"), sem tocar o seed compartilhado.
/// </summary>
[Collection("tenant")]
public sealed class ConsultaBriefingsIsolationTests(TenantIsolationFixture fx)
{
    private async Task<(Guid Usuario, Guid Medico, Guid Paciente, Guid Consulta)> SeedMedico(
        string? plano, string nome, DateTime iniciaEm, string? insightSeveridade)
    {
        var usuario = Guid.NewGuid();
        var medico = Guid.NewGuid();
        var paciente = Guid.NewGuid();
        var consulta = Guid.NewGuid();

        await using var conn = await fx.OpenDbAsync();
        async Task Exec(string sql, params object[] p)
        {
            await using var cmd = new NpgsqlCommand(sql, conn);
            for (var i = 0; i < p.Length; i++) cmd.Parameters.AddWithValue("p" + i, p[i]);
            await cmd.ExecuteNonQueryAsync();
        }

        await Exec(@"INSERT INTO usuarios (id, email, senha_hash, nome, role)
                     VALUES (@p0,@p1,'x',@p2,'medico')", usuario, $"brief.{usuario:N}@ex.com", nome);
        await Exec(@"INSERT INTO medicos (id, usuario_id, nome, crm)
                     VALUES (@p0,@p1,@p2,@p3)", medico, usuario, nome, $"CRM-{usuario:N}".Substring(0, 12));
        if (plano is not null)
            await Exec(@"INSERT INTO assinaturas (medico_id, plano, valor_mensal, status, prazo_pagamento_ate)
                         VALUES (@p0,@p1,0,'ativa',NULL)", medico, plano);

        await Exec(@"INSERT INTO clientes (id, email, nome)
                     VALUES (@p0,@p1,@p2)", paciente, $"pac.{paciente:N}@ex.com", nome);
        await Exec(@"INSERT INTO pacientes (cliente_id, medico_responsavel_id)
                     VALUES (@p0,@p1)", paciente, medico);
        await Exec(@"INSERT INTO consultas (id, paciente_id, medico_id, inicia_em, duracao_min, modalidade, status)
                     VALUES (@p0,@p1,@p2,@p3,30,'presencial','agendada')",
            consulta, paciente, medico, iniciaEm);

        if (insightSeveridade is not null)
            await Exec(@"INSERT INTO insights (paciente_id, medico_id, agente, titulo, conteudo, severidade)
                         VALUES (@p0,@p1,'resumo_pre_consulta',@p2,@p3,@p4)",
                paciente, medico, $"Titulo de {nome}", $"SEGREDO-CLINICO-{nome}", insightSeveridade);

        return (usuario, medico, paciente, consulta);
    }

    [Fact]
    public async Task GetBriefings_CrossTenant_NaoVazaConsultaNemInsightAlheio()
    {
        var quando = DateTime.UtcNow.AddHours(2);
        // Atacante (plano pago) com a própria consulta + insight 'alta'.
        var a = await SeedMedico("starter", "AtacanteBriefingA", quando, "alta");
        // Vítima com consulta + insight clínico — NUNCA pode aparecer pro atacante.
        var b = await SeedMedico("starter", "VitimaBriefingB", quando, "media");

        var client = fx.ClientForMedico(a.Usuario);
        var resp = await client.GetAsync("/api/v1/consultas/briefings");

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var body = await resp.Content.ReadAsStringAsync();

        // Nada da vítima (nome, paciente, consulta, conteúdo do insight).
        Assert.DoesNotContain("VitimaBriefingB", body);
        Assert.DoesNotContain(b.Paciente.ToString(), body);
        Assert.DoesNotContain(b.Consulta.ToString(), body);

        // Controle positivo: vê a PRÓPRIA consulta, com o briefing preenchido (alta).
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(1, doc.RootElement.GetArrayLength());
        var item = doc.RootElement[0];
        Assert.Equal(a.Consulta, item.GetProperty("consultaId").GetGuid());
        var briefing = item.GetProperty("briefing");
        Assert.Equal(JsonValueKind.Object, briefing.ValueKind);
        Assert.Equal("alta", briefing.GetProperty("severidade").GetString());
    }

    [Fact]
    public async Task GetBriefings_ConsultaSemBriefing_RetornaBriefingNull()
    {
        var a = await SeedMedico("starter", "SemBriefing", DateTime.UtcNow.AddHours(2), insightSeveridade: null);

        var client = fx.ClientForMedico(a.Usuario);
        var resp = await client.GetAsync("/api/v1/consultas/briefings");

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        Assert.Equal(1, doc.RootElement.GetArrayLength());
        Assert.Equal(JsonValueKind.Null, doc.RootElement[0].GetProperty("briefing").ValueKind);
    }

    [Fact]
    public async Task GetBriefings_PlanoNulo_LevaUpsell()
    {
        // Médico A do fixture: SEM assinatura → FeatureGate fail-closed (402).
        var client = fx.ClientForMedico(fx.UsuarioA);
        var resp = await client.GetAsync("/api/v1/consultas/briefings");

        Assert.Equal(HttpStatusCode.PaymentRequired, resp.StatusCode);
        Assert.Contains("feature_requer_pro", await resp.Content.ReadAsStringAsync());
    }
}
