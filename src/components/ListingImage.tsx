"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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
  // placeholders are all SVG — they're tiny, so serve those as-is and optimise
  // the real (Supabase-hosted) photos.
  const isSvg = displaySrc.endsWith(".svg");

  return (
    <Image
      src={displaySrc}
      alt={alt}
      fill={fill}
      className={className}
      priority={priority}
      sizes={fill ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" : undefined}
      unoptimized={isSvg}
      onError={() => setHasError(true)}
    />
  );
}
