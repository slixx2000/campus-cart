import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

export type PickedImage = {
  uri: string;
  mimeType: string;
  fileName: string;
};

export async function pickImages(): Promise<PickedImage[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required to add listing images.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.75,
    selectionLimit: 5,
  });

  if (result.canceled) return [];

  return result.assets.map((asset, index) => ({
    uri: asset.uri,
    mimeType: asset.mimeType || 'image/jpeg',
    fileName: asset.fileName || `listing-${Date.now()}-${index}.jpg`,
  }));
}

export async function uploadListingImages(userId: string, listingId: string, images: PickedImage[]) {
  const uploaded: { public_url: string; storage_path: string; sort_order: number }[] = [];

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const base64 = await FileSystem.readAsStringAsync(image.uri, {
      encoding: 'base64' as any,
    });

    const extension = image.fileName.split('.').pop() || 'jpg';
    const path = `${userId}/${listingId}/${Date.now()}-${index}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(path, decode(base64), {
        contentType: image.mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from('listing-images').getPublicUrl(path);
    uploaded.push({ public_url: data.publicUrl, storage_path: path, sort_order: index });
  }

  return uploaded;
}
