"use client";

import { useState } from "react";
import type { OutputFormat } from "@/lib/prompts";
import type { SelectedImage } from "@/components/ImageDropzone";
import { RESULT_PANEL } from "@/lib/strings";
import { fileTimestamp } from "@/lib/format";

const EXTENSIONS: Record<OutputFormat, string> = {
  auto: "txt",
  plain: "txt",
  markdown: "md",
  csv: "csv",
};

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
    a.download = `snapocr-result-${fileTimestamp(new Date())}.${EXTENSIONS[format]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showCompare = compare && images.length > 0;

  return (
    <section className="result-panel">
      <div className="result-toolbar">
        <strong>{RESULT_PANEL.heading} {isStreaming && RESULT_PANEL.streaming}</strong>
        <span>
          <button
            type="button"
            onClick={() => setCompare((v) => !v)}
            disabled={images.length === 0}
          >
            {showCompare ? RESULT_PANEL.compareClose : RESULT_PANEL.compareOpen}
          </button>{" "}
          <button type="button" onClick={copy} disabled={!text}>
            {copied ? RESULT_PANEL.copied : RESULT_PANEL.copy}
          </button>{" "}
          <button type="button" onClick={download} disabled={!text || isStreaming}>
            {RESULT_PANEL.download}
          </button>
        </span>
      </div>

      {showCompare ? (
        <div className="compare-grid">
          <div className="compare-images">
            {images.map((img, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.id} src={img.previewUrl} alt={RESULT_PANEL.compareImageAlt(idx + 1)} />
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
