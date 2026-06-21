# Infra Baseline — medição antes de redimensionar

> **Status:** medição apenas. **NADA foi aplicado.** Documento de apoio à decisão de _rightsizing_ da EC2 do box clínico e do RDS.
> **Data da medição:** 2026-06-21 · **Região:** `sa-east-1` · **Conta:** `004177894935`
> **Janela:** 14 dias (2026-06-07 → 2026-06-21), buckets de 1h via CloudWatch + snapshot ao vivo via SSM.

## TL;DR

- **O box clínico está muito folgado em CPU e em memória de regime.** Uso de regime ≈ **1,3 GB / 8 GB** e **CPU média 8%**. Os picos de memória (até **5,8 GB reais**) são **transientes de deploy**, não carga de usuário.
- **A menor EC2 que aguenta com folga, por capacidade, é classe 4 GB** (`t4g.medium` / `t3.medium`) — **desde que** (a) o `docker builder prune` seja feito, (b) o .NET seja aposentado pós-flip do ADR-067 e (c) o deploy pare de sobrepor container velho+novo. Sem isso, o pico de deploy de ~5,8 GB pede classe **8 GB**.
- **Graviton (`t4g`) é tecnicamente viável** (.NET 10, JVM/Scala e Python rodam em ARM64), mas exige **imagens ARM no CI (buildx)** e está **economicamente travado até 2027-06-18** por causa do **EC2 Instance Savings Plan preso à família `t3`** (ver §5). Trocar de família agora provavelmente **custa mais**, não menos.
- **RDS: manter `db.t4g.small`.** É o piso. `db.t4g.micro` (1 GB) **não aguenta** o working set atual (~1,1 GB). Banco ocioso em CPU/IOPS; única alavanca real de custo é **Multi-AZ → Single-AZ** (decisão de HA do Patrick, não de capacidade).

---

## 1. Inventário medido

| Recurso | Id | Classe | vCPU | RAM | Disco | Papel |
|---|---|---|---|---|---|---|
| EC2 **cerebro-app** | `i-057860cd97edafefb` | `t3.large` (x86_64) | 2 | 8 GB | 20 GB gp3 (3000 IOPS / 125 MB/s) | **box clínico** (compose: gateway .NET + gateway Scala + 3 Python + web standby) |
| EC2 cerebro-web | `i-0c5f587f0c4ebdb31` | `t3.small` | 2 | 2 GB | — | ASG próprio (fora do escopo) |
| EC2 cerebro-checkup | `i-0b793098b29103e9d` | `t3.small` | 2 | 2 GB | — | ASG próprio (fora do escopo) |
| RDS **cerebro-postgres-enc** | — | `db.t4g.small` | 2 | 2 GB | 20 GB gp3 | Postgres 16, **Multi-AZ** |

Escopo desta medição: **cerebro-app + RDS** (é onde vivem o gateway Scala/JVM + serviços Python). web e checkup têm infra própria (ASG+ALB, ADR-045) e não entram aqui.

---

## 2. EC2 cerebro-app — 14 dias

### Host (CloudWatch AWS/EC2 + CWAgent)

| Métrica | Média | Pico-bucket (1h) | Pico real | Piso | Cobertura |
|---|---|---|---|---|---|
| **CPUUtilization** | **8,1%** | 31,5% | **90,3%** | — | 336 pts (14d cheios) |
| **mem_used_percent** | **21,7%** (~1,7 GB) | 60,4% (~4,8 GB) | **72,1% (~5,8 GB)** | 5,2% | 238 pts (~10d, gaps do CWAgent) |
| **swap_used_percent** | 3,0% | 22,9% | **26,6%** | 0% | 238 pts |
| **disk_used_percent (/)** | 77,1% | 82,6% | **82,7%** | 65,2% | 238 pts |

- `mem_used_percent` do CWAgent é baseado em **MemAvailable** (confere com `free -m`: (7823−6193)/7823 = 20,8% ≈ média 21,7%). Logo o **pico de 72% = 5,8 GB de uso REAL**, sem contar page cache. É memória de verdade, gasta em janela de deploy.
- **CPU pico 90%** = transiente de deploy (`compose pull && up -d`, warmup de JVM). Carga de regime é desprezível (load avg `0.35` em 2 vCPU).
- **swap foi tocado a 26%** — confirma pressão de memória pontual em deploy, não em regime.

### Snapshot ao vivo (SSM, 2026-06-21 21:25 UTC, uptime 3d10h)

```
free -m:  total 7823 | used 1273 | available 6193 | buff/cache 4053 | swap usado 0
load avg: 0.35, 0.32, 0.23   (2 vCPU)
df /:     20G total | 17G usado | 3.6G livre | 83%
```

**Memória por container (`docker stats`, regime):**

| Container | CPU% | Mem | Limite | Observação |
|---|---|---|---|---|
| api-gateway-scala (JVM) | 3,74% | **192 MB** | 768 MB | strangler ADR-067 — **rodando** |
| api-gateway (.NET) | 0,01% | **130 MB** | 7,64 GB | strangler — **ainda rodando em paralelo** |
| agents-py | 0,15% | 154 MB | 4 GB | |
| orchestrator-py | 0,12% | 121 MB | 7,64 GB | |
| web | 0,00% | 65 MB | 7,64 GB | standby (web de prod está no ASG próprio) |
| notifier-py | 0,13% | 60 MB | 1 GB | |
| **Total** | **~4%** | **~722 MB** | | regime |

> O gateway **.NET e o Scala rodam juntos** (coexistência do strangler) = ~322 MB hoje. Quando o .NET for aposentado (pós-flip do ADR-067), o footprint de gateway cai e o pico de deploy também.

### Disco — por que está em 83%

```
docker system df:
  Build Cache  11.04 GB  (100% reclaimable)   <-- o vilão
  Images        3.21 GB  (2.12 GB reclaimable)
  Containers   ~0, Volumes 50 MB
```

Tendência diária (max): 68% (06-11) → 82,7% (06-20), subindo devagar com a rotatividade de imagens de deploy. **Mas ~13 GB são lixo reclamável.** `docker builder prune -af` + `docker image prune -af` derruba o disco de **83% → ~28%**. **Não é problema de tamanho de instância** — é higiene. Recomenda-se cron de prune ou step no deploy.

---

## 3. RDS cerebro-postgres-enc — 14 dias

> A janela de 14d **atravessa o downgrade `db.t4g.medium → db.t4g.small` (2026-06-18)**. Por isso uso a leitura limpa **pós-downgrade (últimos 3d)** para julgar memória; o resto é 14d cheios.

| Métrica | Média 14d | Pico 14d | Leitura pós-downgrade (3d) |
|---|---|---|---|
| **CPUUtilization** | 3,9% | 44,9% | ocioso |
| **FreeableMemory** | 1775 MB* | — | **avg 914 MB livre · MÍN 879 MB livre** |
| **DatabaseConnections** | 15,7 | 30 | avg 21 · pico **30** |
| **FreeStorageSpace** | 16,9 GB livre | — | ~3 GB usados de 20 GB |
| **ReadIOPS / WriteIOPS** | 0,3 / 2,1 | 108 / 35 | trivial vs baseline gp3 (3000) |
| **ReadLatency / WriteLatency** | 0,17 ms / 10,7 ms | 10 ms / **317 ms** | latência de escrita = penalidade Multi-AZ (replicação síncrona) |
| **SwapUsage** | 0,6 MB | 1,75 MB | ~zero |

\* média de 14d inflada porque incluía o período `medium` (4 GB) antes do downgrade — daí o "pico" de 3119 MB livre que não cabe em 2 GB.

**Leitura:** em `db.t4g.small` (2 GB) o Postgres usa **~1,1 GB** (working set), deixando ~880 MB livres em regime. CPU/IOPS/storage sobram. **Conexões 30 no pico** (pool do gateway + 3 Python + réplica Multi-AZ).

**Por que não descer para `db.t4g.micro` (1 GB):** o working set atual (~1,1 GB) **já é maior que a RAM total do micro**. Iria fazer thrash/OOM. Sem folga = contraria o pedido. **`db.t4g.small` é o piso.**

---

## 4. Recomendação de sizing (com folga p/ até 3 médicos, 1 ativo)

A carga de **3 médicos / 1 ativo** é desprezível para esta stack — o gargalo **não é usuário**, é **transiente de deploy** (memória) e **higiene de disco**.

### EC2 cerebro-app

| Cenário | Classe | RAM | Cabe? | Quando |
|---|---|---|---|---|
| **Hoje, sem mudar nada** | manter `t3.large` | 8 GB | ✅ folga enorme | pico de deploy 5,8 GB exige >4 GB enquanto .NET+Scala coexistem |
| **Menor por capacidade (curto prazo)** | `t3.medium` (in-family, x86) | 4 GB | ⚠️ só após pré-reqs↓ | mantém o Savings Plan (§5); regime cabe com sobra, deploy é o risco |
| **Menor Graviton (alvo ideal)** | **`t4g.medium`** | 4 GB | ⚠️ pré-reqs + ARM + SP | melhor custo/Watt; **bloqueado até 2027-06-18** (§5) |
| **Graviton conservador** | `t4g.large` | 8 GB | ✅ | folga de deploy intacta, −~20% vs t3.large, mas SP (§5) |

**Pré-requisitos para descer a 4 GB com segurança** (qualquer família):
1. `docker builder prune -af` + `image prune` (libera ~13 GB de disco; reduz I/O de deploy).
2. **Aposentar o gateway .NET** após o flip do ADR-067 (remove ~130 MB + reduz o pico de deploy do gateway pela metade).
3. **Deploy sem sobreposição** velho+novo (hoje o `compose up` sobe o novo com o antigo ainda de pé → soma os dois picos). `--no-deps` / parar-antes-subir, ou aceitar o swap de 2 GB já configurado como colchão.

> **Recomendação prática:** **não encolher a instância ainda.** Primeiro fazer 1–3 acima e **re-medir o pico de deploy**. Com o .NET fora e build cache limpo, o pico real deve cair para a faixa de 2–3 GB → **`t3.medium` (agora, mantendo o SP) e `t4g.medium` (no vencimento do SP)** passam a ter folga.

### RDS

- **Manter `db.t4g.small`.** É o piso de capacidade (micro não cabe). CPU/IOPS/storage sobram; storage 20 GB é o mínimo do gp3 e usa só ~3 GB.
- **Alavanca opcional (HA, não capacidade): Multi-AZ → Single-AZ.** Economiza ~$25–33/mês e corta a latência de escrita (avg 10,7 ms → ~1–2 ms; pico 317 ms some). **Custo:** perde failover automático. **Decisão do Patrick** — já mapeada em memória. Não recomendo flipar sem o "go" de HA.

---

## 5. ⚠️ Trava econômica: Savings Plan preso à família t3

```
Savings Plan 6c71ed92-18d9-4de9-b376-f33abdd02258
  Tipo:      EC2Instance   (NÃO é Compute SP — é family-locked)
  Família:   t3
  Região:    sa-east-1
  Commit:    $0.0772/hr  (~$56/mês comprometido)
  Estado:    active   ·   Expira: 2027-06-18
```

**Implicação para Graviton:** um **EC2 Instance Savings Plan** cobre só a **família `t3` em `sa-east-1`**. Mover o cerebro-app para `t4g` (Graviton) faz a instância sair da cobertura:
- A `t4g` passa a pagar **on-demand cheio**.
- O **commit de $0.0772/hr continua sendo cobrado** até 2027-06-18, agora absorvido só por cerebro-web + cerebro-checkup (2× `t3.small` ≈ $0.052/hr) → **sobra commit ocioso (~$0.025/hr ≈ $18/mês jogado fora)**.
- Resultado provável: **trocar de família agora custa MAIS**, não menos.

**Janela limpa para Graviton:** **2027-06-18** (vencimento do SP). No renew, comprar um **Compute Savings Plan** (cobre qualquer família, incl. `t4g`/Fargate/Lambda) ou um **t4g Instance SP**, e migrar a família então.

**Migração ARM (independe do SP, mas é pré-req do Graviton):** o CI hoje builda imagens **x86** para o ECR. Graviton exige **`docker buildx` multi-arch (linux/arm64)**. .NET 10, JVM/Scala e Python têm suporte ARM64 — viável, mas é trabalho de pipeline, não flip de instância.

---

## 6. Custos aproximados (sa-east-1 on-demand — **conferir no Pricing Calculator**)

| Recurso | Classe | ≈ $/hr | ≈ $/mês | Δ vs atual |
|---|---|---|---|---|
| EC2 atual | `t3.large` | 0,1056 | ~77 | — (coberto pelo SP t3) |
| EC2 in-family | `t3.medium` | 0,0528 | ~38 | −39 (mantém SP) |
| EC2 Graviton | `t4g.large` | 0,0845 | ~62 | −15 **mas perde SP (§5)** |
| EC2 Graviton | `t4g.medium` | 0,0422 | ~31 | −46 **mas perde SP (§5)** |
| RDS atual | `db.t4g.small` Multi-AZ | ~0,103 | ~75 | — (piso recomendado) |
| RDS Single-AZ | `db.t4g.small` Single | ~0,052 | ~37 | −38 (perde HA) |

> Valores aproximados; preços de `sa-east-1` mudam e têm prêmio regional. **Não usar para fatura — usar como ordem de grandeza.**

---

## 7. Ações sugeridas (em ordem, NENHUMA aplicada)

1. **Disco (grátis, imediato):** ✅ **FEITO 2026-06-21** — `docker builder prune -af` no box → **83% → 45%** (build cache 11 GB → 0). Recorrência ✅ **automatizada**: `docker builder prune -af` adicionado ao `deploy-clinical` no `.github/workflows/deploy.yml` (pré-pull, todo deploy do clínico). `docker image prune -af` já existia lá. Restam ~2 GB de imagens reclamáveis (opcional).
2. **Re-medir pós-flip ADR-067** (.NET fora) o pico real de deploy de memória.
3. **Se pico < ~3 GB:** descer `t3.large → t3.medium` (in-family, **SP segue válido**). Ganho ~$39/mês, zero mexer em CI.
4. **No vencimento do SP (2027-06-18):** avaliar Graviton `t4g.medium` + Compute/t4g SP + imagens ARM no CI.
5. **RDS:** manter `db.t4g.small`. Decisão à parte sobre Multi-AZ→Single (HA × ~$38/mês) com o Patrick.

---

## Apêndice — metodologia / caveats de cobertura

- **EC2 CPU:** 336 pts = 14d cheios (o downgrade de 06-18 foi **stop/start**, não substituição — mesmo instance-id, histórico preservado).
- **CWAgent (mem/swap/disk):** 238 pts (~10d) — há gaps do agente; suficiente para média/pico.
- **RDS:** 172 pts em 14d; a janela **atravessa o downgrade medium→small (06-18)**, então memória foi julgada pela leitura limpa de 3d pós-downgrade.
- **Coleta:** CloudWatch `get-metric-statistics` (buckets 1h, stats Average/Maximum/Minimum) + `docker stats`/`free`/`df`/`docker system df` ao vivo via SSM `AWS-RunShellScript`.
- **Não medido / assumido:** carga de 3 médicos/1 ativo é a carga atual real (sistema já em prod com poucos médicos) — não houve teste de carga sintético. Para crescimento >10 médicos ativos, re-medir antes de fixar classe.
