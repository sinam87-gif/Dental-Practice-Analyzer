import {sqliteTable,text,integer,blob} from 'drizzle-orm/sqlite-core';
export const offers=sqliteTable('offers',{id:text('id').primaryKey(),payload:text('payload').notNull(),updatedAt:text('updated_at').notNull()});
export const runs=sqliteTable('search_runs',{id:text('id').primaryKey(),payload:text('payload').notNull(),createdAt:text('created_at').notNull()});

export const settings=sqliteTable('settings',{id:text('id').primaryKey(),payload:text('payload').notNull()});

export const originalFiles=sqliteTable('original_files',{id:text('id').primaryKey(),name:text('name').notNull(),type:text('type').notNull(),size:integer('size').notNull(),chunks:integer('chunks').notNull()});
export const originalChunks=sqliteTable('original_chunks',{id:text('id').primaryKey(),fileId:text('file_id').notNull(),position:integer('position').notNull(),data:blob('data',{mode:'buffer'}).notNull()});
export const teamUsers=sqliteTable('team_users',{email:text('email').primaryKey(),salt:text('salt').notNull(),passwordHash:text('password_hash').notNull()});
export const teamInvites=sqliteTable('team_invites',{tokenHash:text('token_hash').primaryKey(),email:text('email').notNull(),expiresAt:integer('expires_at').notNull(),used:integer('used').notNull().default(0)});
export const teamSessions=sqliteTable('team_sessions',{tokenHash:text('token_hash').primaryKey(),email:text('email').notNull(),expiresAt:integer('expires_at').notNull()});
export const teamAttempts=sqliteTable('team_attempts',{id:text('id').primaryKey(),count:integer('count').notNull(),resetAt:integer('reset_at').notNull()});

// Additive search-platform tables. Existing offers/accounts/originals are retained.
export const platformJobs=sqliteTable('platform_jobs',{id:text('id').primaryKey(),payload:text('payload').notNull(),status:text('status').notNull(),activeKey:text('active_key').unique(),leaseToken:text('lease_token'),leaseUntil:integer('lease_until').notNull().default(0),createdAt:text('created_at').notNull()});
export const platformTasks=sqliteTable('platform_tasks',{id:text('id').primaryKey(),jobId:text('job_id').notNull(),payload:text('payload').notNull(),status:text('status').notNull(),readyAt:integer('ready_at').notNull().default(0),createdAt:text('created_at').notNull()});
export const platformListings=sqliteTable('platform_listings',{id:text('id').primaryKey(),payload:text('payload').notNull(),fingerprint:text('fingerprint').notNull(),revision:integer('revision').notNull(),updatedAt:text('updated_at').notNull()});
export const platformAliases=sqliteTable('platform_aliases',{alias:text('alias').primaryKey(),listingId:text('listing_id').notNull()});
export const platformEvents=sqliteTable('platform_events',{id:text('id').primaryKey(),payload:text('payload').notNull(),createdAt:text('created_at').notNull()});
export const platformNotifications=sqliteTable('platform_notifications',{id:text('id').primaryKey(),payload:text('payload').notNull(),readAt:text('read_at'),createdAt:text('created_at').notNull()});
export const platformConfig=sqliteTable('platform_config',{id:text('id').primaryKey(),payload:text('payload').notNull()});
export const platformCache=sqliteTable('platform_cache',{id:text('id').primaryKey(),payload:text('payload').notNull(),expiresAt:integer('expires_at').notNull(),nextAllowedAt:integer('next_allowed_at').notNull().default(0)});
export const platformMail=sqliteTable('platform_mail',{id:text('id').primaryKey(),payload:text('payload').notNull(),status:text('status').notNull(),createdAt:text('created_at').notNull()});
export const platformNotificationReads=sqliteTable('platform_notification_reads',{id:text('id').primaryKey(),notificationId:text('notification_id').notNull(),userId:text('user_id').notNull(),readAt:text('read_at').notNull()});
