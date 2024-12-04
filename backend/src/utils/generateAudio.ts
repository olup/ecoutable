import { generateAudio } from "./tts";
import { articles } from "../db/schema";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { processAstNode } from "./getArticle";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Resource } from "sst";
import { getMarkdownAst } from "./markdown";

const s3 = new S3Client();

const voicesDictionary = {
  en: {
    paragraph: "en-GB-RyanNeural",
    heading: "en-GB-SoniaNeural",
  },
  fr: {
    paragraph: "fr-FR-HenriNeural",
    heading: "fr-FR-DeniseNeural",
  },
} as Record<string, Record<string, string>>;

const getVoiceId = (lang: string, blockType: string) => {
  const voiceLanguage = voicesDictionary[lang] || voicesDictionary.en;
  return voiceLanguage[blockType] || voiceLanguage.paragraph;
};

export default async function generateAudioForArticle(articleUuid: string) {
  if (!articleUuid) {
    throw new Error("Article ID is required");
  }

  const db = getDb();
  const articlesResult = await db
    .select()
    .from(articles)
    .where(eq(articles.uuid, articleUuid));
  const article = articlesResult[0];

  if (!article) {
    throw new Error("Article not found");
  }

  try {
    const markdownWithTitle = `# ${article.title}\n\n${article.markdownContent}`;
    const ast = await getMarkdownAst(markdownWithTitle);
    const blocks = await processAstNode(ast, null);

    const blobs: Blob[] = [];

    for (const block of blocks) {
      const voice = getVoiceId(article.lang, block.type);
      const blob = await generateAudio(block.content, {
        voice,
        lang: article.lang,
      });
      blobs.push(blob);
    }

    const audio = new Blob(blobs, { type: "audio/mpeg" });
    const audioPath = `audio/${article.uuid}/textContent.mp3`;
    await s3.send(
      new PutObjectCommand({
        Bucket: Resource.ecoutable.name,
        Key: `audio/${article.uuid}/textContent.mp3`,
        Body: Buffer.from(await audio.arrayBuffer()),
        ContentType: "audio/mpeg",
      })
    );

    await db
      .update(articles)
      .set({
        textAudioUrl: `https://${Resource.ecoutable.name}.s3.eu-central-1.amazonaws.com/${audioPath}`,
        status: "complete",
      })
      .where(eq(articles.uuid, article.uuid));
  } catch (error) {
    console.log("error", error);

    await db
      .update(articles)
      .set({ status: "error" })
      .where(eq(articles.uuid, article.uuid));
    throw error;
  }
}
