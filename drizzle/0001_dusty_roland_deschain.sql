CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`channel` text NOT NULL,
	`value` text NOT NULL,
	`normalized_value` text NOT NULL,
	`source_url` text NOT NULL,
	`discovered_at` text NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contact_business_value_unique` ON `contacts` (`business_id`,`channel`,`normalized_value`);--> statement-breakpoint
CREATE INDEX `contact_business_idx` ON `contacts` (`business_id`);--> statement-breakpoint
ALTER TABLE `businesses` ADD `lost_reason` text;--> statement-breakpoint
ALTER TABLE `outreach_drafts` ADD `follow_up_subject` text;--> statement-breakpoint
ALTER TABLE `outreach_drafts` ADD `follow_up_body` text;