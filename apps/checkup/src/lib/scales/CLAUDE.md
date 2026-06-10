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
- Fonte do texto: versão brasileira validada (Santos et al., 2013). Os itens em
  `phq9.ts` foram preenchidos a partir dela — **conferir caractere a caractere
  contra a publicação antes de marcar `validated: true`.**
- O PHQ-9 é de uso livre (Pfizer liberou os instrumentos PHQ sem necessidade de permissão).

### GAD-7 (ansiedade) — `gad7.ts`
- 7 itens, mesma janela e mesma escala de resposta 0–3 do PHQ-9.
- Escore 0–21. Faixas: 0–4 mínimo · 5–9 leve · 10–14 moderado · 15–21 grave.
- Fonte: versão brasileira validada (Moreno et al.). Mesma regra de conferência.
- Uso livre, mesma família do PHQ.

### ASRS-18 v1.1 (TDAH adulto) — `asrs18.ts`
- Instrumento da OMS, versão brasileira validada (Mattos et al., 2006).
- 18 itens, respostas 0–4 (Nunca / Raramente / Às vezes / Frequentemente /
  Muito frequentemente).
- **Parte A (itens 1–6) é o screener**: a positividade é por *células sombreadas*
  que variam por item (alguns itens contam a partir de "Às vezes", outros a partir
  de "Frequentemente"). **NÃO implementar a tabela de sombreamento de memória** —
  transcrever do screener oficial (OMS/HCPA). `asrs18.ts` está como stub com a
  estrutura pronta e `validated: false` até isso ser feito.
- Resultado da triagem: ≥ 4 itens positivos na Parte A ⇒ "triagem positiva —
  sintomas compatíveis com TDAH; procure avaliação". Parte B é relatada
  qualitativamente no PDF, sem corte.

## Linguagem dos resultados

O motor devolve `band` (faixa) e `bandLabel` neutros. Quem transforma isso em texto
acolhedor é a camada de devolutiva (`src/lib/ai`), nunca este módulo. Este módulo
não conhece UI, IA nem PDF.
