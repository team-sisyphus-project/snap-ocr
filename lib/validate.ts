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

export function base64ByteLength(base64: string): number {
  if (base64.length === 0) return 0;
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length * 3) / 4 - padding;
}

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
