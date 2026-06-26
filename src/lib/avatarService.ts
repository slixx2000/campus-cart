import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

const PROFILE_IMAGE_BUCKET = "profile-images";
const DEFAULT_AVATAR_FOLDER = "profile-icons";
const PROFILE_AVATAR_MAX_SIZE_MB = 0.3;
const PROFILE_AVATAR_MAX_DIMENSION = 400;
const PROFILE_AVATAR_MAX_BYTES = 300 * 1024;

async function compressAvatarFile(file: File): Promise<File> {
  try {
    // Profile photos are compressed more aggressively because they are rendered
    // as small avatars across the app and do not need full-resolution assets.
    const compressedFile = await imageCompression(file, {
      maxSizeMB: PROFILE_AVATAR_MAX_SIZE_MB,
      maxWidthOrHeight: PROFILE_AVATAR_MAX_DIMENSION,
      useWebWorker: true,
      initialQuality: 0.82,
      fileType: "image/jpeg",
    });

    if (compressedFile.size > PROFILE_AVATAR_MAX_BYTES) {
      throw new Error("Compressed avatar is still too large.");
    }

    return new File([compressedFile], "avatar.jpg", { type: "image/jpeg" });
  } catch {
    throw new Error("We could not compress this avatar. Try another image.");
  }
}

export async function compressProfileAvatarForSubmit(file: File): Promise<File> {
  return compressAvatarFile(file);
}

export async function fetchDefaultAvatars(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .list(DEFAULT_AVATAR_FOLDER, {
      limit: 20,
      sortBy: { column: "name", order: "asc" },
    });

  if (error) {
    throw new Error("We could not load the default avatars.");
  }

  return (data ?? [])
    .filter((file) => file.name)
    .map((file) =>
      supabase.storage
        .from(PROFILE_IMAGE_BUCKET)
        .getPublicUrl(`${DEFAULT_AVATAR_FOLDER}/${file.name}`).data.publicUrl
    );
}

export async function uploadProfileAvatar(file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to upload an avatar.");
  }

  const compressedFile = await compressAvatarFile(file);
  const storagePath = `${user.id}/avatar.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .upload(storagePath, compressedFile, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw new Error("Avatar upload failed. Please try again.");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(storagePath);

  return publicUrl;
}
