import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

const PROFILE_IMAGE_BUCKET = 'profile-images';
const DEFAULT_AVATAR_FOLDER = 'profile-icons';

export async function pickSingleProfileImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required to update your avatar.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    quality: 0.75,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0];
}

export async function uploadProfileAvatar(userId: string, uri: string, mimeType?: string, fileName?: string) {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64' as any,
  });

  const extension = fileName?.split('.').pop() || 'jpg';
  const path = `${userId}/avatar-${Date.now()}.${extension}`;

  console.log('[PROFILE UPLOAD] Starting avatar upload:', { path, userId });

  const { error } = await supabase.storage.from('profile-images').upload(path, decode(base64), {
    contentType: mimeType || 'image/jpeg',
    upsert: true,
  });

  if (error) {
    console.error('[PROFILE UPLOAD ERROR]', error);
    throw new Error(`Failed to upload avatar: ${error.message}`);
  }

  const { data } = supabase.storage.from('profile-images').getPublicUrl(path);
  const publicUrl = data.publicUrl;
  console.log('[PROFILE UPLOAD] Success:', { publicUrl, path });
  
  return publicUrl;
}

export async function fetchDefaultAvatars(): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .list(DEFAULT_AVATAR_FOLDER, {
      limit: 9,
      sortBy: { column: 'name', order: 'asc' },
    });

  if (error) {
    throw new Error('We could not load the default avatars.');
  }

  return (data ?? [])
    .filter((file) => file.name)
    .map((file) =>
      supabase.storage
        .from(PROFILE_IMAGE_BUCKET)
        .getPublicUrl(`${DEFAULT_AVATAR_FOLDER}/${file.name}`).data.publicUrl
    );
}
