import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { getPaymentProvider } from "@/lib/payments";
import type { Database } from "@/types/database";

export const runtime = "nodejs";

function serviceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase service-role configuration.");
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-bila-signature");
  const timestamp = request.headers.get("x-bila-timestamp");
  const eventName = request.headers.get("x-bila-event");
  const deliveryId = request.headers.get("x-bila-delivery") || null;

  const provider = getPaymentProvider();
  if (!provider.verifyWebhook(rawBody, signature, timestamp)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const parsed = provider.parseWebhook(rawBody, {
    "x-bila-event": eventName,
    "x-bila-signature": signature,
    "x-bila-timestamp": timestamp,
  });

  if (!parsed) {
    return NextResponse.json({ error: "Unrecognized webhook payload" }, { status: 400 });
  }

  try {
    const supabase = serviceRoleClient();

    // Idempotency: if we've already recorded this delivery, return success
    if (deliveryId) {
      const { data: existingEvent } = await supabase
        .from("payment_webhook_events")
        .select("id")
        .eq("provider_event_id", deliveryId)
        .maybeSingle();

      if (existingEvent) {
        return NextResponse.json({ ok: true, message: "Already processed." });
      }
    }

    // Resolve the payment record if present
    let paymentId: string | null = null;
    let { data: matchedPayment } = await supabase
      .from("payments")
      .select("id, user_id, product_id, status, amount_minor, metadata")
      .or(
        `provider_payment_id.eq.${parsed.providerPaymentId},provider_reference.eq.${parsed.providerPaymentId}`
      )
      .limit(1)
      .maybeSingle();

    // If still not found, try matching by transactionId stored in metadata
    if (!matchedPayment && parsed.transactionId) {
      const { data: byTxn } = await supabase
        .from("payments")
        .select("id, user_id, product_id, status, amount_minor, metadata")
        .like("metadata", `%${parsed.transactionId}%`)
        .limit(1)
        .maybeSingle();
      matchedPayment = byTxn ?? null;
    }

    if (matchedPayment) paymentId = matchedPayment.id;

    // If we couldn't match a payment, record nothing and return success so Bila doesn't retry repeatedly.
    if (!paymentId) {
      console.warn("Incoming payment webhook could not be matched to any payment record", {
        providerPaymentId: parsed.providerPaymentId,
        transactionId: parsed.transactionId,
      });
      return NextResponse.json({ ok: true, message: "No matching payment; recorded as ignored." });
    }

    // Insert webhook event record (typed)
    const eventInsert: Database["public"]["Tables"]["payment_webhook_events"]["Insert"] = {
      payment_id: paymentId,
      provider: parsed.provider,
      event_name: parsed.event,
      provider_event_id: deliveryId,
      status: parsed.status,
      payload: JSON.parse(JSON.stringify(parsed.raw ?? {})),
    };

    const { error: insertEventError } = await supabase.from("payment_webhook_events").insert(eventInsert);

    if (insertEventError) {
      // If unique violation on provider_event_id happened concurrently, treat as success
      console.error("Failed inserting webhook event:", insertEventError.message);
    }

    // Update payment status now that we know we have a matching payment
    if (paymentId) {
      const updates: Record<string, unknown> = { status: parsed.status };
      if (parsed.status === "paid") updates.paid_at = new Date().toISOString();

      const { error: updateError } = await supabase.from("payments").update(updates).eq("id", paymentId);
      if (updateError) console.error("Failed updating payment status:", updateError.message);

      // Activation: if this payment bought a listing-level promotion, activate it
      const { data: paymentRow } = await supabase
        .from("payments")
        .select("id, user_id, product_id, purpose, amount_minor, metadata, fulfilled_at")
        .eq("id", paymentId)
        .maybeSingle();

      // Check if already fulfilled (idempotency)
      if (paymentRow && parsed.status === "paid" && !paymentRow.fulfilled_at) {
        const purpose = paymentRow.purpose as string;
        const metadata = paymentRow.metadata as Record<string, unknown> | null;

        // proceed only for listing-scoped promotions
        if ((purpose === "listing_boost" || purpose === "featured_listing") && metadata?.listingId) {
          const listingId = metadata.listingId as string;

          // determine duration: try product -> metadata.duration_days -> default 1
          let durationDays = 1;
          if (paymentRow.product_id) {
            const { data: prod } = await supabase
              .from("payment_products")
              .select("duration_days")
              .eq("id", paymentRow.product_id)
              .maybeSingle();
            if (prod?.duration_days) durationDays = prod.duration_days;
          } else if (metadata && typeof metadata.duration_days === "number") {
            durationDays = metadata.duration_days as number;
          }

          const now = new Date();
          const amountKwacha = paymentRow.amount_minor ? (paymentRow.amount_minor / 100.0) : null;

          if (purpose === "listing_boost") {
            // Paid boost: update last_bumped_at (bypasses 24h cooldown) and record promotion for audit
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: boostError } = await (supabase as any).rpc("paid_boost_listing", {
              p_listing_id: listingId,
              p_user_id: paymentRow.user_id,
              p_days: durationDays,
            });
            if (boostError) console.error("Failed applying paid boost:", boostError.message);

            // Record boost promotion for audit trail (does not affect featured cache)
            const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();
            const { error: promoError } = await supabase.from("listing_promotions").insert({
              listing_id: listingId,
              kind: "boost",
              starts_at: now.toISOString(),
              ends_at: endsAt,
              amount_kwacha: amountKwacha,
              note: "Paid boost via webhook",
              granted_by: paymentRow.user_id,
            });
            if (promoError) console.error("Failed inserting boost promotion:", promoError.message);
          } else if (purpose === "featured_listing") {
            // Featured listing: insert promotion and refresh featured cache
            // compute ends_at by extending existing active window if present
            const { data: currentEnd } = await supabase
              .from("listing_promotions")
              .select("ends_at")
              .eq("listing_id", listingId)
              .gt("ends_at", now.toISOString())
              .order("ends_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            let startsAt = now.toISOString();
            let endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

            if (currentEnd && currentEnd.ends_at) {
              const current = new Date(currentEnd.ends_at);
              startsAt = now.toISOString();
              endsAt = new Date(current.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();
            }

            const { error: promoError } = await supabase.from("listing_promotions").insert({
              listing_id: listingId,
              kind: "featured",
              starts_at: startsAt,
              ends_at: endsAt,
              amount_kwacha: amountKwacha,
              note: null,
              granted_by: paymentRow.user_id,
            });

            if (promoError) console.error("Failed inserting listing promotion:", promoError.message);

            // Refresh the featured listing cache
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: refreshError } = await (supabase as any).rpc("refresh_featured_listings");
            if (refreshError) console.error("Failed refreshing featured listings:", refreshError.message);
          }

          // Mark payment as fulfilled (idempotency)
          await supabase.from("payments").update({ fulfilled_at: now.toISOString() }).eq("id", paymentId);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Webhook processing error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
