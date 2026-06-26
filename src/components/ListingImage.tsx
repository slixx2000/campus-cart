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

  return (
    <Image
      src={displaySrc}
      alt={alt}
      fill={fill}
      className={className}
      priority={priority}
      unoptimized
      onError={() => setHasError(true)}
    />
  );
}
