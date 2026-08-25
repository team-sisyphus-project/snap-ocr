/**
 * Template Header
 * Purpose: Unit tests for the Korean-residue guard. Assert it flags Hangul in a
 *   live code line, ignores Hangul inside a stripped comment, and reports zero
 *   offenders for clean English input — so the guard proves it can actually fail.
 * Feature Unit: Shared
 * Customize: Add cases as new Hangul residue shapes appear.
 * Depends on: Vitest; the guard's exported findKoreanResidue.
 */

import { describe, expect, it } from "vitest";
// The guard is a plain .mjs script; import its pure detector directly.
import { findKoreanResidue } from "../scripts/check-korean-residue.mjs";

describe("findKoreanResidue", () => {
  it("flags Hangul in a code line", () => {
    const hits = findKoreanResidue('const label = "업로드";');
    expect(hits).toHaveLength(1);
    expect(hits[0].line).toBe(1);
    expect(hits[0].text).toBe('const label = "업로드";');
  });

  it("does not flag Hangul inside a stripped line comment", () => {
    expect(findKoreanResidue("const label = \"Upload\"; // 업로드 라벨")).toEqual([]);
  });

  it("does not flag Hangul inside a stripped block comment", () => {
    expect(findKoreanResidue("/* 번역 노트: Upload */\nconst label = \"Upload\";")).toEqual([]);
  });

  it("returns zero offenders for clean English input", () => {
    expect(findKoreanResidue('const label = "Upload";\nexport const title = "OCR";')).toEqual([]);
  });

  it("reports the 1-based line of each offending line", () => {
    const hits = findKoreanResidue('const a = 1;\nconst b = "취소";');
    expect(hits).toHaveLength(1);
    expect(hits[0].line).toBe(2);
  });
});
