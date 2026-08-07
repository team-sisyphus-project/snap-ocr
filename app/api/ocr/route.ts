import { isOutputFormat } from "@/lib/prompts";
import { isProviderId } from "@/lib/providers";
import { ENGINES, ProviderError, type OcrImage } from "@/lib/ocr-engines";
import { validateImages, base64ByteLength } from "@/lib/validate";

export const runtime = "nodejs";
export const maxDuration = 300;

// SECURITY: request bodies carry user API keys — never log the body or the key.

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

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
    return jsonError(400, "잘못된 요청입니다.");
  }

  const provider = body.provider;
  if (!isProviderId(provider)) {
    return jsonError(400, "지원하지 않는 공급자입니다.");
  }

  const format = body.format;
  if (!isOutputFormat(format)) {
    return jsonError(400, "지원하지 않는 출력 포맷입니다.");
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

  // 첫 청크 전 실패(인증·한도·요청 오류)는 HTTP 상태 코드로 매핑한다.
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
        // 스트림 도중 실패 — 상태 코드는 이미 200이므로 본문에 안내를 덧붙인다.
        console.error(
          "[/api/ocr] stream error:",
          err instanceof Error ? err.message : "unknown",
        );
        controller.enqueue(
          encoder.encode("\n[오류가 발생했습니다. 다시 시도해 주세요.]"),
        );
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

function mapEngineError(err: unknown): Response {
  if (err instanceof ProviderError) {
    return jsonError(err.status, err.message);
  }
  console.error(
    "[/api/ocr] error:",
    err instanceof Error ? err.message : "unknown",
  );
  return jsonError(500, "알 수 없는 오류가 발생했습니다.");
}
