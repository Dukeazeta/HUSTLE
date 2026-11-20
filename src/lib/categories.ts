/**
 * Business categories. A campaign can target any kind of business: the value is
 * free text, stored as a lowercase snake_case slug ("dental clinic" → "dental_clinic")
 * so it reads the same way as the original presets and Google's own place types.
 */

/** The original presets. They get a small fit bonus in the opportunity score. */
export const CORE_CATEGORIES = [
  "restaurant",
  "hotel",
  "salon",
  "spa",
  "caterer",
  "event_venue",
  "beauty",
] as const;

/** Suggestions shown in the campaign form. Anything else can be typed. */
export const CATEGORY_SUGGESTIONS = [
  ...CORE_CATEGORIES,
  "dental_clinic",
  "gym",
  "barber",
  "bakery",
  "cafe",
  "law_firm",
  "real_estate_agency",
  "auto_repair",
  "photographer",
  "cleaning_service",
  "school",
  "pharmacy",
] as const;

export const CATEGORY_MAX_LENGTH = 50;

// Letters (any script), digits, spaces, and & ' ’ - inside the name.
const CATEGORY_PATTERN = /^[\p{L}\p{N}](?:[\p{L}\p{N} &'’-]*[\p{L}\p{N}])?$/u;

/**
 * Turns what someone typed into a stored slug, or returns null if it isn't a
 * plausible business type (empty, too long, or containing other symbols).
 */
export function normalizeCategory(raw: string): string | null {
  const words = raw.normalize("NFKC").trim().replace(/[\s_]+/g, " ").toLowerCase();
  if (words.length < 2 || words.length > CATEGORY_MAX_LENGTH) return null;
  if (!CATEGORY_PATTERN.test(words)) return null;
  return words.replaceAll(" ", "_");
}

/** Human-readable label: "dental_clinic" → "dental clinic". */
export function categoryLabel(category: string) {
  return category.replaceAll("_", " ");
}

/**
 * The category as it may appear in an AI prompt. Stored categories come from
 * campaign input or Google place types; anything that doesn't pass the same
 * rules as campaign input falls back to a neutral phrase.
 */
export function promptCategory(category: string) {
  const normalized = normalizeCategory(category);
  return normalized ? categoryLabel(normalized) : "local business";
}

export function isCoreCategory(category: string) {
  return (CORE_CATEGORIES as readonly string[]).includes(category);
}
