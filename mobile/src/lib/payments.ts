import { supabase } from './supabase';
import { API_URL } from './constants';

export type PaymentProduct = {
  id: string;
  kind: 'boost' | 'featured' | 'seller_pro';
  name: string;
  description: string | null;
  priceMinor: number;
  currency: string;
  durationDays: number;
  isActive: boolean;
};

export type PaymentSession = {
  paymentId: string;
  paymentReference: string;
  providerReference: string;
  providerPaymentId: string | null;
  amount: number;
  currency: string;
  status: string;
};

export async function fetchPaymentProducts(): Promise<PaymentProduct[]> {
  const { data, error } = await supabase
    .from('payment_products')
    .select('id, kind, name, description, price_minor, currency, duration_days, is_active')
    .eq('is_active', true)
    .order('price_minor');

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    name: row.name,
    description: row.description,
    priceMinor: row.price_minor,
    currency: row.currency,
    durationDays: row.duration_days,
    isActive: row.is_active,
  }));
}

export type CreatePaymentSessionInput = {
  productId: string;
  purpose: 'listing_boost' | 'featured_listing' | 'seller_subscription';
  listingId?: string;
  phone: string;
  operator?: string;
  customerName?: string;
};

export async function createPaymentSession(input: CreatePaymentSessionInput): Promise<PaymentSession> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (sessionError || !accessToken) {
    throw new Error('Your session expired. Please sign in again.');
  }

  const response = await fetch(`${API_URL}/api/payments/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'Could not create payment session. Please try again.');
  }

  const json = await response.json();
  return {
    paymentId: json.payment.id,
    paymentReference: json.payment.paymentReference,
    providerReference: json.provider.reference,
    providerPaymentId: json.provider.providerPaymentId,
    amount: json.provider.amount,
    currency: json.provider.currency,
    status: json.provider.status,
  };
}