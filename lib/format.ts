/**
 * Template Header
 * Purpose: en-US-locked date and number formatting helpers. Every user-facing
 *   date/number in the UI goes through here so formatting stays consistent and
 *   locale-independent of the server or browser environment.
 * Feature Unit: Shared
 * Customize: Change LOCALE to re-target date/number formatting to another
 *   region. Everything below reads it, so one edit re-locales the whole UI.
 * Depends on: the runtime Intl API (Intl.DateTimeFormat / Intl.NumberFormat).
 */

/**
 * The single display locale for the app. Pinned explicitly so output never
 * depends on the server or browser default locale.
 */
export const LOCALE = "en-US" as const;

/** Format a number using en-US grouping/decimals (e.g. 1234567.89 → "1,234,567.89"). */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(LOCALE, options).format(value);
}

const DATE_DEFAULTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const DATE_TIME_DEFAULTS: Intl.DateTimeFormatOptions = {
  ...DATE_DEFAULTS,
  hour: "numeric",
  minute: "2-digit",
};

/**
 * Format a date for display, en-US locale (default: "Aug 25, 2026").
 * Any options passed are merged over the defaults (e.g. a longer month, a timeZone).
 */
export function formatDate(
  date: Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(LOCALE, {
    ...DATE_DEFAULTS,
    ...options,
  }).format(date);
}

/**
 * Format a date and time for display, en-US locale
 * (default: "Aug 25, 2026, 3:07 PM"). Options are merged over the defaults.
 */
export function formatDateTime(
  date: Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(LOCALE, {
    ...DATE_TIME_DEFAULTS,
    ...options,
  }).format(date);
}

/**
 * Compact, sortable, filename-safe local timestamp: "YYYYMMDD-HHMMSS".
 * Not a display string — intended for generated download filenames — but kept
 * here so all time formatting lives in one module.
 */
export function fileTimestamp(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}
