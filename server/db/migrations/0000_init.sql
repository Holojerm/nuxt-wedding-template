CREATE TABLE `wedding_guest_aliases` (
	`guest_id` text NOT NULL,
	`wedding_slug` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	FOREIGN KEY (`guest_id`) REFERENCES `wedding_guests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wedding_guest_aliases_guest_key_idx` ON `wedding_guest_aliases` (`guest_id`,`name_key`);--> statement-breakpoint
CREATE INDEX `wedding_guest_aliases_lookup_idx` ON `wedding_guest_aliases` (`wedding_slug`,`name_key`);--> statement-breakpoint
CREATE TABLE `wedding_guests` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`wedding_slug` text NOT NULL,
	`first_name` text DEFAULT '' NOT NULL,
	`last_name` text DEFAULT '' NOT NULL,
	`name_key` text DEFAULT '' NOT NULL,
	`is_plus_one` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`dietary` text,
	FOREIGN KEY (`household_id`) REFERENCES `wedding_households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `wedding_guests_lookup_idx` ON `wedding_guests` (`wedding_slug`,`name_key`);--> statement-breakpoint
CREATE INDEX `wedding_guests_household_idx` ON `wedding_guests` (`household_id`);--> statement-breakpoint
CREATE TABLE `wedding_households` (
	`id` text PRIMARY KEY NOT NULL,
	`wedding_slug` text NOT NULL,
	`label` text NOT NULL,
	`email` text,
	`invite_code` text NOT NULL,
	`invited_event_ids` text DEFAULT '[]' NOT NULL,
	`message` text,
	`song_request` text,
	`responded_at` integer,
	`mailing_address` text,
	`address_updated_at` integer,
	`reminded_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wedding_households_code_idx` ON `wedding_households` (`wedding_slug`,`invite_code`);--> statement-breakpoint
CREATE INDEX `wedding_households_wedding_idx` ON `wedding_households` (`wedding_slug`);--> statement-breakpoint
CREATE TABLE `wedding_responses` (
	`guest_id` text NOT NULL,
	`event_id` text NOT NULL,
	`attending` integer NOT NULL,
	`meal` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`guest_id`) REFERENCES `wedding_guests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wedding_responses_guest_event_idx` ON `wedding_responses` (`guest_id`,`event_id`);