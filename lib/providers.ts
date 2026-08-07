// Provider registry (client/server shared metadata).
// Adding a provider = add one entry here + one engine in lib/ocr-engines.ts.

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

export function isProviderId(v: unknown): v is ProviderId {
  return (
    typeof v === "string" && PROVIDER_METAS.some((m) => (m.id as string) === v)
  );
}

export function getProviderMeta(id: ProviderId): ProviderMeta {
  return PROVIDER_METAS.find((m) => m.id === id)!;
}
