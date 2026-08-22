import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import { CDN_URL, UPLOAD_API_URL } from './constants';
import { supabase } from './supabase';

export type PickedImage = {
  uri: string;
  mimeType: string;
  fileName: string;
};

export type UploadedListingImage = {
  objectKey: string;
  publicUrl: string;
  thumbPublicUrl: string;
};

const FULL_MAX_DIMENSION = 1200;
const THUMB_MAX_DIMENSION = 400;
const FULL_MAX_BYTES = 400 * 1024;
const THUMB_MAX_BYTES = 60 * 1024;

async function toUploadBytes(uri: string, maxDimension: number, quality: number): Promise<Uint8Array> {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: maxDimension } }],
    { compress: quality, format: SaveFormat.JPEG }
  );

  const base64 = await FileSystem.readAsStringAsync(result.uri, {
    encoding: 'base64' as any,
  });

  return new Uint8Array(decode(base64));
}

async function putPresignedUrl(url: string, body: Uint8Array, contentType: 'image/jpeg') {
  const bodyBuffer = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'content-type': contentType,
      'cache-control': 'public, max-age=31536000, immutable',
    },
    body: bodyBuffer,
  });

  if (!response.ok) {
    throw new Error('Image upload failed. Please try again.');
  }
}

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
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (sessionError || !accessToken) {
    throw new Error('Your session expired. Please sign in again.');
  }

  const requests = await Promise.all(
    images.map(async (image) => {
      const fullBytes = await toUploadBytes(image.uri, FULL_MAX_DIMENSION, 0.8);
      const thumbBytes = await toUploadBytes(image.uri, THUMB_MAX_DIMENSION, 0.7);

      if (fullBytes.byteLength > FULL_MAX_BYTES || thumbBytes.byteLength > THUMB_MAX_BYTES) {
        throw new Error('That image is too detailed to compress enough. Try a different photo.');
      }

      return { image, fullBytes, thumbBytes };
    })
  );

  const response = await fetch(UPLOAD_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      listingId,
      images: requests.map(({ image, fullBytes, thumbBytes }) => ({
        contentType: 'image/jpeg',
        size: fullBytes.byteLength,
        thumbSize: thumbBytes.byteLength,
      })),
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'We could not prepare this upload. Please try again.');
  }

  const { uploads } = (await response.json()) as { uploads: { key: string; thumbKey: string; putUrl: string; thumbPutUrl: string; publicUrl: string; thumbPublicUrl: string }[] };
  const uploaded: UploadedListingImage[] = [];

  for (let index = 0; index < requests.length; index += 1) {
    const request = requests[index];
    const upload = uploads[index];

    if (!request || !upload) {
      throw new Error('We could not prepare this upload. Please try again.');
    }

    await putPresignedUrl(upload.putUrl, request.fullBytes, 'image/jpeg');
    await putPresignedUrl(upload.thumbPutUrl, request.thumbBytes, 'image/jpeg');

    uploaded.push({
      objectKey: upload.key,
      publicUrl: upload.publicUrl,
      thumbPublicUrl: upload.thumbPublicUrl,
    });
  }

  return uploaded;
}

export function objectKeyToCdnUrl(objectKey: string): string {
  const base = CDN_URL.replace(/\/+$/, '');
  return `${base}/${objectKey.split('/').map((segment) => encodeURIComponent(segment)).join('/')}`;
}

export function thumbKeyFor(objectKey: string): string {
  const dot = objectKey.lastIndexOf('.');
  return dot === -1 ? `${objectKey}_t` : `${objectKey.slice(0, dot)}_t${objectKey.slice(dot)}`;
}
