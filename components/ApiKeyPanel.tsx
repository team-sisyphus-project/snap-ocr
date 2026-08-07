"use client";

import { PROVIDER_METAS, getProviderMeta, type ProviderId } from "@/lib/providers";

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
      <legend>AI 공급자 · API 키</legend>

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
          aria-label={`${meta.label} API 키`}
          onChange={(e) => handleKeyChange(e.target.value)}
        />
        <button type="button" onClick={clearKey} disabled={!apiKey}>
          키 삭제
        </button>
      </div>

      <p className="key-notice">
        키는 이 브라우저(localStorage)에만 저장되며 서버에 저장되지 않습니다. 추출
        요청 시에만 서버로 전달돼 사용됩니다. “키 삭제” 버튼으로 언제든 지울 수
        있습니다.
        {!meta.requiresUiKey &&
          " 비워두면 서버에 설정된 키가 있는 경우 그 키를 사용합니다."}
      </p>
    </fieldset>
  );
}
