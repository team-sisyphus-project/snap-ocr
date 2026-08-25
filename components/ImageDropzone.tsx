/**
 * Template Header
 * Purpose: Image intake surface. Accepts images via drag-and-drop, clipboard
 *   paste (Ctrl/Cmd+V), or file picker; validates them; renders thumbnails with
 *   remove buttons; and offers an enlarged lightbox view.
 * Feature Unit: Upload
 * Customize: Accepted types and limits come from lib/validate.ts; all wording
 *   (instructions, constraints, alt/aria labels) comes from the DROPZONE group
 *   in lib/strings.ts.
 * Depends on: the browser File / Clipboard / URL.createObjectURL APIs; the
 *   validate and strings modules.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { validateImages, ALLOWED_MEDIA_TYPES } from "@/lib/validate";
import { DROPZONE } from "@/lib/strings";

export type SelectedImage = { id: string; file: File; previewUrl: string };

type Props = {
  images: SelectedImage[];
  onImagesChange: (images: SelectedImage[]) => void;
  onError: (message: string | null) => void;
};

/** Image intake: drag-drop / paste / picker, with validation, thumbnails, and lightbox. */
export default function ImageDropzone({ images, onImagesChange, onError }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enlarged, setEnlarged] = useState<SelectedImage | null>(null);

  // Close the enlarged view with the Escape key while it is open.
  useEffect(() => {
    if (!enlarged) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEnlarged(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enlarged]);

  // Handler: append picked files, validate the combined set, and revert on error.
  const addFiles = useCallback(
    (files: File[]) => {
      const next = [
        ...images,
        ...files.map((file) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ];
      const err = validateImages(
        next.map((i) => ({ sizeBytes: i.file.size, mediaType: i.file.type })),
      );
      if (err) {
        onError(err.message);
        next.slice(images.length).forEach((i) => URL.revokeObjectURL(i.previewUrl));
        return;
      }
      onError(null);
      onImagesChange(next);
    },
    [images, onImagesChange, onError],
  );

  // Clipboard paste (Ctrl/Cmd+V).
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) =>
        (ALLOWED_MEDIA_TYPES as readonly string[]).includes(f.type),
      );
      if (files.length > 0) {
        e.preventDefault();
        addFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  // Handler: remove one image by id and release its object URL.
  const removeImage = (id: string) => {
    const target = images.find((i) => i.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    if (enlarged?.id === id) setEnlarged(null);
    onImagesChange(images.filter((i) => i.id !== id));
    onError(null);
  };

  return (
    <div>
      <div
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(Array.from(e.dataTransfer.files));
        }}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <p>
          {DROPZONE.instructions}
          <br />
          <small>{DROPZONE.constraints}</small>
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_MEDIA_TYPES.join(",")}
          multiple
          hidden
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {images.length > 0 && (
        <ul className="thumbs">
          {images.map((img, idx) => (
            <li key={img.id}>
              {/* Local blob preview, so use a plain img instead of next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt={DROPZONE.thumbAlt(idx + 1)}
                title={DROPZONE.thumbTitle}
                onClick={() => setEnlarged(img)}
              />
              <button type="button" onClick={() => removeImage(img.id)} aria-label={DROPZONE.removeImage}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {enlarged && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={DROPZONE.enlargedDialogLabel}
          onClick={() => setEnlarged(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enlarged.previewUrl}
            alt={DROPZONE.enlargedAlt}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="lightbox-close"
            aria-label={DROPZONE.close}
            onClick={() => setEnlarged(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
