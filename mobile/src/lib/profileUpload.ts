import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

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

  const { error } = await supabase.storage.from('profile-images').upload(path, decode(base64), {
    contentType: mimeType || 'image/jpeg',
    upsert: true,
  });

  if (error) throw new Error(error.message);

  return supabase.storage.from('profile-images').getPublicUrl(path).data.publicUrl;
}
