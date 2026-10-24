CREATE TABLE `platform_notification_reads` (
	`id` text PRIMARY KEY NOT NULL,
	`notification_id` text NOT NULL,
	`user_id` text NOT NULL,
	`read_at` text NOT NULL
);
