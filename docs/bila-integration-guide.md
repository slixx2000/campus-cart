# Bila Mobile Money Integration Guide
### Based on the working Katina Basil implementation — for reuse in BookChainZM

This document captures everything confirmed and learned while integrating Bila into Katina Basil, including the exact bugs hit and how they were fixed. Treat the **"Confirmed" vs "Assumed"** labels seriously — this codebase has already been burned once by guessing at Bila's API shape instead of verifying it.

---

## 1. Prerequisites / Environment Variables

```
BILA_API_BASE_URL       # optional, defaults to https://api.usebila.com
BILA_SECRET_KEY         # merchant API key (sk_live_xxx / sk_test_xxx) — used as x-api-key header
BILA_WALLET_ID          # your merchant wallet UUID
BILA_COUNTRY            # defaults to 'zm' if unset
BILA_WEBHOOK_SECRET     # the webhook signing secret — see §5, this is DIFFERENT from BILA_SECRET_KEY
```

**Important distinction (this caused confusion during the Katina build):**
- `BILA_SECRET_KEY` = your merchant API key, sent as `x-api-key` header on every API call you make *to* Bila.
- `BILA_WEBHOOK_SECRET` = a separate secret generated when you create a webhook config, used *locally* to verify signatures on webhooks Bila sends *to* you. Never sent anywhere. Bila only shows you the full value once, at webhook-config creation time — save it immediately.

---

## 2. Creating the Collection (Initiating a Payment)

**Endpoint:** `POST https://api.usebila.com/api/v1/bila/collections/mobile-money`

**Headers:**
```
x-api-key: <BILA_SECRET_KEY>
Content-Type: application/json
Accept: application/json
```

### Confirmed accepted request body fields (verified against Bila's own docs example)

```json
{
  "amount": 100.5,
  "reference": "collection-001",
  "phone": "0977433571",
  "operator": "airtel",
  "country": "zm",
  "walletId": "68f11209-451f-4a15-bfcd-d916eb8b09f4",
  "bearer": "merchant",
  "narration": "Payment for subscription",
  "customerName": "John Doe"
}
```

**Critical: Bila's endpoint uses strict schema validation — any field NOT in the list above gets rejected with a 500 and an error like `"property X should not exist"`.** During the Katina build, we had to remove `currency`, `metadata`, and `callback_url` one at a time after each triggered this exact error. Do not send those three fields. If you need to attach your own metadata (order details, plan type, etc.), store it in your own database keyed by `reference` — do not try to pass it through to Bila.

### Phone number format — unresolved, worth confirming before BookChain launch
Bila's own documented example uses local format (`0977433571`, no country code). The Katina implementation sends international format (`+260779392370`) and it worked in testing — but this was never explicitly confirmed as correct with Bila's dev, just observed to not error. Recommend confirming this explicitly with Bila before relying on it for BookChain, since a wrong format could silently misroute a payment prompt rather than erroring cleanly.

### Response shape
```ts
{
  id?: string;
  reference?: string;
  status?: string;
  amount?: number;
  currency?: string;
  phone?: string;
  provider?: string;
}
```
Bila's response may be wrapped in an envelope (`{ success, message, data }`) or returned flat — the Katina code handles both (see `extractData()` helper below).

**Critical: save `collection.id` (Bila's own ID for this payment) mapped to your internal reference in your database immediately after this call succeeds.** This is what makes webhook resolution possible later (see §6) — Bila's webhooks never send your reference back.

---

## 3. Checking Status via Polling (fallback / immediate feedback)

**Endpoint:** `GET /api/v1/bila/collections/status/{reference}`

**Headers:**
```
Authorization: Bearer <BILA_SECRET_KEY>
Accept: application/json
```

Useful as a fallback if webhooks are delayed, or to show immediate status on your confirmation page while waiting for the webhook.

---

## 4. Reusable Code Structure (`lib/bila.ts`)

The Katina implementation centralizes all Bila interaction in one file with this shape — worth replicating as-is in BookChain:

- `getBilaApiBaseUrl()` / `getBilaSecretKey()` / `getBilaWalletId()` / `getBilaCountry()` — env var readers
- `buildBilaHeaders()` — constructs the `x-api-key` + JSON headers
- `postBilaJson<T>(path, body)` — generic POST wrapper with response envelope handling and error throwing on non-2xx
- `createBilaMobileMoneyCollection(request)` — builds the exact whitelisted payload (§2) and calls `postBilaJson`
- `getBilaCollectionStatus(reference)` — polling wrapper
- `normalizeBilaPaymentStatus(value)` — maps Bila's status strings to your internal enum (see §6 for what's actually confirmed vs guessed here)
- `parseBilaWebhookEvent(event)` — parses incoming webhook body (see §6)
- `verifyBilaWebhookSignature(rawBody, signatureHeader, timestampHeader)` — HMAC verification (see §5)

---

## 5. Webhook Signature Verification

**This took the longest to get right — two separate bugs, in sequence.**

### What Bila actually sends (confirmed from real headers)
```
x-bila-signature: sha256=<64-char hex>
x-bila-timestamp: <unix timestamp, seconds>
x-bila-event: payment.completed  (or collection.completed, etc.)
x-bila-delivery: <delivery id>
```

### The correct verification logic

```ts
export function verifyBilaWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  timestampHeader?: string,
): boolean {
  const secret = process.env.BILA_WEBHOOK_SECRET?.trim();
  if (!secret) return false;

  try {
    // Bila signs `${timestamp}.${rawBody}`, NOT just the raw body alone
    const signedPayload = timestampHeader ? `${timestampHeader}.${rawBody}` : rawBody;
    const expectedSignature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

    // Strip Bila's actual prefix — it's "sha256=", not "whsec_"
    const cleanedHeader = signatureHeader.replace(/^sha256=/, '').replace(/^whsec_/, '');

    if (expectedSignature.length !== cleanedHeader.length) {
      return false; // avoids timingSafeEqual throwing on length mismatch
    }

    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(cleanedHeader));
  } catch {
    return false;
  }
}
```

### Bug 1: wrong prefix stripped
Original code only stripped a `whsec_` prefix (copied from a Stripe-style reference implementation). Bila actually sends `sha256=`. Every signature failed until this was fixed.

### Bug 2: missing timestamp in the signed payload
Even after fixing the prefix, signatures still didn't match. The fix was discovered by dumping the full raw request headers (not just the structured log fields) and noticing `x-bila-timestamp` sent alongside the signature — a strong signal of a Stripe-style anti-replay scheme where the signature covers `timestamp + '.' + body`, not just the body. This was never explicitly documented by Bila in what we found — it was reverse-engineered from the headers. Confirm this explicitly with Bila's dev for BookChain rather than re-discovering it the hard way; ask specifically: "Is the webhook signature HMAC-SHA256 of `timestamp + '.' + body`?"

### How to debug this if it breaks again
Add a temporary log right before computing the HMAC:
```ts
console.info('[WEBHOOK] signature.debug', {
  signedPayloadPreview: signedPayload.slice(0, 50),
  timestampReceived: timestampHeader,
});
```
Remove it once confirmed working — it's just for one debugging pass.

---

## 6. Webhook Payload Body — Confirmed vs. Assumed

**This is the biggest open risk to carry into BookChain. Read carefully.**

### Confirmed (actually observed in real Bila webhook deliveries)

```json
// event: payment.completed
{"id": "cmr8wkzmr00e0qoi7d7e19d7q", "amount": 2, "status": "COMPLETED"}

// event: collection.completed
{"id": "cmr900kcj00fkqoi7xliybc8o", "amount": 2, "status": "PROCESSING", "transactionId": "cmr900kcg00fiqoi7z4ah5um0"}
```

- Status field is named `status`
- Confirmed values actually seen: `"PROCESSING"`, `"COMPLETED"` (uppercase strings)
- `id` = Bila's own collection ID
- `transactionId` present on `collection.completed`, but absent on `payment.completed`
- There is no `reference` field in the webhook body, ever. Bila does not echo back the reference you sent when creating the collection.
- Event type (`payment.completed`, `collection.completed`) comes from the `x-bila-event` header, not a field in the body.

### Confirmed 2026-08-05 (BookChain live tests — real K5 success + real declined payment)

```json
// initial webhook, seconds after creating the collection
{"id": "cmsgllzbv008qqopha5jdjkyt", "amount": 1000, "status": "PROCESSING", "transactionId": "cmsgllzbr008oqoph2kcdymet"}

// customer declined the PIN prompt — arrived ~70s after decline
{"id": "cmsgllzbv008qqopha5jdjkyt", "amount": 1000, "status": "FAILED"}
```

- `"FAILED"` is a real status string (uppercase, same flat shape). `transactionId` is absent on the FAILED delivery — resolve by `id` only.
- A successful payment delivers `PROCESSING` immediately, then the success webhook ~20s after the customer approves.
- International phone format (`+260…`) confirmed working end-to-end: a real prompt arrived and settled.
- BookChain's `handle_webhook` now debug-logs every raw webhook body (`subscription_webhook_raw`), so any future unseen shape gets recorded automatically.

### Assumed / NOT verified — do not trust these blindly

- A `"PENDING"` status string from Bila directly — never observed; the two pre-terminal deliveries seen so far both say `"PROCESSING"`.
- A `"CANCELLED"` status string — the decline path above produced `"FAILED"`, so `cancelled` remains a defensive guess.

### Reference resolution — required workaround

Since Bila never sends your reference back, you cannot match webhooks to your internal records by reference. Instead:

1. When creating a collection (§2), immediately store `collection.id` as `providerPaymentId` in your own payments/transactions table, alongside your internal reference.
2. On webhook receipt, if the payload has no `reference`, look up your internal reference by matching the webhook's `id` (and/or `transactionId`) against your stored `providerPaymentId`.

```ts
async function resolvePaymentReference(providerPaymentId?: string, transactionId?: string): Promise<string | null> {
  const conditions = [
    providerPaymentId ? { providerPaymentId } : undefined,
    transactionId ? { providerPaymentId: transactionId } : undefined,
  ].filter(Boolean);

  if (conditions.length === 0) return null;

  const match = await db.paymentTransaction.findFirst({
    where: { OR: conditions },
    select: { reference: true },
  });

  return match?.reference ?? null;
}
```

Check both `id` and `transactionId` against your stored `providerPaymentId` — which one actually matches can vary depending on the event type, based on what we observed.

---

## 7. Registering the Webhook

**Endpoint:** `POST https://api.usebila.com/api/v1/bila/webhooks`

```bash
curl --request POST \
  --url https://api.usebila.com/api/v1/bila/webhooks \
  --header 'Content-Type: application/json' \
  --header 'x-api-key: <api-key>' \
  --data '{
    "url": "https://yourdomain.com/api/webhooks/bila",
    "events": ["payment.completed", "collection.completed"]
  }'
```

Response includes a `secret` field — shown in full only this once. Save it as `BILA_WEBHOOK_SECRET` immediately. If lost, you'll need to use the "Rotate webhook signing secret" endpoint to generate a new one (also only shown once).

**For BookChain specifically, decide which events you actually need** — Bila's full event list (from their docs) includes: `order.created`, `order.paid`, `order.cancelled`, `stock.low`, `payment.created`, `payment.completed`, `payment.failed`, `collection.pending`, `collection.completed`, `collection.failed`, `withdrawal.created`, `withdrawal.completed`, `withdrawal.failed`, `transaction.updated`, `transfer.pending`, `transfer.completed`, `transfer.failed`, `settlement.completed`. Katina only subscribed to the collection/payment completion events — BookChain's use case (subscriptions/bookings vs. one-off tickets) may benefit from also handling `payment.failed` explicitly rather than relying on the unconfirmed status mapping in §6.

**Useful debugging endpoint:** `GET /api/v1/bila/webhooks/{id}/deliveries` — shows real delivery attempts including response codes and failure reasons. This was how the signature bugs were confirmed and diagnosed during the Katina build. Use this early when setting up BookChain's webhook rather than waiting for it to fail in an ambiguous way.

---

## 8. Webhook Route — Full Flow Checklist

1. Receive raw body (must be the unparsed raw bytes/string — signature verification needs the exact bytes Bila hashed, not a re-serialized JSON object)
2. Read `x-bila-signature` and `x-bila-timestamp` headers
3. Verify signature (§5) — reject with 401 if invalid
4. Parse JSON body
5. Extract `id`, `transactionId`, `status` from body (no `reference` — see §6)
6. Resolve internal reference via `providerPaymentId` lookup (§6) — reject with 404 if no match found
7. Deduplicate using a persisted `providerEventId` (hash of the payload works if Bila doesn't send an explicit event ID) — Bila retries failed/unacknowledged deliveries, so you WILL receive duplicates
8. Map Bila's status to your internal status enum
9. Update your transaction/order record
10. If newly PAID, trigger whatever fulfillment logic is relevant (for BookChain: presumably activating a booking/subscription, vs. Katina's ticket + PDF generation)
11. Always respond 200 quickly once processed — Bila will retry on non-2xx, up to a small number of attempts (observed: 3 retries in testing)

---

## 9. Known Open Items Not Yet Resolved (carry into BookChain planning)

- ~~Real payload shape for failed and pending status webhooks~~ — RESOLVED 2026-08-05: FAILED and PROCESSING observed in real deliveries, see §6
- ~~Phone number format (local vs. international)~~ — RESOLVED 2026-08-05: international (+260…) confirmed by a real settled payment (§2/§6)
- A stray `POST /api/webhook` (different path, no "s") was seen returning 404 in Katina's logs — suspected leftover/misconfigured webhook pointing at the wrong URL in the Bila merchant dashboard. Worth checking Katina's webhook config list before assuming BookChain's setup is clean, in case there's a shared account issue.

---

## 10. What to Do Differently for BookChain

Given BookChain is a subscription/booking platform rather than one-off ticket sales, consider:

- Explicitly subscribing to `payment.failed` (not just relying on default/fallback status mapping) since failed payments matter more for retry logic in a subscription context
- Confirming the failed/pending payload shape before launch (§6), since a misclassified failure could incorrectly mark a subscription as active
- If BookChain needs recurring charges, checking whether Bila's collection API supports any recurring/subscription primitives at all, or whether recurring billing needs to be orchestrated entirely on your side (creating a new collection per billing cycle) — this wasn't something Katina needed to solve, since it's one-off ticket purchases
