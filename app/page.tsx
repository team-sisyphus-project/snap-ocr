"use client";

import { useEffect, useState } from "react";
import ImageDropzone, { type SelectedImage } from "@/components/ImageDropzone";
import FormatSelector from "@/components/FormatSelector";
import ResultPanel from "@/components/ResultPanel";
import ApiKeyPanel from "@/components/ApiKeyPanel";
import type { OutputFormat } from "@/lib/prompts";
import {
  DEFAULT_PROVIDER,
  getProviderMeta,
  type ProviderId,
} from "@/lib/providers";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.slice(dataUrl.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [format, setFormat] = useState<OutputFormat>("auto");
  const [provider, setProvider] = useState<ProviderId>(DEFAULT_PROVIDER);
  const [apiKey, setApiKey] = useState("");
  const [result, setResult] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 최초 진입 시 기본 공급자의 저장된 키 복원
  useEffect(() => {
    setApiKey(
      localStorage.getItem(getProviderMeta(DEFAULT_PROVIDER).storageKey) ?? "",
    );
  }, []);

  const run = async () => {
    setError(null);

    if (getProviderMeta(provider).requiresUiKey && !apiKey.trim()) {
      setError("API 키를 입력해 주세요.");
      return;
    }

    setResult("");
    setIsStreaming(true);
    try {
      const payload = {
        images: await Promise.all(
          images.map(async (img) => ({
            data: await fileToBase64(img.file),
            mediaType: img.file.type,
          })),
        ),
        format,
        provider,
        apiKey: apiKey.trim() || undefined,
      };
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "요청에 실패했습니다. 다시 시도해 주세요.");
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setResult((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <main>
      <h1>SnapOCR</h1>
      <p>스크린샷 속 텍스트를 추출하고 깔끔하게 정리합니다.</p>

      <ApiKeyPanel
        provider={provider}
        onProviderChange={setProvider}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
      />
      <ImageDropzone images={images} onImagesChange={setImages} onError={setError} />
      <FormatSelector value={format} onChange={setFormat} />

      <button
        type="button"
        className="run-button"
        onClick={run}
        disabled={images.length === 0 || isStreaming}
      >
        {isStreaming ? "추출 중…" : "텍스트 추출"}
      </button>

      {error && <p className="error-message" role="alert">{error}</p>}

      <ResultPanel
        text={result}
        format={format}
        isStreaming={isStreaming}
        images={images}
      />
    </main>
  );
}
