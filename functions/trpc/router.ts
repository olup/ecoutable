import { initTRPC } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createArticle } from "../_services/article";
import { Context } from "./[trpc]";
import * as schema from "../_db/schema";

const t = initTRPC.context<Context>().create();

export const router = t.router({
  listArticles: t.procedure.query(async ({ ctx }) => {
    const articles = await ctx.db.select().from(schema.article);
    return { articles };
  }),

  deleteArticle: t.procedure
    .input((val: unknown) => {
      if (typeof val !== "string") throw new Error("UUID required");
      return val;
    })
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(schema.article).where(eq(schema.article.uuid, input));
      return { success: true };
    }),

  addArticle: t.procedure
    .input((val: unknown) => {
      if (typeof val !== "string") throw new Error("URL required");
      return val;
    })
    .mutation(async (opts) => {
      try {
        const article = await createArticle(opts.input, opts.ctx);
        return { success: true, articleUuid: article.uuid };
      } catch (error) {
        console.error("Failed to add article:", error);
        return { success: false, error };
      }
    }),
});

export type AppRouter = typeof router;
