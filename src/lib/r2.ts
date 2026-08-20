import { createHash, createHmac, randomUUID } from "node:crypto";
import { cdnUrl, thumbKeyFor } from "@/lib/cdn";

export { cdnUrl, thumbKeyFor };

/**
 * Cloudflare R2 access, server-side only.
 *
 * SigV4 query presigning is ~40 lines of node:crypto, so this deliberately does not
 * pull in `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` — ~2MB of dependency
 * and cold-start cost in a serverless function to produce one signed query string.
 *
 * Correctness against R2 is verified live rather than by unit test: see the probe
 * results recorded in R2_MIGRATION_PLAN.md §"Phase 1". `assertR2SigningUnchanged()`
 * below is a regression lock over that verified behaviour, not an independent proof.
 */

const REGION = "auto";
const SERVICE = "s3";

export const R2_ALLOWED_CONTENT_TYPES = ["image/webp", "image/jpeg"] as const;
export type R2ContentType = (typeof R2_ALLOWED_CONTENT_TYPES)[number];

/** Signed into the PUT, so R2 rejects an oversized body with a 403 (verified in Phase 1). */
export const MAX_FULL_IMAGE_BYTES = 400 * 1024;
export const MAX_THUMB_IMAGE_BYTES = 60 * 1024;

/** Long enough for a slow mobile connection, short enough that a leaked URL is worthless. */
const PRESIGN_EXPIRY_SECONDS = 120;

/** Keys are unique per upload and never overwritten, so the object is immutable. */
export const R2_CACHE_CONTROL = "public, max-age=31536000, immutable";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  host: string;
};

function config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  // Unlike the mailer, this has no graceful degradation: an upload endpoint that
  // cannot sign is not usefully "degraded", it is broken, and failing loudly at the
  // first request is easier to diagnose than a 403 from Cloudflare.
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "Missing R2 environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET)."
    );
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    host: `${accountId}.r2.cloudflarestorage.com`,
  };
}

const sha256hex = (value: string) => createHash("sha256").update(value).digest("hex");
const hmac = (key: Buffer | string, value: string) =>
  createHmac("sha256", key).update(value).digest();

function signingKey(secretAccessKey: string, datestamp: string): Buffer {
  let key: Buffer = hmac(`AWS4${secretAccessKey}`, datestamp);
  for (const part of [REGION, SERVICE, "aws4_request"]) key = hmac(key, part);
  return key;
}

function timestamps(now: Date) {
  const amzdate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzdate, datestamp: amzdate.slice(0, 8) };
}

/** Each segment is encoded separately so the "/" separators survive. */
const encodeKey = (key: string) => key.split("/").map(encodeURIComponent).join("/");

type PresignArgs = {
  key: string;
  contentType: string;
  contentLength: number;
  now?: Date;
  cfg?: R2Config;
};

/**
 * A presigned PUT with `content-length`, `content-type` and `cache-control` as SIGNED
 * headers. Signing the length is what makes the size cap real: the client cannot send
 * a larger body than the server authorised, because the signature covers it. That is
 * strictly stronger than a client-side file-size check, which is trivially bypassed.
 */
export function presignPut({
  key,
  contentType,
  contentLength,
  now = new Date(),
  cfg = config(),
}: PresignArgs): string {
  const { amzdate, datestamp } = timestamps(now);
  const scope = `${datestamp}/${REGION}/${SERVICE}/aws4_request`;
  const path = `/${cfg.bucket}/${encodeKey(key)}`;
  const signedHeaders = "cache-control;content-length;content-type;host";

  const query = (
    [
      ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
      ["X-Amz-Credential", `${cfg.accessKeyId}/${scope}`],
      ["X-Amz-Date", amzdate],
      ["X-Amz-Expires", String(PRESIGN_EXPIRY_SECONDS)],
      ["X-Amz-SignedHeaders", signedHeaders],
    ] as const
  )
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .sort()
    .join("&");

  const canonicalHeaders =
    `cache-control:${R2_CACHE_CONTROL}\n` +
    `content-length:${contentLength}\n` +
    `content-type:${contentType}\n` +
    `host:${cfg.host}\n`;

  const canonicalRequest = [
    "PUT",
    path,
    query,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzdate,
    scope,
    sha256hex(canonicalRequest),
  ].join("\n");

  const signature = createHmac("sha256", signingKey(cfg.secretAccessKey, datestamp))
    .update(stringToSign)
    .digest("hex");

  return `https://${cfg.host}${path}?${query}&X-Amz-Signature=${signature}`;
}

/**
 * The client never proposes a key — it is derived here from the JWT-verified user id.
 * That is what makes cross-user writes and path traversal impossible by construction,
 * closing the gap in the old storage policy, which checked only `auth.role()`.
 */
export function buildImageKeys(userId: string, listingId: string, contentType: R2ContentType) {
  const extension = contentType === "image/webp" ? "webp" : "jpg";
  const key = `listings/${userId}/${listingId}/${randomUUID()}.${extension}`;
  return { key, thumbKey: thumbKeyFor(key) };
}

/**
 * Regression lock over the canonicalisation. Signing is all-or-nothing and fails as an
 * opaque 403 from Cloudflare, so pin the output for a fixed input: reordering the
 * signed headers, changing the query encoding, or dropping cache-control from the
 * signature all change this digest and get caught here rather than in production.
 *
 * Not auto-run: this module is imported by a route handler, and a self-check that
 * fires on import is a production hazard. Call it from a scratch script or a build
 * step instead.
 */
export function assertR2SigningUnchanged(): void {
  const cfg: R2Config = {
    accountId: "testaccount",
    accessKeyId: "AKIDEXAMPLE",
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
    bucket: "test-bucket",
    host: "testaccount.r2.cloudflarestorage.com",
  };

  const url = presignPut({
    key: "listings/user-1/listing-1/file-1.webp",
    contentType: "image/webp",
    contentLength: 12345,
    now: new Date("2026-08-20T12:00:00.000Z"),
    cfg,
  });

  const signature = new URL(url).searchParams.get("X-Amz-Signature");
  const expected = "9e125a8a6627fd85fa7492d09943e6b0ba53f73dced2e68675afa2ecb603d384";

  if (signature !== expected) {
    throw new Error(`R2 signing changed: expected ${expected}, got ${signature}`);
  }

  // Keys must stay inside the caller's namespace.
  const { key, thumbKey } = buildImageKeys("user-1", "listing-1", "image/webp");
  if (!key.startsWith("listings/user-1/listing-1/")) throw new Error("key escaped its namespace");
  if (!thumbKey.endsWith("_t.webp")) throw new Error("thumb key malformed");

  console.log("r2: signing + key namespacing OK");
}
