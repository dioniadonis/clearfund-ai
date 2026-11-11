/** Parse a contract amount URL param like "250000", "$250,000" or "250k". Returns null if not a sane positive number. */
export function parseAmount(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase().replace(/[$,\s]/g, "");
  const m = s.match(/^(\d+(?:\.\d+)?)(k|m)?$/);
  if (!m) return null;
  const n = Number(m[1]) * (m[2] === "k" ? 1e3 : m[2] === "m" ? 1e6 : 1);
  return n > 0 && n < 1e10 ? Math.round(n) : null;
}
