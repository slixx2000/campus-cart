import { NextRequest, NextResponse } from "next/server";

import { getPaymentProvider } from "@/lib/payments";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-bila-signature");
  const timestamp = request.headers.get("x-bila-timestamp");
  const eventName = request.headers.get("x-bila-event");

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

  return NextResponse.json({
    ok: true,
    provider: parsed.provider,
    event: parsed.event,
    status: parsed.status,
    amount: parsed.amount,
    providerPaymentId: parsed.providerPaymentId,
    transactionId: parsed.transactionId,
  });
}
