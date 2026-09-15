// Shared helpers for the ClearFund application/callback endpoints.

export const APP_PUBLIC_URL =
  Deno.env.get("APP_PUBLIC_URL") ?? "https://clearfundai.com";

export const CONSENT_TEXT_VERSION = "clearfund-consent-v1";

export function serviceClientConfig() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Backend credentials are not configured");
  return { url, key };
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function newToken(): string {
  const raw = new Uint8Array(24);
  crypto.getRandomValues(raw);
  return Array.from(raw)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Digits-only comparison key so "(305) 555-1212" matches "+13055551212". */
export function phoneKey(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}

/**
 * Best-effort reading of a spoken time such as "tomorrow at 3pm".
 * Advisory only — the caller's own words are always stored verbatim.
 */
export function parsePreferredAt(raw: string, now = new Date()): string | null {
  const text = raw.trim().toLowerCase();
  if (!text) return null;

  const iso = Date.parse(raw);
  if (!Number.isNaN(iso) && /\d{4}-\d{2}-\d{2}/.test(raw)) {
    return new Date(iso).toISOString();
  }

  const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  if (!timeMatch) return null;

  let hour = parseInt(timeMatch[1], 10);
  const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
  if (hour < 1 || hour > 12 || minute > 59) return null;
  if (timeMatch[3] === "pm" && hour !== 12) hour += 12;
  if (timeMatch[3] === "am" && hour === 12) hour = 0;

  const target = new Date(now);
  let dayOffset: number | null = null;
  if (text.includes("today") || text.includes("this afternoon") || text.includes("this evening")) {
    dayOffset = 0;
  } else if (text.includes("tomorrow")) {
    dayOffset = 1;
  } else {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const idx = days.findIndex((d) => text.includes(d));
    if (idx >= 0) {
      const diff = (idx - now.getUTCDay() + 7) % 7;
      dayOffset = diff === 0 ? 7 : diff;
    }
  }
  if (dayOffset === null) return null;

  target.setUTCDate(target.getUTCDate() + dayOffset);
  // Times are spoken in Eastern (Florida); store as UTC with a fixed -4 offset.
  target.setUTCHours(hour + 4, minute, 0, 0);
  return target.toISOString();
}
