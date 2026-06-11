import type { Devolutiva, DevolutivaInput } from "./types";

// Fallbacks estáticos revisados — produto, não emergência.
// Ativados quando IA falha, resposta inválida ou contém conteúdo proibido.
const PHQ9_FALLBACKS: Record<string, Devolutiva> = {
  minimal: {
    acolhimento: "Você deu um passo importante ao parar para verificar como está se sentindo.",
    leitura: [
      "Seus resultados sugerem sintomas mínimos de depressão nas últimas duas semanas.",
      "O PHQ-9 é um instrumento de triagem que mede frequência de sintomas — não é um diagnóstico.",
    ],
    limites: "Esta triagem não substitui uma avaliação por profissional de saúde.",
    proximos_passos: [
      "Continue observando como você se sente nas próximas semanas.",
      "Se notar mudanças, considere conversar com seu médico ou um psicólogo.",
    ],
  },
  mild: {
    acolhimento: "Reconhecer que algo não está bem já é um ato de cuidado consigo mesmo.",
    leitura: [
      "Seus resultados sugerem sintomas leves de depressão nas últimas duas semanas.",
      "Sintomas leves são comuns em períodos de estresse e merecem atenção — não ignorar.",
    ],
    limites: "Esta triagem não substitui uma avaliação por profissional de saúde.",
    proximos_passos: [
      "Conversar com seu médico de confiança é um bom próximo passo.",
      "Atenção ao sono, rotina e momentos de descanso podem ajudar.",
      "Se os sintomas persistirem por mais de duas semanas, procure apoio profissional.",
    ],
  },
  moderate: {
    acolhimento: "Você fez bem em parar e verificar. O que você está sentindo tem nome e tem tratamento.",
    leitura: [
      "Seus resultados sugerem sintomas moderados de depressão nas últimas duas semanas.",
      "Sintomas moderados costumam afetar o dia a dia — trabalho, relações, disposição.",
    ],
    limites: "Esta triagem não substitui uma avaliação por profissional de saúde.",
    proximos_passos: [
      "Buscar uma avaliação com psiquiatra ou psicólogo é o passo mais importante agora.",
      "Conte para alguém de confiança como você está se sentindo.",
      "Se tiver plano de saúde, verifique a cobertura para saúde mental.",
    ],
  },
  moderately_severe: {
    acolhimento: "Você não precisa passar por isso sozinho. Buscar ajuda é a decisão certa.",
    leitura: [
      "Seus resultados sugerem sintomas moderadamente graves de depressão nas últimas duas semanas.",
      "Neste nível de sintomas, o apoio profissional faz uma diferença real.",
    ],
    limites: "Esta triagem não substitui uma avaliação por profissional de saúde.",
    proximos_passos: [
      "Marque uma consulta com psiquiatra o quanto antes — o UBS ou CAPS pode ser um caminho acessível.",
      "Não fique sozinho com isso: conte para alguém de confiança.",
      "Se tiver dificuldade de acesso, o CVV (188) oferece escuta 24 horas.",
    ],
  },
  severe: {
    acolhimento: "Você fez algo importante ao chegar até aqui. Merece cuidado — e ele está disponível.",
    leitura: [
      "Seus resultados sugerem sintomas graves de depressão nas últimas duas semanas.",
      "Sintomas graves merecem avaliação profissional urgente.",
    ],
    limites: "Esta triagem não substitui uma avaliação por profissional de saúde.",
    proximos_passos: [
      "Procure atendimento com psiquiatra o mais rápido possível — CAPS, UBS ou pronto-socorro.",
      "O CVV atende 24h pelo 188 e pelo chat em cvv.org.br.",
      "Conta para alguém próximo que você está passando por um momento difícil.",
    ],
  },
};

const GAD7_FALLBACKS: Record<string, Devolutiva> = {
  minimal: {
    acolhimento: "Parar para verificar como você está se sentindo é um cuidado que faz diferença.",
    leitura: [
      "Seus resultados sugerem sintomas mínimos de ansiedade nas últimas duas semanas.",
      "O GAD-7 avalia frequência de sintomas de ansiedade generalizada — não é um diagnóstico.",
    ],
    limites: "Esta triagem não substitui uma avaliação por profissional de saúde.",
    proximos_passos: [
      "Mantenha atenção aos seus níveis de estresse.",
      "Se notar aumento dos sintomas, considere conversar com um profissional.",
    ],
  },
  mild: {
    acolhimento: "Sentir ansiedade é humano — e cuidar disso também é.",
    leitura: [
      "Seus resultados sugerem sintomas leves de ansiedade nas últimas duas semanas.",
      "Sintomas leves podem se intensificar em períodos de pressão — vale observar.",
    ],
    limites: "Esta triagem não substitui uma avaliação por profissional de saúde.",
    proximos_passos: [
      "Técnicas de respiração e rotina regular de sono costumam ajudar.",
      "Se os sintomas persistirem, considere conversar com seu médico ou psicólogo.",
    ],
  },
  moderate: {
    acolhimento: "O que você sente tem solução — e pedir ajuda é o caminho mais direto.",
    leitura: [
      "Seus resultados sugerem sintomas moderados de ansiedade nas últimas duas semanas.",
      "Em nível moderado, a ansiedade costuma interferir no trabalho, nas relações e no sono.",
    ],
    limites: "Esta triagem não substitui uma avaliação por profissional de saúde.",
    proximos_passos: [
      "Conversar com psicólogo ou médico é o próximo passo mais importante.",
      "Anote o que dispara a ansiedade — pode ajudar na consulta.",
    ],
  },
  severe: {
    acolhimento: "Você não precisa carregar isso sozinho. Existem caminhos de melhora reais.",
    leitura: [
      "Seus resultados sugerem sintomas graves de ansiedade nas últimas duas semanas.",
      "Neste nível, o apoio profissional é o recurso mais eficaz disponível.",
    ],
    limites: "Esta triagem não substitui uma avaliação por profissional de saúde.",
    proximos_passos: [
      "Busque avaliação com psiquiatra ou psicólogo o quanto antes.",
      "CAPS e UBS oferecem atendimento em saúde mental pelo SUS.",
      "O CVV (188) oferece escuta 24h se você precisar de alguém para conversar agora.",
    ],
  },
};

// ASRS-18: SEM verdict (Mattos 2006 não tem cutoff validado p/ BR). Único fallback,
// independente do escore — nunca afirma triagem positiva/negativa.
const ASRS_FALLBACK: Devolutiva = {
  acolhimento: "Você fez bem em parar para observar como tem se sentido nos últimos meses.",
  leitura: [
    "O ASRS-18 é um instrumento que organiza sintomas frequentemente associados ao TDAH em adultos — desatenção, inquietação e impulsividade.",
    "Ele é um ponto de partida para uma conversa, não um diagnóstico: no Brasil ainda não há pontos de corte validados para interpretar a pontuação isoladamente.",
  ],
  limites:
    "Esta triagem não substitui uma avaliação por profissional de saúde, que considera história de vida, contexto e outros critérios.",
  proximos_passos: [
    "Leve suas respostas a um psiquiatra ou psicólogo para uma avaliação completa.",
    "Anote exemplos concretos do dia a dia que ajudem a ilustrar o que você percebe.",
  ],
};

const GENERIC_FALLBACK: Devolutiva = {
  acolhimento: "Você deu um passo importante ao parar para verificar como está.",
  leitura: [
    "Seus resultados foram registrados. Cada pessoa responde de um jeito diferente a instrumentos de triagem.",
    "Esta triagem avalia sintomas recentes — não é uma avaliação completa da sua saúde.",
  ],
  limites: "Esta triagem não substitui uma avaliação por profissional de saúde.",
  proximos_passos: [
    "Conversar com um profissional de saúde é sempre o melhor próximo passo.",
    "O CVV (188) oferece escuta 24h se você precisar.",
  ],
};

export function getFallback(input: DevolutivaInput): Devolutiva {
  if (input.scaleId === "asrs18") return ASRS_FALLBACK;
  const map = input.scaleId === "phq9" ? PHQ9_FALLBACKS : GAD7_FALLBACKS;
  return map[input.band] ?? GENERIC_FALLBACK;
}
