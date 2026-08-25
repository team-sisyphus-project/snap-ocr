/**
 * Template Header
 * Purpose: Image upload validation shared by the client and the API route
 *   (double defense): enforce image count, per-image byte size, and allowed
 *   media types, returning a ready-to-show error message or null.
 * Feature Unit: Upload
 * Customize: Change MAX_IMAGES, MAX_IMAGE_BYTES, or ALLOWED_MEDIA_TYPES to adjust
 *   upload limits. The user-facing wording lives in the VALIDATION string group
 *   (lib/strings.ts); the numbers are injected so the two stay in sync.
 * Depends on: the VALIDATION Display String group in lib/strings.ts.
 */

import { VALIDATION } from "@/lib/strings";

export const MAX_IMAGES = 10;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MEDIA_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
export type MediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

export type ImageMeta = { sizeBytes: number; mediaType: string };

export type ValidationError = {
  code: "no_images" | "too_many_images" | "too_large" | "bad_type";
  index?: number;
  message: string;
};

/** Compute the decoded byte length of a base64 string without decoding it. */
export function base64ByteLength(base64: string): number {
  if (base64.length === 0) return 0;
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length * 3) / 4 - padding;
}

/** Validate image count, size, and media type; return the first error or null if all pass. */
export function validateImages(images: ImageMeta[]): ValidationError | null {
  if (images.length === 0) {
    return { code: "no_images", message: VALIDATION.noImages };
  }
  if (images.length > MAX_IMAGES) {
    return {
      code: "too_many_images",
      message: VALIDATION.tooManyImages(MAX_IMAGES),
    };
  }
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (!(ALLOWED_MEDIA_TYPES as readonly string[]).includes(img.mediaType)) {
      return {
        code: "bad_type",
        index: i,
        message: VALIDATION.badType,
      };
    }
    if (img.sizeBytes > MAX_IMAGE_BYTES) {
      return {
        code: "too_large",
        index: i,
        message: VALIDATION.tooLarge(MAX_IMAGE_BYTES / (1024 * 1024)),
      };
    }
  }
  return null;
}
