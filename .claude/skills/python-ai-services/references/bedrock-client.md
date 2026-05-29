# Client Bedrock — migração do LLM (Anthropic API → AWS Bedrock In-Region)

Referência detalhada da mudança central do V3. Leia ao trocar o client de LLM, configurar região/IAM, ou portar orchestrator-py/agents-py do V2.

## Decisão (ADR-008)

- **Bedrock In-Region em `sa-east-1`.** Haiku, Sonnet e Opus 4.7 confirmados na região da conta.
- **Sem `ANTHROPIC_API_KEY`.** Auth por **IAM role** da EC2 (SigV4 automático). Dev: `AWS_PROFILE`.
- Dado de inferência **não sai do Brasil** → ideal LGPD, sem transferência internacional, sem cross-region.
- Mesma Messages API → migração é trocar o client, não o fluxo.

## Opção A — SDK da Anthropic com backend Bedrock (recomendado: menor diff)

Mantém a interface `messages.create(...)` que o código do V2 já usa.

```python
# pip install "anthropic[bedrock]"
from anthropic import AnthropicBedrock

client = AnthropicBedrock(
    aws_region="sa-east-1",   # BEDROCK_REGION
    # sem api_key: credenciais resolvidas via IAM role (prod) / AWS_PROFILE (dev)
)

resp = client.messages.create(
    model=os.environ["BEDROCK_MODEL_SONNET"],   # ex.: id/inference-profile do Sonnet em Bedrock
    max_tokens=1024,
    messages=[{"role": "user", "content": prompt}],
)
texto = resp.content[0].text
```

Streaming (orchestrator-py, SSE):

```python
with client.messages.stream(
    model=os.environ["BEDROCK_MODEL_SONNET"],
    max_tokens=1024,
    messages=msgs,
) as stream:
    for chunk in stream.text_stream:
        yield chunk          # repassado por SSE → proxy no api-gateway
```

## Opção B — boto3 puro (se quiser zero dependência Anthropic)

```python
import boto3, json
rt = boto3.client("bedrock-runtime", region_name="sa-east-1")
resp = rt.invoke_model(
    modelId=os.environ["BEDROCK_MODEL_SONNET"],
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1024,
    }),
)
texto = json.loads(resp["body"].read())["content"][0]["text"]
```

Prefira a Opção A: reaproveita o código do V2 quase sem mudança e mantém paridade de features da Messages API.

## Variáveis de ambiente

```
AWS_REGION=sa-east-1
BEDROCK_REGION=sa-east-1          # separada por higiene; hoje = AWS_REGION
BEDROCK_MODEL_HAIKU=<id/profile do Haiku no Bedrock>
BEDROCK_MODEL_SONNET=<id/profile do Sonnet no Bedrock>
BEDROCK_MODEL_OPUS=<id/profile do Opus 4.7 no Bedrock>   # opcional
# REMOVIDAS: ANTHROPIC_API_KEY, MODEL_HAIKU, MODEL_SONNET (Anthropic), AZURE_*
```

Os IDs exatos dos modelos no Bedrock devem ser confirmados na conta:
`aws bedrock list-foundation-models --region sa-east-1` (ou via inference profiles, se a conta usar). Não chumbe IDs no código — leia do ambiente.

## IAM role (EC2)

A instância precisa de permissão de invocação. Política mínima:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
    "Resource": "*"
  }]
}
```

Restrinja `Resource` aos ARNs dos modelos usados quando possível. Em prod, **nenhuma chave** no `.env` para o LLM — só a role anexada à EC2. Em dev local, `AWS_PROFILE` aponta para credenciais locais.

## Checklist de migração

1. `pip install "anthropic[bedrock]"` (ou boto3).
2. Trocar o construtor do client para `AnthropicBedrock(aws_region=...)`.
3. Trocar referências de modelo para ler `BEDROCK_MODEL_*` do ambiente.
4. Remover `ANTHROPIC_API_KEY` do código, `.env` e CI.
5. Criar/anexar IAM role com `bedrock:InvokeModel*` na EC2.
6. Confirmar IDs com `list-foundation-models` em sa-east-1.
7. Validar streaming (SSE) ponta a ponta: orchestrator → gateway proxy → cliente.
8. Manter `crisis_copy.py` literal e gates de SHADOW_MODE intactos (ver `clinical-safety`).
9. Confirmar `PII_REDACTION_ENABLED=true` no LangSmith.
10. Atualizar/gravar ADR-008.
