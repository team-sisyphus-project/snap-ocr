/**
 * Template Header
 * Purpose: Server-only OCR engines, one per provider (see the lib/providers.ts
 *   registry). Each engine streams the extracted, cleaned-up text as chunks;
 *   failures before the first chunk throw ProviderError so the route can map
 *   them to HTTP status codes.
 * Feature Unit: OCR Extraction
 * Customize: Add a provider engine to the ENGINES map (keyed by provider id),
 *   or change model parameters (e.g. max_tokens) and the request shape per
 *   provider. Error → HTTP status mapping lives in the map*Error helpers.
 * Depends on: the @anthropic-ai/sdk package and the Gemini REST/SSE endpoint;
 *   the ANTHROPIC_API_KEY env var (server fallback for Claude); the prompts,
 *   providers, validate, and strings modules.
 * SECURITY: API keys are used per-request only — never stored, never logged.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  buildSystemPrompt,
  USER_INSTRUCTION,
  type OutputFormat,
} from "@/lib/prompts";
import { getProviderMeta, type ProviderId } from "@/lib/providers";
import type { MediaType } from "@/lib/validate";
import { MESSAGES } from "@/lib/strings";

/** Error carrying the HTTP status the route should return for a provider failure. */
export class ProviderError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type OcrImage = { data: string; mediaType: string };
export type EngineArgs = {
  apiKey?: string;
  images: OcrImage[];
  format: OutputFormat;
};
export type OcrEngine = (args: EngineArgs) => AsyncGenerator<string>;

const MSG_NO_KEY = MESSAGES.enterApiKey;
const MSG_BAD_KEY = MESSAGES.invalidApiKey;
const MSG_TRANSIENT = MESSAGES.temporaryError;

// --- Anthropic ---

/** Map an Anthropic SDK error to a ProviderError with the right HTTP status + message. */
function mapAnthropicError(err: unknown): ProviderError {
  if (err instanceof Anthropic.APIError) {
    const status = (err as { status?: number }).status;
    if (status === 401 || status === 403) return new ProviderError(401, MSG_BAD_KEY);
    if (status === 429) return new ProviderError(429, MESSAGES.rateLimited);
    return new ProviderError(503, MSG_TRANSIENT);
  }
  return new ProviderError(500, MESSAGES.unknownError);
}

/** Stream OCR text from Claude for the given images and format (Anthropic SDK). */
async function* anthropicEngine({
  apiKey,
  images,
  format,
}: EngineArgs): AsyncGenerator<string> {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) throw new ProviderError(401, MSG_NO_KEY);

  const client = new Anthropic({ apiKey: key });
  const stream = client.messages.stream({
    model: getProviderMeta("anthropic").model,
    max_tokens: 16000,
    system: buildSystemPrompt(format),
    messages: [
      {
        role: "user",
        content: [
          ...images.map((img) => ({
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: img.mediaType as MediaType,
              data: img.data,
            },
          })),
          { type: "text" as const, text: USER_INSTRUCTION },
        ],
      },
    ],
  });

  try {
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") {
      yield MESSAGES.imageNotProcessable;
    } else if (final.stop_reason === "max_tokens") {
      yield MESSAGES.outputTruncated;
    }
  } catch (err) {
    throw mapAnthropicError(err);
  }
}

// --- Gemini (REST, SSE) ---

/** Map a Gemini HTTP status to a ProviderError with the right status + message. */
function mapGeminiError(status: number): ProviderError {
  if (status === 429) {
    return new ProviderError(429, MESSAGES.freeQuotaExceeded);
  }
  if (status === 400 || status === 401 || status === 403) {
    return new ProviderError(401, MSG_BAD_KEY);
  }
  return new ProviderError(503, MSG_TRANSIENT);
}

/** Stream OCR text from Gemini for the given images and format (REST + SSE). */
async function* geminiEngine({
  apiKey,
  images,
  format,
}: EngineArgs): AsyncGenerator<string> {
  if (!apiKey) throw new ProviderError(401, MSG_NO_KEY);

  const model = getProviderMeta("gemini").model;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Key goes in a header only — never in the URL (avoids log exposure).
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt(format) }] },
        contents: [
          {
            role: "user",
            parts: [
              ...images.map((img) => ({
                inlineData: { mimeType: img.mediaType, data: img.data },
              })),
              { text: USER_INSTRUCTION },
            ],
          },
        ],
      }),
    },
  );

  if (!res.ok || !res.body) {
    throw mapGeminiError(res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === "[DONE]") continue;
      let parsed: {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      try {
        parsed = JSON.parse(payload);
      } catch {
        continue;
      }
      for (const part of parsed.candidates?.[0]?.content?.parts ?? []) {
        if (part.text) yield part.text;
      }
    }
  }
}

/** Provider id → engine lookup used by the API route to dispatch a request. */
export const ENGINES: Record<ProviderId, OcrEngine> = {
  anthropic: anthropicEngine,
  gemini: geminiEngine,
};
