-- Phase 2: every campaign, lead and usage record now belongs to a workspace.
-- Existing data moves into `ws_legacy`, which nobody can see until the account
-- named in LEGACY_DATA_OWNER_EMAIL signs in and claims it (src/lib/workspace.ts).
-- drizzle runs migrations with foreign keys off, so the table rebuilds below do
-- not cascade-delete child rows.
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);--> statement-breakpoint
INSERT INTO `workspaces` (`id`, `name`) VALUES ('ws_legacy', 'Original workspace');--> statement-breakpoint
CREATE TABLE `workspace_members` (
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'owner' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`workspace_id`, `user_id`),
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `workspace_member_user_idx` ON `workspace_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `usage_events` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`kind` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `usage_event_workspace_kind_idx` ON `usage_events` (`workspace_id`,`kind`,`created_at`);--> statement-breakpoint
CREATE TABLE `__new_campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`country` text NOT NULL,
	`city` text NOT NULL,
	`category` text NOT NULL,
	`currency` text DEFAULT 'NGN' NOT NULL,
	`landing_page_price` integer DEFAULT 85000 NOT NULL,
	`complete_website_price` integer DEFAULT 220000 NOT NULL,
	`booking_catalogue_price` integer DEFAULT 380000 NOT NULL,
	`compliance_note` text,
	`compliance_reference` text,
	`approved_channels` text DEFAULT '[]' NOT NULL,
	`compliance_reviewed_at` text,
	`result_limit` integer DEFAULT 20 NOT NULL,
	`budget_minor` integer DEFAULT 0 NOT NULL,
	`spent_minor` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `__new_campaigns` (`workspace_id`, `id`, `name`, `country`, `city`, `category`, `result_limit`, `budget_minor`, `spent_minor`, `status`, `created_at`, `updated_at`, `currency`, `landing_page_price`, `complete_website_price`, `booking_catalogue_price`, `compliance_note`, `compliance_reference`, `approved_channels`, `compliance_reviewed_at`) SELECT 'ws_legacy', `id`, `name`, `country`, `city`, `category`, `result_limit`, `budget_minor`, `spent_minor`, `status`, `created_at`, `updated_at`, `currency`, `landing_page_price`, `complete_website_price`, `booking_catalogue_price`, `compliance_note`, `compliance_reference`, `approved_channels`, `compliance_reviewed_at` FROM `campaigns`;--> statement-breakpoint
DROP TABLE `campaigns`;--> statement-breakpoint
ALTER TABLE `__new_campaigns` RENAME TO `campaigns`;--> statement-breakpoint
CREATE INDEX `campaign_workspace_idx` ON `campaigns` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `__new_businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`campaign_id` text NOT NULL,
	`place_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`country` text NOT NULL,
	`city` text NOT NULL,
	`address` text,
	`website_url` text,
	`normalized_domain` text,
	`phone` text,
	`email` text,
	`rating` real,
	`user_rating_count` integer,
	`source_url` text NOT NULL,
	`source_discovered_at` text NOT NULL,
	`legal_form` text DEFAULT 'unknown' NOT NULL,
	`compliance_reviewed` integer DEFAULT false NOT NULL,
	`outreach_basis` text,
	`outreach_basis_note` text,
	`outreach_basis_reviewed_at` text,
	`stage` text DEFAULT 'discovered' NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`suppressed` integer DEFAULT false NOT NULL,
	`lost_reason` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `__new_businesses` (`workspace_id`, `id`, `campaign_id`, `place_id`, `name`, `category`, `country`, `city`, `address`, `website_url`, `normalized_domain`, `phone`, `email`, `source_url`, `source_discovered_at`, `legal_form`, `compliance_reviewed`, `stage`, `score`, `suppressed`, `created_at`, `updated_at`, `lost_reason`, `rating`, `user_rating_count`, `outreach_basis`, `outreach_basis_note`, `outreach_basis_reviewed_at`) SELECT 'ws_legacy', `id`, `campaign_id`, `place_id`, `name`, `category`, `country`, `city`, `address`, `website_url`, `normalized_domain`, `phone`, `email`, `source_url`, `source_discovered_at`, `legal_form`, `compliance_reviewed`, `stage`, `score`, `suppressed`, `created_at`, `updated_at`, `lost_reason`, `rating`, `user_rating_count`, `outreach_basis`, `outreach_basis_note`, `outreach_basis_reviewed_at` FROM `businesses`;--> statement-breakpoint
DROP TABLE `businesses`;--> statement-breakpoint
ALTER TABLE `__new_businesses` RENAME TO `businesses`;--> statement-breakpoint
CREATE UNIQUE INDEX `business_workspace_place_unique` ON `businesses` (`workspace_id`,`place_id`);--> statement-breakpoint
CREATE INDEX `business_workspace_idx` ON `businesses` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `business_campaign_idx` ON `businesses` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `business_stage_idx` ON `businesses` (`stage`);--> statement-breakpoint
CREATE TABLE `__new_ai_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`business_id` text,
	`model` text NOT NULL,
	`purpose` text NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`estimated_cost` real DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE set null
);--> statement-breakpoint
INSERT INTO `__new_ai_usage` (`workspace_id`, `id`, `business_id`, `model`, `purpose`, `input_tokens`, `output_tokens`, `estimated_cost`, `created_at`) SELECT 'ws_legacy', `id`, `business_id`, `model`, `purpose`, `input_tokens`, `output_tokens`, `estimated_cost`, `created_at` FROM `ai_usage`;--> statement-breakpoint
DROP TABLE `ai_usage`;--> statement-breakpoint
ALTER TABLE `__new_ai_usage` RENAME TO `ai_usage`;--> statement-breakpoint
CREATE INDEX `ai_usage_workspace_created_idx` ON `ai_usage` (`workspace_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `suppressions` ADD `workspace_id` text REFERENCES workspaces(id) ON DELETE set null;
