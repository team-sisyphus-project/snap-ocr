/**
 * Template Header
 * Purpose: Radio-button chooser for the export output format (auto, plain,
 *   markdown, or CSV) the extraction result should be produced in.
 * Feature Unit: Export
 * Customize: The available formats come from OUTPUT_FORMATS in lib/prompts.ts;
 *   their labels come from the FORMAT_SELECTOR group in lib/strings.ts.
 * Depends on: the prompts and strings modules.
 */

"use client";

import { OUTPUT_FORMATS, type OutputFormat } from "@/lib/prompts";
import { FORMAT_SELECTOR } from "@/lib/strings";

const FORMAT_LABELS: Record<OutputFormat, string> = FORMAT_SELECTOR.labels;

type Props = { value: OutputFormat; onChange: (f: OutputFormat) => void };

/** Radio group for choosing the output format of the extraction result. */
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
