import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Supabase client authenticated by an `Authorization: Bearer <access token>` header
 * rather than by cookies.
 *
 * The mobile app (Expo, AsyncStorage session) has no cookies, so it cannot use
 * `@/lib/supabase/server`. This is otherwise identical: the anon key is still the
 * apikey, the user's JWT still drives RLS, and nothing here bypasses a policy.
 *
 * Only for route handlers that mobile calls. Server Components and Server Actions
 * should keep using the cookie client.
 */
export function createBearerClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Extracts the token from an `Authorization: Bearer …` header, if present. */
export function bearerTokenFrom(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}
