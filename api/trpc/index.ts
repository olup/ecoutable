import { initTRPC } from '@trpc/server'
import { db } from '../db'
import { articles } from '../db/schema'
import { eq } from 'drizzle-orm'
import { createArticle } from '../services/article'

const t = initTRPC.create()

export const router = t.router({
  listArticles: t.procedure
    .query(async () => {
      return await db.select().from(articles)
    }),
    
  deleteArticle: t.procedure
    .input((val: unknown) => {
      if (typeof val !== 'string') throw new Error('UUID required')
      return val
    })
    .mutation(async (opts) => {
      await db.delete(articles).where(eq(articles.id, opts.input))
      return { success: true }
    }),

  addArticle: t.procedure
    .input((val: unknown) => {
      if (typeof val !== 'string') throw new Error('URL required')
      return val
    })
    .mutation(async (opts) => {
      const article = await createArticle(opts.input)
      return { success: true, articleId: article.id }
    })
})

export type AppRouter = typeof router
