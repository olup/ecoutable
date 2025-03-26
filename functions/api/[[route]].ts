/// <reference types="@cloudflare/workers-types" />
import { os } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { CORSPlugin } from "@orpc/server/plugins";
import { z } from "zod";
import { Env } from "../models/types";
import { addArticle, deleteArticle, getArticles } from "../services/articles";

const base = os.$context<{ env: Env }>();

// API Routes
const router = {
  getArticles: base.handler(async ({ context }) => {
    return await getArticles(context.env);
  }),

  addArticle: base
    .input(z.object({ url: z.string() }))
    .handler(async ({ input, context }) => {
      return await addArticle(input.url, context.env);
    }),

  deleteArticle: base
    .input(z.object({ articleId: z.string() }))
    .handler(async ({ input, context }) => {
      return await deleteArticle(input.articleId, context.env);
    }),
};

// Create the handler
const handler = new RPCHandler(router, {
  plugins: [new CORSPlugin()],
});

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  console.log("Request URL:", request.url);

  // Handle API routes
  const { response } = await handler
    .handle(request, {
      prefix: "/api",
      context: { env },
    })
    .catch((error) => {
      console.error("Error handling request:", error);
      return { matched: false, response: undefined };
    });

  return response || new Response("Not found", { status: 404 });
};

export type Router = typeof router;
