"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Listing } from "@/types";

type NewListingsCarouselProps = {
  listings: Listing[];
};

const GAP_PX = 24;
const AUTO_SCROLL_PX_PER_SEC = 28;
const RESUME_COOLDOWN_MS = 3000;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function NewListingsCarousel({ listings }: NewListingsCarouselProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const measureCardRef = useRef<HTMLDivElement | null>(null);

  const [cardWidth, setCardWidth] = useState(300);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [cursorNearLeft, setCursorNearLeft] = useState(false);
  const [cursorNearRight, setCursorNearRight] = useState(false);

  const pausedUntilRef = useRef(0);
  const isPointerInteractingRef = useRef(false);
  const isHoveringRef = useRef(false);
  const scrollLeftRef = useRef(0);

  const stride = cardWidth + GAP_PX;
  const maxScrollableLeft = useMemo(() => {
    const viewport = viewportRef.current;
    if (!viewport) return 0;
    return Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  }, [listings.length, cardWidth, viewportWidth]);

  const total = listings.length;
  const visibleStart = clamp(Math.floor(scrollLeft / stride) - 1, 0, Math.max(0, total - 1));
  const visibleEnd = clamp(
    Math.ceil((scrollLeft + viewportWidth) / stride) + 1,
    0,
    Math.max(0, total - 1)
  );

  const leadingSpacer = visibleStart * stride;
  const trailingSpacer = Math.max(0, (total - visibleEnd - 1) * stride);
  const visibleListings = listings.slice(visibleStart, visibleEnd + 1);
  const canUseCarousel = total > 1;

  const pauseWithCooldown = () => {
    pausedUntilRef.current = Date.now() + RESUME_COOLDOWN_MS;
  };

  useEffect(() => {
    isHoveringRef.current = isHovering;
  }, [isHovering]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const measureCard = measureCardRef.current;
    if (!viewport || !measureCard) return;

    const updateMeasurements = () => {
      const nextWidth = Math.round(measureCard.getBoundingClientRect().width);
      if (nextWidth > 0) setCardWidth(nextWidth);
      setViewportWidth(viewport.clientWidth);
      setScrollLeft(viewport.scrollLeft);
      scrollLeftRef.current = viewport.scrollLeft;
    };

    updateMeasurements();

    const resizeObserver = new ResizeObserver(updateMeasurements);
    resizeObserver.observe(viewport);
    resizeObserver.observe(measureCard);

    return () => resizeObserver.disconnect();
  }, [total]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const next = viewport.scrollLeft;
        scrollLeftRef.current = next;
        setScrollLeft((prev) => (Math.abs(prev - next) > 1 ? next : prev));
      });
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      viewport.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!canUseCarousel) return;

    let rafId = 0;
    let lastTs = 0;

    // Auto-scroll loop: move a few pixels per frame, pause during hover/manual touch,
    // then resume only after the idle cooldown has elapsed.
    const tick = (ts: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      if (lastTs === 0) {
        lastTs = ts;
      }
      const delta = ts - lastTs;
      lastTs = ts;

      const isPausedForInteraction =
        isPointerInteractingRef.current ||
        isHoveringRef.current ||
        Date.now() < pausedUntilRef.current;

      if (!isPausedForInteraction) {
        const px = (AUTO_SCROLL_PX_PER_SEC * delta) / 1000;
        const maxLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        const nextLeft = viewport.scrollLeft + px;

        if (nextLeft >= maxLeft - 1) {
          viewport.scrollLeft = 0;
        } else {
          viewport.scrollLeft = nextLeft;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [canUseCarousel]);

  const scrollByDirection = (direction: "left" | "right") => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (!canUseCarousel) return;

    // Snap logic: compute a card-aligned target index so arrow clicks always
    // land on exact card boundaries across breakpoints.
    const maxLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const cardsPerViewport = Math.max(1, Math.floor(viewport.clientWidth / stride));
    const currentIndex = Math.round(scrollLeftRef.current / stride);
    const delta = direction === "right" ? cardsPerViewport : -cardsPerViewport;
    const maxIndex = Math.round(maxLeft / stride);
    const targetIndex = clamp(currentIndex + delta, 0, maxIndex);
    const targetLeft = clamp(targetIndex * stride, 0, maxLeft);

    viewport.scrollTo({ left: targetLeft, behavior: "smooth" });

    pauseWithCooldown();
  };

  const handlePointerDown = () => {
    isPointerInteractingRef.current = true;
  };

  const handlePointerUp = () => {
    isPointerInteractingRef.current = false;
    pauseWithCooldown();
  };

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const edgeZone = Math.min(130, rect.width * 0.2);
    setCursorNearLeft(localX <= edgeZone);
    setCursorNearRight(localX >= rect.width - edgeZone);
  };

  const showLeftButton = canUseCarousel && (isHovering || cursorNearLeft) && scrollLeft > 2;
  const showRightButton =
    canUseCarousel && (isHovering || cursorNearRight) && scrollLeft < maxScrollableLeft - 2;

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setCursorNearLeft(false);
        setCursorNearRight(false);
        pauseWithCooldown();
      }}
      onMouseMove={onMouseMove}
    >
      <div
        ref={viewportRef}
        className="overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div ref={listRef} className="flex items-stretch">
          <div style={{ width: leadingSpacer }} aria-hidden="true" />
          {visibleListings.map((listing, idx) => {
            const absoluteIndex = visibleStart + idx;
            return (
              <div
                key={listing.id}
                className="w-[78vw] shrink-0 pr-6 sm:w-[320px] lg:w-[300px]"
                data-index={absoluteIndex}
              >
                <ProductCard listing={listing} />
              </div>
            );
          })}
          <div style={{ width: trailingSpacer }} aria-hidden="true" />
        </div>
      </div>

      {/* Fade-in controls: hidden at rest, then revealed on hover or near-edge pointer. */}
      <button
        type="button"
        onClick={() => scrollByDirection("left")}
        className={`absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800 shadow-lg ring-1 ring-slate-200/80 transition-all dark:bg-slate-900/85 dark:text-slate-100 dark:ring-white/10 ${
          showLeftButton
            ? "opacity-100"
            : "opacity-0"
        } focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
        aria-label="Scroll new listings left"
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      <button
        type="button"
        onClick={() => scrollByDirection("right")}
        className={`absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800 shadow-lg ring-1 ring-slate-200/80 transition-all dark:bg-slate-900/85 dark:text-slate-100 dark:ring-white/10 ${
          showRightButton
            ? "opacity-100"
            : "opacity-0"
        } focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
        aria-label="Scroll new listings right"
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>

      <div className="sr-only" aria-live="polite">
        Showing {visibleStart + 1} to {visibleEnd + 1} of {total} listings.
      </div>

      <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-background-light to-transparent dark:from-background-dark" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-background-light to-transparent dark:from-background-dark" />

      <div className="absolute -z-10 opacity-0 pointer-events-none">
        <div ref={measureCardRef} className="w-[78vw] sm:w-[320px] lg:w-[300px]" />
      </div>
    </div>
  );
}