import OpenAI from "openai";
import { EdgeTTS } from "./tts";
import { Context } from "../trpc/[trpc]";
import { title } from "process";
import * as schema from "../_db/schema";
import { eq } from "drizzle-orm";
import markdownToPlain from "./markdownToPlain";

const tts = new EdgeTTS();

type ReadabilityResponse = {
  title: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  siteName: string | null;
  readingTimeMinutes: number;
};

export const getArticleContent = async (url: string) => {
  const readabilityResponse = await fetch(
    `https://readability-omega.vercel.app/api/analyze?url=${url}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );
  if (!readabilityResponse.ok) {
    throw new Error(`Readability error: ${readabilityResponse.statusText}`);
  }
  const response: ReadabilityResponse = await readabilityResponse.json();

  return response;
};

export const getArticleSummary = async (
  article: { title: string; content: string },
  ctx: Context
) => {
  const [llmApiKey] = await ctx.db
    .select()
    .from(schema.setting)
    .where(eq(schema.setting.key, "llm_api_key"));
  const [llmApiUrl] = await ctx.db
    .select()
    .from(schema.setting)
    .where(eq(schema.setting.key, "llm_api_url"));
  const [llmApiModel] = await ctx.db
    .select()
    .from(schema.setting)
    .where(eq(schema.setting.key, "llm_api_model"));

  if (!llmApiKey?.value || !llmApiUrl?.value || !llmApiModel?.value) {
    console.log("LLM API key or URL not set");
    return "";
  }

  const openai = new OpenAI({
    apiKey: llmApiKey.value,
    baseURL: llmApiUrl.value,
  });

  // Get summary from OpenAI
  const completion = await openai.chat.completions.create({
    model: llmApiModel.value,
    messages: [
      { role: "system", content: "Summarize the following text concisely:" },
      { role: "user", content: article.content },
    ],
  });
  const summary = completion.choices[0]?.message?.content || "";

  return summary;
};

const generateAndSaveAudio = async (
  content: string,
  audioPath: string,
  ctx: Context
) => {
  console.log("generating audio for");
  const blob = await tts.ttsPromise(content);
  await ctx.bucket.put(audioPath, await blob.arrayBuffer());
};

export const createArticle = async (url: string, ctx: Context) => {
  const article = await getArticleContent(url);
  const summary = await getArticleSummary(article, ctx);

  console.log("article", article);

  const [articleDb] = await ctx.db
    .insert(schema.article)
    .values({
      url,
      title: article.title,
      content: article.content,
      status: "processing",
    })
    .returning();

  const audioPath = `articles/${articleDb.uuid}/full.mp3`;
  const summaryPath = `articles/${articleDb.uuid}/summary.mp3`;

  await generateAndSaveAudio(article.textContent, audioPath, ctx);
  // await generateAndSaveAudio(summary, summaryPath, ctx);

  await ctx.db
    .update(schema.article)
    .set({
      summary,
      fullLengthAudioUrl: audioPath,
      summaryAudioUrl: summaryPath,
      status: "complete",
    })
    .where(eq(schema.article.uuid, articleDb.uuid));

  return articleDb;
};
