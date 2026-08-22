import { createHmac, timingSafeEqual } from "node:crypto";

import type {
  CreatePaymentSessionInput,
  PaymentProvider,
  PaymentSession,
  PaymentStatus,
  PaymentWebhookEvent,
} from "./provider";

const DEFAULT_BILA_API_BASE_URL = "https://api.usebila.com";

function readEnv(name: string): string | undefined {
  return process.env[name]?.trim();
}

function getBilaApiBaseUrl(): string {
  return readEnv("BILA_API_BASE_URL") || DEFAULT_BILA_API_BASE_URL;
}

function getBilaSecretKey(): string {
  const value = readEnv("BILA_SECRET_KEY");
  if (!value) throw new Error("Missing BILA_SECRET_KEY.");
  return value;
}

function getBilaWalletId(): string {
  const value = readEnv("BILA_WALLET_ID");
  if (!value) throw new Error("Missing BILA_WALLET_ID.");
  return value;
}

function getBilaCountry(): string {
  return readEnv("BILA_COUNTRY") || "zm";
}

function getBilaWebhookSecret(): string {
  const value = readEnv("BILA_WEBHOOK_SECRET");
  if (!value) throw new Error("Missing BILA_WEBHOOK_SECRET.");
  return value;
}

function buildBilaHeaders(): Headers {
  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-key": getBilaSecretKey(),
  });

  return headers;
}

function extractData<T>(payload: unknown): T | null {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if ("data" in record && record.data !== undefined) {
      return record.data as T;
    }
    if ("result" in record && record.result !== undefined) {
      return record.result as T;
    }
  }

  return payload as T | null;
}

export function normalizeBilaStatus(value?: string | null): PaymentStatus {
  switch ((value ?? "").toUpperCase()) {
    case "PENDING":
      return "pending";
    case "PROCESSING":
      return "processing";
    case "COMPLETED":
      return "paid";
    case "SUCCESS":
      return "paid";
    case "FAILED":
      return "failed";
    case "CANCELLED":
      return "cancelled";
    case "REFUNDED":
      return "refunded";
    default:
      return "pending";
  }
}

export function verifyBilaWebhookSignature(
  rawBody: string,
  signatureHeader?: string | null,
  timestampHeader?: string | null,
): boolean {
  const secret = readEnv("BILA_WEBHOOK_SECRET");
  if (!secret) return false;
  if (!signatureHeader) return false;

  try {
    const signedPayload = timestampHeader ? `${timestampHeader}.${rawBody}` : rawBody;
    const expectedSignature = createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    const cleanedHeader = signatureHeader
      .replace(/^sha256=/i, "")
      .replace(/^whsec_/i, "")
      .trim();

    if (expectedSignature.length !== cleanedHeader.length) {
      return false;
    }

    return timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(cleanedHeader),
    );
  } catch {
    return false;
  }
}

export async function createBilaCollection(
  input: CreatePaymentSessionInput,
): Promise<PaymentSession> {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Bila payment amount must be a positive number.");
  }

  const payload = {
    amount,
    reference: input.reference,
    phone: input.phone.trim(),
    operator: (input.operator ?? "airtel").toLowerCase(),
    country: input.country?.trim() || getBilaCountry(),
    walletId: getBilaWalletId(),
    bearer: "merchant",
    narration: input.narration || "CampusCart payment",
    customerName: input.customerName || "CampusCart customer",
  };

  const response = await fetch(`${getBilaApiBaseUrl()}/api/v1/bila/collections/mobile-money`, {
    method: "POST",
    headers: buildBilaHeaders(),
    body: JSON.stringify(payload),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const reason = typeof json === "object" && json && "message" in json ? String(json.message) : "Unknown Bila API error";
    throw new Error(`Bila payment request failed: ${reason}`);
  }

  const data = extractData<Record<string, unknown>>(json);
  const providerPaymentId = typeof data?.id === "string" ? data.id : undefined;

  return {
    provider: "bila",
    reference: typeof data?.reference === "string" ? data.reference : input.reference,
    providerPaymentId,
    status: normalizeBilaStatus(typeof data?.status === "string" ? data.status : "PROCESSING"),
    amount,
    currency: "ZMW",
    raw: typeof json === "object" && json ? (json as Record<string, unknown>) : undefined,
  };
}

export async function getBilaCollectionStatus(
  reference: string,
): Promise<PaymentSession> {
  const response = await fetch(
    `${getBilaApiBaseUrl()}/api/v1/bila/collections/status/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: buildBilaHeaders(),
    },
  );

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const reason = typeof json === "object" && json && "message" in json ? String(json.message) : "Unknown Bila status error";
    throw new Error(`Bila payment status failed: ${reason}`);
  }

  const data = extractData<Record<string, unknown>>(json);
  const amountValue = typeof data?.amount === "number" ? data.amount : undefined;

  return {
    provider: "bila",
    reference,
    providerPaymentId: typeof data?.id === "string" ? data.id : undefined,
    status: normalizeBilaStatus(typeof data?.status === "string" ? data.status : undefined),
    amount: typeof amountValue === "number" ? amountValue : 0,
    currency: "ZMW",
    raw: typeof json === "object" && json ? (json as Record<string, unknown>) : undefined,
  };
}

export function parseBilaWebhook(
  rawBody: string,
  headers?: Record<string, string | null>,
): PaymentWebhookEvent | null {
  try {
    const parsed = JSON.parse(rawBody) as Record<string, unknown>;
    const eventName = (headers?.["x-bila-event"] ?? "").trim();
    const providerPaymentId = typeof parsed.id === "string" ? parsed.id : undefined;
    const transactionId = typeof parsed.transactionId === "string" ? parsed.transactionId : undefined;
    const amountValue = typeof parsed.amount === "number" ? parsed.amount : undefined;

    return {
      provider: "bila",
      event: eventName || "unknown",
      providerPaymentId,
      transactionId,
      status: normalizeBilaStatus(typeof parsed.status === "string" ? parsed.status : undefined),
      amount: amountValue,
      raw: parsed,
    };
  } catch {
    return null;
  }
}

export const bilaPaymentProvider: PaymentProvider = {
  name: "bila",
  async createCollection(input) {
    return createBilaCollection(input);
  },
  async getCollectionStatus(reference) {
    return getBilaCollectionStatus(reference);
  },
  verifyWebhook(rawBody, signatureHeader, timestampHeader) {
    return verifyBilaWebhookSignature(rawBody, signatureHeader, timestampHeader);
  },
  parseWebhook(rawBody, headers) {
    return parseBilaWebhook(rawBody, headers ?? {});
  },
};

export function getBilaWebhookSecretForDevelopment(): string | undefined {
  return readEnv("BILA_WEBHOOK_SECRET") || getBilaWebhookSecret();
}
