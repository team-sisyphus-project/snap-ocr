"use client";

import { OUTPUT_FORMATS, type OutputFormat } from "@/lib/prompts";

const FORMAT_LABELS: Record<OutputFormat, string> = {
  auto: "자동",
  plain: "플레인 텍스트",
  markdown: "마크다운",
  csv: "표 (CSV)",
};

type Props = { value: OutputFormat; onChange: (f: OutputFormat) => void };

export default function FormatSelector({ value, onChange }: Props) {
  return (
    <fieldset className="format-selector">
      <legend>출력 포맷</legend>
      {OUTPUT_FORMATS.map((f) => (
        <label key={f}>
          <input
            type="radio"
            name="format"
            value={f}
            checked={value === f}
            onChange={() => onChange(f)}
          />
          {FORMAT_LABELS[f]}
        </label>
      ))}
    </fieldset>
  );
}
