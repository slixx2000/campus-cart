"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { isCdnUrl } from "@/lib/cdn";

interface ListingImageProps {
  src?: string;
  alt: string;
  fallbackSrc: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  contentFit?: "cover" | "contain";
}

export default function ListingImage({
  src,
  alt,
  fallbackSrc,
  fill = false,
  className = "",
  priority = false,
}: ListingImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const displaySrc = hasError || !src ? fallbackSrc : src;
  // The optimizer rejects SVG unless dangerouslyAllowSVG is set, and the local
  // placeholders are all SVG — they're tiny, so serve those as-is.
  // R2/CDN images are already WebP at the right size (full ~250KB, thumb ~30KB), so
  // re-optimising them buys nothing and spends Vercel's image quota. Supabase-hosted
  // images predate the cutover and still go through the optimizer.
  const skipOptimizer = displaySrc.endsWith(".svg") || isCdnUrl(displaySrc);

  return (
    <Image
      src={displaySrc}
      alt={alt}
      fill={fill}
      className={className}
      priority={priority}
      sizes={fill ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" : undefined}
      unoptimized={skipOptimizer}
      onError={() => setHasError(true)}
    />
  );
}
