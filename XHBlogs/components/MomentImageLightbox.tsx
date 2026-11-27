"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";

export interface ImageLightboxMetadata {
  caption?: string;
  mapUrl?: string;
  mapLabel?: string;
}

export default function MomentImageLightbox({
  images,
  index,
  onClose,
  onChange,
  ariaLabel = "查看图片",
  metadata,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
  ariaLabel?: string;
  metadata?: Array<ImageLightboxMetadata | undefined>;
}) {
  const current = Math.min(Math.max(index, 0), Math.max(images.length - 1, 0));
  const currentMetadata = metadata?.[current];
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButton.current?.focus();
    return () => {
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (images.length < 2) return;
      if (event.key === "ArrowLeft") {
        onChange((current - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight") {
        onChange((current + 1) % images.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [current, images.length, onChange, onClose]);

  if (images.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100000] flex h-dvh items-center justify-center bg-black/95 p-4 backdrop-blur-xl"
    >
      <button
        ref={closeButton}
        type="button"
        aria-label="关闭图片"
        onClick={onClose}
        className="absolute right-5 top-5 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <X size={20} />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="上一张"
            onClick={() =>
              onChange((current - 1 + images.length) % images.length)
            }
            className="absolute left-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            aria-label="下一张"
            onClick={() => onChange((current + 1) % images.length)}
            className="absolute right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <div className="flex min-h-0 w-full flex-col items-center justify-center gap-3 sm:flex-row">
        <img
          src={images[current]}
          alt=""
          className="max-h-[76dvh] max-w-full rounded-2xl object-contain shadow-2xl sm:max-h-[85dvh] sm:max-w-[calc(100vw-14rem)]"
        />
        {currentMetadata?.mapUrl && (
          <a
            href={currentMetadata.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`在 Google 地图中打开${currentMetadata.mapLabel || "这个地点"}`}
            className="flex shrink-0 items-center gap-2 rounded-full border border-indigo-300/25 bg-indigo-500/20 px-5 py-3 text-sm font-bold text-indigo-100 shadow-2xl backdrop-blur-md transition hover:border-indigo-300/45 hover:bg-indigo-500/30"
          >
            <MapPin size={16} />
            到这儿去
          </a>
        )}
      </div>
      <div className="absolute bottom-5 flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-2">
        {currentMetadata?.caption && (
          <p className="max-h-[14dvh] overflow-y-auto rounded-full border border-white/10 bg-white/10 px-4 py-2 text-center text-xs text-white backdrop-blur-md">
            {currentMetadata.caption}
          </p>
        )}
        <p className="rounded-full bg-white/10 px-4 py-2 text-xs text-white">
          {current + 1} / {images.length}
        </p>
      </div>
    </div>
  );
}
