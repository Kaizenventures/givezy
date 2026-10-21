-- Visitor analytics, kept as daily rollups.
--
-- Deliberately not an event log. This droplet has a 10 GB disk and has twice
-- run out of space, and the admin panel only ever reads daily totals, so one
-- row per page per day is both cheaper and sufficient — a few thousand rows a
-- year rather than one per hit.
CREATE TABLE IF NOT EXISTS `page_stats` (
  `day` text NOT NULL,
  `path` text NOT NULL,
  `views` integer DEFAULT 0 NOT NULL,
  `visitors` integer DEFAULT 0 NOT NULL,
  PRIMARY KEY(`day`, `path`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `referrer_stats` (
  `day` text NOT NULL,
  `source` text NOT NULL,
  `views` integer DEFAULT 0 NOT NULL,
  PRIMARY KEY(`day`, `source`)
);
--> statement-breakpoint
-- Deduplicates a visitor within a single day and nothing more. The hash is
-- one-way over IP + user agent + day + a server secret, so no address is
-- stored; the salt changes daily so the same person does not hash alike across
-- days; and rows are deleted once the day has rolled over.
CREATE TABLE IF NOT EXISTS `visitor_days` (
  `day` text NOT NULL,
  `hash` text NOT NULL,
  `path` text NOT NULL,
  PRIMARY KEY(`day`, `hash`, `path`)
);
--> statement-breakpoint
-- Site-wide totals. Per-page visitor counts cannot be summed into a site
-- total — one person reading three pages is one visitor — so the daily figure
-- is counted once, when a hash is first seen that day, and kept here where it
-- outlives the nightly pruning of the hashes.
CREATE TABLE IF NOT EXISTS `day_stats` (
  `day` text PRIMARY KEY NOT NULL,
  `views` integer DEFAULT 0 NOT NULL,
  `visitors` integer DEFAULT 0 NOT NULL
);
