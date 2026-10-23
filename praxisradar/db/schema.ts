import {sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const offers=sqliteTable('offers',{id:text('id').primaryKey(),payload:text('payload').notNull(),updatedAt:text('updated_at').notNull()});
export const runs=sqliteTable('search_runs',{id:text('id').primaryKey(),payload:text('payload').notNull(),createdAt:text('created_at').notNull()});

export const settings=sqliteTable('settings',{id:text('id').primaryKey(),payload:text('payload').notNull()});
