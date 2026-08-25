import { describe, it, expect } from "vitest";
import {
  validateImages,
  base64ByteLength,
  MAX_IMAGES,
  MAX_IMAGE_BYTES,
} from "@/lib/validate";

const png = (sizeBytes: number) => ({ sizeBytes, mediaType: "image/png" });

describe("validateImages", () => {
  it("returns no_images for empty array", () => {
    expect(validateImages([])?.code).toBe("no_images");
  });

  it("accepts 1..MAX_IMAGES valid images", () => {
    expect(validateImages([png(1000)])).toBeNull();
    expect(validateImages(Array.from({ length: MAX_IMAGES }, () => png(1000)))).toBeNull();
  });

  it("rejects more than MAX_IMAGES", () => {
    const err = validateImages(Array.from({ length: MAX_IMAGES + 1 }, () => png(1000)));
    expect(err?.code).toBe("too_many_images");
  });

  it("rejects an oversized image with its index", () => {
    const err = validateImages([png(1000), png(MAX_IMAGE_BYTES + 1)]);
    expect(err?.code).toBe("too_large");
    expect(err?.index).toBe(1);
  });

  it("rejects disallowed media types with its index", () => {
    const err = validateImages([{ sizeBytes: 10, mediaType: "image/tiff" }]);
    expect(err?.code).toBe("bad_type");
    expect(err?.index).toBe(0);
  });

  it("every error carries an English (Korean-free) message", () => {
    const err = validateImages([]);
    expect(err?.message).toBeTruthy();
    expect(err?.message).toMatch(/at least one image/i);
    expect(err?.message ?? "").not.toMatch(/[가-힣]/);
  });
});

describe("base64ByteLength", () => {
  it("computes decoded byte length", () => {
    // "aGVsbG8=" == "hello" (5 bytes)
    expect(base64ByteLength("aGVsbG8=")).toBe(5);
    expect(base64ByteLength("")).toBe(0);
  });
});
