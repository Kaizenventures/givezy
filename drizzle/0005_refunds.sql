-- Refund tracking on shipments.
--
-- Before this, refunding a payment in the Razorpay dashboard changed nothing
-- here: the booking still read as paid, still consumed a daily slot and still
-- sat in the worklist waiting for a bag to be posted.
--
-- Additive only. The migration script tolerates "duplicate column name" so
-- this is safe to re-apply.
ALTER TABLE `shipments` ADD `refund_amount` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `shipments` ADD `razorpay_refund_id` text;
--> statement-breakpoint
ALTER TABLE `shipments` ADD `refund_reason` text;
--> statement-breakpoint
ALTER TABLE `shipments` ADD `refunded_at` text;
