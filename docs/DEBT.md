# Dívida Técnica — Cérebro Amigo V3

Documento vivo. Itens são removidos quando resolvidos, adicionados quando descobertos.

> Histórico dos itens já fechados vive no git (log de `docs/DEBT.md`). Aqui ficam só os
> abertos e os resolvidos com dependência/pendência ainda em aberto.

## Tier 0 — Segurança clínica & LGPD (pendências pós-entrega)

| # | Item | Severidade | Rationale | Caminho para resolver |
|---|---|---|---|---|
| T0-4 | **LangSmith não auto-hospedado**; `HIDE_INPUTS/OUTPUTS` não é default | ~~🟡 Média~~ ✅ **Parcial** | `langsmith_hide_inputs/outputs=true` por default (orchestrator-py + agents-py): traces sobem só com metadata; dev opt-out explícito via env. Redação de PII por regex mantida como defesa em profundidade. **Pendente (🟢 Baixa):** avaliar LangSmith self-hosted para reabrir inputs/outputs com dado no Brasil. | Self-hosted: avaliar quando houver volume que justifique. |
| T0-7 | **Fail-safe da detecção de crise conflaba outage de LLM com crise** (flood de falso-positivo) | ~~🔴 Alta~~ ✅ **Implementado (gateado)** | Incidente 2026-06-17: `ANTHROPIC_API_KEY` revogada → 7 falsos / 2 pacientes / ≈18 dias silenciosos. **ADR-063 camadas 1-4 implementadas (2026-06-18, commit 321926a):** screen determinístico (`_screen_deterministico`, lista clínica), retry c/ backoff, modo degradado (`degraded_response` node, circuit breaker), Sentry OPS alert. Gateado por `CRISIS_RESILIENCE_ENABLED=false` (default) — comportamento histórico inalterado até atestação clínica. | **Gates pendentes (Adonai):** (1) preencher `_TERMOS_CRISE_RAW` em `crisis.py` → `LISTA_ATESTADA=True`; (2) revisar texto em `crisis_copy.py` → `INSTABILIDADE_COPY.atestado=True`; (3) setar `CRISIS_RESILIENCE_ENABLED=true` no box + `--force-recreate orchestrator-py`. |

## Tier 1 — Segurança de plataforma (pendências pós-entrega)

| # | Item | Severidade | Rationale | Caminho para resolver |
|---|---|---|---|---|
| T1-3 | **No mTLS entre serviços internos** | 🟡 Média | `INTERNAL_API_TOKEN` protege, mas tráfego entre gateway↔orchestrator↔agents via HTTP plain na VPC. | AWS VPC endpoints + security groups restringem tráfego; mTLS seria overkill mas ideal. |
| T1-8 | **Presigned PUT de documentos/foto sem limite de tamanho** (ADR-066) | 🟢 Baixa | `GetPreSignedURL(PUT)` assina o content-type (S3 rejeita divergência) mas **não** impõe `content-length-range` → médico autenticado pode subir arquivo arbitrariamente grande no próprio prefixo (abuso de storage/custo; escopo do próprio tenant, ator identificado). | Trocar por presigned **POST** com `content-length-range`, ou validar tamanho real pós-upload + quota/lifecycle no bucket. |

## Tier 4 — Produto / UX (pendências pós-entrega)

| # | Item | Severidade | Rationale | Caminho para resolver |
|---|---|---|---|---|
| T4-5 | **Background sync não implementado** | 🟢 Baixa | Checkins respondidos offline não são enviados quando a conexão volta. | Usar `navigator.serviceWorker.ready.then(r => r.sync.register('checkins'))`. |

## Teleconsulta (ADR-026) / Escriba (ADR-040)

| # | Item | Severidade | Rationale | Caminho para resolver |
|---|---|---|---|---|
| TC-1 | **Validação manual de call real atrás de NAT** nunca registrada | 🟡 Média | Teste sintético não exercita CGNAT/TURN relay — exatamente o cenário onde teleconsulta falha em produção. Exige duas pessoas em redes diferentes (ex.: 4G × wifi). | Call médico↔paciente com `COMPOSE_PROFILES=turn` em prod; conferir em `chrome://webrtc-internals` se o candidato selecionado é `relay` quando P2P falha. Registrar resultado aqui. |
| TC-3 | **Upload do áudio do escriba em base64 via gateway (limite 25 MB)** | 🟢 Baixa | Consulta longa pode estourar o limite; base64 infla 33%. ADR-040 já prevê evolução. | S3 presigned URL direto do browser + notificação ao gateway para disparar a transcrição. |
| TC-4 | **Sem testes do fluxo teleconsulta** | ~~🟡 Média~~ ✅ **Parcial** | Unit tests adicionados: escriba (diarização, pipeline efêmero S3, guardrails do prompt — agents-py) e gateway (TurnCredentialService HMAC/TTL, TeleconsultaSignalingHub pareamento/presença/reconexão). **Pendente (🟢):** endpoint HTTP de vídeo no fixture de Testcontainers + E2E do `SalaVideo.tsx`. | Estender `TenantIsolationTests` para `/video/entrar`; Playwright com `--use-fake-device-for-media-stream`. |

## Check-up Mental (apps/checkup)

Contexto: as 3 escalas (PHQ-9, GAD-7, ASRS-18) estão validadas e live no EC2 (ADR-051);
funil completo (landing → teste → crise/resultado → devolutiva → PDF) verificado por smoke
E2E pelo domínio (12/12). Roda só no EC2 (`:3001`); o destino Vercel foi descartado porque
us-east não alcança o RDS sa-east-1 (SG não libera + sem IP fixo). Itens pendentes:

| # | Item | Severidade | Rationale | Caminho para resolver |
|---|---|---|---|---|
| CK-8 | **ASRS-18 sem verdict por falta de cutoff BR** | 🟢 Baixa | Por design (ADR-051): Mattos 2006 não tem ponto de corte validado p/ Brasil → triagem qualitativa, sem positivo/negativo. Não é bug; é gatilho de revisão. | Se publicarem cutoff BR validado, reabrir por novo ADR (ex.: screener WHO 6 itens). |
| CK-11 | **`/crise` sai do origin com `cache-control: s-maxage=31536000`** | ~~🟡 Média~~ ✅ **Mitigado (CloudFront)** | A tela de crise **prerenderiza por design** (render instantâneo dos canais de crise, sem depender de JS — regra #2) e responde `s-maxage` longo no origin. **Controle efetivo:** CloudFront com `CachingDisabled` no `/crise*` (`x-cache: Miss` provado no cutover, ADR-047). **Origin no-store NÃO perseguido:** forçar a page dinâmica (`connection()`) **quebra o build** no `cacheComponents` do Next 16 (_"Uncached data accessed outside of `<Suspense>`"_) e conflita com o prerender obrigatório da tela de crise. Risco residual desprezível (conteúdo de crise é estático). | Se exigido: cachear só o shell com `'use cache'` + `cacheLife` curto (mantém prerender, encurta o s-maxage) — refactor com cautela na page de crise. |

## Geral / Cross-cutting

| # | Item | Severidade | Rationale | Caminho para resolver |
|---|---|---|---|---|
| G-6 | **No integration tests entre serviços** | ~~🟡 Média~~ ✅ **Parcial (núcleo)** | Job `integration` no `ci.yml`: Postgres real (pgvector) + migrations + api-gateway (`dotnet run`) + orchestrator (`uvicorn`) de verdade, exercitando via HTTP: health/ready dos dois lados, login+`/me` (bcrypt+JWT), bloqueio do rate limit T1-1 na 6ª tentativa, validação de prompt T4-2 (422/200/ativar), trava ADR-035 (409) e rejeição do `INTERNAL_API_TOKEN` (401). **Sem LLM** (key dummy). Script: `infra/ci/integration-smoke.sh`. **Pendente (🟢):** estender p/ web (BFF) e p/ a cadeia conversacional com LLM fake — aí cobre o grafo. | Estender com BFF + provider fake p/ o grafo. |
| G-8 | **Espelho MEMED não alimentava lembrete nem renovação** (Tier 1 prescrição, ADR-056) | ~~🔴 Alta~~ ✅ **Resolvido (código) / 🟡 dep. sandbox** | Espelho gravava `ativa=TRUE` sem `horarios`/`receita_validade` → `gerador_checkins_medicacao` (itera `horarios`) e `gerador_renovacao_receita` (filtra `receita_validade IS NOT NULL`) ignoravam toda receita MEMED. Agora espelho entra **rascunho** (`ativa=FALSE, precisa_confirmar=TRUE`, migration 0046) e o médico confirma horários+validade no prontuário (`/a-confirmar`, `/confirmar`, `/descartar`) antes de ativar — sem parse/IA (clinical-safety #1/#4). Captura via SDK deixou de ser silenciosa (retry + aviso ao médico). | **Migration 0046 aplicada no RDS prod (`cerebro_v3`)** + código em **#64 (mergeado)**; reconfirmada idempotente 2026-06-16. **Nota (ADR-070, 2026-06-20):** emissão MEMED **PAUSADA na UI** (flag `MEMED_HABILITADO=false` em `prescricoes/page.tsx`) — esta dep de sandbox fica **parada** até religar o MEMED. **Aberto (quando religar):** confirmar nome/shape do evento `prescricaoImpressa` no **sandbox MEMED** (precisa credencial); reconciliação server-side via REST = evolução. |
| G-9 | **2ª barreira A5 era painel à parte, não disparava ao prescrever** (Tier 2 prescrição, ADR-057) | ~~🟡 Média~~ ✅ **Resolvido (código) / 🟡 dep. catálogo** | A checagem A5 (ADR-032) só vivia no painel passivo `VerificadorInteracoes`. Como **não existe form de prescrição manual** (única entrada = espelho MEMED), liguei a checagem ao **confirmar do rascunho MEMED** (ADR-056): `ReceitasMemedAConfirmar` auto-roda `checar-interacoes` com todos os fármacos dos rascunhos + ativos do paciente (pega rascunho×ativo e rascunho×rascunho), bloco prominente grave-primeiro, informa-não-bloqueia (clinical-safety #1), regra "falhou≠sem-interação". Web-only, sem migration. | **Aberto:** catálogo `A5-…-draft` não-exaustivo, pendente **revisão clínica (Adonai)**. Próximas fatias Tier 2: relatório de pontos-cegos (worklist do Adonai) + governança do catálogo. |
| G-10 | **Catálogo `medicamentos` só tem nome+classe** (ADR-062, reconciliação) | 🟢 Baixa | A 0047 semeou `medicamentos` projetando o dicionário A5 (~50 fármacos): só `nome_generico` + `classe_terapeutica`. `dosagens`/`indicacoes_resumo`/`registro_anvisa` ficaram vazios — a IA não inventa dado clínico (clinical-safety #1). O picker de "Medicações em uso" mostra nome+classe (+ picker por classe no verificador de interações, ADR-070); texto livre cobre o resto. | **Ingestão ANVISA da tabela de EXIBIÇÃO CONSTRUÍDA** (migration 0056 + `infra/scripts/import_anvisa_medicamentos.py` + runbook `import-anvisa-medicamentos.md`): expande nome/registro/classe/lab do picker a partir do CSV oficial (factual; **não toca o motor A5**) — falta só rodar no box (passo ops). Pendente de **Adonai**: `dosagens`/`indicacoes_resumo` (a IA não inventa — clinical-safety #1) e a curadoria do dicionário/interações A5. |

## Legenda de severidade

- 🔴 **Alta**: correção obrigatória antes de produção ou risco de incidente
- 🟡 **Média**: impacto controlado, deve ser feito na próxima sprint
- 🟢 **Baixa**: nice-to-have, endereçar quando houver tempo
