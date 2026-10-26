CREATE TABLE `platform_daily_budget` (
	`day` text PRIMARY KEY NOT NULL,
	`steps` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_storage_budget` (
	`name` text PRIMARY KEY NOT NULL,
	`bytes` integer NOT NULL,
	`maximum` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `platform_jobs` ADD `available_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `platform_jobs_created` ON `platform_jobs` (`created_at`);--> statement-breakpoint
CREATE INDEX offers_public_url ON offers(json_extract(payload,'$.url'));--> statement-breakpoint
CREATE INDEX `platform_cache_expiry` ON `platform_cache` (`expires_at`);--> statement-breakpoint
CREATE INDEX `platform_events_created` ON `platform_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `platform_mail_status` ON `platform_mail` (`status`);--> statement-breakpoint
CREATE INDEX `platform_notifications_created` ON `platform_notifications` (`created_at`);--> statement-breakpoint
CREATE INDEX `platform_tasks_next` ON `platform_tasks` (`job_id`,`status`,`ready_at`,`created_at`);
--> statement-breakpoint
INSERT INTO platform_storage_budget(name,bytes,maximum) SELECT 'platform_cache',COALESCE(SUM(length(CAST(payload AS BLOB))),0),33554432 FROM platform_cache;
CREATE TRIGGER platform_cache_budget_insert AFTER INSERT ON platform_cache BEGIN UPDATE platform_storage_budget SET bytes=bytes+(length(CAST(NEW.payload AS BLOB))) WHERE name='platform_cache'; SELECT CASE WHEN bytes>maximum THEN RAISE(ABORT,'Free storage budget reached: platform_cache') END FROM platform_storage_budget WHERE name='platform_cache'; END;
CREATE TRIGGER platform_cache_budget_update AFTER UPDATE ON platform_cache BEGIN UPDATE platform_storage_budget SET bytes=bytes+(length(CAST(NEW.payload AS BLOB))-length(CAST(OLD.payload AS BLOB))) WHERE name='platform_cache'; SELECT CASE WHEN bytes>maximum AND length(CAST(NEW.payload AS BLOB))>length(CAST(OLD.payload AS BLOB)) THEN RAISE(ABORT,'Free storage budget reached: platform_cache') END FROM platform_storage_budget WHERE name='platform_cache'; END;
CREATE TRIGGER platform_cache_budget_delete AFTER DELETE ON platform_cache BEGIN UPDATE platform_storage_budget SET bytes=bytes+(-length(CAST(OLD.payload AS BLOB))) WHERE name='platform_cache';  END;
INSERT INTO platform_storage_budget(name,bytes,maximum) SELECT 'platform_tasks',COALESCE(SUM(length(CAST(payload AS BLOB))),0),16777216 FROM platform_tasks;
CREATE TRIGGER platform_tasks_budget_insert AFTER INSERT ON platform_tasks BEGIN UPDATE platform_storage_budget SET bytes=bytes+(length(CAST(NEW.payload AS BLOB))) WHERE name='platform_tasks'; SELECT CASE WHEN bytes>maximum THEN RAISE(ABORT,'Free storage budget reached: platform_tasks') END FROM platform_storage_budget WHERE name='platform_tasks'; END;
CREATE TRIGGER platform_tasks_budget_update AFTER UPDATE ON platform_tasks BEGIN UPDATE platform_storage_budget SET bytes=bytes+(length(CAST(NEW.payload AS BLOB))-length(CAST(OLD.payload AS BLOB))) WHERE name='platform_tasks'; SELECT CASE WHEN bytes>maximum AND length(CAST(NEW.payload AS BLOB))>length(CAST(OLD.payload AS BLOB)) THEN RAISE(ABORT,'Free storage budget reached: platform_tasks') END FROM platform_storage_budget WHERE name='platform_tasks'; END;
CREATE TRIGGER platform_tasks_budget_delete AFTER DELETE ON platform_tasks BEGIN UPDATE platform_storage_budget SET bytes=bytes+(-length(CAST(OLD.payload AS BLOB))) WHERE name='platform_tasks';  END;
INSERT INTO platform_storage_budget(name,bytes,maximum) SELECT 'platform_jobs',COALESCE(SUM(length(CAST(payload AS BLOB))),0),4194304 FROM platform_jobs;
CREATE TRIGGER platform_jobs_budget_insert AFTER INSERT ON platform_jobs BEGIN UPDATE platform_storage_budget SET bytes=bytes+(length(CAST(NEW.payload AS BLOB))) WHERE name='platform_jobs'; SELECT CASE WHEN bytes>maximum THEN RAISE(ABORT,'Free storage budget reached: platform_jobs') END FROM platform_storage_budget WHERE name='platform_jobs'; END;
CREATE TRIGGER platform_jobs_budget_update AFTER UPDATE ON platform_jobs BEGIN UPDATE platform_storage_budget SET bytes=bytes+(length(CAST(NEW.payload AS BLOB))-length(CAST(OLD.payload AS BLOB))) WHERE name='platform_jobs'; SELECT CASE WHEN bytes>maximum AND length(CAST(NEW.payload AS BLOB))>length(CAST(OLD.payload AS BLOB)) THEN RAISE(ABORT,'Free storage budget reached: platform_jobs') END FROM platform_storage_budget WHERE name='platform_jobs'; END;
CREATE TRIGGER platform_jobs_budget_delete AFTER DELETE ON platform_jobs BEGIN UPDATE platform_storage_budget SET bytes=bytes+(-length(CAST(OLD.payload AS BLOB))) WHERE name='platform_jobs';  END;
INSERT INTO platform_storage_budget(name,bytes,maximum) SELECT 'platform_events',COALESCE(SUM(length(CAST(payload AS BLOB))),0),33554432 FROM platform_events;
CREATE TRIGGER platform_events_budget_insert AFTER INSERT ON platform_events BEGIN UPDATE platform_storage_budget SET bytes=bytes+(length(CAST(NEW.payload AS BLOB))) WHERE name='platform_events'; SELECT CASE WHEN bytes>maximum THEN RAISE(ABORT,'Free storage budget reached: platform_events') END FROM platform_storage_budget WHERE name='platform_events'; END;
CREATE TRIGGER platform_events_budget_update AFTER UPDATE ON platform_events BEGIN UPDATE platform_storage_budget SET bytes=bytes+(length(CAST(NEW.payload AS BLOB))-length(CAST(OLD.payload AS BLOB))) WHERE name='platform_events'; SELECT CASE WHEN bytes>maximum AND length(CAST(NEW.payload AS BLOB))>length(CAST(OLD.payload AS BLOB)) THEN RAISE(ABORT,'Free storage budget reached: platform_events') END FROM platform_storage_budget WHERE name='platform_events'; END;
CREATE TRIGGER platform_events_budget_delete AFTER DELETE ON platform_events BEGIN UPDATE platform_storage_budget SET bytes=bytes+(-length(CAST(OLD.payload AS BLOB))) WHERE name='platform_events';  END;
INSERT INTO platform_storage_budget(name,bytes,maximum) SELECT 'platform_notifications',COALESCE(SUM(length(CAST(payload AS BLOB))),0),4194304 FROM platform_notifications;
CREATE TRIGGER platform_notifications_budget_insert AFTER INSERT ON platform_notifications BEGIN UPDATE platform_storage_budget SET bytes=bytes+(length(CAST(NEW.payload AS BLOB))) WHERE name='platform_notifications'; SELECT CASE WHEN bytes>maximum THEN RAISE(ABORT,'Free storage budget reached: platform_notifications') END FROM platform_storage_budget WHERE name='platform_notifications'; END;
CREATE TRIGGER platform_notifications_budget_update AFTER UPDATE ON platform_notifications BEGIN UPDATE platform_storage_budget SET bytes=bytes+(length(CAST(NEW.payload AS BLOB))-length(CAST(OLD.payload AS BLOB))) WHERE name='platform_notifications'; SELECT CASE WHEN bytes>maximum AND length(CAST(NEW.payload AS BLOB))>length(CAST(OLD.payload AS BLOB)) THEN RAISE(ABORT,'Free storage budget reached: platform_notifications') END FROM platform_storage_budget WHERE name='platform_notifications'; END;
CREATE TRIGGER platform_notifications_budget_delete AFTER DELETE ON platform_notifications BEGIN UPDATE platform_storage_budget SET bytes=bytes+(-length(CAST(OLD.payload AS BLOB))) WHERE name='platform_notifications';  END;
INSERT INTO platform_storage_budget(name,bytes,maximum) SELECT 'platform_mail',COALESCE(SUM(length(CAST(payload AS BLOB))),0),2097152 FROM platform_mail;
CREATE TRIGGER platform_mail_budget_insert AFTER INSERT ON platform_mail BEGIN UPDATE platform_storage_budget SET bytes=bytes+(length(CAST(NEW.payload AS BLOB))) WHERE name='platform_mail'; SELECT CASE WHEN bytes>maximum THEN RAISE(ABORT,'Free storage budget reached: platform_mail') END FROM platform_storage_budget WHERE name='platform_mail'; END;
CREATE TRIGGER platform_mail_budget_update AFTER UPDATE ON platform_mail BEGIN UPDATE platform_storage_budget SET bytes=bytes+(length(CAST(NEW.payload AS BLOB))-length(CAST(OLD.payload AS BLOB))) WHERE name='platform_mail'; SELECT CASE WHEN bytes>maximum AND length(CAST(NEW.payload AS BLOB))>length(CAST(OLD.payload AS BLOB)) THEN RAISE(ABORT,'Free storage budget reached: platform_mail') END FROM platform_storage_budget WHERE name='platform_mail'; END;
CREATE TRIGGER platform_mail_budget_delete AFTER DELETE ON platform_mail BEGIN UPDATE platform_storage_budget SET bytes=bytes+(-length(CAST(OLD.payload AS BLOB))) WHERE name='platform_mail';  END;
