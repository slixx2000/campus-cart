import { bilaPaymentProvider } from "./bila";
import type { CreatePaymentSessionInput, PaymentProvider, PaymentSession } from "./provider";

export type {
  CreatePaymentSessionInput,
  PaymentProvider,
  PaymentProviderName,
  PaymentSession,
  PaymentStatus,
  PaymentWebhookEvent,
} from "./provider";

export { getConfiguredPaymentProviderName } from "./provider";
export { bilaPaymentProvider, normalizeBilaStatus, parseBilaWebhook, verifyBilaWebhookSignature } from "./bila";

export function getPaymentProvider(): PaymentProvider {
  return bilaPaymentProvider;
}

export async function createPaymentSession(input: CreatePaymentSessionInput): Promise<PaymentSession> {
  return getPaymentProvider().createCollection(input);
}

export async function getPaymentSessionStatus(reference: string): Promise<PaymentSession> {
  return getPaymentProvider().getCollectionStatus(reference);
}

export function verifyIncomingWebhook(
  rawBody: string,
  signatureHeader?: string | null,
  timestampHeader?: string | null,
): boolean {
  return getPaymentProvider().verifyWebhook(rawBody, signatureHeader, timestampHeader);
}
