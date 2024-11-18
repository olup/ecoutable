import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const articles = pgTable('articles', {
  id: uuid('id').defaultRandom().primaryKey(),
  url: text('url').notNull(),
  markdown: text('markdown').notNull(),
  audioPath: text('audio_path'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending')
})
