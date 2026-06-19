# api-gateway-scala

Fatia **strangler** do gateway, em Scala 3 na JVM (**ADR-067**, supersede ADR-007).
Coexiste com o gateway .NET (`apps/api-gateway`). O BFF (`apps/web/app/api/*`) só
passa a apontar pra cá **por endpoint**, depois de paridade de contrato + testes verdes.
Endpoints **clínicos e de dinheiro migram por último**.

## Stack

cats-effect 3 · http4s (Ember) · Tapir (endpoints tipados) · Doobie (Postgres) ·
jwt-scala (HS256) · testcontainers-scala (gate de isolamento de tenant).

## Invariantes de segurança preservados (não regredir)

- Conecta como **`cerebro_gateway` (NOBYPASSRLS)** — a RLS da ADR-042 vale por baixo.
- Tenant via GUC **`app.current_medico`**. Aqui é **transaction-local**
  (`set_config(..., true)`): `set_config` + query na mesma transação Doobie, GUC
  auto-reseta no commit. Mesma semântica de RLS do .NET, sem reset manual.
- JWT `sub` = **`usuario_id`**, não `medicos.id` → resolver via
  `TenantSession.resolveMedicoId`.
- JWT HS256 com o **mesmo `JWT_SECRET`**, issuer `cerebro-amigo`, audiences
  `dashboard`/`portal-paciente` → tokens atuais valem nos dois gateways.

## Endpoints

| Rota | Estado |
| --- | --- |
| `GET /health`, `GET /ready` | ✅ implementados |
| `GET /api/v1/auth/me` | ✅ portado (contrato fiel) — **pendente `fotoUrl` (presigned S3)** antes do flip do BFF |

## Variáveis de ambiente

- **Banco (prefira JDBC em PROD):** `POSTGRES_JDBC_URL` + `POSTGRES_USER` +
  `POSTGRES_PASSWORD`. Fallback: `POSTGRES_DSN` (Npgsql) — convertido p/ JDBC, mas
  **best-effort**: senha com `;`/`=` quebra o parser (review #4). Role = `cerebro_gateway`.
- `RDS_CA_PATH` — CA bundle do RDS p/ `sslmode=verify-full` em host RDS (review #1).
  Setada no Dockerfile (`/usr/local/share/rds-ca.pem`); sem ela, host RDS cai p/
  `sslmode=require` (cifra sem verificar CA).
- `JWT_SECRET` (obrigatório). Opcionais: `JWT_ISSUER` (default `cerebro-amigo`),
  `JWT_AUDIENCES` (CSV; default `dashboard,portal-paciente`).
- `PORT` (default `5001` no dev — o `:5050`/`:5000` é do gateway .NET).

## Rodar

```bash
cd apps/api-gateway-scala
sbt compile
sbt test     # sobe pgvector:pg16 via Testcontainers (precisa de Docker)
sbt run      # precisa de POSTGRES_* + JWT_SECRET no ambiente
```

## Estado / próximos passos (strangler — ADR-067)

- [x] Fundação: projeto, transactor Doobie (`cerebro_gateway`), JWT, TenantSession (GUC).
- [x] `GET /api/v1/auth/me` portado (fiel a `AuthEndpoints.cs`; `AssinaturaGate`/`PlanCatalog` portados).
- [x] Gate de isolamento de tenant (`TenantIsolationSpec`) — espelha `RlsTests.cs`.
- [x] Lane sbt no CI (`.github/workflows/ci.yml`, job `gateway-scala`) — `sbt test` (compila + gate de tenant). Roda no runner (Docker presente).
- [x] Dockerfile (multi-stage: `sbt stage` → JRE 21, non-root, healthcheck `/health`, `:5001`).
- [x] **CI verde + MERGEADO em main** (PR #89, squash `6322682`) — deploy de prod disparado.
- [x] E2E do `/me` (`MeEndpointSpec`: mint JWT → GET → 200/401/403) + review local aplicado (TLS verify-full, DSN, pool/mem, docs).
- [ ] `fotoUrl` (presigned S3) no `/me` antes de flipar o BFF.
- [ ] Migrar próximos endpoints **não-clínicos read-only** (`/api/v1/minha-assinatura`…).
- [ ] Por último: clínico e dinheiro, com revisão `clinical-safety` + tenant verde.
