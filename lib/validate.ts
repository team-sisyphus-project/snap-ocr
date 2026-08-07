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
    return { code: "no_images", message: "이미지를 1장 이상 추가해 주세요." };
  }
  if (images.length > MAX_IMAGES) {
    return {
      code: "too_many_images",
      message: `이미지는 최대 ${MAX_IMAGES}장까지 처리할 수 있습니다.`,
    };
  }
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (!(ALLOWED_MEDIA_TYPES as readonly string[]).includes(img.mediaType)) {
      return {
        code: "bad_type",
        index: i,
        message: "PNG, JPEG, WebP, GIF 이미지만 지원합니다.",
      };
    }
    if (img.sizeBytes > MAX_IMAGE_BYTES) {
      return {
        code: "too_large",
        index: i,
        message: "이미지 한 장의 크기는 5MB 이하여야 합니다.",
      };
    }
  }
  return null;
}
