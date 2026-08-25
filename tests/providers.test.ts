/**
 * Template Header
 * Purpose: Unit tests for the provider registry. Assert PROVIDER_METAS has
 *   unique ids, isProviderId/getProviderMeta resolve known ids, and
 *   DEFAULT_PROVIDER is a valid registered provider.
 * Feature Unit: Shared
 * Depends on: Vitest; the exports of @/lib/providers.
 */

import { describe, it, expect } from "vitest";
import {
  PROVIDER_METAS,
  isProviderId,
  getProviderMeta,
  DEFAULT_PROVIDER,
} from "@/lib/providers";

describe("PROVIDER_METAS registry", () => {
  it("has unique ids", () => {
    const ids = PROVIDER_METAS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes anthropic and gemini", () => {
    const ids = PROVIDER_METAS.map((m) => m.id);
    expect(ids).toContain("anthropic");
    expect(ids).toContain("gemini");
  });

  it("every entry has required non-empty fields", () => {
    for (const m of PROVIDER_METAS) {
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.model.length).toBeGreaterThan(0);
      expect(m.keyPlaceholder.length).toBeGreaterThan(0);
      expect(m.storageKey).toContain(m.id);
      expect(typeof m.requiresUiKey).toBe("boolean");
    }
  });

  it("gemini requires a UI key; anthropic allows env fallback", () => {
    expect(getProviderMeta("gemini").requiresUiKey).toBe(true);
    expect(getProviderMeta("anthropic").requiresUiKey).toBe(false);
  });
});

describe("isProviderId", () => {
  it("accepts declared ids and rejects others", () => {
    for (const m of PROVIDER_METAS) expect(isProviderId(m.id)).toBe(true);
    expect(isProviderId("openai")).toBe(false);
    expect(isProviderId(1)).toBe(false);
    expect(isProviderId(undefined)).toBe(false);
  });
});

describe("DEFAULT_PROVIDER", () => {
  it("is a registered provider", () => {
    expect(isProviderId(DEFAULT_PROVIDER)).toBe(true);
  });
});
