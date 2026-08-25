/**
 * Template Header
 * Purpose: Static guard that fails if any Korean (Hangul) character survives as a
 *   Display String in the UI code paths. The app ships an English-only UI, so
 *   Hangul in a rendered string is a regression. Comments are stripped before
 *   the scan (translator notes are allowed), and test fixtures and docs are out
 *   of scope by path.
 * Feature Unit: Shared
 * Customize: Edit UI_DIRS to change which paths are scanned. Run via
 *   `npm run check:korean`.
 * Depends on: Node.js fs (no external packages).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

// UI code paths only. Tests (tests/), docs (*.md), and config live outside these.
const UI_DIRS = ["app", "components", "lib"];
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

// Hangul syllables + Jamo ranges.
const HANGUL = /[ᄀ-ᇿ㄰-㆏ꥠ-꥿가-힣]/;

/** Remove block and line comments so translator notes don't trip the scan. */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
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

/** Scan the UI paths and report every line that still contains Hangul. */
function main() {
  const offenders = [];
  for (const dir of UI_DIRS) {
    for (const file of collectFiles(dir)) {
      const lines = stripComments(readFileSync(file, "utf8")).split("\n");
      lines.forEach((line, i) => {
        if (HANGUL.test(line)) {
          offenders.push(`${file}:${i + 1}: ${line.trim()}`);
        }
      });
    }
  }

  if (offenders.length > 0) {
    console.error("Korean residue found in UI Display Strings:");
    for (const o of offenders) console.error(`  ${o}`);
    console.error(
      `\n${offenders.length} line(s) contain Hangul. The UI is English-only; ` +
        "move the text into lib/strings.ts in English.",
    );
    process.exit(1);
  }

  console.log("No Korean residue in UI Display Strings. UI is English-only.");
}

main();
