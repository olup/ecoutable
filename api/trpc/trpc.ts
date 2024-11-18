import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { router } from ".";
import {
  KVNamespace,
  PagesFunction,
  R2Bucket,
} from "@cloudflare/workers-types";

type Env = {
  ECOUTABLE_KV: KVNamespace;
  BUCKET: R2Bucket;
};

export type Context = {
  kv: KVNamespace;
  bucket: R2Bucket;
};

export const onRequest: PagesFunction<Env> = async (context) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: context.request,
    router,
    createContext: () => ({
      kv: context.env.ECOUTABLE_KV,
      bucket: context.env.BUCKET,
    }),
  });
};
