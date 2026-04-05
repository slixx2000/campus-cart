"use client";

import { createClient } from "@/lib/supabase/client";

function mapAuthErrorMessage(message: string): string {
  if (/rate limit exceeded/i.test(message)) {
    return "Too many requests. Please wait a minute before trying again.";
  }
  return message;
}

function getSiteUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const normalized = vercel.startsWith("http") ? vercel : `https://${vercel}`;
    return normalized.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

function normalizeNextPath(nextPath?: string): string {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) return "/";
  return nextPath;
}

export async function sendPasswordResetEmail(email: string) {
  const supabase = createClient();
  const redirectTo = `${getSiteUrl()}/auth/callback?next=/auth/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error(mapAuthErrorMessage(error.message || "Could not send reset email."));
}

export async function signInWithGoogle(nextPath = "/") {
  const supabase = createClient();
  const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(normalizeNextPath(nextPath))}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) throw new Error(mapAuthErrorMessage(error.message || "Could not continue with Google."));
}
