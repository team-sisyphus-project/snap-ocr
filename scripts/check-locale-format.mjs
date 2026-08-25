/**
 * Template Header
 * Purpose: Static guard that fails if any UI-path date/number formatting call
 *   omits an explicit locale. `Intl.*Format(...)` and `.toLocale*(...)` fall
 *   back to the host's default locale when the locale argument is missing (or
 *   passed as `undefined`/`null`), so output silently varies by server/browser.
 *   The UI is pinned to `en-US` (see lib/format.ts), so a locale-less call is a
 *   regression this guard catches in CI. Comments are stripped before the scan;
 *   test fixtures, docs, and non-UI paths are out of scope by path.
 * Feature Unit: Shared
 * Customize: Edit UI_DIRS to change which paths are scanned. Run via
 *   `npm run check:locale`.
 * Depends on: Node.js fs/url (no external packages).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

// UI code paths only. Tests (tests/), docs (*.md), and config live outside these.
const UI_DIRS = ["app", "components", "lib"];
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

// Formatting calls that take a locale as their first argument:
//   Intl.NumberFormat(  Intl.DateTimeFormat(  Intl.RelativeTimeFormat(  ...
//   .toLocaleString(  .toLocaleDateString(  .toLocaleTimeString(
const CALL = /(?:Intl\.[A-Za-z]+Format|\.toLocale[A-Za-z]+)\s*\(/g;

// A first argument of `undefined`/`null` (or no argument at all) means "use the
// host default locale" — the exact thing this guard forbids.
const NO_LOCALE_FIRST_ARG = /^(?:undefined|null)\b/;

/**
 * Blank out block and line comments while preserving newlines, so example
 * snippets in comments never trip the scan and reported line numbers stay exact.
 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + " ".repeat(m.length - p1.length));
}

/**
 * Find every locale-less formatting call in a source string. Returns one entry
 * per offending call with its 1-based line/column and the matched call text.
 */
export function findLocalelessCalls(source) {
  const scanned = stripComments(source);
  const offenders = [];
  for (const match of scanned.matchAll(CALL)) {
    const rest = scanned.slice(match.index + match[0].length).replace(/^\s*/, "");
    const localeless = rest.startsWith(")") || NO_LOCALE_FIRST_ARG.test(rest);
    if (!localeless) continue;
    const before = scanned.slice(0, match.index);
    const line = before.split("\n").length;
    const column = match.index - before.lastIndexOf("\n");
    offenders.push({ line, column, call: match[0].trim() });
  }
  return offenders;
}

/** Recursively collect scannable source files under a directory. */
function collectFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out; // Directory absent — nothing to scan.
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectFiles(full));
    } else if (SCAN_EXTENSIONS.has(extname(full))) {
      out.push(full);
    }
  }
  return out;
}

/** Scan the UI paths and report every locale-less formatting call. */
function main() {
  const offenders = [];
  for (const dir of UI_DIRS) {
    for (const file of collectFiles(dir)) {
      const source = readFileSync(file, "utf8");
      for (const hit of findLocalelessCalls(source)) {
        offenders.push(`${file}:${hit.line}:${hit.column}: ${hit.call}`);
      }
    }
  }

  if (offenders.length > 0) {
    console.error("Locale-less date/number formatting found in UI paths:");
    for (const o of offenders) console.error(`  ${o}`);
    console.error(
      `\n${offenders.length} call(s) omit an explicit locale. The UI is pinned to ` +
        "en-US; route dates/numbers through lib/format.ts (or pass an explicit " +
        'locale like "en-US") so output never depends on the host default.',
    );
    process.exit(1);
  }

  console.log(
    "No locale-less date/number formatting in UI paths. Formatting is en-US-pinned.",
  );
}

// Run the scan only when invoked as a script (not when imported by tests).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
