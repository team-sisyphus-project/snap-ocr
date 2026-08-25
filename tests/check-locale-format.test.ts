/**
 * Template Header
 * Purpose: Unit tests for the locale-format guard. Assert it flags formatting
 *   calls that omit an explicit locale (no arg / undefined / null) and leaves
 *   explicit-locale calls alone, so the guard proves it can actually fail.
 * Feature Unit: Shared
 * Customize: Add cases as new locale-less call shapes appear.
 * Depends on: Vitest; the guard's exported findLocalelessCalls.
 */

import { describe, expect, it } from "vitest";
// The guard is a plain .mjs script; import its pure detector directly.
import { findLocalelessCalls } from "../scripts/check-locale-format.mjs";

describe("findLocalelessCalls", () => {
  it("flags Intl.*Format calls with no locale argument", () => {
    const hits = findLocalelessCalls("new Intl.NumberFormat().format(1000);");
    expect(hits).toHaveLength(1);
    expect(hits[0].call).toBe("Intl.NumberFormat(");
  });

  it("flags .toLocale* calls with no locale argument", () => {
    expect(findLocalelessCalls("value.toLocaleString();")).toHaveLength(1);
    expect(findLocalelessCalls("d.toLocaleDateString();")).toHaveLength(1);
  });

  it("flags an explicit undefined/null first argument", () => {
    expect(findLocalelessCalls("d.toLocaleString(undefined, opts);")).toHaveLength(1);
    expect(findLocalelessCalls("new Intl.DateTimeFormat(null);")).toHaveLength(1);
  });

  it("accepts a string-literal locale", () => {
    expect(findLocalelessCalls('new Intl.NumberFormat("en-US").format(1);')).toEqual([]);
    expect(findLocalelessCalls('d.toLocaleDateString("en-US");')).toEqual([]);
  });

  it("accepts a locale identifier or expression", () => {
    expect(findLocalelessCalls("new Intl.DateTimeFormat(LOCALE, opts);")).toEqual([]);
    expect(findLocalelessCalls("n.toLocaleString(locales, options);")).toEqual([]);
  });

  it("ignores type references and commented-out examples", () => {
    expect(findLocalelessCalls("let o: Intl.NumberFormatOptions;")).toEqual([]);
    expect(findLocalelessCalls("// new Intl.NumberFormat().format(1)")).toEqual([]);
    expect(findLocalelessCalls("/* d.toLocaleString() */")).toEqual([]);
  });

  it("reports 1-based line and column of the offending call", () => {
    const [hit] = findLocalelessCalls("const x = 1;\n  value.toLocaleString();");
    expect(hit.line).toBe(2);
    // Column points at the matched call (the leading "." for .toLocale*).
    expect(hit.column).toBe(8);
  });
});
