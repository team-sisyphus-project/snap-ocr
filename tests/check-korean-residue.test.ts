/**
 * Template Header
 * Purpose: Unit tests for the Korean-residue guard. Assert it flags Hangul in a
 *   live code line, ignores Hangul inside a stripped comment, and reports zero
 *   offenders for clean English input — so the guard proves it can actually fail.
 * Feature Unit: Shared
 * Customize: Add cases as new Hangul residue shapes appear. Write Hangul
 *   fixtures as \uXXXX escapes so this file itself stays free of literal Hangul.
 * Depends on: Vitest; the guard's exported findKoreanResidue.
 */

import { describe, expect, it } from "vitest";
// The guard is a plain .mjs script; import its pure detector directly.
import { findKoreanResidue } from "../scripts/check-korean-residue.mjs";

describe("findKoreanResidue", () => {
  it("flags Hangul in a code line", () => {
    const hits = findKoreanResidue('const label = "\uC5C5\uB85C\uB4DC";');
    expect(hits).toHaveLength(1);
    expect(hits[0].line).toBe(1);
    expect(hits[0].text).toBe('const label = "\uC5C5\uB85C\uB4DC";');
  });

  it("does not flag Hangul inside a stripped line comment", () => {
    expect(findKoreanResidue("const label = \"Upload\"; // \uC5C5\uB85C\uB4DC \uB77C\uBCA8")).toEqual([]);
  });

  it("does not flag Hangul inside a stripped block comment", () => {
    expect(findKoreanResidue("/* \uBC88\uC5ED \uB178\uD2B8: Upload */\nconst label = \"Upload\";")).toEqual([]);
  });

  it("returns zero offenders for clean English input", () => {
    expect(findKoreanResidue('const label = "Upload";\nexport const title = "OCR";')).toEqual([]);
  });

  it("reports the 1-based line of each offending line", () => {
    const hits = findKoreanResidue('const a = 1;\nconst b = "\uCDE8\uC18C";');
    expect(hits).toHaveLength(1);
    expect(hits[0].line).toBe(2);
  });
});
