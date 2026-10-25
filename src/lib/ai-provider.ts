/**
 * Server-only OpenAI-compatible chat-completions adapter.
 *
 * This module must only be imported by server components or route handlers.
 * It reads secrets from process.env and never sends configuration to the
 * browser. No request, response or prompt content is logged here.
 */

import type { CoachChatCompletionMessage } from "@/lib/coach";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_TIMEOUT_MS = 20_000;
const MIN_TIMEOUT_MS = 5_000;
const MAX_TIMEOUT_MS = 45_000;
const MAX_MODEL_LENGTH = 120;

export type AiProviderConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  endpoint: string;
};

export type AiProviderErrorCode =
  | "timeout"
  | "rate_limited"
  | "unauthorized"
  | "provider_error"
  | "invalid_response";

export class AiProviderError extends Error {
  code: AiProviderErrorCode;

  constructor(code: AiProviderErrorCode, message: string) {
    super(message);
    this.name = "AiProviderError";
    this.code = code;
  }
}

function parseTimeout(value: string | undefined): number {
  if (!value) return DEFAULT_TIMEOUT_MS;

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return DEFAULT_TIMEOUT_MS;

  return Math.min(Math.max(Math.round(parsed), MIN_TIMEOUT_MS), MAX_TIMEOUT_MS);
}

function normalizeBaseUrl(value: string | undefined): string | null {
  const raw = value?.trim() || DEFAULT_BASE_URL;

  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.username || url.password) return null;

  const isLocal =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]";

  if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) {
    return null;
  }

  url.hash = "";
  url.search = "";

  return url.toString().replace(/\/+$/, "");
}

function buildEndpoint(baseUrl: string): string {
  return baseUrl.endsWith("/chat/completions")
    ? baseUrl
    : `${baseUrl}/chat/completions`;
}

export function getAiProviderConfig(): AiProviderConfig | null {
  const apiKey = process.env.AI_PROVIDER_API_KEY?.trim();
  const model = process.env.AI_PROVIDER_MODEL?.trim();
  const baseUrl = normalizeBaseUrl(process.env.AI_PROVIDER_BASE_URL);

  if (!apiKey || !model || !baseUrl) return null;
  if (model.length > MAX_MODEL_LENGTH) return null;
  if (!/^[A-Za-z0-9._:/-]+$/.test(model)) return null;

  return {
    apiKey,
    baseUrl,
    model,
    timeoutMs: parseTimeout(process.env.AI_PROVIDER_TIMEOUT_MS),
    endpoint: buildEndpoint(baseUrl),
  };
}

export function isAiProviderConfigured(): boolean {
  return getAiProviderConfig() !== null;
}

type ChatCompletionOptions = {
  messages: CoachChatCompletionMessage[];
  maxTokens?: number;
  temperature?: number;
};

function extractContent(value: unknown): string | null {
  if (typeof value === "string") {
    const content = value.trim();
    return content || null;
  }

  if (!Array.isArray(value)) return null;

  const parts: string[] = [];

  for (const part of value) {
    if (
      typeof part === "object" &&
      part !== null &&
      "text" in part &&
      typeof part.text === "string"
    ) {
      const text = part.text.trim();
      if (text) parts.push(text);
    }
  }

  const content = parts.join("\n").trim();

  return content || null;
}

export async function createChatCompletion(
  config: AiProviderConfig,
  {
    messages,
    maxTokens = 700,
    temperature = 0.3,
  }: ChatCompletionOptions,
): Promise<string> {
  let response: Response;

  try {
    response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      throw new AiProviderError(
        "timeout",
        "The AI provider took too long to respond.",
      );
    }

    throw new AiProviderError(
      "provider_error",
      "The AI provider could not be reached.",
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new AiProviderError(
      "unauthorized",
      "The AI provider rejected its configured credentials.",
    );
  }

  if (response.status === 429) {
    throw new AiProviderError(
      "rate_limited",
      "The AI provider is temporarily rate limited.",
    );
  }

  if (!response.ok) {
    throw new AiProviderError(
      "provider_error",
      "The AI provider returned an unsuccessful response.",
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new AiProviderError(
      "invalid_response",
      "The AI provider returned an unreadable response.",
    );
  }

  if (typeof data !== "object" || data === null || !("choices" in data)) {
    throw new AiProviderError(
      "invalid_response",
      "The AI provider response did not contain an answer.",
    );
  }

  const choices = data.choices;

  if (!Array.isArray(choices) || choices.length === 0) {
    throw new AiProviderError(
      "invalid_response",
      "The AI provider response did not contain an answer.",
    );
  }

  const first = choices[0];

  if (
    typeof first !== "object" ||
    first === null ||
    !("message" in first) ||
    typeof first.message !== "object" ||
    first.message === null ||
    !("content" in first.message)
  ) {
    throw new AiProviderError(
      "invalid_response",
      "The AI provider response did not contain an answer.",
    );
  }

  const content = extractContent(first.message.content);

  if (!content) {
    throw new AiProviderError(
      "invalid_response",
      "The AI provider returned an empty answer.",
    );
  }

  return content.slice(0, 8_000);
}

export function normalizeProviderAnswer(value: string): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, 8_000);
}
