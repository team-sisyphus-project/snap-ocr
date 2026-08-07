import { describe, it, expect, vi, beforeEach } from "vitest";

// 엔진 계층 mock — 라우트는 디스패치·검증·에러 변환만 책임진다
const { engineMock } = vi.hoisted(() => ({ engineMock: vi.fn() }));
vi.mock("@/lib/ocr-engines", () => {
  class ProviderError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return {
    ProviderError,
    ENGINES: { anthropic: engineMock, gemini: engineMock },
  };
});

import { POST } from "@/app/api/ocr/route";
import { ProviderError } from "@/lib/ocr-engines";

const validBody = {
  images: [{ data: "aGVsbG8=", mediaType: "image/png" }],
  format: "auto",
  provider: "gemini",
  apiKey: "test-key",
};

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function* yielding(chunks: string[]) {
  for (const c of chunks) yield c;
}

// eslint-disable-next-line require-yield
async function* throwing(err: Error): AsyncGenerator<string> {
  throw err;
}

async function* throwingAfter(chunks: string[], err: Error): AsyncGenerator<string> {
  for (const c of chunks) yield c;
  throw err;
}

beforeEach(() => {
  engineMock.mockReset();
});

describe("POST /api/ocr", () => {
  it("rejects invalid JSON with 400", async () => {
    const res = await POST(
      new Request("http://localhost/api/ocr", { method: "POST", body: "not-json" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects unknown provider with 400", async () => {
    const res = await POST(makeRequest({ ...validBody, provider: "openai" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(typeof json.error).toBe("string");
  });

  it("rejects unknown format with 400", async () => {
    const res = await POST(makeRequest({ ...validBody, format: "html" }));
    expect(res.status).toBe(400);
  });

  it("rejects empty image list with 400", async () => {
    const res = await POST(makeRequest({ ...validBody, images: [] }));
    expect(res.status).toBe(400);
  });

  it("streams engine output on success", async () => {
    engineMock.mockReturnValue(yielding(["안녕", "하세요"]));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    expect(await res.text()).toBe("안녕하세요");
  });

  it("passes apiKey, images and format to the engine", async () => {
    engineMock.mockReturnValue(yielding(["x"]));
    await POST(makeRequest(validBody)).then((r) => r.text());
    expect(engineMock).toHaveBeenCalledWith({
      apiKey: "test-key",
      images: validBody.images,
      format: "auto",
    });
  });

  it("omits apiKey when blank", async () => {
    engineMock.mockReturnValue(yielding(["x"]));
    await POST(makeRequest({ ...validBody, apiKey: "  " })).then((r) => r.text());
    expect(engineMock.mock.calls[0][0].apiKey).toBeUndefined();
  });

  it("maps a pre-stream ProviderError to its HTTP status", async () => {
    engineMock.mockReturnValue(throwing(new ProviderError(429, "무료 사용량 한도에 도달했습니다.")));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toContain("무료 사용량 한도");
  });

  it("appends a Korean notice on mid-stream failure", async () => {
    engineMock.mockReturnValue(
      throwingAfter(["부분"], new ProviderError(503, "transient")),
    );
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("부분");
    expect(text).toContain("오류가 발생했습니다");
  });
});
