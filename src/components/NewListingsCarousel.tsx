"use client";

import { useEffect, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Listing } from "@/types";

type NewListingsCarouselProps = {
  listings: Listing[];
};

const GAP_PX = 24;
const AUTO_SCROLL_PX_PER_SEC = 34;
const RESUME_COOLDOWN_MS = 3000;
const RESUME_RAMP_MS = 650;

export default function NewListingsCarousel({ listings }: NewListingsCarouselProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const measureCardRef = useRef<HTMLDivElement | null>(null);

  const [cardWidth, setCardWidth] = useState(300);
  const [isHovering, setIsHovering] = useState(false);
  const [cursorNearLeft, setCursorNearLeft] = useState(false);
  const [cursorNearRight, setCursorNearRight] = useState(false);

  const pausedUntilRef = useRef(0);
  const isPointerInteractingRef = useRef(false);
  const scrollLeftRef = useRef(0);
  const autoScrollLeftRef = useRef(0);

  const stride = cardWidth + GAP_PX;
  const total = listings.length;
  const loopPoint = Math.max(0, stride * total);
  const canUseCarousel = total > 1;
  const renderedListings = canUseCarousel ? [...listings, ...listings, ...listings] : listings;

  const pauseWithCooldown = () => {
    pausedUntilRef.current = Date.now() + RESUME_COOLDOWN_MS;
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    const measureCard = measureCardRef.current;
    if (!viewport || !measureCard) return;

    const updateMeasurements = () => {
      const nextWidth = Math.round(measureCard.getBoundingClientRect().width);
      if (nextWidth > 0) setCardWidth(nextWidth);
      scrollLeftRef.current = viewport.scrollLeft;
      autoScrollLeftRef.current = viewport.scrollLeft;
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
    const onScroll = () => {
      const next = viewport.scrollLeft;
      scrollLeftRef.current = next;
      autoScrollLeftRef.current = next;
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      viewport.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !canUseCarousel || loopPoint <= 0) return;

    const minBand = loopPoint * 0.6;
    const maxBand = loopPoint * 1.4;
    if (viewport.scrollLeft < minBand || viewport.scrollLeft > maxBand) {
      viewport.scrollLeft = loopPoint;
      scrollLeftRef.current = loopPoint;
      autoScrollLeftRef.current = loopPoint;
    }
  }, [canUseCarousel, loopPoint]);

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
      const delta = Math.min(ts - lastTs, 34);
      lastTs = ts;

      const isPausedForInteraction =
        isPointerInteractingRef.current ||
        Date.now() < pausedUntilRef.current;

      if (!isPausedForInteraction) {
        const now = Date.now();
        const timeSinceResume = Math.max(0, now - pausedUntilRef.current);
        const resumeProgress = Math.min(1, timeSinceResume / RESUME_RAMP_MS);
        const easedResume = 1 - Math.pow(1 - resumeProgress, 3);
        const px = (AUTO_SCROLL_PX_PER_SEC * easedResume * delta) / 1000;
        let nextLeft = autoScrollLeftRef.current + px;

        if (loopPoint > 0) {
          if (nextLeft >= loopPoint * 2) nextLeft -= loopPoint;
          if (nextLeft < loopPoint) nextLeft += loopPoint;
        }

        autoScrollLeftRef.current = nextLeft;
        scrollLeftRef.current = nextLeft;
        viewport.scrollLeft = nextLeft;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [canUseCarousel, loopPoint]);

  const scrollByDirection = (direction: "left" | "right") => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (!canUseCarousel) return;

    const delta = direction === "right" ? viewport.clientWidth * 0.8 : -viewport.clientWidth * 0.8;
    let targetLeft = scrollLeftRef.current + delta;

    if (loopPoint > 0) {
      if (targetLeft < loopPoint) targetLeft += loopPoint;
      if (targetLeft >= loopPoint * 2) targetLeft -= loopPoint;
    }

    autoScrollLeftRef.current = targetLeft;
    scrollLeftRef.current = targetLeft;
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

  const showLeftButton = canUseCarousel && (isHovering || cursorNearLeft);
  const showRightButton = canUseCarousel && (isHovering || cursorNearRight);

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setCursorNearLeft(false);
        setCursorNearRight(false);
      }}
      onMouseMove={onMouseMove}
    >
      <div
        ref={viewportRef}
        className="overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="flex items-stretch">
          {renderedListings.map((listing, idx) => {
            return (
              <div
                key={`${listing.id}-${idx}`}
                ref={idx === 0 ? measureCardRef : undefined}
                className="w-[78vw] shrink-0 pr-6 sm:w-[320px] lg:w-[300px]"
                data-index={idx}
              >
                <ProductCard listing={listing} />
              </div>
            );
          })}
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
        Showing a continuously scrolling feed of {total} new listings.
      </div>

      <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-background-light to-transparent dark:from-background-dark" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-background-light to-transparent dark:from-background-dark" />

    </div>
  );
}