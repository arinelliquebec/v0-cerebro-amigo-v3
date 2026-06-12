# ADR-047 — CloudFront na frente do checkup.cerebroamigo.com.br

**Status:** Proposto (IaC pronto; pendente provisioning — gated pelo Rafael)  
**Data:** 2026-06-12  
**Autores:** Rafael Arinelli

---

## Contexto

Lighthouse nas 3 landings do checkup (2026-06-12) mostrou:

| Métrica | Valor | Threshold ideal |
|---|---|---|
| LCP | 3.0–3.2 s | < 2.5 s |
| FCP | 0.9 s | < 1.8 s ✅ |
| TBT | 10–40 ms | < 200 ms ✅ |
| CLS | 0 | < 0.1 ✅ |

LCP acima do ideal porque origem está em `sa-east-1` e não há edge cache — todo request paga latência EC2 + TLS handshake completo.

O checkup é motor de aquisição orgânica (SEO). LCP é Core Web Vital que o Google usa como sinal de ranking. Melhorar de 3.0 s para < 2.5 s reduz bounces e melhora posição nas SERPs YMYL.

---

## Decisão

Adicionar CloudFront como CDN na frente do checkup:

```
checkup.cerebroamigo.com.br
        │ CNAME
        ▼
CloudFront (edge PoP São Paulo + outros)
        │ HTTPS
        ▼
EC2 clínico :443 (Caddy)         ← origin hoje
        │                         (futuro: ALB do ADR-045)
        ▼
Next.js checkup :3001
```

---

## Cache strategy

| Path | Policy | Razão |
|---|---|---|
| `/_next/static/*` | 1 ano, imutável | Hash no filename garante bust |
| `/images/*`, `/*.png`, `/*.ico` | 1 ano | Assets estáticos |
| `/depressao`, `/ansiedade`, `/tdah-adulto`, `/`, `/medico` | Respeita `Cache-Control` origin | SSG envia `s-maxage=31536000` |
| `/teste/*` | No-cache, query strings | Personalized UX |
| `/resultado*` | No-cache, query strings | `rid` único por pessoa |
| `/crise*` | No-cache | Conteúdo sensível — sem risco de servir cache desatualizado |
| `/api/*` | No-cache, forward all | Rate limit e sessão |

---

## Segurança

- Header `X-CF-Origin-Secret` em todos os requests CF → EC2. Caddy rejeita com 403 requests sem o header (impede bypass direto ao IP do EC2).
- Secret armazenado em SSM Parameter Store SecureString (`/cerebro-amigo/checkup/cf-origin-secret`).
- TLS mínimo: TLSv1.2_2021. HTTP/2+3 habilitado.

---

## Custo estimado

- CloudFront PriceClass_100 (~1.000 req/dia iniciais): < US$ 1/mês.
- ACM: gratuito.
- Invalidações: 1.000/mês gratuitas; deploy diário = ~30 invalidações.

---

## Integração com CI/CD

Após deploy de nova imagem do checkup, o job `deploy-checkup` deve criar invalidação `/*` via `aws cloudfront create-invalidation`. Distribution ID fica em SSM (`/cerebro-amigo/checkup/cf-distribution-id`).

---

## Alternativas descartadas

- **Vercel**: bloqueado — RDS em `sa-east-1` não é alcançável (ADR-046).
- **NGINX com proxy_cache no EC2**: sem benefício de edge; apenas local.
- **CloudFront + S3 export**: Next.js App Router não exporta completamente sem `output: export`; incompatível com Route Handlers (API de PDF, devolutiva IA).

---

## Consequências

- LCP esperado: 3.0 s → ~1.0 s (hit de cache no PoP SP).
- Deploy de nova imagem requer invalidação CloudFront (adicionado ao job CI).
- Quando ADR-045 (ASG+ALB) for provisionado, atualizar apenas o parâmetro `OriginDomain` no stack CF — sem recriar distribuição.
- Provisionamento: ver `docs/runbooks/cloudfront-checkup.md` e `infra/aws/cloudfront-checkup.yaml`.
