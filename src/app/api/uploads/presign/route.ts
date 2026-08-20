import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { bearerTokenFrom, createBearerClient } from "@/lib/supabase/bearer";
import {
  MAX_FULL_IMAGE_BYTES,
  MAX_THUMB_IMAGE_BYTES,
  R2_ALLOWED_CONTENT_TYPES,
  buildImageKeys,
  cdnUrl,
  presignPut,
} from "@/lib/r2";

/**
 * Mints presigned R2 PUT URLs for listing images.
 *
 * This endpoint replaces what the Supabase Storage INSERT policy used to do — except
 * that policy only checked `auth.role() = 'authenticated'` and never checked the path,
 * so any signed-in user could write into anyone's folder. Here the caller never
 * proposes a key: it is derived from the JWT-verified user id, so that hole cannot
 * exist.
 *
 * Called by the web app (cookie session) and by the Expo app (Bearer token). The path
 * is a frozen public contract — APKs distributed via GitHub Releases hardcode it and
 * cannot be force-updated.
 */

// Matches MAX_LISTING_IMAGE_COUNT in src/lib/imageUpload.ts.
const MAX_IMAGES_PER_LISTING = 6;

// Ten listings/hour (the listings_owner_insert policy) x six images.
const MAX_GRANTS_PER_HOUR = 60;

const requestSchema = z.object({
  listingId: z.string().uuid(),
  images: z
    .array(
      z.object({
        contentType: z.enum(R2_ALLOWED_CONTENT_TYPES),
        size: z.number().int().positive().max(MAX_FULL_IMAGE_BYTES),
        thumbSize: z.number().int().positive().max(MAX_THUMB_IMAGE_BYTES),
      })
    )
    .min(1)
    .max(MAX_IMAGES_PER_LISTING),
});

export async function POST(request: Request) {
  try {
    // Authenticate before parsing: an anonymous caller should not get detailed
    // validation feedback, and should not cost us the work.
    // Mobile sends a Bearer token; the web app sends cookies.
    const token = bearerTokenFrom(request);
    const supabase = token ? createBearerClient(token) : await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in to upload images." }, { status: 401 });
    }

    // request.json() throws on a malformed body — that is a client error, not ours,
    // so catch it here rather than letting it fall through to the 500 handler.
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid upload request.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { listingId, images } = parsed.data;

    // 1. Same gate as createListingAction — only verified students can sell.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_verified_student")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
    if (!profile?.is_verified_student) {
      return NextResponse.json(
        { error: "Only verified students can upload listing images." },
        { status: 403 }
      );
    }

    // 2. Ownership. The listing row must already exist — this is why the sell flow
    //    creates a draft first. Without a row there is nothing to check against, and
    //    we would be back to trusting a client-generated id.
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, seller_id")
      .eq("id", listingId)
      .maybeSingle();

    if (listingError) {
      return NextResponse.json({ error: listingError.message }, { status: 500 });
    }
    if (!listing || listing.seller_id !== user.id) {
      // Same response for "missing" and "someone else's" so this cannot be used to
      // probe which listing ids exist.
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    // 3. Quota. Counting listing_images alone is not enough: those rows are only
    //    written at publish time, so during a single sell session the count is 0 no
    //    matter how many URLs have already been handed out. Counting grants for this
    //    listing too closes that — one grant is recorded per image (the thumbnail key
    //    is derived, not granted separately), so grants are directly comparable to
    //    images.
    const [{ count: existingCount, error: countError }, { count: grantedCount, error: grantErr }] =
      await Promise.all([
        supabase
          .from("listing_images")
          .select("id", { count: "exact", head: true })
          .eq("listing_id", listingId),
        supabase
          .from("upload_grants")
          .select("object_key", { count: "exact", head: true })
          .eq("listing_id", listingId),
      ]);

    if (countError || grantErr) {
      return NextResponse.json({ error: (countError ?? grantErr)!.message }, { status: 500 });
    }
    if (Math.max(existingCount ?? 0, grantedCount ?? 0) + images.length > MAX_IMAGES_PER_LISTING) {
      return NextResponse.json(
        { error: `A listing can have at most ${MAX_IMAGES_PER_LISTING} images.` },
        { status: 409 }
      );
    }

    // 4. Rate limit. Counting listing_images would not work — an abuser who uploads
    //    but never inserts rows never appears there. Counting grants does.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentGrants, error: grantCountError } = await supabase
      .from("upload_grants")
      .select("object_key", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneHourAgo);

    if (grantCountError) {
      return NextResponse.json({ error: grantCountError.message }, { status: 500 });
    }
    if ((recentGrants ?? 0) + images.length > MAX_GRANTS_PER_HOUR) {
      return NextResponse.json(
        { error: "Too many uploads in the last hour. Please try again later." },
        { status: 429 }
      );
    }

    // 5. Sign. content-length and content-type are signed headers, so R2 itself
    //    rejects a body of the wrong size or type with a 403 — the client cannot
    //    talk its way past the cap.
    const expiresAt = new Date(Date.now() + 120 * 1000).toISOString();
    const uploads = images.map((image) => {
      const { key, thumbKey } = buildImageKeys(user.id, listingId, image.contentType);
      return {
        key,
        thumbKey,
        putUrl: presignPut({
          key,
          contentType: image.contentType,
          contentLength: image.size,
        }),
        thumbPutUrl: presignPut({
          key: thumbKey,
          contentType: image.contentType,
          contentLength: image.thumbSize,
        }),
        publicUrl: cdnUrl(key),
        thumbPublicUrl: cdnUrl(thumbKey),
        expiresAt,
      };
    });

    // 6. Record the grants. This is both the rate-limit counter above and the ledger
    //    the reaper walks to find objects that were uploaded but never attached.
    // One row per image, not per object: the thumbnail key is `thumbKeyFor(key)`, so
    // the reaper can derive it. Keeps grants countable against the 6-image cap.
    const { error: grantError } = await supabase.from("upload_grants").insert(
      uploads.map((upload) => ({
        object_key: upload.key,
        user_id: user.id,
        listing_id: listingId,
      }))
    );

    if (grantError) {
      return NextResponse.json({ error: grantError.message }, { status: 500 });
    }

    return NextResponse.json({ uploads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare the upload.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
