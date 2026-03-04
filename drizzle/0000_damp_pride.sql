CREATE TABLE `admins` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_email_unique` ON `admins` (`email`);--> statement-breakpoint
CREATE TABLE `donations` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`condition` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`image_url` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`pickup_date` text,
	`pickup_notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`donor_name` text NOT NULL,
	`donor_phone` text NOT NULL,
	`donor_email` text,
	`donor_address` text NOT NULL,
	`donor_pincode` text NOT NULL,
	`donor_area` text,
	`whatsapp_optin` integer DEFAULT false NOT NULL,
	`preferred_slot` text
);
