import { relations, sql } from "drizzle-orm";
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp_ms" }),
  image: text("image"),
  ...timestamps,
});

export const accounts = sqliteTable("accounts", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), provider: text("provider").notNull(), providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"), access_token: text("access_token"), expires_at: integer("expires_at"), token_type: text("token_type"), scope: text("scope"), id_token: text("id_token"), session_state: text("session_state"),
}, (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(), token: text("token").notNull(), expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
}, (t) => [primaryKey({ columns: [t.identifier, t.token] })]);

export const campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), country: text("country", { enum: ["NG", "UK"] }).notNull(), city: text("city").notNull(),
  category: text("category").notNull(), resultLimit: integer("result_limit").notNull().default(20),
  budgetMinor: integer("budget_minor").notNull().default(0), spentMinor: integer("spent_minor").notNull().default(0),
  status: text("status", { enum: ["draft", "active", "paused", "complete"] }).notNull().default("draft"),
  ...timestamps,
});

export const businesses = sqliteTable("businesses", {
  id: text("id").primaryKey(), campaignId: text("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  placeId: text("place_id").notNull(), name: text("name").notNull(), category: text("category").notNull(), country: text("country").notNull(),
  city: text("city").notNull(), address: text("address"), websiteUrl: text("website_url"), normalizedDomain: text("normalized_domain"),
  phone: text("phone"), email: text("email"), sourceUrl: text("source_url").notNull(), sourceDiscoveredAt: text("source_discovered_at").notNull(),
  legalForm: text("legal_form", { enum: ["corporate", "sole_trader", "unknown"] }).notNull().default("unknown"),
  complianceReviewed: integer("compliance_reviewed", { mode: "boolean" }).notNull().default(false),
  stage: text("stage").notNull().default("discovered"), score: integer("score").notNull().default(0), suppressed: integer("suppressed", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
}, (t) => [uniqueIndex("business_place_unique").on(t.placeId), index("business_campaign_idx").on(t.campaignId), index("business_stage_idx").on(t.stage)]);

export const audits = sqliteTable("audits", {
  id: text("id").primaryKey(), businessId: text("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  status: text("status").notNull(), httpStatus: integer("http_status"), responseMs: integer("response_ms"), pageBytes: integer("page_bytes"),
  score: integer("score").notNull(), summary: text("summary"), aiUsed: integer("ai_used", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

export const findings = sqliteTable("findings", {
  id: text("id").primaryKey(), auditId: text("audit_id").notNull().references(() => audits.id, { onDelete: "cascade" }),
  code: text("code").notNull(), severity: text("severity").notNull(), title: text("title").notNull(), evidence: text("evidence").notNull(), recommendation: text("recommendation").notNull(),
});

export const opportunities = sqliteTable("opportunities", {
  id: text("id").primaryKey(), businessId: text("business_id").notNull().unique().references(() => businesses.id, { onDelete: "cascade" }),
  stage: text("stage").notNull().default("qualified"), packageName: text("package_name"), currency: text("currency"), valueMinor: integer("value_minor"),
  nextActionAt: text("next_action_at"), previewUrl: text("preview_url"), previewApprovedAt: text("preview_approved_at"), paidAt: text("paid_at"),
  ...timestamps,
});

export const outreachDrafts = sqliteTable("outreach_drafts", {
  id: text("id").primaryKey(), businessId: text("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  channel: text("channel", { enum: ["email", "whatsapp"] }).notNull(), subject: text("subject"), body: text("body").notNull(), status: text("status").notNull().default("draft"),
  sentAt: text("sent_at"), followUpDueAt: text("follow_up_due_at"), followUpSentAt: text("follow_up_sent_at"), ...timestamps,
});

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(), businessId: text("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  type: text("type").notNull(), detail: text("detail"), metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const proposals = sqliteTable("proposals", {
  id: text("id").primaryKey(), opportunityId: text("opportunity_id").notNull().references(() => opportunities.id, { onDelete: "cascade" }),
  title: text("title").notNull(), content: text("content").notNull(), expiresAt: text("expires_at").notNull(), status: text("status").notNull().default("draft"), ...timestamps,
});

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(), opportunityId: text("opportunity_id").notNull().references(() => opportunities.id, { onDelete: "cascade" }),
  amountMinor: integer("amount_minor").notNull(), currency: text("currency").notNull(), reference: text("reference"), paidAt: text("paid_at").notNull(), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const suppressions = sqliteTable("suppressions", {
  id: text("id").primaryKey(), email: text("email"), phone: text("phone"), domain: text("domain"), reason: text("reason").notNull(), source: text("source").notNull(), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [index("suppression_email_idx").on(t.email), index("suppression_phone_idx").on(t.phone), index("suppression_domain_idx").on(t.domain)]);

export const aiUsage = sqliteTable("ai_usage", {
  id: text("id").primaryKey(), businessId: text("business_id").references(() => businesses.id, { onDelete: "set null" }),
  model: text("model").notNull(), purpose: text("purpose").notNull(), inputTokens: integer("input_tokens").notNull().default(0), outputTokens: integer("output_tokens").notNull().default(0),
  estimatedCost: real("estimated_cost").notNull().default(0), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const businessRelations = relations(businesses, ({ one, many }) => ({
  campaign: one(campaigns, { fields: [businesses.campaignId], references: [campaigns.id] }), audits: many(audits), drafts: many(outreachDrafts), opportunity: one(opportunities),
}));
