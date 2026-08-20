import imageCompression from "browser-image-compression";

export const MAX_LISTING_IMAGE_COUNT = 6;
export const MAX_LISTING_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;

// Two variants per image. The full size is what the product page shows; the thumbnail
// is what the browse grid loads, which is the overwhelming majority of image requests.
// R2 has no on-the-fly resizing, so both are produced here — and serving a ready-made
// thumbnail also keeps the grid off Vercel's image-optimisation quota entirely.
const FULL_MAX_DIMENSION = 1200;
const FULL_TARGET_MB = 0.25;
const THUMB_MAX_DIMENSION = 400;
const THUMB_TARGET_MB = 0.03;

// Must stay <= the server's caps in src/lib/r2.ts; the presigned PUT signs
// content-length, so R2 rejects anything larger with a 403 regardless.
const FULL_HARD_LIMIT_BYTES = 400 * 1024;
const THUMB_HARD_LIMIT_BYTES = 60 * 1024;

export type UploadedListingImage = {
  objectKey: string;
  publicUrl: string;
  thumbPublicUrl: string;
};

type PresignedUpload = {
  key: string;
  thumbKey: string;
  putUrl: string;
  thumbPutUrl: string;
  publicUrl: string;
  thumbPublicUrl: string;
};

interface UploadListingImageOptions {
  listingId: string;
  onProgress?: (progress: number, stage: string) => void;
}

async function compress(file: File, maxSizeMB: number, maxWidthOrHeight: number): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    initialQuality: 0.8,
    fileType: "image/webp",
  });

  return new File([compressed], "image.webp", { type: "image/webp" });
}

/** WebP at two sizes. Exported so the sell form can preflight before submitting. */
export async function compressListingImage(file: File): Promise<{ full: File; thumb: File }> {
  let full: File;
  let thumb: File;

  try {
    full = await compress(file, FULL_TARGET_MB, FULL_MAX_DIMENSION);
    thumb = await compress(file, THUMB_TARGET_MB, THUMB_MAX_DIMENSION);
  } catch {
    throw new Error("We could not compress this image. Try a different file.");
  }

  // browser-image-compression treats maxSizeMB as a target, not a guarantee — a noisy
  // photo can land above it. Checking here produces a message the user can act on;
  // letting it through produces an opaque 403 from Cloudflare instead.
  if (full.size > FULL_HARD_LIMIT_BYTES || thumb.size > THUMB_HARD_LIMIT_BYTES) {
    throw new Error("That image is too detailed to compress enough. Try a different photo.");
  }

  return { full, thumb };
}

async function putToR2(url: string, file: File): Promise<void> {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "content-type": "image/webp",
      // Must match the value signed server-side, byte for byte, or the signature fails.
      "cache-control": "public, max-age=31536000, immutable",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Image upload failed. Please try again.");
  }
}

/**
 * Compresses to WebP, asks the server for presigned R2 URLs, and uploads both variants
 * straight to Cloudflare.
 *
 * The client no longer chooses where the bytes land: the key is derived server-side
 * from the JWT-verified user id and the listing it just proved ownership of.
 */
export async function uploadListingImage(
  file: File,
  { listingId, onProgress }: UploadListingImageOptions
): Promise<UploadedListingImage> {
  if (file.size > MAX_LISTING_IMAGE_SIZE_BYTES) {
    throw new Error("One of the selected files is too large to process.");
  }

  onProgress?.(15, "Compressing image...");
  const { full, thumb } = await compressListingImage(file);

  onProgress?.(45, "Preparing upload...");
  const response = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      listingId,
      images: [{ contentType: "image/webp", size: full.size, thumbSize: thumb.size }],
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "We could not prepare this upload. Please try again.");
  }

  const { uploads } = (await response.json()) as { uploads: PresignedUpload[] };
  const upload = uploads[0];
  if (!upload) {
    throw new Error("We could not prepare this upload. Please try again.");
  }

  onProgress?.(65, "Uploading image...");
  await putToR2(upload.putUrl, full);

  onProgress?.(90, "Uploading thumbnail...");
  await putToR2(upload.thumbPutUrl, thumb);

  onProgress?.(100, "Image uploaded");
  return {
    objectKey: upload.key,
    publicUrl: upload.publicUrl,
    thumbPublicUrl: upload.thumbPublicUrl,
  };
}
