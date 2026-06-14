# ADR-053: Teleconsulta multiparticipante (família) — SFU self-hosted

**Status:** Proposed — implementação adiada (feature futura; ver "Custos e dimensionamento")
**Data:** 2026-06-14
**Decisores:** Equipe de engenharia + psiquiatra responsável clínico (sign-off clínico/DPO pendente — ver "clinical-safety")
**Categoria:** Produto / Arquitetura / Segurança clínica
**Relação:** supersede o **ADR-026** no **transporte de mídia** (P2P → SFU) ao ser
aceito; carrega adiante o modelo de segurança do 026 (sem gravação, sinalização
não persistida, consentimento antes da sala, revalidação de tenant por chamada).
Não altera o ADR-040 (escriba).

## Contexto

O ADR-026 entregou teleconsulta como **WebRTC P2P 1:1** (médico↔paciente): no
caminho feliz a mídia vai direto entre os dois navegadores (DTLS-SRTP) e nunca
toca nosso servidor — a melhor postura possível de LGPD. A premissa explícita do
026 é "a consulta é **sempre 1:1**".

Surgiu um requisito de produto que quebra essa premissa: **familiares (ex.: pai e
mãe) participarem da consulta a partir de locais diferentes, cada um com o
próprio vídeo** — tipicamente 3 a 4 participantes em redes distintas.

Em malha P2P (mesh), cada participante abre uma conexão com todos os outros: com
4 pessoas, cada um faz **3 uploads simultâneos** do próprio vídeo e decodifica 3
streams. O gargalo é o **upload do elo mais fraco** (familiar em 4G / wifi
residencial assimétrico), além de CPU/bateria no aparelho. Consenso da
indústria: mesh aguenta 2-3 participantes; **4 já é a fronteira** e fica frágil
demais para um produto clínico, onde a chamada precisa simplesmente funcionar.

Decisão de transporte para o caso multiparticipante, entre as mesmas três
famílias de opção que o ADR-026 avaliou:

1. **Mesh P2P (status quo do 026)** — ótimo para 1:1, frágil em 3-4 por causa do
   upload do elo fraco. Não serve ao novo requisito.
2. **SaaS gerenciado** (Daily/Vonage/Agora/…) — rápido, mas a mídia clínica
   trafega na nuvem do provedor (provável fora do BR) → vira processador LGPD,
   exige DPA e custo por minuto. Mesma rejeição do ADR-026.
3. **SFU self-hosted** (LiveKit/Jitsi/mediasoup/Janus) — cada participante sobe a
   mídia **uma vez** ao nosso servidor, que a repassa aos demais. A mídia passa a
   transitar pela nossa infra (perde-se o "nunca toca a gente" do P2P), mas
   continua **no BR** e **sem gravação**. Escala para N de forma estável.

## Decisão

**SFU self-hosted em `sa-east-1`, cobrindo os dois casos (1:1 e
multiparticipante) com um único stack de vídeo.** Abrimos mão do P2P puro do 1:1
em troca de um só caminho de código — menos superfície de bug num produto
clínico. A perda de privacidade do 1:1 é mitigada porque o SFU é **nosso, no BR,
sem gravar nada e sem persistir mídia** (ver "clinical-safety").

- **SFU = LiveKit** (Apache-2.0, self-hosted). Motivos: turnkey (não é só
  toolkit), SDK JS/React que encaixa no Next.js do `apps/web`, **auth por JWT de
  sala** (mapeia direto no problema do convidado), TURN/ICE embutido (dispensa o
  coturn avulso do 026), simulcast/adaptação de banda, footprint razoável e
  projeto ativo. Alternativas e por que não: ver seção própria.
- **Infra: VM dedicada, fora do box clínico.** O SFU roda numa EC2 própria em
  `sa-east-1`, com security group próprio — **mesma lógica do ADR-045** (checkup
  saiu do box clínico) e da separação que discutimos para o coturn: relay de
  mídia contínuo + portas de mídia públicas **não** podem dividir a máquina que
  roda o caminho de crise (orchestrator) e guarda dado clínico. Para a escala de
  um consultório, uma instância pequena basta; LiveKit escala horizontal depois
  (mesmo padrão ASG do ADR-045) se a concorrência crescer.
- **Sinalização e ICE passam a ser do LiveKit.** Isso **aposenta** o
  `TeleconsultaSignalingHub` (relay SSE/POST em memória, 2 papéis) e o
  `TurnCredentialService` (credencial TURN efêmera) do ADR-026, além do serviço
  `coturn` avulso (`profiles: ["turn"]`) — o LiveKit provê TURN próprio.
- **O gateway .NET continua dono da autorização** (transacional, não-LLM): emite
  o **JWT de sala do LiveKit por participante**, com TTL curto, escopo de uma
  única `consulta_id` e *grants* por papel:
  - `medico` = host (admite/remove participantes, encerra a sala);
  - `paciente` = publica a própria mídia; consente quem entra (ver
    clinical-safety);
  - `convidado` = publica só a própria mídia; **sem** poder de admitir ninguém e
    **sem** nenhum grant de dado clínico — o token autoriza **entrar numa sala**,
    nada mais. É o mesmo princípio da credencial efêmera de hoje (mintada
    server-side, nunca no front, caduca sozinha), agora como token do LiveKit.
- **Convite do familiar é dirigido pelo paciente, controlado pelo médico.** O
  paciente indica/consente quem participa (no portal `/p/*`); o gateway emite um
  **convite efêmero por familiar** (token de uso único, com janela de validade em
  torno do horário da consulta, revogável); o médico, como host, admite/remove na
  sala. Um link de convite **nunca** é caminho para o prontuário.
- **Sem gravação** (mantido do ADR-026). Nesta fase nenhum áudio/vídeo é gravado
  ou armazenado pelo SFU. Gravação só existe via escriba (ADR-040), com
  consentimento e guard próprios — a presença de família **não** liga gravação.
- **Estado e auditoria** (nova migration): estende `consulta_video_eventos`
  (append-only do 026) com **papel** e **identificador de convidado sem PII** nos
  eventos entrou/saiu/encerrou — prova de quem esteve presente, sem conteúdo
  clínico. Convites e o consentimento do paciente por participante ficam numa
  tabela própria (`consulta_convidados`), também sem PII clínica.
- **UI:** `SalaVideo` reescrito sobre o SDK do LiveKit, com layout de **N
  participantes** e controles de host (admitir/remover/encerrar). Consentimento
  de teleconsulta + aviso "não é gravada" exibidos **antes de entrar** para
  **todos** os papéis (médico, paciente e cada convidado).

### clinical-safety

- **Regra #1 (IA não pratica medicina):** inalterada — transporte de vídeo não
  envolve LLM; nenhuma sugestão/diagnóstico é gerado. O escriba (ADR-040) segue
  com seus próprios guardrails.
- **Regra #2 (crise):** inalterada — a chamada é humano↔humano (médico presente);
  o protocolo de crise segue no orchestrator, no canal de mensagens. Texto de
  crise nunca por vídeo. Família presente não muda o protocolo.
- **Regra #4 (LGPD categoria especial) — é a mudança central deste ADR.** Sair do
  P2P puro significa que a **mídia passa a transitar pela nossa infra** (o SFU
  encaminha os streams). Consequência aceita, mitigada por:
  - SFU **self-hosted em `sa-east-1`** → sem transferência internacional; dado de
    inferência/mídia fica no Brasil;
  - **SRTP em trânsito**; o SFU **encaminha, não armazena** — mídia efêmera;
  - **sem gravação e sem persistência** de áudio/vídeo (mantido do 026);
  - **sinalização não persistida**; logs só com metadados (SDP/ICE contêm IP =
    PII, não vão a banco nem log);
  - **minimização**: só familiares **convidados e consentidos** pelo paciente
    entram; token de convidado é efêmero, escopado à sala, **sem PII** no
    identificador e **sem** grant de dado clínico.
  - **Consentimento (novo fluxo):** a consulta expõe conteúdo clínico do
    paciente; portanto **o paciente consente explicitamente cada familiar**
    presente (consentimento por participante, registrado em auditoria), e o aviso
    "não é gravada" é exibido a todos antes de entrar. Se o paciente for menor,
    entra a camada de responsável legal. **Este fluxo de consentimento exige
    sign-off do responsável clínico e do DPO antes de implementação** — por isso
    o ADR está *Proposed*.
- **Tenant (revalidado em TODA chamada):** médico via JOIN
  `pacientes.medico_responsavel_id`; paciente via `paciente_id`. Só consultas
  `modalidade='teleconsulta'`. O convidado é autorizado **exclusivamente** por um
  token de uso único vinculado àquela `consulta_id` e ao convite consentido —
  nunca ganha acesso a qualquer outro dado.
- **Regra #5 (auditoria imutável):** `consulta_video_eventos` permanece
  append-only; a extensão (papel + id de convidado) e a nova `consulta_convidados`
  seguem append-only para os registros de presença/consentimento. Nenhum código
  dá DELETE/UPDATE em registro de presença ou de consentimento.

## Alternativas consideradas

- **Manter mesh P2P para 1:1 e usar SFU só para 3+ (modo híbrido).** Preservaria o
  "mídia nunca toca a gente" no caso 1:1 (comum). **Rejeitado por ora** a pedido
  do produto: manteria **dois stacks de vídeo** (o `RTCPeerConnection` atual +
  LiveKit), dobrando código e superfície de teste num produto clínico. Pode ser
  reaberto como gatilho de revisão se a privacidade do 1:1 puro voltar a ser
  requisito.
- **SaaS gerenciado (Daily/Vonage/Agora).** Rejeitado: mídia clínica fora do BR,
  vira processador LGPD com DPA, custo por minuto. Mesma rejeição do ADR-026.
- **Outros SFUs self-hosted:** *mediasoup* (mais controle/performance, mas é
  toolkit — muito mais trabalho de servidor); *Janus* (maduro em C, modelo de
  plugin, mais peso operacional); *Jitsi/JVB* (turnkey, porém Java e mais
  pesado em RAM). LiveKit vence pelo equilíbrio turnkey + SDK + footprint +
  modelo de token.

## Consequências

- **Supersede o transporte do ADR-026.** Ao aceitar este ADR, marcar o 026 como
  *Superseded by ADR-053* (no cabeçalho e no índice). O modelo de segurança do
  026 é carregado adiante, não descartado.
- **Nova infra:** servidor LiveKit em EC2 dedicada `sa-east-1` + security group
  próprio (portas de mídia públicas isoladas do box clínico). Segredos
  (`LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET`) via SSM SecureString; `LIVEKIT_URL`
  por env. Provisionamento em `infra/aws/` (mesmo padrão do checkup-ASG).
- **Gateway:** aposenta `TeleconsultaSignalingHub` e `TurnCredentialService`;
  introduz um serviço de emissão de **token de sala LiveKit por papel** + rotas
  de **convite/revogação** de familiar; mantém a revalidação de tenant.
  `TeleconsultaEndpoints` passa a devolver token de join em vez de ICE+SSE.
- **Migrations:** estender `consulta_video_eventos` (papel + id de convidado sem
  PII); nova `consulta_convidados` (convite, status, consentimento) — append-only.
- **BFF (`apps/web`):** `app/api/consultas/[id]/video/*` e
  `app/api/paciente/agenda/[id]/video/*` passam a entregar token de join do
  LiveKit (o cookie httpOnly autentica a emissão); novas rotas de convite no
  portal do paciente. `lib/teleconsulta-proxy.ts` revisado.
- **Web:** `components/video/SalaVideo.tsx` reescrito sobre o SDK do LiveKit
  (layout N participantes, controles de host, gate de consentimento por papel).
- **Aposentadorias:** serviço `coturn` avulso (`profiles: ["turn"]`) e as vars
  `STUN_URLS`/`TURN_URLS`/`TURN_SECRET`/`TURN_TTL_SECONDS`/`TURN_REALM`/
  `TURN_EXTERNAL_IP` saem com o caminho P2P (o LiveKit provê TURN). O raw
  `RTCPeerConnection` e a sinalização SSE/POST são removidos.
- **Escriba (ADR-040):** inalterado nesta fase — a captura de áudio segue
  client-side e com seu próprio consentimento; a presença de família **não** liga
  gravação. (Futuro possível, fora deste ADR: o SFU habilita captura server-side
  do escriba — exigiria revisão do ADR-040 e novo consentimento.)
- **Custo aceito:** banda/CPU de relay de mídia no box do SFU **durante** as
  chamadas (não há custo quando não há sala ativa).

## Custos e dimensionamento

Dimensionamento para o lançamento (~5 psiquiatras): **1 nó**. A quantidade de VMs
escala com **chamadas simultâneas**, não com número de médicos (todos os tenants
compartilham o SFU; salas são isoladas por token, não por máquina). O gargalo de
um SFU é **egress** (transferência de dados para a internet), não CPU/RAM — ele
encaminha mídia, não transcodifica.

Âncoras `sa-east-1` (jun/2026; confirmar no AWS Pricing Calculator antes de
provisionar):

- Egress: primeiros **100 GB/mês grátis**, depois **US$0,15/GB** (já com a redução
  de 40% aplicada em São Paulo; ~67% mais caro que os EUA).
- EC2 on-demand: `t3.small` ≈ US$21/mês, `t3.medium` ≈ US$42/mês (Savings Plan
  corta ~30-40%).
- IPv4 público ≈ US$4/mês; EBS root gp3 ≈ US$2/mês (**sem gravação** = pouco
  disco). TLS/DNS no próprio nó (Caddy + Let's Encrypt) = US$0; Redis = US$0 (só
  multi-nó).

Egress por sala (1 Mbps/stream; o SFU manda N-1 streams para cada um dos N peers):

| Sala | Egress | 30 min | 50 min |
|---|---|---|---|
| 1:1 (2 pessoas) | 2 Mbps | 0,45 GB | 0,75 GB |
| Família (4 pessoas) | 12 Mbps | 2,7 GB | 4,5 GB |

Volume-base: 5 médicos × ~8 consultas/dia × ~22 dias ≈ **~880 consultas/mês**.

| Cenário | Premissas | Egress/mês | **Total/mês (1 nó)** |
|---|---|---|---|
| Baixo | tudo 1:1, 30 min, 0,6 Mbps | ~238 GB → ~US$21 | **~US$50** |
| Médio | 50 min, 1 Mbps, 15% família | ~1.155 GB → ~US$158 | **~US$185** |
| Alto | 50 min, 1,2 Mbps, 30% família | ~1.980 GB → ~US$282 | **~US$310** |

Dominado pelo egress, que é **pay-per-use** (sobe com o número de consultas — e de
médicos pagantes). No começo, com poucas consultas, o uso fica perto do tier
grátis (~US$30-50/mês). **HA** (2 nós + ALB + Redis para distribuir salas) soma
~US$60-90/mês fixos; a recomendação é começar com **1 nó**.

Alavancas (todas no egress): capar resolução (720p→480p ≈ **metade** do egress);
áudio-only em rede ruim; os 100 GB grátis cobrem o início; Savings Plan na
instância.

Comparativo na mesma escala: self-hosted ~US$150-185/mês · Daily.co embutível
~US$420 (e processador estrangeiro) · Zoom 5 hosts ~US$75-100 (não embutido, sem
escriba). **Custo não é argumento pró-SaaS** — o self-hosted fica na mesma faixa e
preserva residência + escriba + auditoria. O gasto que a fatura da AWS **não**
mostra, e que mais pesa, é o **esforço de engenharia/operação** (integração
LiveKit + token + consentimento + reescrita do `SalaVideo`; plantão quando o vídeo
cai).

### Priorização — feature futura (adiada)

Decisão de produto (jun/2026, fase de lançamento do SaaS): **implementação
adiada**. No estágio inicial o custo — sobretudo o esforço de engenharia, mas
também a infra recorrente (~US$150-185/mês ≈ **R$800-1.000/mês** a ~R$5,5/US$,
câmbio flutuante, na faixa de uso pleno) — **não se justifica ante outras
features** com mais retorno agora.

Até a implementação, a **teleconsulta 1:1 (ADR-026, P2P) segue em produção** e
atende o caso comum; a capacidade **multiparticipante (família)** deste ADR é o
upgrade a fazer quando um gatilho disparar. O ADR-026 **só será marcado como
superseded quando o 053 for implementado e aceito** — até lá, é o 026 que vale.

Implementar quando (qualquer um):

- família na teleconsulta virar demanda real e recorrente de médicos/pacientes;
- a receita/escala diluir o custo (mais médicos pagantes amortizam egress + infra);
- houver janela de engenharia sem custo de oportunidade sobre features de maior
  retorno.

## Gatilhos de revisão

- Concorrência acima do que uma instância aguenta → escalar LiveKit horizontal
  (ASG, padrão ADR-045).
- Necessidade de **gravação** da teleconsulta → **não** por este ADR; vai por
  revisão do escriba (ADR-040) + novo consentimento.
- Grupos grandes (webinar/grupo terapêutico) → outro produto; reavaliar.
- Se a privacidade do **1:1 P2P puro** voltar a ser requisito de produto →
  reabrir o modo híbrido descartado acima.
