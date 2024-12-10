import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { Resource } from "sst";
import { articles } from "../db/schema";
import { getDb } from "./db";
import { processAstNode } from "./getArticle";
import { getMarkdownAst } from "./markdown";
import { generateAudio } from "./tts";
import appendSilenceToMp3WithRateLimit from "./appendSilence";
import path, { join } from "path";
import { mkdir, readFile, rm, unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { combineMp3Files } from "./combineMp3Files";

const s3 = new S3Client();

const voicesDictionary = {
  en: {
    paragraph: "en-GB-RyanNeural",
    heading: "en-GB-SoniaNeural",
    image: "en-GB-SoniaNeural",
  },
  fr: {
    paragraph: "fr-FR-HenriNeural",
    heading: "fr-FR-DeniseNeural",
    image: "fr-FR-DeniseNeural",
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

  const sourceList: string[] = [];

  // preparing our work directory
  const tempDirUuid = crypto.randomUUID();
  const tempDir = path.join(tmpdir(), tempDirUuid);
  const tempDirParts = path.join(tempDir, "parts");
  await mkdir(tempDirParts, { recursive: true });

  try {
    // preparing final markdown
    const markdownWithTitle = `# ${article.title}\n\n${article.markdownContent}`;
    const ast = await getMarkdownAst(markdownWithTitle);
    const blocks = await processAstNode(article.lang, ast, null);

    for (const block of blocks) {
      const blockId = crypto.randomUUID();

      const voice = getVoiceId(article.lang, block.type);
      const blob = await generateAudio(block.content, {
        voice,
        lang: article.lang,
      });
      const audioPath = join(tempDir, "parts", `${blockId}.mp3`);
      await writeFile(audioPath, blob.stream());
      sourceList.push(audioPath);
    }

    const outputPath = join(tempDir, "output.mp3");
    await combineMp3Files(sourceList, outputPath);

    const audioBucketPath = `audio/${article.uuid}/audio-full.mp3`;
    await s3.send(
      new PutObjectCommand({
        Bucket: Resource.ecoutable.name,
        Key: audioBucketPath,
        Body: await readFile(outputPath),
        ContentType: "audio/mpeg",
      })
    );

    await db
      .update(articles)
      .set({
        textAudioUrl: `https://${Resource.ecoutable.name}.s3.eu-central-1.amazonaws.com/${audioBucketPath}`,
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
  } finally {
    await rm(tempDir, { recursive: true });
  }
}
