ALTER TABLE `campaigns` ADD `currency` text DEFAULT 'NGN' NOT NULL;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `landing_page_price` integer DEFAULT 85000 NOT NULL;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `complete_website_price` integer DEFAULT 220000 NOT NULL;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `booking_catalogue_price` integer DEFAULT 380000 NOT NULL;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `compliance_note` text;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `compliance_reference` text;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `approved_channels` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `compliance_reviewed_at` text;--> statement-breakpoint
UPDATE `campaigns`
SET
	`country` = 'GB',
	`currency` = 'GBP',
	`landing_page_price` = 450,
	`complete_website_price` = 1200,
	`booking_catalogue_price` = 2200
WHERE `country` = 'UK';--> statement-breakpoint
UPDATE `businesses` SET `country` = 'GB' WHERE `country` = 'UK';
