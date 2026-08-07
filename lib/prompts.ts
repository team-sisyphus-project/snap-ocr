export const OUTPUT_FORMATS = ["auto", "plain", "markdown", "csv"] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export function isOutputFormat(v: unknown): v is OutputFormat {
  return typeof v === "string" && (OUTPUT_FORMATS as readonly string[]).includes(v);
}

const SHARED_RULES = `You are an OCR and text-cleanup engine. The user sends one or more screenshot images.

Rules:
- Extract ALL visible text from the images, in image order. Merge multiple images into one continuous document.
- Keep the original language of the text (Korean, English, or mixed). Never translate.
- Rejoin paragraphs that were broken by line-wrapping; preserve intentional line breaks (lists, headings, code).
- Fix only obvious OCR-level typos (broken characters, spacing errors). Do not invent, summarize, or omit content.
- Exclude pure UI chrome (window buttons, scrollbars) unless it carries meaningful text.
- Output ONLY the extracted text. No preamble, no explanation, no code fences around the whole output.`;

const FORMAT_RULES: Record<OutputFormat, string> = {
  auto: `Choose the structure that best fits the content: plain paragraphs, Markdown lists/headings, or a Markdown table for tabular data.`,
  plain: `Output strictly as plain text. No Markdown syntax, no tables — flatten tabular data into lines.`,
  markdown: `Output as Markdown. Use headings, lists, and tables where the source content implies them.`,
  csv: `The images contain tabular data. Output CSV only: first line is the header row, comma-separated, quote fields containing commas or newlines. If multiple tables exist, separate them with one blank line.`,
};

export function buildSystemPrompt(format: OutputFormat): string {
  return `${SHARED_RULES}\n\nOutput format:\n${FORMAT_RULES[format]}`;
}

export const USER_INSTRUCTION =
  "Extract and clean up the text from the attached image(s) following your rules.";
