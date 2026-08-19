/**
 * Canonical public origin, without a trailing slash.
 *
 * Set NEXT_PUBLIC_SITE_URL in production. Vercel injects VERCEL_URL for preview
 * deployments, which is why that fallback exists; localhost is the last resort so
 * a missing env var degrades to a working dev link rather than an empty string.
 * (The admin verification link was previously hardcoded to localhost:3000 for
 * exactly this reason.)
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return "http://localhost:3000";
}
