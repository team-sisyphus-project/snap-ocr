"use client";

import { PROVIDER_METAS, getProviderMeta, type ProviderId } from "@/lib/providers";
import { API_KEY_PANEL } from "@/lib/strings";

type Props = {
  provider: ProviderId;
  onProviderChange: (id: ProviderId) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
};

export default function ApiKeyPanel({
  provider,
  onProviderChange,
  apiKey,
  onApiKeyChange,
}: Props) {
  const meta = getProviderMeta(provider);

  const handleProviderChange = (id: ProviderId) => {
    onProviderChange(id);
    onApiKeyChange(localStorage.getItem(getProviderMeta(id).storageKey) ?? "");
  };

  const handleKeyChange = (value: string) => {
    onApiKeyChange(value);
    if (value) {
      localStorage.setItem(meta.storageKey, value);
    } else {
      localStorage.removeItem(meta.storageKey);
    }
  };

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
