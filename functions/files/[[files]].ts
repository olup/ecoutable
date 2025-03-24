import { PagesFunction } from "@cloudflare/workers-types";
import { Env } from "../trpc/[trpc]";

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const path = new URL(ctx.request.url).pathname.replace("/files/", "");
  const file = await ctx.env.BUCKET.get(path);
  if (!file) return new Response(null, { status: 404 });

  return new Response(file.body, {
    headers: { "Content-Type": file.httpMetadata?.contentType },
  });
};
