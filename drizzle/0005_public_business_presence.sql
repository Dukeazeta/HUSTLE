CREATE TABLE `business_links` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`type` text NOT NULL,
	`url` text NOT NULL,
	`normalized_url` text NOT NULL,
	`source_url` text NOT NULL,
	`discovered_at` text NOT NULL,
	`verification_status` text DEFAULT 'candidate' NOT NULL,
	`confidence` integer DEFAULT 0 NOT NULL,
	`evidence` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `business_link_unique` ON `business_links` (`business_id`,`normalized_url`);--> statement-breakpoint
CREATE INDEX `business_link_business_idx` ON `business_links` (`business_id`);