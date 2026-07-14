import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp_ms" }),
  image: text("image"),
  ...timestamps,
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country", { enum: ["NG", "UK"] }).notNull(),
  city: text("city").notNull(),
  category: text("category").notNull(),
  resultLimit: integer("result_limit").notNull().default(20),
  budgetMinor: integer("budget_minor").notNull().default(0),
  spentMinor: integer("spent_minor").notNull().default(0),
  status: text("status", { enum: ["draft", "active", "paused", "complete"] })
    .notNull()
    .default("draft"),
  ...timestamps,
});

export const businesses = sqliteTable(
  "businesses",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    placeId: text("place_id").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    country: text("country").notNull(),
    city: text("city").notNull(),
    address: text("address"),
    websiteUrl: text("website_url"),
    normalizedDomain: text("normalized_domain"),
    phone: text("phone"),
    email: text("email"),
    rating: real("rating"),
    userRatingCount: integer("user_rating_count"),
    sourceUrl: text("source_url").notNull(),
    sourceDiscoveredAt: text("source_discovered_at").notNull(),
    legalForm: text("legal_form", {
      enum: ["corporate", "sole_trader", "unknown"],
    })
      .notNull()
      .default("unknown"),
    complianceReviewed: integer("compliance_reviewed", { mode: "boolean" })
      .notNull()
      .default(false),
    outreachBasis: text("outreach_basis", {
      enum: ["corporate_b2b", "consent", "solicited_request"],
    }),
    outreachBasisNote: text("outreach_basis_note"),
    outreachBasisReviewedAt: text("outreach_basis_reviewed_at"),
    stage: text("stage").notNull().default("discovered"),
    score: integer("score").notNull().default(0),
    suppressed: integer("suppressed", { mode: "boolean" })
      .notNull()
      .default(false),
    lostReason: text("lost_reason"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("business_place_unique").on(t.placeId),
    index("business_campaign_idx").on(t.campaignId),
    index("business_stage_idx").on(t.stage),
  ],
);

export const audits = sqliteTable("audits", {
  id: text("id").primaryKey(),
  businessId: text("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  httpStatus: integer("http_status"),
  responseMs: integer("response_ms"),
  pageBytes: integer("page_bytes"),
  score: integer("score").notNull(),
  summary: text("summary"),
  aiUsed: integer("ai_used", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

export const contacts = sqliteTable(
  "contacts",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    channel: text("channel", {
      enum: ["email", "phone", "whatsapp"],
    }).notNull(),
    value: text("value").notNull(),
    normalizedValue: text("normalized_value").notNull(),
    sourceUrl: text("source_url").notNull(),
    discoveredAt: text("discovered_at").notNull(),
    verified: integer("verified", { mode: "boolean" }).notNull().default(false),
    verificationMethod: text("verification_method", {
      enum: ["unverified", "manual", "published_whatsapp"],
    })
      .notNull()
      .default("unverified"),
    isPrimary: integer("is_primary", { mode: "boolean" })
      .notNull()
      .default(false),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("contact_business_value_unique").on(
      t.businessId,
      t.channel,
      t.normalizedValue,
    ),
    index("contact_business_idx").on(t.businessId),
  ],
);

export const businessLinks = sqliteTable(
  "business_links",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: ["website", "instagram", "linkedin", "facebook", "x", "tiktok"],
    }).notNull(),
    url: text("url").notNull(),
    normalizedUrl: text("normalized_url").notNull(),
    sourceUrl: text("source_url").notNull(),
    discoveredAt: text("discovered_at").notNull(),
    verificationStatus: text("verification_status", {
      enum: ["candidate", "confirmed", "rejected"],
    })
      .notNull()
      .default("candidate"),
    confidence: integer("confidence").notNull().default(0),
    evidence: text("evidence").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("business_link_unique").on(t.businessId, t.normalizedUrl),
    index("business_link_business_idx").on(t.businessId),
  ],
);

export const findings = sqliteTable("findings", {
  id: text("id").primaryKey(),
  auditId: text("audit_id")
    .notNull()
    .references(() => audits.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  evidence: text("evidence").notNull(),
  recommendation: text("recommendation").notNull(),
});

export const opportunities = sqliteTable("opportunities", {
  id: text("id").primaryKey(),
  businessId: text("business_id")
    .notNull()
    .unique()
    .references(() => businesses.id, { onDelete: "cascade" }),
  stage: text("stage").notNull().default("qualified"),
  packageName: text("package_name"),
  currency: text("currency"),
  valueMinor: integer("value_minor"),
  nextActionAt: text("next_action_at"),
  previewUrl: text("preview_url"),
  previewApprovedAt: text("preview_approved_at"),
  paidAt: text("paid_at"),
  ...timestamps,
});

export const outreachDrafts = sqliteTable("outreach_drafts", {
  id: text("id").primaryKey(),
  businessId: text("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  channel: text("channel", {
    enum: ["email", "whatsapp", "instagram", "linkedin"],
  }).notNull(),
  sourceVariantId: text("source_variant_id").references(
    () => pitchVariants.id,
    { onDelete: "set null" },
  ),
  subject: text("subject"),
  body: text("body").notNull(),
  feedback: text("feedback", { enum: ["up", "down"] }),
  status: text("status").notNull().default("draft"),
  sentAt: text("sent_at"),
  followUpDueAt: text("follow_up_due_at"),
  followUpSubject: text("follow_up_subject"),
  followUpBody: text("follow_up_body"),
  followUpSentAt: text("follow_up_sent_at"),
  ...timestamps,
}, (t) => [uniqueIndex("outreach_source_variant_unique").on(t.sourceVariantId)]);

export const pitchGenerations = sqliteTable(
  "pitch_generations",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    requestId: text("request_id").notNull(),
    channel: text("channel", {
      enum: ["email", "whatsapp", "instagram", "linkedin"],
    }).notNull(),
    model: text("model"),
    usedFallback: integer("used_fallback", { mode: "boolean" })
      .notNull()
      .default(false),
    styleSignals: text("style_signals", { mode: "json" }).$type<
      Record<string, string | number | boolean | null>
    >(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("pitch_generation_request_unique").on(
      t.businessId,
      t.requestId,
    ),
    index("pitch_generation_business_idx").on(t.businessId),
  ],
);

export const pitchVariants = sqliteTable(
  "pitch_variants",
  {
    id: text("id").primaryKey(),
    generationId: text("generation_id")
      .notNull()
      .references(() => pitchGenerations.id, { onDelete: "cascade" }),
    label: text("label", { enum: ["short", "warm", "specific"] }).notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    evidenceCodes: text("evidence_codes", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("pitch_variant_generation_label_unique").on(
      t.generationId,
      t.label,
    ),
    index("pitch_variant_generation_idx").on(t.generationId),
  ],
);

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  businessId: text("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  detail: text("detail"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const proposals = sqliteTable("proposals", {
  id: text("id").primaryKey(),
  opportunityId: text("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  expiresAt: text("expires_at").notNull(),
  status: text("status").notNull().default("draft"),
  ...timestamps,
});

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  opportunityId: text("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  reference: text("reference"),
  paidAt: text("paid_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const suppressions = sqliteTable(
  "suppressions",
  {
    id: text("id").primaryKey(),
    email: text("email"),
    phone: text("phone"),
    domain: text("domain"),
    profileUrl: text("profile_url"),
    reason: text("reason").notNull(),
    source: text("source").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("suppression_email_idx").on(t.email),
    index("suppression_phone_idx").on(t.phone),
    index("suppression_domain_idx").on(t.domain),
    index("suppression_profile_url_idx").on(t.profileUrl),
  ],
);

export const aiUsage = sqliteTable("ai_usage", {
  id: text("id").primaryKey(),
  businessId: text("business_id").references(() => businesses.id, {
    onDelete: "set null",
  }),
  model: text("model").notNull(),
  purpose: text("purpose").notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  estimatedCost: real("estimated_cost").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const businessRelations = relations(businesses, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [businesses.campaignId],
    references: [campaigns.id],
  }),
  audits: many(audits),
  drafts: many(outreachDrafts),
  pitchGenerations: many(pitchGenerations),
  contacts: many(contacts),
  links: many(businessLinks),
  opportunity: one(opportunities),
}));

export const pitchGenerationRelations = relations(
  pitchGenerations,
  ({ one, many }) => ({
    business: one(businesses, {
      fields: [pitchGenerations.businessId],
      references: [businesses.id],
    }),
    variants: many(pitchVariants),
  }),
);

export const pitchVariantRelations = relations(pitchVariants, ({ one }) => ({
  generation: one(pitchGenerations, {
    fields: [pitchVariants.generationId],
    references: [pitchGenerations.id],
  }),
}));
