import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const articles = pgTable("articles", {
  uuid: uuid("uuid").primaryKey().defaultRandom(),
  url: varchar("url").notNull(),
  title: text("title").notNull(),
  textContent: text("text_content").notNull(),
  markdownContent: text("markdown_content").notNull(),
  textAudioUrl: text("text_audio_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lang: text("lang").notNull().default("en"),
  status: text("status", {
    enum: ["pending", "processing", "complete", "error"],
  })
    .notNull()
    .default("pending"),

  userUuid: uuid("user_uuid")
    .notNull()
    .references(() => users.uuid, { onDelete: "cascade" }),
});

export const articleRelations = relations(articles, ({ one, many }) => ({
  user: one(users, {
    fields: [articles.userUuid],
    references: [users.uuid],
  }),
}));

// New user table
export const users = pgTable("users", {
  uuid: uuid("uuid").primaryKey().defaultRandom(),
  email: varchar("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userRelations = relations(users, ({ one, many }) => ({
  articles: many(articles),
}));
