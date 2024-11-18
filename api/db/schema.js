"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.articles = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.articles = (0, pg_core_1.pgTable)('articles', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    url: (0, pg_core_1.text)('url').notNull(),
    markdown: (0, pg_core_1.text)('markdown').notNull(),
    audioPath: (0, pg_core_1.text)('audio_path'),
    summary: (0, pg_core_1.text)('summary'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).notNull().default('pending')
});
