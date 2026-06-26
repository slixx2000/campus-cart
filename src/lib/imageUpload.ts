import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

export const MAX_LISTING_IMAGE_COUNT = 6;
export const MAX_LISTING_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;
const LISTING_IMAGE_MAX_SIZE_MB = 0.8;
const LISTING_IMAGE_COMPRESSED_MAX_BYTES = 800 * 1024;
const LISTING_IMAGE_MAX_DIMENSION = 1200;
const LISTING_IMAGE_BUCKET = "listing-images";

export type UploadedListingImage = {
  publicUrl: string;
  storagePath: string;
};

interface UploadListingImageOptions {
  userId: string;
  listingId: string;
  onProgress?: (progress: number, stage: string) => void;
}

export async function compressListingImage(file: File): Promise<File> {
  try {
    // Normalize every listing image into a lightweight JPEG before upload so
    // users send smaller files and the app stores a consistent format.
    const compressedFile = await imageCompression(file, {
      maxSizeMB: LISTING_IMAGE_MAX_SIZE_MB,
      maxWidthOrHeight: LISTING_IMAGE_MAX_DIMENSION,
      useWebWorker: true,
      initialQuality: 0.8,
      fileType: "image/jpeg",
    });

    if (compressedFile.size > LISTING_IMAGE_COMPRESSED_MAX_BYTES) {
      throw new Error("Compressed image is still too large to upload.");
    }

    return new File([compressedFile], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, {
      type: "image/jpeg",
    });
  } catch {
    throw new Error("We could not compress this image. Try a different file.");
  }
}

export async function uploadListingImage(
  file: File,
  { userId, listingId, onProgress }: UploadListingImageOptions
): Promise<UploadedListingImage> {
  if (file.size > MAX_LISTING_IMAGE_SIZE_BYTES) {
    throw new Error("One of the selected files is too large to process.");
  }

  onProgress?.(20, "Compressing image...");
  const compressedFile = await compressListingImage(file);

  const supabase = createClient();
  const fileId = crypto.randomUUID();
  const storagePath = `${userId}/${listingId}/${fileId}.jpg`;

  onProgress?.(70, "Uploading image...");
  const { error: uploadError } = await supabase.storage
    .from(LISTING_IMAGE_BUCKET)
    .upload(storagePath, compressedFile, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error("Image upload failed. Please try again.");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(LISTING_IMAGE_BUCKET).getPublicUrl(storagePath);

  onProgress?.(100, "Image uploaded");
  return { publicUrl, storagePath };
}
