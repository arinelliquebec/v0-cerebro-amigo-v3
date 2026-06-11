# CLAUDE.md — src/lib/scales (motor de instrumentos)

Este diretório é o coração clínico do produto. Regras absolutas:

## Princípios

1. **Itens são dados, não prosa.** Cada instrumento é um objeto `Scale` tipado
   (ver `types.ts`). A UI renderiza a partir dos dados; nunca hardcodar texto de item
   em componente.
2. **Nunca inventar ou parafrasear itens.** Onde o texto validado ainda não foi
   conferido, existe um `// TODO(validar)` apontando a fonte. Se um TODO estiver
   aberto, a escala NÃO entra em produção — falhar o build se `validated: false`.
3. **Scoring determinístico em TS puro**, sem IA, com testes unitários de casos
   canônicos (mínimo: tudo-zero, tudo-máximo, um caso por faixa de corte, caso de crise).
4. Toda mudança em itens/cutoffs exige atualizar os testes no mesmo commit.

## Instrumentos do MVP

### PHQ-9 (depressão) — `phq9.ts`
- 9 itens, janela "últimas 2 semanas", respostas 0–3
  (Nenhuma vez / Vários dias / Mais da metade dos dias / Quase todos os dias).
- Escore 0–27. Faixas: 0–4 mínimo · 5–9 leve · 10–14 moderado ·
  15–19 moderadamente grave · 20–27 grave.
- **Item 9 é o item de crise**: resposta > 0 dispara `crisisFlag` no resultado,
  independentemente do escore total. O fluxo de UI trata isso ANTES de mostrar escore
  (ver docs/CRISIS-PROTOCOL.md).
- Fonte do texto: versão **oficial PT-BR autorrelato** (tradução Pfizer/MapiTrust;
  back-translation Fraguas Jr. et al., 2006), distribuída em phqscreeners.com.
  **NÃO é a versão de Santos et al. (2013)** — essa é aplicada por entrevistador e usa
  opções de resposta modificadas (nenhum dia / menos de uma semana / uma semana ou mais /
  quase todos os dias). O checkup é autoaplicado, então usa a versão autorrelato.
  **Conferir caractere a caractere contra o PDF oficial "Portuguese for Brazil" do
  phqscreeners.com antes de marcar `validated: true`.**
- O PHQ-9 é de uso livre (Pfizer liberou os instrumentos PHQ sem necessidade de permissão).

### GAD-7 (ansiedade) — `gad7.ts`
- 7 itens, mesma janela e mesma escala de resposta 0–3 do PHQ-9.
- Escore 0–21. Faixas: 0–4 mínimo · 5–9 leve · 10–14 moderado · 15–21 grave.
- Fonte: versão **oficial PT-BR autorrelato** (tradução Pfizer/MapiTrust; phqscreeners.com),
  **não** Moreno et al. (paper psicométrico, não reproduz o instrumento). Conferido
  char-a-char contra o PDF oficial "Portuguese for Brazil" (2026-06-11): itens e opções
  idênticos, sem defeito. Mesma regra de conferência do PHQ-9.
- Uso livre, mesma família do PHQ.

### ASRS-18 v1.1 (TDAH adulto) — `asrs18.ts`
- Instrumento da OMS, versão brasileira validada (Mattos et al., 2006, Rev Psiq Clín, Tabela 2).
- 18 itens, respostas 0–4 (Nunca / Raramente / Algumas vezes / Frequentemente /
  Muito frequentemente).
- Estrutura real: **Parte A = 9 itens** (desatenção, 1–9), **Parte B = 9 itens**
  (hiperatividade-impulsividade, 10–18). Itens transcritos verbatim da Tabela 2
  (house style: ortografia moderna + notação (a)); `validated: true` desde 2026-06-11.
- **SCORING QUALITATIVO, SEM VERDICT** (decisão Patrick/Rafael, 2026-06-11). Mattos 2006
  adverte EXPLICITAMENTE que **não há pontos de corte validados para o Brasil** e recomenda
  cautela em usar a pontuação dos itens ou tratar "algumas vezes" como positivo. Por isso
  **NÃO** aplicamos os cutoffs americanos (Kessler) nem a tabela de células sombreadas:
  `scoreAsrs18` só soma (totalScore informativo), band única `informative`; devolutiva fixa
  (`ASRS_FALLBACK`, sem chamar LLM), nunca afirma positiva/negativa. "Triagem nunca é diagnóstico".
- Reabrir só por novo ADR/decisão do Patrick (ex.: screener WHO 6 itens A4,A5,A6,A9+B1,B5,
  ≥4 positivos) se houver cutoff validado p/ BR.

## Linguagem dos resultados

O motor devolve `band` (faixa) e `bandLabel` neutros. Quem transforma isso em texto
acolhedor é a camada de devolutiva (`src/lib/ai`), nunca este módulo. Este módulo
não conhece UI, IA nem PDF.
