CREATE TABLE `pitch_generations` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`request_id` text NOT NULL,
	`channel` text NOT NULL,
	`model` text,
	`used_fallback` integer DEFAULT false NOT NULL,
	`style_signals` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pitch_generation_request_unique` ON `pitch_generations` (`business_id`,`request_id`);--> statement-breakpoint
CREATE INDEX `pitch_generation_business_idx` ON `pitch_generations` (`business_id`);--> statement-breakpoint
CREATE TABLE `pitch_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`generation_id` text NOT NULL,
	`label` text NOT NULL,
	`subject` text,
	`body` text NOT NULL,
	`evidence_codes` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`generation_id`) REFERENCES `pitch_generations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pitch_variant_generation_label_unique` ON `pitch_variants` (`generation_id`,`label`);--> statement-breakpoint
CREATE INDEX `pitch_variant_generation_idx` ON `pitch_variants` (`generation_id`);--> statement-breakpoint
ALTER TABLE `businesses` ADD `outreach_basis` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `outreach_basis_note` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `outreach_basis_reviewed_at` text;--> statement-breakpoint
ALTER TABLE `outreach_drafts` ADD `source_variant_id` text REFERENCES pitch_variants(id);--> statement-breakpoint
ALTER TABLE `outreach_drafts` ADD `feedback` text;--> statement-breakpoint
CREATE UNIQUE INDEX `outreach_source_variant_unique` ON `outreach_drafts` (`source_variant_id`);--> statement-breakpoint
ALTER TABLE `suppressions` ADD `profile_url` text;--> statement-breakpoint
CREATE INDEX `suppression_profile_url_idx` ON `suppressions` (`profile_url`);