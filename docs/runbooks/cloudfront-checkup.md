# Runbook — CloudFront para checkup.cerebroamigo.com.br

**ADR-047** · Reduz LCP de ~3 s → ~1 s com edge cache no PoP de São Paulo.

## Visão geral

```
Usuario BR
    │
    ▼
CloudFront (edge SP)
    │ HTTPS
    ▼
EC2 clinico :443 (Caddy)    ← origin atual
    │                         substituir por ALB quando ADR-045 for provisionado
    ▼
Next.js checkup :3001
```

DNS: zona fica na **Vercel** (nao Registro.br).  
ACM: cert de checkup.cerebroamigo.com.br deve estar em **us-east-1** (exigencia CF).

---

## Fase 0 — Pre-requisitos

- [ ] AWS CLI configurado com perfil que tem permissoes CloudFront + ACM + SSM
- [ ] Acesso ao painel Vercel DNS (para alterar CNAME)

---

## Fase 1 — Criar cert ACM em us-east-1

> CloudFront exige cert em us-east-1, independente da regiao do resto da infra.

```bash
aws acm request-certificate \
  --region us-east-1 \
  --domain-name checkup.cerebroamigo.com.br \
  --validation-method DNS \
  --query CertificateArn --output text
```

Salva o ARN retornado. Depois:

```bash
aws acm describe-certificate \
  --region us-east-1 \
  --certificate-arn <ARN> \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord'
```

Retorna um CNAME assim:
```json
{
  "Name": "_abc123.checkup.cerebroamigo.com.br.",
  "Type": "CNAME",
  "Value": "_xyz789.acm-validations.aws."
}
```

**Adiciona esse CNAME no DNS da Vercel:**
- Vercel Dashboard → Domains → cerebroamigo.com.br → Add Record
- Type: `CNAME`
- Name: `_abc123.checkup` (sem o dominio base)
- Value: `_xyz789.acm-validations.aws.`

Aguarda validacao (~5 min):
```bash
watch -n 30 "aws acm describe-certificate \
  --region us-east-1 \
  --certificate-arn <ARN> \
  --query 'Certificate.Status' --output text"
# Aguarda: ISSUED
```

---

## Fase 2 — Criar secret de origem no SSM

Impede acesso direto ao EC2 bypassando o CloudFront. O Caddy valida o header.

```bash
# Gera secret aleatorio
SECRET=$(openssl rand -hex 32)

aws ssm put-parameter \
  --region sa-east-1 \
  --name /cerebro-amigo/checkup/cf-origin-secret \
  --value "$SECRET" \
  --type SecureString \
  --overwrite

echo "Secret: $SECRET"
# Salva o valor — vai configurar no Caddy no proximo passo
```

**Configura validacao no Caddy (EC2):**

Via SSM Session Manager no EC2 (`cerebro-clinical-box`):
```bash
# Edita /opt/cerebro/Caddyfile ou equivalente
# Adiciona na secao checkup.cerebroamigo.com.br:
@notcf {
  not header X-CF-Origin-Secret <SECRET_AQUI>
}
respond @notcf 403
```

Reinicia Caddy: `sudo systemctl reload caddy`

---

## Fase 3 — Deploy do stack CloudFront

```bash
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name cerebro-checkup-cf \
  --template-file infra/aws/cloudfront-checkup.yaml \
  --parameter-overrides \
    AcmCertificateArn=<ARN_DA_FASE_1> \
    OriginDomain=18.229.175.231 \
  --capabilities CAPABILITY_IAM \
  --no-fail-on-empty-changeset
```

> Deploy leva ~10 min (CloudFront propaga globalmente).

Pega o dominio CF gerado:
```bash
aws cloudformation describe-stacks \
  --region us-east-1 \
  --stack-name cerebro-checkup-cf \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomain`].OutputValue' \
  --output text
# Ex: d1abcdefg.cloudfront.net
```

---

## Fase 4 — Smoke no dominio CF (antes de mudar DNS)

```bash
CF_DOMAIN="d1abcdefg.cloudfront.net"  # substituir pelo real

# Testa via header Host (simula dominio customizado)
curl -sv -H "Host: checkup.cerebroamigo.com.br" "https://$CF_DOMAIN/" 2>&1 | grep -E "< HTTP|x-cache|server"
curl -sv -H "Host: checkup.cerebroamigo.com.br" "https://$CF_DOMAIN/depressao" 2>&1 | grep -E "< HTTP|x-cache"
curl -sv -H "Host: checkup.cerebroamigo.com.br" "https://$CF_DOMAIN/api/health" 2>&1 | grep -E "< HTTP"

# Verifica header de cache
curl -I -H "Host: checkup.cerebroamigo.com.br" "https://$CF_DOMAIN/depressao" | grep -i "x-cache\|age\|cache-control"
# Primeiro hit: x-cache: Miss from cloudfront
# Segundo hit:  x-cache: Hit from cloudfront  ← confirma cache ativo
```

---

## Fase 5 — Cutover DNS (zero-downtime)

Na Vercel DNS (zona cerebroamigo.com.br):

1. **Reduz TTL** do registro `checkup` para 60s. Aguarda TTL atual propagar (~5 min).
2. **Remove** o registro A atual (`18.229.175.231`).
3. **Adiciona** CNAME:
   - Name: `checkup`
   - Value: `d1abcdefg.cloudfront.net`
4. Aguarda 2 min.
5. `curl -I https://checkup.cerebroamigo.com.br/depressao` — confirma `x-cache: Hit from cloudfront`.

---

## Fase 6 — Smoke final

```bash
# Paginas SSG — devem cachear
for path in / /depressao /ansiedade /tdah-adulto /medico; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "https://checkup.cerebroamigo.com.br$path")
  echo "$path → $status"
done

# API — deve passar sem cache
curl -s https://checkup.cerebroamigo.com.br/api/health | python3 -m json.tool

# Fluxo critico — crise nao deve cachear
curl -I https://checkup.cerebroamigo.com.br/crise | grep -i "cache-control\|x-cache"
# Esperado: x-cache: Miss (CachingDisabled)
```

---

## Invalidar cache (apos deploy novo)

Adicionar ao job `deploy-checkup` no GitHub Actions:

```bash
DIST_ID=$(aws ssm get-parameter \
  --region sa-east-1 \
  --name /cerebro-amigo/checkup/cf-distribution-id \
  --query Parameter.Value --output text)

aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/*"
```

Salva o Distribution ID no SSM apos o deploy do stack:
```bash
DIST_ID=$(aws cloudformation describe-stacks \
  --region us-east-1 \
  --stack-name cerebro-checkup-cf \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
  --output text)

aws ssm put-parameter \
  --region sa-east-1 \
  --name /cerebro-amigo/checkup/cf-distribution-id \
  --value "$DIST_ID" \
  --type String \
  --overwrite
```

---

## Rollback

DNS volta ao A record em < 2 min:
```bash
# Vercel DNS: remove CNAME checkup, readiciona A record 18.229.175.231
```

Stack CF pode ficar desabilitado (nao deletar — evita recriar cert):
```bash
# CloudFront console: Distribution → Disable
# Ou atualizar stack com Enabled: false
```

---

## Quando ADR-045 (ASG+ALB) for provisionado

Atualizar o parametro `OriginDomain` no stack:
```bash
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name cerebro-checkup-cf \
  --template-file infra/aws/cloudfront-checkup.yaml \
  --parameter-overrides \
    AcmCertificateArn=<ARN> \
    OriginDomain=<DNS_DO_ALB> \
    OriginProtocol=https-only
```
