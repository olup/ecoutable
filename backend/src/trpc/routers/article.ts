import { Readability } from "@mozilla/readability";
import { and, desc, eq } from "drizzle-orm";
import { JSDOM } from "jsdom";
import { z } from "zod";
import { articles, users } from "../../db/schema";
import generateAudioForArticle from "../../utils/generateAudio";
import { procedure, router } from "../trpc";
import { getArticle } from "@/utils/getArticle";
import test from "node:test";
import { Resource } from "sst";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { TRPCError } from "@trpc/server";
import { getDb } from "@/utils/db";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const sqs = new SQSClient({});
const s3 = new S3Client();

const articleRouter = router({
  add: procedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const article = await getArticle(input.url);
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.email, ctx.user.email),
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to add articles",
        });
      }

      const articleDb = await ctx.db
        .insert(articles)
        .values({
          url: input.url,
          title: article.title || "Untitled",
          textContent: article.textContent || "",
          markdownContent: article.markdownContent,
          userUuid: user.uuid,
          lang: article.lang,
        })
        .returning();

      return articleDb[0];
    }),

  list: procedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(users.email, ctx.user.email),
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to add articles",
      });
    }

    return await db
      .select()
      .from(articles)
      .where(eq(articles.userUuid, user.uuid))
      .orderBy(desc(articles.createdAt));
  }),

  getOne: procedure
    .input(z.object({ uuid: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(users.email, ctx.user.email),
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to add articles",
        });
      }

      return await db.query.articles.findFirst({
        where: and(
          eq(articles.userUuid, user.uuid),
          eq(articles.uuid, input.uuid)
        ),
      });
    }),

  delete: procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const user = await ctx.db.query.users.findFirst({
        where: eq(users.email, ctx.user.email),
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to add articles",
        });
      }

      const article = await ctx.db.query.articles.findFirst({
        where: eq(articles.uuid, input.id),
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      if (article.textAudioUrl) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: Resource.ecoutable.name,
            Key: `audio/${article.uuid}/textContent.mp3`,
          })
        );
      }

      return ctx.db
        .delete(articles)
        .where(
          and(eq(articles.uuid, input.id), eq(articles.userUuid, user.uuid))
        );
    }),

  // New tRPC route for audio generation
  audioGeneration: procedure
    .input(z.object({ articleUuid: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Update the article status to processing
      await getDb()
        .update(articles)
        .set({
          status: "processing",
        })
        .where(eq(articles.uuid, input.articleUuid));

      // Send the message to the audio worker queue
      await sqs.send(
        new SendMessageCommand({
          QueueUrl: Resource.audioWorkerQueue.url,
          MessageBody: JSON.stringify({ articleUuid: input.articleUuid }),
        })
      );
    }),
});

export default articleRouter;
