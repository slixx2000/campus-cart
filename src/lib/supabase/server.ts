import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { Database } from "@/types/database";

function isUuid(value?: string | null): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function extractSupabaseIdFromJwt(token?: string | null): string | null {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    const fromClaim = typeof payload?.supabase_id === "string" ? payload.supabase_id : null;
    if (isUuid(fromClaim)) return fromClaim;

    const fromSub = typeof payload?.sub === "string" ? payload.sub : null;
    if (isUuid(fromSub)) return fromSub;

    return null;
  } catch {
    return null;
  }
}

export async function createClient(): Promise<SupabaseClient<Database>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const clerk = await auth();
  const token = await clerk.getToken({ template: "campuscartclerk" });
  const subject = extractSupabaseIdFromJwt(token);

  const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  });

  // Store ALL original auth methods that Supabase might call internally
  const originalAuth = supabase.auth;

  // Override getUser to return our custom user from Clerk token
  supabase.auth.getUser = async () => {
    if (subject) {
      return {
        data: {
          user: { id: subject, email: null } as {
            id: string;
            email: string | null;
          },
        },
        error: null,
      };
    }
    return originalAuth.getUser();
  };

  // Delegate all other auth methods to the original to preserve internal Supabase functionality
  supabase.auth.getSession = originalAuth.getSession.bind(originalAuth);
  supabase.auth.getClaims = originalAuth.getClaims.bind(originalAuth);
  supabase.auth.refreshSession = originalAuth.refreshSession.bind(originalAuth);
  supabase.auth.onAuthStateChange = originalAuth.onAuthStateChange.bind(originalAuth);
  supabase.auth.signInWithPassword = originalAuth.signInWithPassword.bind(originalAuth);
  supabase.auth.signInWithOAuth = originalAuth.signInWithOAuth.bind(originalAuth);
  supabase.auth.signInWithOtp = originalAuth.signInWithOtp.bind(originalAuth);
  supabase.auth.signUp = originalAuth.signUp.bind(originalAuth);
  supabase.auth.signOut = originalAuth.signOut.bind(originalAuth);
  supabase.auth.resetPasswordForEmail = originalAuth.resetPasswordForEmail.bind(originalAuth);
  supabase.auth.updateUser = originalAuth.updateUser.bind(originalAuth);
  supabase.auth.setSession = originalAuth.setSession.bind(originalAuth);
  supabase.auth.exchangeCodeForSession = originalAuth.exchangeCodeForSession.bind(originalAuth);

  return supabase;
}
