import type { AuthUser } from '../types';

export const CLERK_SUPABASE_TEMPLATE = 'campuscartclerk';
export const CLERK_BOOTSTRAP_URL = 'https://campuscart.social/api/clerk/bootstrap-profile';

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function createUuid() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function parseSupabaseIdFromToken(token?: string | null) {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return isUuid(payload?.supabase_id) ? payload.supabase_id : null;
  } catch {
    return null;
  }
}

export function toAuthUser(input: {
  clerkId: string;
  email: string | null;
  fullName?: string | null;
  phone?: string | null;
  supabaseId?: string | null;
}): AuthUser {
  return {
    id: input.supabaseId || input.clerkId,
    email: input.email,
    fullName: input.fullName ?? null,
    phone: input.phone ?? null,
  };
}

export async function bootstrapClerkProfile(options: {
  sessionToken: string;
  supabaseId: string;
  fullName?: string;
  phone?: string | null;
}) {
  const response = await fetch(CLERK_BOOTSTRAP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.sessionToken}`,
    },
    body: JSON.stringify({
      supabaseId: options.supabaseId,
      fullName: options.fullName,
      phone: options.phone ?? null,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload?.error === 'string' ? payload.error : 'Could not prepare your account.');
  }

  return payload as { supabaseId: string };
}
