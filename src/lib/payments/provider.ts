export type PaymentProviderName = "bila";
export type PaymentCurrency = "ZMW";
export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export interface CreatePaymentSessionInput {
  amount: number;
  reference: string;
  phone: string;
  operator?: string;
  customerName?: string;
  narration?: string;
  country?: string;
}

export interface PaymentSession {
  provider: PaymentProviderName;
  reference: string;
  providerPaymentId?: string;
  status: PaymentStatus;
  amount: number;
  currency: PaymentCurrency;
  raw?: Record<string, unknown>;
}

export interface PaymentWebhookEvent {
  provider: PaymentProviderName;
  event: string;
  providerPaymentId?: string;
  transactionId?: string;
  status: PaymentStatus;
  amount?: number;
  raw: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createCollection(input: CreatePaymentSessionInput): Promise<PaymentSession>;
  getCollectionStatus(reference: string): Promise<PaymentSession>;
  verifyWebhook(
    rawBody: string,
    signatureHeader?: string | null,
    timestampHeader?: string | null,
  ): boolean;
  parseWebhook(
    rawBody: string,
    headers?: Record<string, string | null>,
  ): PaymentWebhookEvent | null;
}

export function getConfiguredPaymentProviderName(): PaymentProviderName {
  const configured = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (configured === "bila") return "bila";
  return "bila";
}
