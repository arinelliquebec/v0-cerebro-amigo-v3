# Dívida Técnica — Cérebro Amigo V3

Documento vivo. Itens são removidos quando resolvidos, adicionados quando descobertos.

## Tier 0 — Segurança clínica & LGPD (pendências pós-entrega)

| # | Item | Severidade | Rationale | Caminho para resolver |
|---|---|---|---|---|
| T0-1 | **Nenhuma coluna está cifrada** (ADR-018) | ~~🔴 Alta~~ ✅ **Resolvido** | Fase 1 implementada: `mensagens.conteudo` cifrada no INSERT (orchestrator-py) e decifrada no SELECT (gateway .NET). Script one-off `migrate_mensagens_cifra.py` para dados legados. | — |
| T0-2 | **PII regex: conflito CPF/telefone** em celulares sem separador (11 dígitos) | ~~🟡 Média~~ ✅ **Resolvido** | Comportamento atual é intencional e correto: CPF roda antes de PHONE, então 11 dígitos sem separador sempre são redatados (como `[CPF_REDACTED]`). Falso positivo de label aceitável — cobertura é 100%. Comentário adicionado em ambos os serviços para documentar a invariante. | — |
| T0-3 | **No NER offline** para campos livres | 🟡 Média | Comentado em `observability.py`. Regex não pega nome próprio, endereço, etc. | Integrar modelo NER leve (spaCy `pt_core_news_sm` ou regex expansiva) em pipeline de log. |
| T0-4 | **LangSmith não auto-hospedado**; `HIDE_INPUTS/OUTPUTS` não é default | 🟡 Média | Traces enviam conteúdo para terceiro (LangSmith cloud). LGPD prefere dados no Brasil. | `settings.langsmith_hide_inputs=true` por default em prod; avaliar self-hosted. |

## Tier 1 — Segurança de plataforma (pendências pós-entrega)

| # | Item | Severidade | Rationale | Caminho para resolver |
|---|---|---|---|---|
| T1-1 | **LoginRateLimiter é in-memory** (single-node) | 🔴 Alta | EC2 t3.small não escala horizontalmente hoje, mas se migrar para load balancer com 2+ instâncias, o rate limiter perde eficácia. | Migrar para Redis/DistributedCache (ex.: `Microsoft.Extensions.Caching.StackExchangeRedis`). |
| T1-2 | **Magic-link: endpoint `/magic-link` sem rate limiting** | ~~🟡 Média~~ ✅ **Resolvido** | `LoginRateLimiter` aplicado ao endpoint `POST /magic-link`. Conta tentativas por e-mail (mesmo em 404, para evitar enumeration). Expiração do link corrigida para 1h no response. | — |
| T1-3 | **No mTLS entre serviços internos** | 🟡 Média | `INTERNAL_API_TOKEN` protege, mas tráfego entre gateway↔orchestrator↔agents via HTTP plain na VPC. | AWS VPC endpoints + security groups restringem tráfego; mTLS seria overkill mas ideal. |
| T1-4 | **SSL mode = `require`** (não `verify-full`) | 🟡 Média | Conexões Postgres aceitam certificado sem validar CA. Risco de MITM na rede. | Mudar para `sslmode=verify-full` + cert CA da AWS RDS no container. |
| T1-5 | **No teste automatizado de restore** | 🟡 Média | Runbook existe, mas nunca foi executado. Desastre real = primeiro teste. | Job mensal no CI que restaura snapshot para instância efêmera e roda health checks. |
| T1-6 | **No CloudWatch alarm para backup health** | 🟢 Baixa | Se snapshots pararem de ser gerados, só saberemos quando precisarmos deles. | Alarme: `0 snapshots available nos últimos 7 dias`. |

## Tier 4 — Produto / UX (pendências pós-entrega)

| # | Item | Severidade | Rationale | Caminho para resolver |
|---|---|---|---|---|
| T4-1 | **agents-py não usa prompt_loader dinâmico** | 🟡 Média | Apenas orchestrator-py carrega prompts do banco. Agentes analíticos ainda usam hardcoded. | Replicar `prompt_loader.py` em agents-py; adaptar `BaseAgent.execute()` para `await get_prompt()`. |
| T4-2 | **No preview/validação de prompt antes de ativar** | 🟡 Média | Médico pode ativar um prompt com JSON schema quebrado → todos os nós do grafo falham. | Validar que o prompt tem os placeholders `{...}` esperados; testar chamada a LLM com prompt de sandbox. |
| T4-3 | **No rollback com um clique** | ~~🟢 Baixa~~ ✅ **Resolvido** | Botão "Reverter para v{N}" aparece no editor quando existe versão anterior à ativa. Chama `ativar(versaoAnterior.id)` inline. | — |
| T4-4 | **SW não tem página offline HTML** | ~~🟢 Baixa~~ ✅ **Resolvido** | `public/offline.html` criada (UI minimalista pt-BR + botão recarregar). SW precacheia e serve como fallback de navegação antes de `/p`. | — |
| T4-5 | **Background sync não implementado** | 🟢 Baixa | Checkins respondidos offline não são enviados quando a conexão volta. | Usar `navigator.serviceWorker.ready.then(r => r.sync.register('checkins'))`. |
| T4-6 | **Ícones do PWA são placeholders** | 🟢 Baixa | Gerados via Python/Pillow com letra "C". Deveriam ser a marca real do produto. | Designer produz ícones 192x192 e 512x512; substituir em `public/`. |

## Geral / Cross-cutting

| # | Item | Severidade | Rationale | Caminho para resolver |
|---|---|---|---|---|
| G-1 | **TODO: convenção de payload do checkin** (`medication.py`) | ~~🔴 Alta~~ ✅ **Resolvido** | Schema confirmado consistente: `gerador_checkins_medicacao.py` produz `{tomada_id, prescricao_id, medicamento, dose_descricao}`; `CheckinsEndpoints.cs` consome `prescricao_id`. Sem divergência. | — |
| G-2 | **FIXME ADR-014: dedup ineficiente** (`agents-py`) | ~~🟡 Média~~ ✅ **Resolvido** | `_listar_candidatos` agora exclui via SQL pacientes com insight `risco_silencioso` na janela de dedup (7d). Evita processar per-patient quem já foi notificado. | — |
| G-3 | **TODO: email backup quando push falha** (`notifier-py`) | ~~🟡 Média~~ ✅ **Resolvido** | `EmailFallbackService` implementado no notifier-py. Chama Resend API quando nenhum device recebe push. Configuração opcional (`EMAIL_FALLBACK_ENABLED`, `RESEND_API_KEY`). Fallback também no `dispatch_for_patient`. | — |
| G-4 | **TODO: timezone em checkins de medicação** | 🟢 Baixa | Considera UTC; paciente em outro timezone pode receber checkin no horário errado. | Usar `timezone` do paciente (coluna em `pacientes` ou inferir de localização). |
| G-5 | **PasswordHasher usa PBKDF2** | ~~🟡 Média~~ ✅ **Resolvido** | Migrado para `BCrypt.Net-Next` (work factor 12) com fallback PBKDF2 e rehash automático no login (médico + paciente). | — |
| G-6 | **No integration tests entre serviços** | 🟡 Média | Cada serviço tem testes unitários, mas nenhum testa a cadeia completa (web → gateway → orchestrator → DB). | Criar suite de integração com Docker Compose (todos os serviços + Postgres). |
| G-7 | **`send_push` é síncrono (notifier-py)** | ~~🔴 Alta~~ ✅ **Resolvido** | `send_push()` já usa `asyncio.to_thread(_send)` — pywebpush (síncrono) roda em thread pool, sem bloquear o event loop do APScheduler. | — |

## Legenda de severidade

- 🔴 **Alta**: correção obrigatória antes de produção ou risco de incidente
- 🟡 **Média**: impacto controlado, deve ser feito na próxima sprint
- 🟢 **Baixa**: nice-to-have, endereçar quando houver tempo
