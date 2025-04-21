import { Storage } from "@google-cloud/storage";
import "dotenv/config";
import { os } from "@orpc/server";
import { RPCHandler } from "@orpc/server/node";
import { CORSPlugin } from "@orpc/server/plugins";
import { createServer } from "node:http";
import { z } from "zod";
import { Article, CURRENT_USER_ID } from "./models/types.js";
import { MarkdownChunk, splitMarkdownIntoChunks } from "./utils/article.js";
import { describeImage, generateCompletion } from "./utils/llm.js";
import { generateSignedUrl } from "./utils/storage.js";
import { processContentToAudio } from "./utils/tts.js";
import { getUserData, saveUserData } from "./utils/user-data.js";

// Initialize Google Cloud Storage
const storage = new Storage();
const bucket = storage.bucket(process.env.BUCKET_NAME || "");

// API Routes
const router = {
  health: os.handler(async () => {
    return { status: "ok" };
  }),

  getArticles: os.handler(async () => {
    const userData = await getUserData(CURRENT_USER_ID);
    return userData.articles;
  }),

  addArticle: os
    .input(z.object({ url: z.string() }))
    .handler(async ({ input }) => {
      console.log("Adding article with URL:", input.url);

      const apiUrl = `https://r.jina.ai/${input.url}`;
      const result = (await fetch(apiUrl, {
        headers: {
          Accept: "application/json",
        },
      }).then((response) => response.json())) as {
        data: { title: string; content: string };
      };

      const tinyUid = Math.random().toString(36).substring(2, 8);

      // Create and save initial article
      const article: Article = {
        id: tinyUid,
        url: input.url,
        title: result?.data?.title || "Untitled",
        content: result?.data?.content,
        audioId: tinyUid,
        createdAt: new Date().toISOString(),
        status: "ADDED",
      };

      // Save initial article
      const userData = await getUserData(CURRENT_USER_ID);
      userData.articles.push(article);
      await saveUserData(CURRENT_USER_ID, userData);

      // Update status to PROCESSING
      article.status = "PROCESSING";
      await saveUserData(CURRENT_USER_ID, {
        ...userData,
        articles: userData.articles.map((a) =>
          a.id === article.id ? article : a
        ),
      });

      // Clean article content using LLM
      const prompt = `
ORIGINAL ARTICLE CONTENT
${result?.data?.content}

INSTRUCTIONS
We want to turn this article into audio. Before running the TTS model, please clean the article content.
- Remove any markdown link, only keep the text
- Remove bold and italic formatting
- Remove any code block. Replace them by a mention of the presence of a code
- Remove URL in the text, as they cannot be read by the TTS model. Replace them by a mention of the presence of a URL.
- Keep titles and images as markdown. Keep image urls in the markdown.

Keep the rest of the content as is. Do not add anything to the content.

CLEANED ARTICLE CONTENT
`;

      let cleanedArticle: string;
      try {
        cleanedArticle = (await generateCompletion(prompt)) || "";
        if (!cleanedArticle) {
          throw new Error("Failed to generate completion");
        }
      } catch (error) {
        // Update status to ERROR
        article.status = "ERROR";
        await saveUserData(CURRENT_USER_ID, {
          ...userData,
          articles: userData.articles.map((a) =>
            a.id === article.id ? article : a
          ),
        });
        return { success: false, error: "Failed to generate completion" };
      }

      // Split markdown and process images
      const splitted = splitMarkdownIntoChunks(cleanedArticle);

      console.log("Augmenting splits");

      const processedChunks = await Promise.all(
        splitted.map(async (chunk) => {
          if (chunk.type === "image") {
            const description = await describeImage(chunk.content);

            // Skip image if description is null
            if (!description) {
              return null;
            }

            return {
              type: "image" as const,
              content: description,
            };
          }
          return chunk;
        })
      );

      // Filter out null chunks and generate audio
      // Convert the chunks to the format expected by processContentToAudio
      // First filter out nulls and convert to ContentChunks
      const validChunks = processedChunks
        .filter((chunk): chunk is MarkdownChunk => chunk !== null)
        .map((chunk) => ({
          type: chunk.type as "text" | "image" | "title",
          content: chunk.content,
        }));

      const audioBuffer = await processContentToAudio(validChunks);

      // Upload to Google Cloud Storage
      console.log("Uploading audio to bucket");
      try {
        const file = bucket.file(`audio/${tinyUid}.mp3`);
        await file.save(audioBuffer);

        // Update status to AUDIO_GENERATED
        article.status = "AUDIO_GENERATED";
        await saveUserData(CURRENT_USER_ID, {
          ...userData,
          articles: userData.articles.map((a) =>
            a.id === article.id ? article : a
          ),
        });
      } catch (error) {
        // Update status to ERROR
        article.status = "ERROR";
        await saveUserData(CURRENT_USER_ID, {
          ...userData,
          articles: userData.articles.map((a) =>
            a.id === article.id ? article : a
          ),
        });
        return { success: false, error: "Failed to upload audio" };
      }

      return {
        success: true,
        articleId: tinyUid,
        article,
      };
    }),

  deleteArticle: os
    .input(z.object({ articleId: z.string() }))
    .handler(async ({ input }) => {
      try {
        // Get current user data
        const userData = await getUserData(CURRENT_USER_ID);

        // Find and remove the article
        const articleIndex = userData.articles.findIndex(
          (a) => a.id === input.articleId
        );
        if (articleIndex === -1) {
          return false;
        }

        // Delete the audio file
        const file = bucket.file(`${input.articleId}.mp3`);
        const exists = await file.exists();
        if (exists[0]) {
          await file.delete();
        }

        // Update user data without the deleted article
        userData.articles.splice(articleIndex, 1);
        await saveUserData(CURRENT_USER_ID, userData);

        return true;
      } catch (error) {
        console.error("Error deleting article:", error);
        return false;
      }
    }),

  getAudio: os
    .input(z.object({ articleId: z.string() }))
    .handler(async ({ input }) => {
      try {
        const path = `audio/${input.articleId}.mp3`;
        const file = bucket.file(path);
        const exists = await file.exists();
        if (!exists[0]) {
          return null;
        }

        const url = await generateSignedUrl(file);

        return { url };
      } catch (error) {
        console.error("Error getting audio:", error);
        return null;
      }
    }),
};

// Create the handler
const handler = new RPCHandler(router, {
  plugins: [new CORSPlugin()],
});

const server = createServer(async (req, res) => {
  const result = await handler.handle(req, res, {
    context: {},
  });

  if (!result.matched) {
    res.statusCode = 404;
    res.end("No procedure matched");
  }
});

server.listen(3333, "0.0.0.0", () => console.log("Listening on 0.0.0.0:3333"));

export type Router = typeof router;
