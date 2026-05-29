---
name: python-ai-services
description: >-
  Convenções dos serviços Python do Cérebro Amigo V3 (orchestrator-py, agents-py,
  notifier-py). Use ao criar ou alterar: nó/grafo LangGraph, fluxo conversacional,
  qualquer chamada ao Claude (AGORA via AWS Bedrock, não mais ANTHROPIC_API_KEY),
  client/SDK de LLM, roteamento de modelo (Haiku/Sonnet/Opus), agente analítico,
  job do APScheduler, Web Push (pywebpush), endpoint FastAPI desses serviços, ou
  config do LangSmith. Use TAMBÉM, e com prioridade, quando o pedido for "migrar
  o LLM para o Bedrock", "trocar a chave da Anthropic", "conectar à IA da AWS" ou
  configurar região/IAM do Bedrock — nesse caso leia também references/bedrock-client.md.
---

# Serviços Python — orchestrator / agents / notifier

Três FastAPI. **Única camada que fala com o LLM**, sempre via **AWS Bedrock In-Region (sa-east-1)**.

## Regra de ouro

Toda decisão sobre paciente passa pelos guardrails clínicos. Antes de escrever prompt, fluxo de crise, ou resposta ao paciente, **leia a skill `clinical-safety`**. O LLM extrai/organiza fato relatado; não decide clínica.

## orchestrator-py (:8081) — LangGraph

IA conversacional + protocolo de crise. Grafo stateful: recebe mensagem → detecta crise → extrai sintomas → audita → responde (SSE). 

- **Crise:** detecção (Haiku) → texto **literal** de `crisis_copy.py` → registra `protocolos_crise_acionados` → notifica médico → pausa automação. Nunca gere texto de crise com LLM.
- **Auditoria:** `audit_response` antes de qualquer texto chegar ao paciente; `escalate_to_human` quando necessário.
- **Streaming:** responde por SSE; o api-gateway faz proxy para o cliente.

## agents-py (:8082) — APScheduler

5 agentes analíticos (não conversacionais), agendados (`SCHEDULER_INTERVAL_SECONDS`). Rodam em **`SHADOW_MODE`** antes de agir em produção: logam o que fariam, sem efeito. Cada execução vai para `agente_execucoes` (append-only). Modelo pesado (Opus 4.7) só onde o raciocínio justifica; o resto em Haiku/Sonnet por custo/latência.

## notifier-py (:8083) — Web Push

Push de check-in via `pywebpush` + VAPID (`VAPID_*`). Sem conteúdo clínico no payload do push — só gatilho para abrir o app. Respeita `NOTIFIER_MODE`.

## LLM via Bedrock (mudança central do V3)

- **Sem `ANTHROPIC_API_KEY`.** Auth por **IAM role** da EC2 (SigV4 automático); dev usa `AWS_PROFILE`.
- **In-Region sa-east-1**: Haiku, Sonnet e Opus 4.7 confirmados na região. Dado de inferência fica no Brasil (LGPD).
- Mesma Messages API — migração do V2 é trocar o client. **Detalhes, código e roteamento de modelo: leia `references/bedrock-client.md`.**

## Roteamento de modelo por etapa

| Etapa | Modelo (env) |
| --- | --- |
| Detecção de crise, classificação, auditoria | `BEDROCK_MODEL_HAIKU` |
| Extração de sintomas, resposta ao paciente | `BEDROCK_MODEL_SONNET` |
| Resumo pré-consulta denso / análise de padrões | `BEDROCK_MODEL_OPUS` (opcional) |

## LangSmith

Tracing ligado, mas com `PII_REDACTION_ENABLED=true`. Nunca trace conteúdo clínico cru. Amostre se o custo por volume subir.

## FastAPI — convenções

- `GET /health` e `GET /ready` em todos os três.
- Autenticação entre serviços por `INTERNAL_API_TOKEN` (header Bearer).
- Python 3.12. Dependências por serviço (não monolito de requirements).

## Ao portar do V2

V2 já tinha tirado Go destes serviços (viraram Python) — mantenha. **Troque** o client Anthropic direto pelo Bedrock (`references/bedrock-client.md`). **Remova** qualquer `AZURE_*` (Azure OpenAI/Whisper saíram). Preserve `crisis_copy.py`, os gates de SHADOW_MODE e a estrutura do grafo.
