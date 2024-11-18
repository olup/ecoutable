import OpenAI from "openai";
import { EdgeTTS } from "../services/tts";
import { Context } from "../trpc/trpc";

export async function processArticle(url: string, ctx: Context) {
  // Get markdown from Jina
  const jinaResponse = await fetch(`https://r.jina.ai/${url}`, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!jinaResponse.ok) {
    throw new Error(`Jina API error: ${jinaResponse.statusText}`);
  }
  const markdown = (await jinaResponse.json()) as {
    title: string;
    content: string;
  };

  const settingsRaw = await ctx.kv.get("settings");
  const settings = JSON.parse(settingsRaw || "{}");

  const openai = new OpenAI({
    apiKey: await settings.llm_api_key,
    baseURL: await settings.llm_api_url,
  });

  // Get summary from OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "Summarize the following text concisely:" },
      { role: "user", content: markdown.content },
    ],
  });
  const summary = completion.choices[0]?.message?.content || "";

  // Convert to speech
  const audioUuid = crypto.randomUUID();
  const tts = new EdgeTTS();
  const audioBuffer = await tts.ttsPromise(markdown.content);
  const audioPath = `articles/${audioUuid}.mp3`;

  // Store audio in Vercel Blob
  await ctx.bucket.put(`articles/${audioPath}.mp3`, audioBuffer);

  return {
    url,
    content: markdown.content,
    audioPath,
    summary,
    title: markdown.title,
  };
}

export async function createArticle(url: string, ctx: Context) {
  // Create article in pending state
  const uuid = crypto.randomUUID();
  const article = {
    uuid,
    url,
    status: "pending",
    createdAt: Date.now(),
    title: "",
    content: "",
    summary: "",
    audiourl: "",
    version: 0,
  };

  await ctx.kv.put(`articles/${uuid}`, JSON.stringify(article));

  // Process article asynchronously
  processArticle(url, ctx)
    .then(async (articleData) => {
      article.title = articleData.title;
      article.content = articleData.content;
      article.summary = articleData.summary;
      article.audiourl = articleData.audioPath;

      await ctx.kv.put(`articles/${uuid}`, JSON.stringify(article));
    })
    .catch(async (error) => {
      article.status = "error";
      await ctx.kv.put(`articles/${uuid}`, JSON.stringify(article));
      throw error;
    });

  return article;
}
