/**
 * Template Header
 * Purpose: Single source of truth for every user-facing English Display String
 *   (labels, status/empty/error messages, toasts, placeholders, ARIA labels,
 *   export headers). Template users rebrand or reword the product by editing
 *   copy here, in one place, instead of hunting through components.
 * Feature Unit: Shared
 * Customize: Product name, taglines, and any wording below. Change a value and
 *   every screen that reads it updates. Do NOT localize user-generated data
 *   (uploaded images, OCR output, free text the user typed) — that is the
 *   user's language, not the UI's.
 * Depends on: nothing (pure constants + string builders; no runtime deps).
 */

// ---------------------------------------------------------------------------
// English UI voice/tone (see design-spec recording):
//   - Second person ("you"/"your"), sentence case.
//   - Concise and plain; one idea per sentence.
//   - Errors: state what happened + the next action, no blame, no jargon.
//   - Curly quotes (“ ”) for quoted UI labels inside prose.
//   - No exclamation marks except brief success acknowledgements ("Copied!").
// ---------------------------------------------------------------------------

/** App-level identity and document metadata. Feature Unit: Shared. */
export const APP = {
  name: "SnapOCR",
  tagline: "Extract and clean up the text in your screenshots.",
  metaTitle: "SnapOCR — Screenshot text extraction",
  metaDescription:
    "Extract text from screenshot images and clean it up.",
} as const;

/** Primary extraction action + streaming state. Feature Unit: OCR Extraction. */
export const HOME = {
  extract: "Extract text",
  extracting: "Extracting…",
} as const;

/** Provider picker + API key entry. Feature Unit: Shared (config). */
export const API_KEY_PANEL = {
  legend: "AI provider · API key",
  remove: "Remove key",
  notice:
    "Your key is stored only in this browser (localStorage), never on the " +
    "server. It is sent to the server only when you run an extraction. You " +
    "can remove it anytime with the “Remove key” button.",
  noticeServerFallback:
    " Leave it empty to use the server's configured key, if one is set.",
  /** ARIA label for the key input, e.g. "Claude (Anthropic) API key". */
  keyInputLabel: (providerLabel: string): string => `${providerLabel} API key`,
} as const;

/** Output-format chooser. Feature Unit: Export. */
export const FORMAT_SELECTOR = {
  legend: "Output format",
  labels: {
    auto: "Auto",
    plain: "Plain text",
    markdown: "Markdown",
    csv: "Table (CSV)",
  },
} as const;

/** Upload / paste / drag-drop surface. Feature Unit: Upload. */
export const DROPZONE = {
  instructions:
    "Drag and drop an image, paste it (Ctrl+V), or click to choose one.",
  constraints: "PNG · JPEG · WebP · GIF, up to 5MB each, 10 images max.",
  thumbTitle: "Click to enlarge",
  removeImage: "Remove",
  enlargedDialogLabel: "Enlarged image view",
  enlargedAlt: "Enlarged image",
  close: "Close",
  /** Alt text for a thumbnail, e.g. "Image 1 — click to enlarge". */
  thumbAlt: (index: number): string => `Image ${index} — click to enlarge`,
} as const;

/** Result display, copy/download toolbar, image comparison. Feature Unit: Export. */
export const RESULT_PANEL = {
  heading: "Extraction result",
  streaming: "(generating…)",
  compareOpen: "Compare with image",
  compareClose: "Close comparison",
  copy: "Copy",
  copied: "Copied!",
  download: "Download",
  /** Alt text for a side-by-side comparison image, e.g. "Image 1". */
  compareImageAlt: (index: number): string => `Image ${index}`,
} as const;

/**
 * User-facing error and status messages shared across client, API route, and
 * OCR engines. Feature Unit: Shared. Consumers pick the message that matches
 * the failure they detect; keeping them here keeps wording consistent.
 */
export const MESSAGES = {
  // Client-side (page) —
  enterApiKey: "Please enter your API key.",
  requestFailed: "Request failed. Please try again.",
  generic: "Something went wrong.",

  // API route (request validation / mapping) —
  invalidRequest: "Invalid request.",
  unsupportedProvider: "This provider is not supported.",
  unsupportedFormat: "This output format is not supported.",
  unknownError: "An unknown error occurred.",
  /** Appended to an in-progress stream that fails after headers are sent. */
  streamInterrupted: "\n[Something went wrong. Please try again.]",

  // OCR engine outcomes —
  invalidApiKey: "Your API key is invalid. Please check it.",
  temporaryError: "A temporary error occurred. Please try again.",
  rateLimited: "Too many requests. Please try again shortly.",
  freeQuotaExceeded:
    "You have reached the free usage limit. Please try again later, or " +
    "tomorrow if this is a daily limit.",
  /** Inline note when a provider refuses to process an image. */
  imageNotProcessable: "\n[This image cannot be processed.]",
  /** Inline note when output was cut off by the token limit. */
  outputTruncated: "\n[The output limit was reached; the result was truncated.]",
} as const;

/**
 * Image-validation messages. Sizes/counts are passed in so the numbers stay in
 * sync with the validation constants rather than being duplicated here.
 * Feature Unit: Upload.
 */
export const VALIDATION = {
  noImages: "Please add at least one image.",
  badType: "Only PNG, JPEG, WebP, and GIF images are supported.",
  /** e.g. "You can process up to 10 images." */
  tooManyImages: (max: number): string =>
    `You can process up to ${max} images.`,
  /** e.g. "Each image must be 5MB or smaller." */
  tooLarge: (maxMegabytes: number): string =>
    `Each image must be ${maxMegabytes}MB or smaller.`,
} as const;

/** Flat namespace for convenient single-import access to every string group. */
export const STRINGS = {
  APP,
  HOME,
  API_KEY_PANEL,
  FORMAT_SELECTOR,
  DROPZONE,
  RESULT_PANEL,
  MESSAGES,
  VALIDATION,
} as const;

export type Strings = typeof STRINGS;
