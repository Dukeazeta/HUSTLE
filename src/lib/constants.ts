export const PIPELINE_STAGES = [
  "discovered",
  "audited",
  "qualified",
  "pitch_ready",
  "contacted",
  "replied",
  "meeting",
  "proposal",
  "preview",
  "payment_due",
  "won",
  "lost",
  "do_not_contact",
] as const;
export const CATEGORIES = [
  "restaurant",
  "hotel",
  "salon",
  "spa",
  "caterer",
  "event_venue",
  "beauty",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const OUTREACH_CHANNELS = [
  "email",
  "whatsapp",
  "instagram",
  "linkedin",
] as const;
export type OutreachChannel = (typeof OUTREACH_CHANNELS)[number];

export const PITCH_VARIANT_LABELS = ["short", "warm", "specific"] as const;
export type PitchVariantLabel = (typeof PITCH_VARIANT_LABELS)[number];
