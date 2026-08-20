"use client";

import Image from "next/image";
import { isCdnUrl } from "@/lib/cdn";
import { useState } from "react";

interface AvatarImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export default function AvatarImage({
  src,
  alt,
  className = "h-full w-full object-cover",
  fallbackClassName = "flex h-full w-full items-center justify-center bg-primary/10 text-primary",
}: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={fallbackClassName} aria-label={alt}>
        <span className="material-symbols-outlined text-3xl">person</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={256}
      height={256}
      sizes="256px"
      unoptimized={src.endsWith(".svg") || isCdnUrl(src)}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
