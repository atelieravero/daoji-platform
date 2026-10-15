// lib/applicant-identity.ts

/**
 * Strips all spaces, punctuation, symbols, and converts to lowercase.
 * e.g., "  陳大文 (David) " -> "陳大文david"
 */
export function canonicalizeApplicantName(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, ''); // Unicode-safe space and punctuation removal
}

/**
 * Strips all non-digits and returns strictly the last 8 digits.
 * Returns empty string if fewer than 8 digits exist.
 * e.g., "+852 9123-4567" -> "91234567"
 * e.g., "+86 138-0013-8000" -> "00138000"
 */
export function canonicalizePhoneSuffix(raw: string | null | undefined): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 8) return '';
  return digits.slice(-8);
}

/**
 * Generates an 8-digit numeric token string (00000000 - 99999999).
 * Token format: [EVENT_CODE]-[DDDD-DDDD]
 */
export function generateNumericToken(eventCode: string): string {
  const code = (eventCode || 'MMC').trim().toUpperCase();
  const d1 = Math.floor(1000 + Math.random() * 9000);
  const d2 = Math.floor(1000 + Math.random() * 9000);
  return `${code}-${d1}-${d2}`;
}