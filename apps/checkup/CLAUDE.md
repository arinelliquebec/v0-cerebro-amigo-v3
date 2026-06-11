# CLAUDE.md — apps/checkup (Check-up Mental)

## O que é este projeto

Experiência pública e gratuita de **triagem de saúde mental** (não diagnóstico) com
instrumentos clínicos validados — PHQ-9, GAD-7 e ASRS-18 — devolutiva gerada por IA
com guardrails rígidos, e um **relatório em PDF** que a pessoa leva ao médico dela.

Função de negócio: é o motor de aquisição do lançamento do Cérebro Amigo.
- Lado paciente: SEO em buscas de altíssimo volume ("teste de ansiedade", "teste TDAH adulto").
- Lado médico: o PDF carrega QR + "gerado por Cérebro Amigo" e recruta psiquiatras
  que recebem o relatório de pacientes. **Métrica norte: médicos cadastrados por 1.000 testes concluídos.**

## Posição na arquitetura

- Vive no monorepo do Cérebro Amigo como `apps/checkup`. Porta **:3001**.
- **Isolamento deliberado**: NÃO importa código do gateway (.NET), orchestrator, agents
  ou notifier. NÃO chama serviços clínicos. Compartilha apenas design tokens.
- LLM: Anthropic API direta (`@anthropic-ai/sdk`), modelo `claude-haiku-4-5`.
  Chave somente via env `ANTHROPIC_API_KEY` (SSM Parameter Store SecureString,
  injetada no deploy) — **nunca** no repositório, na imagem Docker ou em log.
  Implementar atrás da flag `LLM_PROVIDER` (default `anthropic`), com interface
  única, para que uma futura troca de provedor seja config, não refactor.
- Anti-abuso: o checkup é superfície pública anônima. Rate limit por sessão na
  rota da devolutiva + spend limit no Console da Anthropic são obrigatórios
  antes do deploy público.
- Banco: schema `checkup` no RDS Postgres existente. Acesso via Drizzle
  (a menos que apps/web já tenha um padrão de ORM — nesse caso, espelhar).
- Deploy: 6º serviço no Docker Compose (ver `deploy/compose.snippet.yaml`),
  imagem própria no ECR, mesmo fluxo GitHub Actions → SSM.
- Domínio: `checkup.cerebroamigo.com.br` no lançamento (roteado por Host na EC2).
  Migração futura para path no domínio principal é aceitável; não otimizar agora.

## Stack e convenções (espelhar apps/web)

- Next.js 16 (App Router) + React 19 + TypeScript strict.
- Tailwind 4 + shadcn/ui (estilo new-york) + lucide-react. pnpm.
- `cacheComponents` (PPR) e React Compiler ligados — copiar a config de apps/web.
- Páginas de conteúdo/SEO: SSG. Fluxo do teste: client components com estado local.
- Testes: Vitest. **O motor de escalas exige testes unitários antes de qualquer UI.**

## As três regras inegociáveis (lê isto duas vezes)

### 1. Triagem nunca é diagnóstico
- Proibido em QUALQUER texto (UI, devolutiva, PDF, SEO): "você tem X",
  "diagnóstico", "você sofre de", "confirmado". Usar: "seus resultados sugerem
  sintomas compatíveis com…", "isto é um ponto de partida para uma conversa
  com um profissional".
- A devolutiva da IA é template-driven com estrutura fixa (ver `src/lib/ai/CLAUDE.md`).
  Nunca geração livre.

### 2. Fluxo de crise é first-class (ver docs/CRISIS-PROTOCOL.md)
- Resposta > 0 no item 9 do PHQ-9 desvia IMEDIATAMENTE para a tela de acolhimento
  com canais de ajuda. Sem dark patterns, sem voltar ao funil comercial.
- Este fluxo é implementado e testado ANTES de qualquer feature de conversão.

### 3. Anônimo por padrão (LGPD — dado sensível)
- O teste roda inteiro sem cadastro. Sessão efêmera (id aleatório, sem cookie de tracking).
- Respostas só são persistidas com consentimento explícito (checkbox desmarcado por
  padrão) e de forma anonimizada: sem IP bruto, sem fingerprint, sem e-mail junto
  das respostas.
- E-mail é opcional e serve só para enviar o PDF; vive em tabela separada, sem FK
  para as respostas.
- Sem Google Analytics/pixels por padrão. Eventos de funil são server-side no
  Postgres: `test_started`, `crisis_routed` (sem payload), `test_completed`,
  `report_generated`, `qr_scanned`, `doctor_signup_started`.

## Instrumentos

- Usar SOMENTE versões brasileiras validadas dos instrumentos. **Nunca parafrasear,
  traduzir por conta própria ou inventar itens.** Regras por escala em
  `src/lib/scales/CLAUDE.md`.
- Scoring é TypeScript puro, determinístico, com testes de casos canônicos.
  A IA NUNCA calcula escore.

## PDF do relatório

- Gerado server-side com `@react-pdf/renderer`. Uma página, layout limpo e clínico:
  identificação opcional, data, tabela escala → escore → faixa, respostas item a item,
  texto fixo "instrumento de triagem; não substitui avaliação profissional",
  QR para `cerebroamigo.com.br/medicos?src=checkup&rid=<id-curto>`.
- O QR é o mecanismo central de aquisição de médicos. O `rid` permite atribuição
  sem identificar a pessoa.

## SEO (a aquisição do lado paciente)

- Três landings SSG no MVP: `/ansiedade`, `/depressao`, `/tdah-adulto`.
  Conteúdo educacional honesto (o que é a escala, o que ela mede e o que não mede),
  CTA para o teste. Metadata API do Next, sitemap, robots, Schema.org básico.
- Proibido: promessa de cura/tratamento, sensacionalismo, conteúdo gerado raso.
  (Limites de publicidade médica do CFM se aplicam à marca.)

## Design

- Base: tokens do Cérebro Amigo — roxo `#5E4B8B`, navy `#0F2137`, coral `#E57373`,
  Playfair Display (display) + Inter (texto) — adaptados para um tom mais calmo e
  acolhedor que o site clínico: fundos claros, mais respiro, coral reservado a
  acentos pequenos (nunca em telas de crise; ali, paleta sóbria).
- O elemento-assinatura é UM só: o **ritmo do teste** — uma pergunta por tela,
  transição suave, barra de progresso discreta, microcópia que acolhe sem infantilizar.
  Todo o resto fica quieto e disciplinado. Nada de partículas/glassmorphism aqui:
  o público pode estar em sofrimento.
- Acessibilidade é requisito: WCAG AA, foco visível, navegação por teclado,
  `prefers-reduced-motion` respeitado, alvos de toque ≥ 44px (tráfego será móvel).
- Copy: voz ativa, sentence case, específica. Botões dizem o que fazem
  ("Ver meu resultado", não "Enviar").

## Fora de escopo do MVP (não implementar)

Contas/login, histórico de testes, comparação temporal, mais escalas, versão B2B/empresas,
gamificação, chat livre com IA, notificações push, i18n.

## Definition of Done do MVP

1. Motor de 3 escalas com testes unitários verdes (incl. fluxo de crise).
2. Funil completo: landing → teste → (crise OU resultado) → devolutiva IA com
   fallback estático → PDF com QR.
3. 3 landings SEO publicadas com metadata e sitemap.
4. Eventos de funil gravando no schema `checkup`.
5. Lighthouse ≥ 90 em performance e acessibilidade nas landings.
6. Container sobe via compose snippet e responde em :3001.
