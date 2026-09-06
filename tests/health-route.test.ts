/**
 * Template Header
 * Purpose: Unit tests for the health route. Assert GET answers 200 with the
 *   JSON liveness payload, marks the response uncacheable, and stays green
 *   with every optional environment variable unset.
 * Feature Unit: Shared
 * Depends on: Vitest; @/app/api/health/route.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { GET, dynamic, runtime } from "@/app/api/health/route";

const OPTIONAL_ENV = ["ANTHROPIC_API_KEY", "PORT"] as const;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const key of OPTIONAL_ENV) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of OPTIONAL_ENV) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("GET /api/health", () => {
  it("answers 200 with the liveness payload when no optional env is set", async () => {
    const res = GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", service: "snapocr" });
  });

  it("returns JSON and forbids caching so a stale body cannot report liveness", () => {
    const res = GET();

    expect(res.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("runs on the Node runtime and is never prerendered", () => {
    expect(runtime).toBe("nodejs");
    expect(dynamic).toBe("force-dynamic");
  });
});
