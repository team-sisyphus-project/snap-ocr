# SnapOCR

A web tool that extracts text (OCR) from screenshot and document-capture images and cleans it up.

- Stack: Next.js (App Router, TypeScript) in a single codebase — frontend plus API Route backend.
- OCR engines: a list-based set of providers — Gemini (`gemini-2.5-flash`, REST SSE) and Claude (`claude-opus-5`, official SDK). Each run extracts and cleans up (rejoins paragraphs, structures tables, fixes typos) in one pass.

The interface is English only. All user-facing text lives in one catalog (`lib/strings.ts`); dates and numbers are formatted in the `en-US` locale (`lib/format.ts`).

## Usage

Open the app in your browser (local default `http://localhost:3000`), then:

1. **Choose a provider and enter your API key** — pick Gemini (default) or Claude at
   the top and enter your own API key. The field is masked, and the key is stored
   per provider in this browser (localStorage) only, never on the server. It is sent
   to the server only when you run an extraction, and you can clear it anytime with
   the "Remove key" button.
   - For Claude, leaving the key empty falls back to the server's `ANTHROPIC_API_KEY`
     environment variable if one is set. Gemini is UI-key only.
2. **Add images** — drag and drop, paste with `Ctrl/Cmd + V`, or click to choose files.
   Use 1–10 images at a time; multiple images are joined in order into one result.
   Click a thumbnail to enlarge it, or the ✕ button to remove one.
   - Supported formats: PNG · JPEG · WebP · GIF, up to 5MB each.
   - Anything outside those count/size/format limits shows a message immediately and
     does not proceed to extraction.
3. **Pick an output format** — Auto (default), plain text, Markdown, or table (CSV).
4. **Extract text** — the result streams in live. The "Compare with image" button
   splits the view into source image (left) and extracted result (right) side by side.
5. **Copy or download** — use the copy button, or download as
   `snapocr-result-YYYYMMDD-HHMMSS.txt|md|csv`.

Error handling: a missing or invalid key (401), the Gemini free-usage limit (429), and
transient errors (5xx) each show an English message, and you can rerun with the same input.

## Green-field local run

No database and no seed (the app is stateless). It starts with just:

```bash
npm install
npm run dev        # honors the PORT environment variable, default 3000
```

- Optional: to use the Claude server fallback key, copy `.env.example` to `.env.local`
  and fill in `ANTHROPIC_API_KEY`. Not needed if you enter a key in the UI.
- No dummy accounts (this is a single-screen tool with no login).

## Test / build / checks

```bash
npm test           # Vitest — all external APIs are mocked, no key required
npm run build
npm start          # honors the PORT environment variable
npm run check         # runs both guards below; the single gate to run before shipping
npm run check:korean   # fails if any Korean (Hangul) remains in UI Display Strings
npm run check:locale   # fails if a UI formatting call omits an explicit locale
```

`npm run check` runs `check:korean` and `check:locale` in sequence and exits non-zero if
either fails, so the two static UI guards are a single gate rather than a suggestion.

`npm run check:korean` statically scans the UI code paths (`app/`, `components/`, `lib/`),
strips comments, and reports any remaining Hangul. The UI is English only, so a hit means
a hardcoded string needs to move into `lib/strings.ts` in English.

`npm run check:locale` scans the same UI paths for date/number formatting calls
(`Intl.*Format(...)` and `.toLocale*(...)`) that omit an explicit locale — a missing
argument, or one passed as `undefined`/`null`. Such calls fall back to the host's
default locale, so output silently varies by server or browser. The UI is pinned to
**`en-US`**: format dates and numbers through the helpers in `lib/format.ts` (which
pass the `en-US` locale for you), or pass an explicit locale like `"en-US"` at the call
site. A hit means a formatting call needs its locale made explicit.

## Structure

Every source file starts with a **Template Header** (Purpose, Feature Unit, Customize,
Depends on) so a template user can find and swap each part. Feature Units follow the five
product axes — Upload, OCR Extraction, Cleanup, Grouping·Tagging, Export — or "Shared" for
common infrastructure.

| Path | Role | Feature Unit |
|---|---|---|
| `lib/strings.ts` | Central English Display String catalog (rebrand here) | Shared |
| `lib/format.ts` | `en-US`-locked date/number formatting | Shared |
| `lib/providers.ts` | Provider registry (shared metadata). Add a provider = add an entry | Shared |
| `lib/prompts.ts` | System-prompt builder per output format | OCR Extraction |
| `lib/ocr-engines.ts` | Server-only streaming engines (Claude SDK / Gemini REST SSE) + error mapping | OCR Extraction |
| `lib/validate.ts` | Image count/size/format validation (client + server) | Upload |
| `app/api/ocr/route.ts` | Validate → dispatch engine → stream text response | OCR Extraction |
| `app/page.tsx` | Main screen that composes the panels and runs an extraction | OCR Extraction |
| `components/` | ApiKeyPanel · ImageDropzone · FormatSelector · ResultPanel (compare view) | Upload / Export / Shared |
