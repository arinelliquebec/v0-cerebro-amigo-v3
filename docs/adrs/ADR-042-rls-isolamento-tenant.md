# ADR-042: Isolamento de tenant em profundidade — least-privilege + RLS

**Status:** Accepted — Camada A (guards) + Estágios 0 (roles) e 3 (testes) em
produção; Estágios 1+2 (middleware + RLS) implementados e **validados em harness
Testcontainers**, rollout em prod pendente (ver "Rollout").
**Data:** 2026-06-08
**Decisores:** Equipe de engenharia + Rafael Arinelli (responsável pelo projeto)
**Categoria:** Segurança / LGPD (categoria especial — saúde mental)

## Contexto

Auditoria de isolamento de tenant (2026-06-08) achou e confirmou **7 vazamentos
cross-tenant REAIS** em produção — um médico autenticado lia/alterava dado de
paciente de OUTRO médico (IDOR), inclusive medicação/dose e takeover de conta via
magic-link. Todos por **um WHERE de tenant esquecido** na aplicação. O isolamento
era 100% manual (cada query repete o predicado de tenant), sem rede de segurança.
Tenant = `medicos.id`; âncora = `pacientes.medico_responsavel_id`.

Pior: **todos os serviços conectavam como `cerebroadmin`** (RDS master =
rds_superuser E dono das tabelas), que **bypassa RLS** — qualquer policy seria
inócua enquanto isso fosse verdade.

## Decisão

Defesa em profundidade, em camadas independentes:

- **Camada A — guards na aplicação:** corrigir os 7 IDOR ancorando cada query no
  tenant do JWT (`JOIN pacientes ON p.cliente_id = t.paciente_id AND
  p.medico_responsavel_id = @medico`, ou `medico_id = @medico` nas tabelas com
  coluna direta). Convenção: o filtro de tenant é a 1ª cláusula, nunca opcional.

- **Estágio 0 — roles least-privilege (0036):** aposentar `cerebroadmin` no
  runtime. Gateway → `cerebro_gateway` (NOSUPERUSER, **NOBYPASSRLS**); serviços
  Python → `cerebro_workers` (NOSUPERUSER, **BYPASSRLS** — fazem scans
  cross-tenant legítimos via scheduler, e precisam de `CREATE` no schema para o
  checkpointer do LangGraph). Sem isso a RLS não valeria.

- **Estágio 3 — suíte de regressão (apps/api-gateway-tests):** Testcontainers
  sobe Postgres real, aplica as migrations, seeda 2 médicos e prova que A não
  acessa dado de B. Job CI `dotnet-tests` no PR — pega a classe dos 7 IDOR antes
  do merge.

- **Estágios 1+2 — RLS fail-closed (0037 + TenantSessionMiddleware):** rede no
  banco para o WHERE futuro esquecido.
  - **RLS ENABLE (não FORCE):** o dono (`cerebroadmin`, migrations) e
    `cerebro_workers` (BYPASSRLS) seguem livres; só `cerebro_gateway` é filtrado.
  - **GUC de sessão por request:** o `TenantSessionMiddleware` abre a conexão do
    DbContext e seta, conforme o JWT, `app.current_medico` (médico),
    `app.current_paciente` (portal) ou `app.tenant_bypass=on` (owner/admin). Todas
    as queries do request reusam a conexão (o `DbExtensions` não fecha conexão já
    aberta), então o GUC vale para todas. Reset no fim + reset-on-close do Npgsql.
  - **Policy** (`NULLIF(current_setting(...,true),'')::uuid` para tratar
    ausência/reset): `bypass OR paciente dono OR médico dono (via pacientes)`.
    Sem GUC → NULL/false em tudo → **zero linhas (fail-closed)**.
  - **Escopo iteração 1:** tabelas-folha clínicas (prescricoes, sintomas,
    consultas, evolucoes_clinicas, consulta_transcricoes, diario_entradas,
    checkins, notificacoes_medico, etc.). FORA: tabelas que DEFINEM o tenant
    (medicos/pacientes/clientes/usuarios — lidas para estabelecer o tenant) e
    auth/webhook/catálogos.

## Alternativas descartadas

- **`SET LOCAL` em transação por request:** exigiria envolver todo request numa
  transação. Quebraria os inserts best-effort com try/catch (GravarEvento,
  RegistrarAcessoProntuario): no Postgres, um erro dentro da transação aborta
  tudo, e o catch não salvaria. `set_config(...,false)` (sessão, autocommit
  preservado) evita isso.
- **FORCE ROW LEVEL SECURITY:** filtraria também o dono (migrations) e exigiria
  bypass explícito para os workers. ENABLE já dá o efeito desejado.
- **Só guards na aplicação:** foi o que falhou (7 IDOR). Mantidos, mas com RLS
  por baixo.

## Consequências

- Um WHERE esquecido no futuro **não vaza** — a RLS barra o `cerebro_gateway`.
- Custo: subquery `EXISTS pacientes` por linha nas tabelas via paciente_id
  (mitigado pelos índices `pacientes(cliente_id)` PK e `(medico_responsavel_id)`).
- Acoplamento: todo acesso do gateway a tabela com RLS depende do middleware ter
  setado o GUC. Endpoints anônimos/internos NÃO tocam as tabelas no escopo —
  verificado. Workers bypassam.
- Validação: 15 testes verdes (9 HTTP com o gateway como role restrito + RLS
  ativa; 6 de RLS direto no banco: fail-closed, isolamento A↔B, bypass, dimensão
  paciente).

## Rollout (prod) — ORDEM IMPORTA

1. **Deploy do gateway com o middleware PRIMEIRO** (RLS ainda não habilitada → o
   middleware seta GUCs que ninguém lê → zero mudança de comportamento).
2. **Aplicar 0037** (habilita RLS). Efeito imediato; o gateway já está em
   `cerebro_gateway` (NOBYPASSRLS, swap de DSN feito 2026-06-08).
3. **Verificar** um fluxo de médico em prod (lê prontuário, registra prescrição).
4. **Rollback instantâneo** se algo quebrar: `ALTER TABLE <t> DISABLE ROW LEVEL
   SECURITY` nas tabelas da 0037.

> Invertendo a ordem (0037 antes do middleware) o gateway fail-close TUDO (sem
> GUC, RLS nega) e o app cai. Nunca aplicar 0037 sem o middleware já no ar.

## Estágios futuros

- Estender a RLS às demais tabelas clínicas (conversas/mensagens 2-hop, etc.).
- Apertar `cerebro_workers`: o orchestrator (por-tenant) poderia setar
  `app.current_medico` por request em vez de BYPASSRLS.
- Ver memória `project-tenant-isolation` e `project-infalivel-top5`.
