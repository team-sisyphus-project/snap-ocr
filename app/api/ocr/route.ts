/**
 * Template Header
 * Purpose: OCR API route. Validates the request (provider, format, images),
 *   dispatches to the matching server engine, and streams the extracted text
 *   back as text/plain. Pre-stream failures become JSON error responses; a
 *   mid-stream failure appends a notice to the body.
 * Feature Unit: OCR Extraction
 * Customize: The request/response contract lives here; provider engines and
 *   their error→status mapping live in lib/ocr-engines.ts, and all user-facing
 *   messages come from the MESSAGES group in lib/strings.ts. maxDuration bounds
 *   how long a stream may run.
 * Depends on: the ocr-engines, prompts, providers, validate, and strings
 *   modules; the Node.js runtime.
 * SECURITY: request bodies carry user API keys — never log the body or the key.
 */

import { isOutputFormat } from "@/lib/prompts";
import { isProviderId } from "@/lib/providers";
import { ENGINES, ProviderError, type OcrImage } from "@/lib/ocr-engines";
import { validateImages, base64ByteLength } from "@/lib/validate";
import { MESSAGES } from "@/lib/strings";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Build a JSON error response with the given status and message. */
function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/** POST /api/ocr — validate input, dispatch to the engine, and stream the extracted text. */
export async function POST(req: Request): Promise<Response> {
  let body: {
    images?: OcrImage[];
    format?: unknown;
    provider?: unknown;
    apiKey?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, MESSAGES.invalidRequest);
  }

  const provider = body.provider;
  if (!isProviderId(provider)) {
    return jsonError(400, MESSAGES.unsupportedProvider);
  }

  const format = body.format;
  if (!isOutputFormat(format)) {
    return jsonError(400, MESSAGES.unsupportedFormat);
  }

  const images = Array.isArray(body.images) ? body.images : [];
  const validationError = validateImages(
    images.map((img) => ({
      sizeBytes: base64ByteLength(img.data ?? ""),
      mediaType: img.mediaType,
    })),
  );
  if (validationError) {
    return jsonError(400, validationError.message);
  }

  const apiKey =
    typeof body.apiKey === "string" && body.apiKey.trim().length > 0
      ? body.apiKey.trim()
      : undefined;

  const engine = ENGINES[provider];
  const gen = engine({ apiKey, images, format });

  // Failures before the first chunk (auth, quota, request errors) map to HTTP status codes.
  let first: IteratorResult<string>;
  try {
    first = await gen.next();
  } catch (err) {
    return mapEngineError(err);
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done && first.value) {
          controller.enqueue(encoder.encode(first.value));
        }
        if (!first.done) {
          for (;;) {
            const { done, value } = await gen.next();
            if (done) break;
            if (value) controller.enqueue(encoder.encode(value));
          }
        }
      } catch (err) {
        // Mid-stream failure — the status is already 200, so append a notice to the body.
        console.error(
          "[/api/ocr] stream error:",
          err instanceof Error ? err.message : "unknown",
        );
        controller.enqueue(encoder.encode(MESSAGES.streamInterrupted));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** Map a pre-stream engine failure to a JSON error response (known status, or 500). */
function mapEngineError(err: unknown): Response {
  if (err instanceof ProviderError) {
    return jsonError(err.status, err.message);
  }
  console.error(
    "[/api/ocr] error:",
    err instanceof Error ? err.message : "unknown",
  );
  return jsonError(500, MESSAGES.unknownError);
}
