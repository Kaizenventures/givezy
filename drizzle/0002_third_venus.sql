ALTER TABLE `donations` ADD `size_mode` text DEFAULT 'weight' NOT NULL;--> statement-breakpoint
ALTER TABLE `donations` ADD `genres` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `shipments` ADD `payment_method` text;--> statement-breakpoint
ALTER TABLE `shipments` ADD `failure_reason` text;--> statement-breakpoint
ALTER TABLE `shipments` ADD `failed_at` text;