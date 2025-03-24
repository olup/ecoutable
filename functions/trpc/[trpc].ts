import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { router } from "./router";
import { D1Database, PagesFunction, R2Bucket } from "@cloudflare/workers-types";
import { createDb } from "../_db";

export type Env = {
  DB: D1Database;
  BUCKET: R2Bucket;
};

export type Context = {
  db: ReturnType<typeof createDb>;
  bucket: R2Bucket;
};

// @ts-ignore
export const onRequest: PagesFunction<Env> = async (context) => {
  return fetchRequestHandler({
    endpoint: "/trpc",
    // @ts-ignore
    req: context.request,
    router,
    createContext: () => ({
      db: createDb(context.env.DB),
      bucket: context.env.BUCKET,
      context,
    }),
  });
};
