"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { validateImages, ALLOWED_MEDIA_TYPES } from "@/lib/validate";

export type SelectedImage = { id: string; file: File; previewUrl: string };

type Props = {
  images: SelectedImage[];
  onImagesChange: (images: SelectedImage[]) => void;
  onError: (message: string | null) => void;
};

export default function ImageDropzone({ images, onImagesChange, onError }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enlarged, setEnlarged] = useState<SelectedImage | null>(null);

  // 확대 보기 열림 중 ESC로 닫기
  useEffect(() => {
    if (!enlarged) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEnlarged(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enlarged]);

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

  // 클립보드 붙여넣기 (Ctrl/Cmd+V)
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
          이미지를 끌어다 놓거나, 붙여넣기(Ctrl+V)하거나, 클릭해서 선택하세요.
          <br />
          <small>PNG · JPEG · WebP · GIF, 장당 5MB, 최대 10장</small>
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
              {/* 로컬 blob 프리뷰이므로 next/image 대신 img 사용 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt={`이미지 ${idx + 1} — 클릭하면 크게 보기`}
                title="클릭하면 크게 보기"
                onClick={() => setEnlarged(img)}
              />
              <button type="button" onClick={() => removeImage(img.id)} aria-label="삭제">
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
          aria-label="이미지 크게 보기"
          onClick={() => setEnlarged(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enlarged.previewUrl}
            alt="확대된 이미지"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="lightbox-close"
            aria-label="닫기"
            onClick={() => setEnlarged(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
