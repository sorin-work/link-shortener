ALTER TABLE `links` ADD `max_clicks` integer;--> statement-breakpoint
ALTER TABLE `links` ADD `click_count` integer DEFAULT 0 NOT NULL;