ALTER TABLE `shipments` ADD `booked_manually` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `shipments` ADD `courier_name` text;