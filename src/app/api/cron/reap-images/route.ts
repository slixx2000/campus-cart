import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { thumbKeyFor } from "@/lib/cdn";
import { presignDelete } from "@/lib/r2";
import type { Database } from "@/types/database";

const CRON_SECRET = process.env.CRON_SECRET;
const DEFAULT_RETENTION_DAYS = 30;
const DEFAULT_STALE_HOURS = 24;

function getSecretFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header && header.toLowerCase().startsWith("bearer ")) return header.slice(7);

  const routeSecret = request.headers.get("x-cron-secret");
  if (routeSecret) return routeSecret;

  const url = new URL(request.url);
  return url.searchParams.get("secret") ?? null;
}

function isAuthorized(request: Request): boolean {
  if (!CRON_SECRET) return false;
  const candidate = getSecretFromRequest(request);
  return Boolean(candidate) && candidate === CRON_SECRET;
}

function serviceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase service-role configuration.");
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function deleteR2ObjectIfPresent(key: string, dryRun: boolean) {
  if (!key) return { deleted: false, key, skipped: true };

  if (dryRun) {
    return { deleted: false, key, skipped: true };
  }

  const deleteUrl = presignDelete({ key });
  const response = await fetch(deleteUrl, { method: "DELETE" });

  if (response.status === 404) {
    return { deleted: false, key, skipped: true, alreadyAbsent: true };
  }

  if (!response.ok) {
    throw new Error(`R2 delete failed for ${key}: ${response.status}`);
  }

  return { deleted: true, key, skipped: false };
}

async function reapOrphans(supabase: ReturnType<typeof serviceRoleClient>, before: Date, dryRun: boolean) {
  const cutoff = before.toISOString();
  const { data: grants, error } = await supabase
    .from("upload_grants")
    .select("object_key, listing_id")
    .lt("created_at", cutoff);

  if (error) throw error;

  const items = grants ?? [];
  const orphanKeys: string[] = [];

  for (const grant of items) {
    if (!grant.object_key) continue;

    const { data: match, error: matchError } = await supabase
      .from("listing_images")
      .select("id")
      .eq("object_key", grant.object_key)
      .limit(1)
      .maybeSingle();

    if (matchError) throw matchError;
    if (match) continue;

    orphanKeys.push(grant.object_key);
  }

  for (const key of orphanKeys) {
    if (!dryRun) {
      await deleteR2ObjectIfPresent(key, false);
      await supabase.from("upload_grants").delete().eq("object_key", key);
    }
  }

  return { count: orphanKeys.length, keys: orphanKeys };
}

async function reapDraftListings(supabase: ReturnType<typeof serviceRoleClient>, before: Date, dryRun: boolean) {
  const cutoff = before.toISOString();
  const { data: drafts, error } = await supabase
    .from("listings")
    .select("id")
    .eq("status", "draft")
    .lt("created_at", cutoff);

  if (error) throw error;

  const ids = (drafts ?? []).map((listing) => listing.id);

  if (!dryRun && ids.length > 0) {
    await supabase.from("listings").delete().in("id", ids);
  }

  return { count: ids.length, ids };
}

async function reapSoftDeletedImages(
  supabase: ReturnType<typeof serviceRoleClient>,
  before: Date,
  retentionDays: number,
  dryRun: boolean
) {
  const retentionCutoff = new Date(before.getTime() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const { data: deletedListings, error: listingError } = await supabase
    .from("listings")
    .select("id")
    .not("deleted_at", "is", null)
    .lt("deleted_at", retentionCutoff);

  if (listingError) throw listingError;

  const listingIds = (deletedListings ?? []).map((listing) => listing.id);
  if (listingIds.length === 0) return { count: 0, ids: [] };

  const { data: images, error: imageError } = await supabase
    .from("listing_images")
    .select("id, object_key, listing_id")
    .in("listing_id", listingIds);

  if (imageError) throw imageError;

  const rows = images ?? [];
  for (const image of rows) {
    const key = image.object_key;
    if (!key) continue;

    if (!dryRun) {
      await deleteR2ObjectIfPresent(key, false);
      await deleteR2ObjectIfPresent(thumbKeyFor(key), false);
      await supabase.from("listing_images").delete().eq("id", image.id);
    }
  }

  return { count: rows.length, ids: rows.map((image) => image.id) };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") !== "false";
  const retentionDays = Number(url.searchParams.get("retentionDays") ?? DEFAULT_RETENTION_DAYS);
  const staleHours = Number(url.searchParams.get("staleHours") ?? DEFAULT_STALE_HOURS);

  try {
    const supabase = serviceRoleClient();
    const before = new Date();
    const staleBefore = new Date(before.getTime() - staleHours * 60 * 60 * 1000);

    const orphanSummary = await reapOrphans(supabase, staleBefore, dryRun);
    const draftSummary = await reapDraftListings(supabase, staleBefore, dryRun);
    const deletedListingImageSummary = await reapSoftDeletedImages(
      supabase,
      before,
      Number.isFinite(retentionDays) && retentionDays > 0 ? retentionDays : DEFAULT_RETENTION_DAYS,
      dryRun
    );

    return NextResponse.json({
      ok: true,
      dryRun,
      staleHours,
      retentionDays: Number.isFinite(retentionDays) && retentionDays > 0 ? retentionDays : DEFAULT_RETENTION_DAYS,
      summary: {
        orphanedUploadGrants: orphanSummary.count,
        staleDraftListings: draftSummary.count,
        staleDeletedImages: deletedListingImageSummary.count,
      },
      details: {
        orphanedUploadGrants: orphanSummary.keys,
        staleDraftListings: draftSummary.ids,
        staleDeletedImages: deletedListingImageSummary.ids,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown reaper error.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
