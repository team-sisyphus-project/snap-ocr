/**
 * Template Header
 * Purpose: Provider picker and API-key entry. Lets the user choose a provider
 *   and enter a key that is persisted per provider in this browser's
 *   localStorage only — never sent anywhere except with an extraction request.
 * Feature Unit: Shared
 * Customize: The provider list comes from lib/providers.ts (labels, key
 *   placeholders, storage keys); all wording comes from the API_KEY_PANEL group
 *   in lib/strings.ts.
 * Depends on: the browser localStorage API; the providers and strings modules.
 */

"use client";

import { PROVIDER_METAS, getProviderMeta, type ProviderId } from "@/lib/providers";
import { API_KEY_PANEL } from "@/lib/strings";

type Props = {
  provider: ProviderId;
  onProviderChange: (id: ProviderId) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
};

/** Panel for selecting a provider and entering/persisting its API key. */
export default function ApiKeyPanel({
  provider,
  onProviderChange,
  apiKey,
  onApiKeyChange,
}: Props) {
  const meta = getProviderMeta(provider);

  // Handler: switch provider and load that provider's saved key from storage.
  const handleProviderChange = (id: ProviderId) => {
    onProviderChange(id);
    onApiKeyChange(localStorage.getItem(getProviderMeta(id).storageKey) ?? "");
  };

  // Handler: update the key and mirror it into localStorage (or clear it).
  const handleKeyChange = (value: string) => {
    onApiKeyChange(value);
    if (value) {
      localStorage.setItem(meta.storageKey, value);
    } else {
      localStorage.removeItem(meta.storageKey);
    }
  };

  // Handler: remove the saved key for the current provider.
  const clearKey = () => {
    localStorage.removeItem(meta.storageKey);
    onApiKeyChange("");
  };

  return (
    <fieldset className="key-panel">
      <legend>{API_KEY_PANEL.legend}</legend>

      <div className="provider-row">
        {PROVIDER_METAS.map((m) => (
          <label key={m.id}>
            <input
              type="radio"
              name="provider"
              value={m.id}
              checked={provider === m.id}
              onChange={() => handleProviderChange(m.id)}
            />
            {m.label}
          </label>
        ))}
      </div>

      <div className="key-row">
        <input
          type="password"
          value={apiKey}
          placeholder={meta.keyPlaceholder}
          autoComplete="off"
          aria-label={API_KEY_PANEL.keyInputLabel(meta.label)}
          onChange={(e) => handleKeyChange(e.target.value)}
        />
        <button type="button" onClick={clearKey} disabled={!apiKey}>
          {API_KEY_PANEL.remove}
        </button>
      </div>

      <p className="key-notice">
        {API_KEY_PANEL.notice}
        {!meta.requiresUiKey && API_KEY_PANEL.noticeServerFallback}
      </p>
    </fieldset>
  );
}
