import { describe, expect, it } from "vitest";
import {
  API_KEY_PANEL,
  APP,
  DROPZONE,
  FORMAT_SELECTOR,
  HOME,
  MESSAGES,
  RESULT_PANEL,
  STRINGS,
  VALIDATION,
} from "@/lib/strings";

// Matches any Hangul syllable / Jamo — used to assert the catalog is English.
const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힣]/;

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    out.push(value);
  } else if (typeof value === "function") {
    // Exercise builder functions with representative arguments.
    out.push((value as (...a: unknown[]) => string)("Sample", 1));
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectStrings(v, out);
  }
}

describe("strings catalog", () => {
  it("exposes every group through the STRINGS namespace", () => {
    expect(STRINGS.APP).toBe(APP);
    expect(STRINGS.HOME).toBe(HOME);
    expect(STRINGS.API_KEY_PANEL).toBe(API_KEY_PANEL);
    expect(STRINGS.FORMAT_SELECTOR).toBe(FORMAT_SELECTOR);
    expect(STRINGS.DROPZONE).toBe(DROPZONE);
    expect(STRINGS.RESULT_PANEL).toBe(RESULT_PANEL);
    expect(STRINGS.MESSAGES).toBe(MESSAGES);
    expect(STRINGS.VALIDATION).toBe(VALIDATION);
  });

  it("contains no Korean Display Strings (English-only catalog)", () => {
    const all: string[] = [];
    collectStrings(STRINGS, all);
    expect(all.length).toBeGreaterThan(0);
    const withHangul = all.filter((s) => HANGUL.test(s));
    expect(withHangul).toEqual([]);
  });

  it("keeps the product name and core actions in English", () => {
    expect(APP.name).toBe("SnapOCR");
    expect(HOME.extract).toBe("Extract text");
    expect(HOME.extracting).toBe("Extracting…");
  });

  it("builds parameterized strings correctly", () => {
    expect(API_KEY_PANEL.keyInputLabel("Claude (Anthropic)")).toBe(
      "Claude (Anthropic) API key",
    );
    expect(DROPZONE.thumbAlt(1)).toBe("Image 1 — click to enlarge");
    expect(RESULT_PANEL.compareImageAlt(3)).toBe("Image 3");
    expect(VALIDATION.tooManyImages(10)).toBe(
      "You can process up to 10 images.",
    );
    expect(VALIDATION.tooLarge(5)).toBe("Each image must be 5MB or smaller.");
  });

  it("routes injected counts/sizes through en-US number formatting", () => {
    // Small values are unchanged, so the human-readable wording is preserved.
    expect(DROPZONE.constraints(10, 5)).toBe(
      "PNG · JPEG · WebP · GIF, up to 5MB each, 10 images max.",
    );
    // Large values pick up en-US grouping — proof the number goes through
    // formatNumber rather than a raw template-literal injection.
    expect(DROPZONE.constraints(1000, 1500)).toBe(
      "PNG · JPEG · WebP · GIF, up to 1,500MB each, 1,000 images max.",
    );
    expect(VALIDATION.tooManyImages(1000)).toBe(
      "You can process up to 1,000 images.",
    );
    expect(VALIDATION.tooLarge(1024)).toBe(
      "Each image must be 1,024MB or smaller.",
    );
  });

  it("covers every output-format label", () => {
    expect(FORMAT_SELECTOR.labels).toEqual({
      auto: "Auto",
      plain: "Plain text",
      markdown: "Markdown",
      csv: "Table (CSV)",
    });
  });

  it("provides distinct client, route, and engine error messages", () => {
    expect(MESSAGES.enterApiKey).toBe("Please enter your API key.");
    expect(MESSAGES.invalidRequest).toBe("Invalid request.");
    expect(MESSAGES.invalidApiKey).toBe(
      "Your API key is invalid. Please check it.",
    );
    expect(MESSAGES.streamInterrupted.startsWith("\n[")).toBe(true);
  });
});
