# 04 — Gate 0: audit preliminar do split-brain do checkup

> **Executado:** 2026-07-06T21:13Z (read-only nos dois lados; checkup ainda RODANDO no RDS).
> **Este é o audit PRELIMINAR.** O audit FINAL re-executa estas mesmas queries com o ASG em
> `desired=0` e drenagem confirmada, imediatamente antes do flip (Gate 0 do `03-descomissionamento.md`).

## Linha do tempo real do split-brain

- `2026-07-06T20:25Z` — cutover do stack clínico para o Postgres local (tag).
- `2026-07-06T20:33:07Z` — **re-sync**: schema `checkup` local foi dropado e restaurado
  fresh a partir do RDS (delta da Fase 1). Logo, o split-brain efetivo corre **desde 20:33Z**;
  o filtro de 20:25Z usado abaixo é superset conservador (cobre os 8 min a mais).

## (a) Conjunto de tabelas do checkup — por evidência (ACL), não por nome

`aclexplode(pg_class.relacl)` no RDS: INSERT de `checkup_app` existe em **exatamente 7 tabelas**,
todas no schema `checkup` (nenhuma em `public`):
`funnel_events` · `rate_limits` · `report_emails` · `test_results` · `tracking_points` ·
`tracking_reminders` · `tracking_series`.

## (b) Disjunção de ownership — ✅ CONFIRMADA

Grantees com INSERT nas tabelas do schema `checkup` no RDS: somente `checkup_app` e
`cerebroadmin` (master/owner — não é role de aplicação do stack principal).
`cerebro_gateway` e `cerebro_workers` **não têm INSERT** em nenhuma delas.
Premissa de ownership disjunto mantida — sem condição de parada.

## (c)+(d) Delta desde 2026-07-06T20:25:00Z e contagens nos dois lados

| Tabela | rows_rds | rows_local | inseridos ≥20:25Z | tocados ≥20:25Z | tem_timestamps |
|---|---:|---:|---:|---|---|
| funnel_events | 42 | 42 | **0** | n/a | `created_at` (sem `updated_at`) |
| rate_limits | 29 | 29 | n/a | n/a | **nenhuma** — comparação por contagem: 29 = 29 ✅ |
| report_emails | 2 | 2 | **0** | n/a | `created_at` |
| test_results | 1 | 1 | **0** | n/a | `created_at` |
| tracking_points | 0 | 0 | **0** | n/a | `created_at` |
| tracking_reminders | 0 | 0 | **0** | n/a | `created_at` |
| tracking_series | 0 | 0 | **0** | n/a | `created_at` |

Nenhuma tabela do conjunto tem `updated_at` → "tocados" é não-mensurável por timestamp;
mitigado por (i) contagens idênticas nos dois lados e (ii) natureza append-only do funil.

## Veredito preliminar

**Delta = ZERO.** Nenhuma escrita do checkup chegou ao RDS desde o re-sync (test mode,
tráfego ~zero). Se o audit FINAL (com `desired=0`) confirmar zero, o **merge é dispensado**
e o Gate 0 vai direto de drenagem → flip do SSM. O passo de merge (truncate+reload + setval)
permanece no plano para o caso de delta > 0 no momento da execução.
