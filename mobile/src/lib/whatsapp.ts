import { formatPrice } from './format';
import type { Listing } from '../types';

const ZAMBIA_COUNTRY_CODE = '+260';

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

// Accepts local input like 97xxxxxxx or 097xxxxxxx and returns +26097xxxxxxx.
export function normalizeZambiaPhoneForStorage(localInput: string): string | null {
  const digits = digitsOnly(localInput);
  const withoutLeadingZero = digits.startsWith('0') ? digits.slice(1) : digits;

  if (/^9\d{8}$/.test(withoutLeadingZero)) {
    return `${ZAMBIA_COUNTRY_CODE}${withoutLeadingZero}`;
  }

  return null;
}

// Accepts stored numbers and normalizes to +260XXXXXXXXX when possible.
export function normalizeSellerPhoneToE164(phoneNumber: string): string | null {
  const trimmed = phoneNumber.trim();
  if (!trimmed) return null;

  if (/^\+2609\d{8}$/.test(trimmed)) {
    return trimmed;
  }

  const digits = digitsOnly(trimmed);

  if (/^2609\d{8}$/.test(digits)) {
    return `+${digits}`;
  }

  if (/^09\d{8}$/.test(digits)) {
    return `${ZAMBIA_COUNTRY_CODE}${digits.slice(1)}`;
  }

  if (/^9\d{8}$/.test(digits)) {
    return `${ZAMBIA_COUNTRY_CODE}${digits}`;
  }

  return null;
}

export function isValidSellerWhatsAppPhone(phoneNumber: string): boolean {
  return normalizeSellerPhoneToE164(phoneNumber) !== null;
}

export function generateWhatsAppLink(phoneNumber: string, listing: Listing): string | null {
  const normalized = normalizeSellerPhoneToE164(phoneNumber);
  if (!normalized) return null;

  const phoneDigits = normalized.replace('+', '');
  const prefilled = `Hi${listing.sellerName ? ` ${listing.sellerName}` : ''}, I'm interested in your item '${listing.title}' listed on CampusCart for ${formatPrice(listing.price)}. Is it still available? (Listing ID: ${listing.id})`;

  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(prefilled)}`;
}
