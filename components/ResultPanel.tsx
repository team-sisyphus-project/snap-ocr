"use client";

import { useState } from "react";
import type { OutputFormat } from "@/lib/prompts";
import type { SelectedImage } from "@/components/ImageDropzone";

const EXTENSIONS: Record<OutputFormat, string> = {
  auto: "txt",
  plain: "txt",
  markdown: "md",
  csv: "csv",
};

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

type Props = {
  text: string;
  format: OutputFormat;
  isStreaming: boolean;
  images: SelectedImage[];
};

export default function ResultPanel({ text, format, isStreaming, images }: Props) {
  const [copied, setCopied] = useState(false);
  const [compare, setCompare] = useState(false);

  if (!text && !isStreaming) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snapocr-result-${timestamp()}.${EXTENSIONS[format]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showCompare = compare && images.length > 0;

  return (
    <section className="result-panel">
      <div className="result-toolbar">
        <strong>추출 결과 {isStreaming && "(생성 중…)"}</strong>
        <span>
          <button
            type="button"
            onClick={() => setCompare((v) => !v)}
            disabled={images.length === 0}
          >
            {showCompare ? "대조 닫기" : "이미지와 대조"}
          </button>{" "}
          <button type="button" onClick={copy} disabled={!text}>
            {copied ? "복사됨!" : "복사"}
          </button>{" "}
          <button type="button" onClick={download} disabled={!text || isStreaming}>
            다운로드
          </button>
        </span>
      </div>

      {showCompare ? (
        <div className="compare-grid">
          <div className="compare-images">
            {images.map((img, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.id} src={img.previewUrl} alt={`이미지 ${idx + 1}`} />
            ))}
          </div>
          <pre className="result-text compare-text">{text}</pre>
        </div>
      ) : (
        <pre className="result-text">{text}</pre>
      )}
    </section>
  );
}
