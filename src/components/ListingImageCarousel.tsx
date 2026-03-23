"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import ListingImage from "./ListingImage";

const PLACEHOLDER = "/images/placeholder-electronics.svg";

interface ListingImageCarouselProps {
  images: string[];
  alt: string;
  featured?: boolean;
}

export default function ListingImageCarousel({
  images,
  alt,
  featured = false,
}: ListingImageCarouselProps) {
  const normalizedImages = useMemo(() => {
    const valid = images.filter(Boolean);
    return valid.length > 0 ? valid : [PLACEHOLDER];
  }, [images]);

  const total = normalizedImages.length;
  const canSwipe = total > 1;

  const [index, setIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef(0);

  useEffect(() => {
    if (!isFullscreenOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreenOpen(false);
      if (!canSwipe) return;
      if (event.key === "ArrowRight") {
        setIndex((prev) => (prev + 1) % total);
      }
      if (event.key === "ArrowLeft") {
        setIndex((prev) => (prev - 1 + total) % total);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canSwipe, isFullscreenOpen, total]);

  const goTo = (nextIndex: number) => {
    if (!canSwipe) return;
    setIndex(nextIndex);
  };

  const goNext = () => {
    if (!canSwipe) return;
    setIndex((prev) => (prev + 1) % total);
  };

  const goPrev = () => {
    if (!canSwipe) return;
    setIndex((prev) => (prev - 1 + total) % total);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!canSwipe) return;
    startXRef.current = event.clientX;
    setIsDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !canSwipe) return;
    setDragOffset(event.clientX - startXRef.current);
  };

  const onPointerUp = () => {
    if (!isDragging || !canSwipe) return;

    if (dragOffset < -50) {
      goNext();
    } else if (dragOffset > 50) {
      goPrev();
    }

    setIsDragging(false);
    setDragOffset(0);
  };

  return (
    <>
      <div className="space-y-3">
        <div
          className="group relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-[0_35px_120px_-55px_rgba(8,15,33,0.95)]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div
            className={`flex h-full ${isDragging ? "" : "transition-transform duration-300 ease-out"}`}
            style={{
              transform: `translateX(calc(${-index * 100}% + ${dragOffset}px))`,
            }}
          >
            {normalizedImages.map((src, imageIndex) => (
              <button
                key={`${src}-${imageIndex}`}
                type="button"
                className="relative h-full w-full shrink-0 cursor-zoom-in bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-[#0d1a2b]"
                onClick={() => setIsFullscreenOpen(true)}
                aria-label={`Open image ${imageIndex + 1} in fullscreen`}
              >
                <ListingImage
                  src={src}
                  alt={alt}
                  fallbackSrc={PLACEHOLDER}
                  fill
                  className="object-contain"
                />
              </button>
            ))}
          </div>

          {featured && (
            <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900 backdrop-blur dark:bg-slate-950/70 dark:text-white">
              Featured
            </div>
          )}

          {canSwipe && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/85 p-2 text-slate-800 shadow transition hover:bg-white group-hover:inline-flex dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-900"
                aria-label="Previous image"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/85 p-2 text-slate-800 shadow transition hover:bg-white group-hover:inline-flex dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-900"
                aria-label="Next image"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Image position indicators">
          {normalizedImages.map((_, dotIndex) => {
            const isActive = dotIndex === index;
            return (
              <button
                key={`dot-${dotIndex}`}
                type="button"
                onClick={() => goTo(dotIndex)}
                className={`h-2.5 rounded-full transition-all ${isActive ? "w-6 bg-primary dark:bg-sky-300" : "w-2.5 bg-slate-300 dark:bg-slate-600"}`}
                aria-label={`Go to image ${dotIndex + 1}`}
                aria-current={isActive}
                disabled={!canSwipe}
              />
            );
          })}
        </div>

        {canSwipe && (
          <div className="hidden items-center justify-center gap-3 md:flex" aria-label="Image thumbnails">
            {normalizedImages.map((src, thumbIndex) => {
              const isActive = thumbIndex === index;
              return (
                <button
                  key={`thumb-${src}-${thumbIndex}`}
                  type="button"
                  onClick={() => goTo(thumbIndex)}
                  className={`relative aspect-[4/3] w-20 overflow-hidden rounded-xl border transition-all ${
                    isActive
                      ? "border-primary ring-2 ring-primary/30 dark:border-sky-300 dark:ring-sky-300/30"
                      : "border-slate-200/80 opacity-80 hover:opacity-100 dark:border-white/15"
                  }`}
                  aria-label={`Preview image ${thumbIndex + 1}`}
                  aria-current={isActive}
                >
                  <ListingImage
                    src={src}
                    alt={`${alt} thumbnail ${thumbIndex + 1}`}
                    fallbackSrc={PLACEHOLDER}
                    fill
                    className="object-contain bg-slate-50 dark:bg-[#0d1a2b]"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isFullscreenOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen image viewer"
          onClick={() => setIsFullscreenOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            onClick={() => setIsFullscreenOpen(false)}
            aria-label="Close fullscreen"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <div
            className="relative h-[82vh] w-full max-w-6xl overflow-hidden rounded-2xl"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <div
              className={`flex h-full ${isDragging ? "" : "transition-transform duration-300 ease-out"}`}
              style={{
                transform: `translateX(calc(${-index * 100}% + ${dragOffset}px))`,
              }}
            >
              {normalizedImages.map((src, imageIndex) => (
                <div key={`full-${src}-${imageIndex}`} className="relative h-full w-full shrink-0 bg-slate-950">
                  <ListingImage
                    src={src}
                    alt={alt}
                    fallbackSrc={PLACEHOLDER}
                    fill
                    className="object-contain"
                  />
                </div>
              ))}
            </div>

            {canSwipe && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
                  aria-label="Previous image"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
                  aria-label="Next image"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/45 px-3 py-2">
              {normalizedImages.map((_, dotIndex) => {
                const isActive = dotIndex === index;
                return (
                  <button
                    key={`fullscreen-dot-${dotIndex}`}
                    type="button"
                    onClick={() => goTo(dotIndex)}
                    className={`h-2.5 rounded-full transition-all ${isActive ? "w-6 bg-white" : "w-2.5 bg-white/45"}`}
                    aria-label={`Go to image ${dotIndex + 1}`}
                    aria-current={isActive}
                    disabled={!canSwipe}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}