"use client";

import { OUTPUT_FORMATS, type OutputFormat } from "@/lib/prompts";
import { FORMAT_SELECTOR } from "@/lib/strings";

const FORMAT_LABELS: Record<OutputFormat, string> = FORMAT_SELECTOR.labels;

type Props = { value: OutputFormat; onChange: (f: OutputFormat) => void };

export default function FormatSelector({ value, onChange }: Props) {
  return (
    <fieldset className="format-selector">
      <legend>{FORMAT_SELECTOR.legend}</legend>
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
