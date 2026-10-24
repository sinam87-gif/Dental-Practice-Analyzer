CREATE TABLE `platform_aliases` (
	`alias` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`expires_at` integer NOT NULL,
	`next_allowed_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_config` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_events` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`active_key` text,
	`lease_token` text,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `platform_jobs_active_key_unique` ON `platform_jobs` (`active_key`);--> statement-breakpoint
CREATE TABLE `platform_listings` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`fingerprint` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_mail` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`read_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`ready_at` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
