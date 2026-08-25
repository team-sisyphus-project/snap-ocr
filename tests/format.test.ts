import { describe, expect, it } from "vitest";
import {
  LOCALE,
  fileTimestamp,
  formatDate,
  formatDateTime,
  formatNumber,
} from "@/lib/format";

describe("format (en-US locked)", () => {
  it("pins the locale to en-US", () => {
    expect(LOCALE).toBe("en-US");
  });

  it("formats numbers with en-US grouping and decimals", () => {
    expect(formatNumber(1234567.89)).toBe("1,234,567.89");
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(0.5, { style: "percent" })).toBe("50%");
  });

  it("formats dates with the en-US default field selection", () => {
    // UTC to keep the calendar day stable regardless of the test machine's TZ.
    const date = new Date("2026-08-25T12:00:00Z");
    expect(formatDate(date, { timeZone: "UTC" })).toBe("Aug 25, 2026");
    expect(
      formatDate(date, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }),
    ).toBe("August 25, 2026");
  });

  it("formats date-times in en-US style", () => {
    const date = new Date("2026-08-25T15:07:00Z");
    expect(
      formatDateTime(date, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "UTC",
      }),
    ).toBe("Aug 25, 2026, 3:07 PM");
  });

  it("builds a compact, filename-safe local timestamp", () => {
    const date = new Date(2026, 7, 25, 9, 4, 5); // local time
    expect(fileTimestamp(date)).toBe("20260825-090405");
  });
});
