import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createPaymentSession } from "@/lib/payments";
import type { Database } from "@/types/database";

const createSessionSchema = z.object({
  productId: z.string().uuid().optional(),
  amountMinor: z.coerce.number().int().positive().optional(),
  purpose: z.enum([
    "listing_boost",
    "featured_listing",
    "seller_subscription",
    "storefront_upgrade",
    "advertisement",
    "sponsored_deal",
    "transaction_fee",
    "delivery",
  ]).default("listing_boost"),
  listingId: z.string().uuid().optional(),
  phone: z.string().min(7).max(20),
  operator: z.string().min(2).max(30).optional(),
  customerName: z.string().min(2).max(120).optional(),
  narration: z.string().max(200).optional(),
  reference: z.string().max(120).optional(),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const productId = parsed.data.productId;
    let amountMinor = parsed.data.amountMinor;
    let productRow = null as { id: string; price_minor: number; kind: string; name: string } | null;

    if (productId) {
      const { data, error } = await supabase
        .from("payment_products")
        .select("id, kind, name, price_minor")
        .eq("id", productId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (!data) {
        return NextResponse.json({ error: "Selected product is unavailable" }, { status: 404 });
      }

      productRow = data;
      amountMinor = data.price_minor;
    }

    // For listing-scoped purchases require a listingId
    if ((parsed.data.purpose === "listing_boost" || parsed.data.purpose === "featured_listing") && !parsed.data.listingId) {
      return NextResponse.json({ error: "listingId is required for this product purpose" }, { status: 400 });
    }

    if (!amountMinor || amountMinor <= 0) {
      return NextResponse.json({ error: "A valid amount is required" }, { status: 400 });
    }

    const paymentReference = parsed.data.reference || `campuscart-${user.id.slice(0, 8)}-${randomUUID()}`;
    const amountZmw = amountMinor / 100;

    const providerSession = await createPaymentSession({
      amount: amountZmw,
      reference: paymentReference,
      phone: parsed.data.phone,
      operator: parsed.data.operator,
      customerName: parsed.data.customerName ?? "CampusCart customer",
      narration: parsed.data.narration ?? "CampusCart payment",
      country: "zm",
    });

    const paymentMetadata = JSON.parse(
      JSON.stringify({
        providerSession: providerSession.raw ?? null,
        productId: productRow?.id ?? null,
        productName: productRow?.name ?? null,
        productKind: productRow?.kind ?? null,
        listingId: parsed.data.listingId ?? null,
      }),
    );

    const paymentInsert: Database["public"]["Tables"]["payments"]["Insert"] = {
      user_id: user.id,
      product_id: productRow?.id ?? null,
      provider: "bila",
      provider_payment_id: providerSession.providerPaymentId ?? null,
      provider_reference: providerSession.reference ?? null,
      payment_reference: paymentReference,
      status: providerSession.status,
      purpose: parsed.data.purpose,
      amount_minor: amountMinor,
      currency: "ZMW",
      metadata: paymentMetadata,
    };

    const { data: insertedPayment, error: insertError } = await supabase
      .from("payments")
      .insert(paymentInsert)
      .select("id, payment_reference, status")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      payment: {
        id: insertedPayment.id,
        paymentReference: insertedPayment.payment_reference,
        status: insertedPayment.status,
      },
      provider: {
        name: providerSession.provider,
        reference: providerSession.reference,
        providerPaymentId: providerSession.providerPaymentId,
        amount: providerSession.amount,
        currency: providerSession.currency,
        status: providerSession.status,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment session creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
