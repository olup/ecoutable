"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const server_1 = require("@trpc/server");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const node_edge_tts_1 = require("node-edge-tts");
const blob_1 = require("@vercel/blob");
const promises_1 = require("fs/promises");
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
async function processArticle(url) {
    // Get markdown from Jina
    const jinaResponse = await fetch(`https://r.jina.ai/${url}`);
    if (!jinaResponse.ok) {
        throw new Error(`Jina API error: ${jinaResponse.statusText}`);
    }
    const markdown = await jinaResponse.text();
    // Get summary from OpenAI
    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "system", content: "Summarize the following text concisely:" },
            { role: "user", content: markdown }
        ]
    });
    const summary = completion.choices[0]?.message?.content || '';
    // Convert to speech
    const tts = new node_edge_tts_1.EdgeTTS();
    const tempPath = `/tmp/speech-${Date.now()}.mp3`;
    await tts.ttsPromise(markdown, tempPath);
    const audioBuffer = await (0, promises_1.readFile)(tempPath);
    // Store audio in Vercel Blob
    const blob = await (0, blob_1.put)(`articles/${Date.now()}.mp3`, audioBuffer, {
        access: 'public',
        contentType: 'audio/mpeg'
    });
    return {
        url,
        markdown,
        audioPath: blob.url,
        summary
    };
}
const t = server_1.initTRPC.create();
exports.router = t.router({
    listArticles: t.procedure
        .query(async () => {
        return await db_1.db.select().from(schema_1.articles);
    }),
    deleteArticle: t.procedure
        .input((val) => {
        if (typeof val !== 'string')
            throw new Error('UUID required');
        return val;
    })
        .mutation(async (opts) => {
        await db_1.db.delete(schema_1.articles).where((0, drizzle_orm_1.eq)(schema_1.articles.id, opts.input));
        return { success: true };
    }),
    addArticle: t.procedure
        .input((val) => {
        if (typeof val !== 'string')
            throw new Error('URL required');
        return val;
    })
        .mutation(async (opts) => {
        // First create article in pending state
        const [article] = await db_1.db.insert(schema_1.articles).values({
            url: opts.input,
            markdown: '',
            status: 'pending'
        }).returning();
        // Process article asynchronously
        processArticle(opts.input).then(async (articleData) => {
            await db_1.db.update(schema_1.articles)
                .set({
                ...articleData,
                status: 'processed'
            })
                .where((0, drizzle_orm_1.eq)(schema_1.articles.id, article.id));
        }).catch(async (error) => {
            await db_1.db.update(schema_1.articles)
                .set({ status: 'error' })
                .where((0, drizzle_orm_1.eq)(schema_1.articles.id, article.id));
            console.error('Error processing article:', error);
        });
        return { success: true, articleId: article.id };
    })
});
