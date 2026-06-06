using ApiGateway.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ApiGateway.Endpoints;

/// <summary>
/// Modo demo (item 2 do top-3): popula a conta do médico autenticado com 3 pacientes
/// de exemplo e dados ricos (sintomas, adesão, consultas, insights, notificações) num
/// clique — pra apresentação ao vivo sem precisar de psql. Port do infra/seed/demo.sql,
/// parametrizado pelo medico_id do JWT, com e-mails únicos por médico e idempotência.
///
/// Compliance: APENAS INSERT. notificacoes_medico é append-only (regra #5 clinical-safety) —
/// inserir é permitido, deletar não; por isso NÃO há rota de remoção. Pacientes ficam
/// marcados "(demo)" no nome. Use numa conta de demonstração, não na sua conta real.
/// O medico_id é um GUID derivado do JWT (não input do usuário) — interpolação segura.
/// </summary>
public static class SeedDemoEndpoint
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/api/v1/seed/demo", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var sub = user.FindFirst("sub")?.Value;
            if (!Guid.TryParse(sub, out var userId)) return Results.Forbid();
            var medicoId = await db.Database.ExecuteScalarAsync<Guid?>(
                "SELECT id FROM medicos WHERE usuario_id = {0}", userId);
            if (medicoId is null) return Results.Forbid();

            // medicoId é GUID validado (não input bruto) → interpolação segura no DO block,
            // que não aceita bind params.
            var mid = medicoId.Value.ToString();
            var sql = DemoBlock(mid);
            await db.Database.ExecuteSqlRawAsync(sql);

            // Conta pacientes demo p/ informar o resultado.
            var total = await db.Database.ExecuteScalarAsync<int>(
                "SELECT COUNT(*)::int FROM clientes WHERE email LIKE {0}",
                $"%demo.{mid}@cerebroamigo.com");

            return Results.Ok(new { ok = true, pacientesDemo = total });
        }).WithTags("seed").RequireAuthorization();
    }

    private static string DemoBlock(string mid) => $@"
DO $$
DECLARE
  medico_id  UUID := '{mid}'::uuid;
  e1 TEXT := 'maria.demo.{mid}@cerebroamigo.com';
  e2 TEXT := 'joao.demo.{mid}@cerebroamigo.com';
  e3 TEXT := 'ana.demo.{mid}@cerebroamigo.com';
  p1_id UUID; p2_id UUID; p3_id UUID;
  presc1_id UUID := gen_random_uuid();
  presc3_id UUID := gen_random_uuid();
  d INT;
BEGIN
  -- Idempotência: se já há paciente demo deste médico, não refaz.
  IF EXISTS (SELECT 1 FROM clientes WHERE email = e1) THEN RETURN; END IF;

  INSERT INTO clientes (id, nome, email) VALUES
    (gen_random_uuid(), 'Maria Fernanda Silva (demo)', e1),
    (gen_random_uuid(), 'João Carlos Oliveira (demo)', e2),
    (gen_random_uuid(), 'Ana Paula Mendes (demo)',     e3)
  ON CONFLICT (email) DO NOTHING;

  SELECT id INTO p1_id FROM clientes WHERE email = e1;
  SELECT id INTO p2_id FROM clientes WHERE email = e2;
  SELECT id INTO p3_id FROM clientes WHERE email = e3;

  INSERT INTO pacientes (cliente_id, medico_responsavel_id, cpf, data_nascimento, consentimento_lgpd_em) VALUES
    (p1_id, medico_id, '123.456.789-01', '1991-03-15', NOW() - INTERVAL '90 days'),
    (p2_id, medico_id, '234.567.890-12', '1980-07-22', NOW() - INTERVAL '180 days'),
    (p3_id, medico_id, '345.678.901-23', '1997-11-08', NOW() - INTERVAL '14 days')
  ON CONFLICT (cliente_id) DO NOTHING;

  INSERT INTO prescricoes (id, paciente_id, medico_id, medicamento, dose_descricao, horarios, inicio_em, ativa) VALUES
    (presc1_id, p1_id, medico_id, 'Escitalopram', '10 mg — 1x/dia (manha)', ARRAY['08:00']::TIME[], CURRENT_DATE - 60, TRUE),
    (gen_random_uuid(), p1_id, medico_id, 'Clonazepam', '0,5 mg — SOS (max 1x/dia)', ARRAY[]::TIME[], CURRENT_DATE - 60, TRUE),
    (presc3_id, p2_id, medico_id, 'Lamotrigina', '100 mg — 2x/dia (manha e noite)', ARRAY['08:00','20:00']::TIME[], CURRENT_DATE - 120, TRUE),
    (gen_random_uuid(), p2_id, medico_id, 'Quetiapina', '50 mg — 1x/noite', ARRAY['22:00']::TIME[], CURRENT_DATE - 120, TRUE),
    (gen_random_uuid(), p3_id, medico_id, 'Venlafaxina', '75 mg — 1x/dia (manha)', ARRAY['08:00']::TIME[], CURRENT_DATE - 14, TRUE);

  -- Maria: 60 dias, melhora clara
  FOR d IN SELECT generate_series(0, 59, 3) LOOP
    INSERT INTO sintomas (paciente_id, humor, ansiedade, sono_horas, energia, registrado_em) VALUES (
      p1_id,
      LEAST(10, GREATEST(1, 3 + floor(d * 0.07 + random() * 1.5)::int)),
      GREATEST(1, 9 - floor(d * 0.06 + random() * 1.5)::int),
      LEAST(10.0, 5.5 + d * 0.025 + random() * 0.5),
      LEAST(10, GREATEST(1, 3 + floor(d * 0.05 + random() * 1.5)::int)),
      NOW() - INTERVAL '60 days' + (d || ' days')::INTERVAL);
  END LOOP;

  -- João: 30 dias, oscilação
  FOR d IN SELECT generate_series(0, 29, 2) LOOP
    INSERT INTO sintomas (paciente_id, humor, ansiedade, sono_horas, energia, registrado_em) VALUES (
      p2_id,
      LEAST(10, GREATEST(1, 5 + floor(sin(d * 0.4) * 3)::int)),
      LEAST(10, GREATEST(1, 5 + floor(cos(d * 0.3) * 3)::int)),
      LEAST(12.0, GREATEST(3.0, 6.0 + sin(d * 0.5) * 2.5 + random())),
      LEAST(10, GREATEST(1, 5 + floor(sin(d * 0.6) * 3)::int)),
      NOW() - INTERVAL '30 days' + (d || ' days')::INTERVAL);
  END LOOP;

  -- Ana: 14 dias, estável
  FOR d IN SELECT generate_series(0, 13, 2) LOOP
    INSERT INTO sintomas (paciente_id, humor, ansiedade, sono_horas, energia, registrado_em) VALUES (
      p3_id,
      LEAST(10, GREATEST(1, 5 + floor(random() * 2)::int)),
      LEAST(10, GREATEST(4, 7 - floor(d * 0.15 + random())::int)),
      6.0 + random() * 1.5,
      LEAST(10, GREATEST(1, 5 + floor(random() * 2)::int)),
      NOW() - INTERVAL '14 days' + (d || ' days')::INTERVAL);
  END LOOP;

  -- Adesão Maria ~95%
  FOR d IN SELECT generate_series(0, 59) LOOP
    INSERT INTO tomadas_medicacao (prescricao_id, paciente_id, horario_previsto, horario_real, status) VALUES (
      presc1_id, p1_id,
      (NOW() - INTERVAL '60 days' + (d || ' days')::INTERVAL)::DATE + TIME '08:00',
      CASE WHEN random() > 0.05 THEN (NOW() - INTERVAL '60 days' + (d || ' days')::INTERVAL)::DATE + TIME '08:00' ELSE NULL END,
      CASE WHEN random() > 0.05 THEN 'tomada' ELSE 'esquecida' END);
  END LOOP;

  -- Adesão João ~60%
  FOR d IN SELECT generate_series(0, 29) LOOP
    INSERT INTO tomadas_medicacao (prescricao_id, paciente_id, horario_previsto, horario_real, status) VALUES (
      presc3_id, p2_id,
      (NOW() - INTERVAL '30 days' + (d || ' days')::INTERVAL)::DATE + TIME '08:00',
      CASE WHEN random() > 0.40 THEN (NOW() - INTERVAL '30 days' + (d || ' days')::INTERVAL)::DATE + TIME '08:00' ELSE NULL END,
      CASE WHEN random() > 0.40 THEN 'tomada' ELSE 'esquecida' END);
  END LOOP;

  INSERT INTO consultas (paciente_id, medico_id, inicia_em, modalidade, status) VALUES
    (p1_id, medico_id, NOW() - INTERVAL '30 days', 'presencial',   'realizada'),
    (p1_id, medico_id, NOW() + INTERVAL '7 days',  'teleconsulta', 'confirmada'),
    (p2_id, medico_id, NOW() - INTERVAL '15 days', 'teleconsulta', 'realizada'),
    (p2_id, medico_id, NOW() + INTERVAL '3 days',  'presencial',   'agendada'),
    (p3_id, medico_id, NOW() - INTERVAL '7 days',  'presencial',   'realizada'),
    (p3_id, medico_id, NOW() + INTERVAL '14 days', 'teleconsulta', 'agendada');

  INSERT INTO insights (paciente_id, medico_id, agente, titulo, conteudo, severidade, criado_em) VALUES
    (p1_id, medico_id, 'padroes', 'Tendencia de melhora sustentada no humor',
     'Maria apresenta melhora linear nas ultimas 6 semanas. Humor 3/10 para 7/10, sono regularizou para ~7h, ansiedade reduziu de 9 para 5. Adesao ao Escitalopram: 95%.',
     'info', NOW() - INTERVAL '2 days'),
    (p2_id, medico_id, 'adesao', 'Adesao critica — Lamotrigina abaixo de 65%',
     'Joao tomou 63% das doses nos ultimos 30 dias. Ultima dose ha 2 dias. Risco de episodio por descontinuacao. Contato recomendado.',
     'urgente', NOW() - INTERVAL '1 day'),
    (p3_id, medico_id, 'padroes', 'Perfil inicial — ansiedade moderada',
     'Ana na semana 2 de Venlafaxina 75mg. Ansiedade media 6,2/10, humor estavel 5-6/10. Resposta ainda inconclusiva.',
     'info', NOW() - INTERVAL '3 days');

  INSERT INTO notificacoes_medico (medico_id, paciente_id, severidade, tipo, titulo, mensagem, lida, criada_em) VALUES
    (medico_id, p2_id, 'urgente', 'adesao', 'Adesao critica — Joao Carlos',
     'Taxa de adesao 63% no ultimo mes. Ultima dose ha 2 dias.', FALSE, NOW() - INTERVAL '1 day'),
    (medico_id, p1_id, 'info', 'padroes', 'Maria Fernanda — melhora documentada',
     'Humor estabilizou em 6-7/10 apos 6 semanas. Consulta em 7 dias.', TRUE, NOW() - INTERVAL '2 days');

END $$;";
}
