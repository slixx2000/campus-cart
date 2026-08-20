/**
 * CDN URL construction. Deliberately free of any node: import so it can be used from
 * both the browser (imageUpload.ts) and the server (mappers.ts, the presign route) —
 * `src/lib/r2.ts` pulls in node:crypto and must never reach a client bundle.
 *
 * Postgres stores only the object key. The host lives here, read from env, so the CDN
 * domain can change without a data migration.
 */

/** Thumbnails are the full key with `_t` before the extension — see buildImageKeys. */
export function thumbKeyFor(objectKey: string): string {
  const dot = objectKey.lastIndexOf(".");
  return dot === -1 ? `${objectKey}_t` : `${objectKey.slice(0, dot)}_t${objectKey.slice(dot)}`;
}

export function cdnBase(): string {
  const base = process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/+$/, "");
  if (!base) throw new Error("Missing NEXT_PUBLIC_CDN_URL.");
  return base;
}

export function cdnUrl(objectKey: string): string {
  return `${cdnBase()}/${objectKey.split("/").map(encodeURIComponent).join("/")}`;
}

/** True for anything already served from our CDN — those are pre-sized and pre-WebP. */
export function isCdnUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/+$/, "");
  return Boolean(base) && url.startsWith(`${base}/`);
}
