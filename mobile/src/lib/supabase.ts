import Constants from "expo-constants";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) {
    return client;
  }

  const expoExtra = (Constants.expoConfig?.extra ?? {}) as {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
  };

  const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? expoExtra.supabaseUrl ?? "";
  const supabaseAnonKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? expoExtra.supabaseAnonKey ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY");
  }

  client = createClient(supabaseUrl.replace(/\/+$/, ""), supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  return client;
}
