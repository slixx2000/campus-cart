import { Image } from "react-native";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const MAX_UPLOAD_BYTES = 0.8 * 1024 * 1024;
const MAX_DIMENSION = 1200;
const QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25];

async function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error),
    );
  });
}

function buildResizeAction(width: number, height: number) {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return [] as Array<{ resize: { width?: number; height?: number } }>;
  }

  if (width >= height) {
    return [{ resize: { width: MAX_DIMENSION } }];
  }

  return [{ resize: { height: MAX_DIMENSION } }];
}

async function getBlobSize(uri: string): Promise<number> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob.size;
}

export async function compressImageForUpload(uri: string): Promise<string> {
  const { width, height } = await getImageSize(uri);
  const actions = buildResizeAction(width, height);

  let bestUri = uri;
  let bestSize = Number.POSITIVE_INFINITY;

  for (const quality of QUALITY_STEPS) {
    const result = await manipulateAsync(uri, actions, {
      compress: quality,
      format: SaveFormat.JPEG,
    });

    bestUri = result.uri;

    const size = await getBlobSize(result.uri);
    bestSize = size;
    if (size <= MAX_UPLOAD_BYTES) {
      return result.uri;
    }
  }

  if (bestSize > MAX_UPLOAD_BYTES) {
    throw new Error("One or more images exceed the 0.8MB upload limit after compression.");
  }

  return bestUri;
}