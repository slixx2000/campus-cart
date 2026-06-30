import { NextResponse } from "next/server";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function fallbackName(email: string | null | undefined) {
  return email?.split("@")[0] || "CampusCart User";
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing server environment configuration." }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    supabaseId?: string;
    fullName?: string;
    phone?: string | null;
  };

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "Clerk user not found." }, { status: 404 });
  }

  const existingSupabaseId = isUuid(clerkUser.publicMetadata?.supabase_id)
    ? clerkUser.publicMetadata.supabase_id
    : null;
  const requestedSupabaseId = isUuid(body.supabaseId) ? body.supabaseId : null;
  const effectiveSupabaseId = existingSupabaseId ?? requestedSupabaseId;

  if (!effectiveSupabaseId) {
    return NextResponse.json({ error: "Missing supabaseId." }, { status: 400 });
  }

  if (!existingSupabaseId) {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...clerkUser.publicMetadata,
        supabase_id: effectiveSupabaseId,
      },
    });
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const adminSupabase = createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await adminSupabase.from("profiles").upsert(
    {
      id: effectiveSupabaseId,
      full_name: body.fullName?.trim() || clerkUser.fullName || fallbackName(email),
      phone: body.phone?.trim() || null,
    },
    { onConflict: "id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ supabaseId: effectiveSupabaseId });
}
