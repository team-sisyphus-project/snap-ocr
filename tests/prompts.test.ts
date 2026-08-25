/**
 * Template Header
 * Purpose: Unit tests for the prompt builder. Assert isOutputFormat guards the
 *   OUTPUT_FORMATS set and buildSystemPrompt returns a non-empty prompt for
 *   every declared format.
 * Feature Unit: OCR Extraction
 * Depends on: Vitest; the exports of @/lib/prompts.
 */

import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  isOutputFormat,
  OUTPUT_FORMATS,
} from "@/lib/prompts";

describe("isOutputFormat", () => {
  it("accepts every declared format", () => {
    for (const f of OUTPUT_FORMATS) expect(isOutputFormat(f)).toBe(true);
  });
  it("rejects unknown values", () => {
    expect(isOutputFormat("html")).toBe(false);
    expect(isOutputFormat(42)).toBe(false);
    expect(isOutputFormat(undefined)).toBe(false);
  });
});

describe("buildSystemPrompt", () => {
  it("returns a non-empty prompt for every format", () => {
    for (const f of OUTPUT_FORMATS) {
      expect(buildSystemPrompt(f).length).toBeGreaterThan(50);
    }
  });

  it("includes shared OCR rules in every format", () => {
    for (const f of OUTPUT_FORMATS) {
      const p = buildSystemPrompt(f);
      expect(p).toContain("Do not invent");
    }
  });

  it("differentiates formats", () => {
    expect(buildSystemPrompt("csv")).toContain("CSV");
    expect(buildSystemPrompt("markdown")).toContain("Markdown");
    expect(buildSystemPrompt("plain")).toContain("plain text");
    expect(buildSystemPrompt("auto")).not.toContain("CSV output only");
  });
});
