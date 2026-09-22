CREATE TABLE `pincodes` (
	`pincode` text PRIMARY KEY NOT NULL,
	`lat` real,
	`lng` real,
	`label` text,
	`looked_up_at` text NOT NULL
);
