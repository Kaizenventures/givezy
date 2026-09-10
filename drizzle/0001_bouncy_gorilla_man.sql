CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`phone` text,
	`city` text,
	`source` text DEFAULT 'homepage' NOT NULL,
	`converted` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` text PRIMARY KEY NOT NULL,
	`donation_id` text NOT NULL,
	`shipping_cost` integer NOT NULL,
	`service_fee` integer DEFAULT 0 NOT NULL,
	`total_amount` integer NOT NULL,
	`estimated_courier_cost` integer,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`razorpay_order_id` text,
	`razorpay_payment_id` text,
	`razorpay_signature` text,
	`shiprocket_order_id` text,
	`shiprocket_shipment_id` text,
	`shiprocket_awb` text,
	`tracking_url` text,
	`fulfillment_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `waitlist` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`pincode` text,
	`category` text,
	`weight_bucket` text,
	`status` text DEFAULT 'waiting' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `donations` ADD `photos` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `donations` ADD `weight_bucket` text DEFAULT 'upto-5kg' NOT NULL;--> statement-breakpoint
ALTER TABLE `donations` ADD `weight_range` text DEFAULT '1-3kg' NOT NULL;--> statement-breakpoint
ALTER TABLE `donations` ADD `bag_sent_at` text;--> statement-breakpoint
ALTER TABLE `donations` ADD `packed_confirmed_at` text;