/// <reference types="@cloudflare/workers-types" />

export interface Env {
  AUDIO_BUCKET: R2Bucket;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const id = context.params.id as string;
  const key = `${id}.wav`;

  const object = await context.env.AUDIO_BUCKET.get(key);
  if (!object) {
    return new Response("Audio file not found", { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", "audio/wav");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET");

  return new Response(object.body, { headers });
};
