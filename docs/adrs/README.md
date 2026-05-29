# Architecture Decision Records · Cérebro Amigo

Este diretório registra decisões arquiteturais significativas do produto. Cada
ADR captura **contexto**, **decisão**, **alternativas consideradas** (incluindo
as rejeitadas e por quê), **consequências aceitas** e **gatilhos de revisão**
— condições objetivas que disparariam uma reavaliação.

Padrão seguido: [Michael Nygard, *Documenting Architecture Decisions*](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

Em um sistema de saúde mental (LGPD categoria especial) com responsabilidade
clínica delegada à psiquiatra titular, decisões arquiteturais não são apenas
técnicas — elas têm impacto em segurança do paciente, auditabilidade
regulatória e responsabilidade civil. Cada ADR documenta o raciocínio que
fundamentou a decisão para que ela possa ser explicada anos depois, em
contexto regulatório, sem dependência da memória do autor.

## Índice

| # | Título | Status | Categoria |
|---|---|---|---|
| [001](001-backend-transacional-net.md) | Backend transacional em .NET | Accepted | Stack |
| [002](002-ia-conversacional-python-langgraph.md) | IA conversacional em Python + LangGraph | Accepted | Stack |
| [003](003-agentes-analiticos-python-vanilla.md) | Agentes analíticos em Python sem LangGraph | Accepted | Stack |
| [004](004-lgpd-traces-langsmith.md) | Tratamento de LGPD em traces de LangSmith | Accepted | Compliance |
| [005](005-versionamento-texto-crise.md) | Versionamento e revisão do texto de crise | Accepted | Segurança clínica |
| [006](006-fail-safe-classificador-crise.md) | Fail-safe do classificador de crise | Accepted | Segurança clínica |
| [007](007-gateway-net-nao-go.md) | Gateway .NET 10, não Go (V3) | Accepted | Stack |
| [008](008-llm-bedrock-nao-anthropic-api.md) | LLM via Bedrock In-Region, não ANTHROPIC_API_KEY | Accepted | Stack / Compliance |

## Status possíveis

- **Proposed** — decisão tomada mas ainda não validada em produção.
- **Accepted** — decisão em vigor.
- **Deprecated** — substituída por ADR mais recente; manter para histórico.
- **Superseded by ADR-NNN** — substituída e link para a nova decisão.

## Como propor uma mudança

Decisões aqui registradas não são imutáveis, mas mudá-las exige um novo ADR
que cite explicitamente o ADR anterior em "Superseded by". Não edite ADRs
existentes exceto para correções factuais óbvias (typo, link quebrado).

## Convenções

- ADRs são numerados sequencialmente, sem reuso.
- Mudanças significativas geram novos ADRs; pequenos ajustes operacionais
  podem ser registrados como amendments no final do ADR original (com data).
- Cada ADR é autocontido — não pressuponha que o leitor leu os outros.
