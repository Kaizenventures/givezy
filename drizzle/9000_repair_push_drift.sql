-- Repairs drift left behind by `drizzle-kit push`.
--
-- Numbered high on purpose so it never collides with a generated migration.
-- Both statements are no-ops on a database built from the migrations alone.

-- shipments was created by an early push, before estimated_courier_cost existed.
-- The column appears only inside a CREATE TABLE, which is skipped once the table
-- is there, so no migration ever added it.
ALTER TABLE `shipments` ADD `estimated_courier_cost` integer;--> statement-breakpoint

-- Left behind by a push that died mid-rebuild when it asked for a prompt it
-- could never get in a container.
DROP TABLE IF EXISTS `__new_shipments`;
