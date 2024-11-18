import { initTRPC } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createArticle } from "../services/article";
import { Context } from "./trpc";

const t = initTRPC.context<Context>().create();

export const router = t.router({
  listArticles: t.procedure.query(async ({ ctx }) => {
    return await ctx.kv.list({ prefix: "articles/" });
  }),

  deleteArticle: t.procedure
    .input((val: unknown) => {
      if (typeof val !== "string") throw new Error("UUID required");
      return val;
    })
    .mutation(async ({ ctx, input }) => {
      await ctx.kv.delete(`articles/${input}`);
      return { success: true };
    }),

  addArticle: t.procedure
    .input((val: unknown) => {
      if (typeof val !== "string") throw new Error("URL required");
      return val;
    })
    .mutation(async (opts) => {
      const article = await createArticle(opts.input, opts.ctx);
      return { success: true, articleUuid: article.uuid };
    }),
});

export type AppRouter = typeof router;
