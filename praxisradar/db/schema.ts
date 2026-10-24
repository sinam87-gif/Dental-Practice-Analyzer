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
