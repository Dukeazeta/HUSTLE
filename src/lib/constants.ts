export const PIPELINE_STAGES = ["discovered", "audited", "qualified", "pitch_ready", "contacted", "replied", "meeting", "proposal", "preview", "payment_due", "won", "lost", "do_not_contact"] as const;
export const CATEGORIES = ["restaurant", "hotel", "salon", "spa", "caterer", "event_venue", "beauty"] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PACKAGES = {
  NG: [
    { name: "Landing page rescue", price: 85000, currency: "NGN" },
    { name: "Complete business website", price: 220000, currency: "NGN" },
    { name: "Booking or catalogue website", price: 380000, currency: "NGN" },
  ],
  UK: [
    { name: "Landing page rescue", price: 450, currency: "GBP" },
    { name: "Complete business website", price: 1200, currency: "GBP" },
    { name: "Booking or catalogue website", price: 2200, currency: "GBP" },
  ],
} as const;
