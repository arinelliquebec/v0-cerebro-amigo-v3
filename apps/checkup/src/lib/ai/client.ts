import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic | null {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  // timeout/maxRetries explícitos: defaults do SDK (~10min, 2 retries) somados ao retry
  // manual em devolutiva.ts amplificam custo/latência numa superfície pública.
  _client = new Anthropic({ apiKey, timeout: 15000, maxRetries: 1 });
  return _client;
}

export const HAIKU_MODEL = process.env.ANTHROPIC_MODEL_HAIKU ?? "claude-haiku-4-5";
