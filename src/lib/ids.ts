export const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export function normalizeDomain(value?: string | null) {
  if (!value) return null;
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); } catch { return null; }
}

export function normalizePhone(value?: string | null) {
  return value?.replace(/[^+\d]/g, "") || null;
}
