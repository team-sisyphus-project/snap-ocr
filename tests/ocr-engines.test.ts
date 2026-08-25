/**
 * Template Header
 * Purpose: Unit tests for the OCR engine layer against a mocked Anthropic SDK.
 *   Assert engines stream extracted text and map provider failures to
 *   ProviderError.
 * Feature Unit: OCR Extraction
 * Depends on: Vitest; @/lib/ocr-engines; a mocked @anthropic-ai/sdk.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// --- Anthropic SDK mock ---
const { streamMock, ctorMock } = vi.hoisted(() => ({
  streamMock: vi.fn(),
  ctorMock: vi.fn(),
}));
vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error {
    status: number;
    constructor(status: number) {
      super("api error");
      this.status = status;
    }
  }
  class MockAnthropic {
    messages = { stream: streamMock };
    constructor(opts: unknown) {
      ctorMock(opts);
    }
    static APIError = APIError;
    static RateLimitError = class extends APIError {
      constructor() {
        super(429);
      }
    };
  }
  return { default: MockAnthropic };
});

import { ENGINES, ProviderError } from "@/lib/ocr-engines";

async function collect(gen: AsyncGenerator<string>): Promise<string> {
  let out = "";
  for await (const chunk of gen) out += chunk;
  return out;
}

function fakeAnthropicStream(chunks: string[], stopReason = "end_turn") {
  return {
    async *[Symbol.asyncIterator]() {
      for (const text of chunks) {
        yield { type: "content_block_delta", delta: { type: "text_delta", text } };
      }
    },
    finalMessage: async () => ({ stop_reason: stopReason }),
  };
}

const IMAGES = [{ data: "aGVsbG8=", mediaType: "image/png" }];

beforeEach(() => {
  streamMock.mockReset();
  ctorMock.mockReset();
  delete process.env.ANTHROPIC_API_KEY;
});

describe("anthropic engine", () => {
  it("throws 401 ProviderError when no key and no env fallback", async () => {
    const gen = ENGINES.anthropic({ images: IMAGES, format: "auto" });
    await expect(gen.next()).rejects.toMatchObject({ status: 401 });
  });

  it("falls back to ANTHROPIC_API_KEY env var", async () => {
    process.env.ANTHROPIC_API_KEY = "env-key";
    streamMock.mockReturnValue(fakeAnthropicStream(["ok"]));
    const text = await collect(ENGINES.anthropic({ images: IMAGES, format: "auto" }));
    expect(text).toBe("ok");
    expect(ctorMock).toHaveBeenCalledWith({ apiKey: "env-key" });
  });

  it("prefers the request apiKey over env", async () => {
    process.env.ANTHROPIC_API_KEY = "env-key";
    streamMock.mockReturnValue(fakeAnthropicStream(["ok"]));
    await collect(ENGINES.anthropic({ apiKey: "ui-key", images: IMAGES, format: "auto" }));
    expect(ctorMock).toHaveBeenCalledWith({ apiKey: "ui-key" });
  });

  it("streams deltas and appends refusal notice", async () => {
    streamMock.mockReturnValue(fakeAnthropicStream([], "refusal"));
    const text = await collect(
      ENGINES.anthropic({ apiKey: "k", images: IMAGES, format: "auto" }),
    );
    expect(text).toContain("cannot be processed");
  });

  it("uses claude model and passes image blocks", async () => {
    streamMock.mockReturnValue(fakeAnthropicStream(["x"]));
    await collect(ENGINES.anthropic({ apiKey: "k", images: IMAGES, format: "csv" }));
    const args = streamMock.mock.calls[0][0];
    expect(args.model).toBe("claude-opus-5");
    expect(args.system).toContain("CSV");
    expect(args.messages[0].content[0]).toMatchObject({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: "aGVsbG8=" },
    });
  });
});

// --- Gemini fetch mock ---
function sseBody(payloads: object[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const p of payloads) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(p)}\n\n`));
      }
      controller.close();
    },
  });
}

function geminiChunk(text: string) {
  return { candidates: [{ content: { parts: [{ text }] } }] };
}

describe("gemini engine", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws 401 ProviderError when no apiKey", async () => {
    const gen = ENGINES.gemini({ images: IMAGES, format: "auto" });
    await expect(gen.next()).rejects.toMatchObject({ status: 401 });
  });

  it("sends key via header (never in URL) and parses SSE text", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      body: sseBody([geminiChunk("안녕"), geminiChunk("하세요")]),
    });
    const text = await collect(
      ENGINES.gemini({ apiKey: "g-key", images: IMAGES, format: "auto" }),
    );
    expect(text).toBe("안녕하세요");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("gemini-2.5-flash");
    expect(String(url)).not.toContain("g-key");
    expect(init.headers["x-goog-api-key"]).toBe("g-key");
    const body = JSON.parse(init.body);
    expect(body.contents[0].parts[0]).toMatchObject({
      inlineData: { mimeType: "image/png", data: "aGVsbG8=" },
    });
    expect(body.systemInstruction.parts[0].text).toContain("OCR");
  });

  it("maps 429 to the free-tier limit message", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429, body: null });
    const gen = ENGINES.gemini({ apiKey: "g", images: IMAGES, format: "auto" });
    await expect(gen.next()).rejects.toMatchObject({
      status: 429,
      message: expect.stringContaining("free usage limit"),
    });
  });

  it("maps 400/403 to an invalid-key message", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, body: null });
    const gen = ENGINES.gemini({ apiKey: "g", images: IMAGES, format: "auto" });
    await expect(gen.next()).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining("invalid"),
    });
  });

  it("maps 5xx to a transient error", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, body: null });
    const gen = ENGINES.gemini({ apiKey: "g", images: IMAGES, format: "auto" });
    await expect(gen.next()).rejects.toMatchObject({ status: 503 });
  });
});

describe("ProviderError", () => {
  it("carries status and message", () => {
    const e = new ProviderError(429, "msg");
    expect(e.status).toBe(429);
    expect(e.message).toBe("msg");
    expect(e).toBeInstanceOf(Error);
  });
});
