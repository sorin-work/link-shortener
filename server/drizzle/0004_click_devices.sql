ALTER TABLE `clicks` ADD `device` text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `clicks` ADD `browser` text DEFAULT 'Unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `clicks` ADD `os` text DEFAULT 'Unknown' NOT NULL;