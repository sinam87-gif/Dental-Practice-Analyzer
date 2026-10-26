CREATE TABLE `platform_daily_schedule` (
	`day` text PRIMARY KEY NOT NULL,
	`requested_at` integer NOT NULL,
	`job_id` text,
	`state` text DEFAULT 'queued' NOT NULL
);
