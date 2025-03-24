import { sql, sum } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { url } from "inspector";

export const setting = sqliteTable("setting", {
  key: text("key").primaryKey(),
  value: text("value"),
});

export const article = sqliteTable("article", {
  uuid: text()
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: integer("timestamp", { mode: "timestamp" })
    .notNull()
    .default(sql`(current_timestamp)`),
  summary: text("summary"),
  fullLengthAudioUrl: text("full_length_audio_url"),
  summaryAudioUrl: text("summary_audio_url"),
  podcastAudioUrl: text("podcast_audio_url"),
  status: text("status", { enum: ["processing", "complete"] })
    .notNull()
    .default("processing"),
});
