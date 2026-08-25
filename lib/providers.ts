/**
 * Template Header
 * Purpose: Provider registry — the shared (client + server) metadata list of the
 *   OCR/AI providers the app can call. One entry per provider.
 * Feature Unit: Shared
 * Customize: Add, remove, or re-label a provider by editing PROVIDER_METAS
 *   (id, display label, model id, key placeholder, whether a UI key is required,
 *   localStorage key). Change DEFAULT_PROVIDER to pick which one loads first.
 *   Adding a provider = add one entry here + one engine in lib/ocr-engines.ts.
 * Depends on: nothing (pure metadata + type guards).
 */

export const PROVIDER_METAS = [
  {
    id: "gemini",
    label: "Gemini (Google)",
    model: "gemini-2.5-flash",
    keyPlaceholder: "AIza...",
    requiresUiKey: true,
    storageKey: "snapocr.apiKey.gemini",
  },
  {
    id: "anthropic",
    label: "Claude (Anthropic)",
    model: "claude-opus-5",
    keyPlaceholder: "sk-ant-...",
    requiresUiKey: false,
    storageKey: "snapocr.apiKey.anthropic",
  },
] as const;

export type ProviderMeta = (typeof PROVIDER_METAS)[number];
export type ProviderId = ProviderMeta["id"];

export const DEFAULT_PROVIDER: ProviderId = "gemini";

/** Type guard: true when `v` is a known provider id (validates untrusted input). */
export function isProviderId(v: unknown): v is ProviderId {
  return (
    typeof v === "string" && PROVIDER_METAS.some((m) => (m.id as string) === v)
  );
}

/** Look up the metadata entry for a provider id. */
export function getProviderMeta(id: ProviderId): ProviderMeta {
  return PROVIDER_METAS.find((m) => m.id === id)!;
}
