import { Article, CURRENT_USER_ID, Env, UserData } from "../models/types";
import { generateCompletion, describeImage } from "../_utils/llm";
import { splitMarkdownIntoChunks } from "../_utils/article";
import { runTts } from "../_utils/tts";

export async function deleteArticle(
  articleId: string,
  env: Env
): Promise<boolean> {
  const userData = (await env.ecoutable_users.get(
    CURRENT_USER_ID,
    "json"
  )) as UserData | null;

  if (!userData) return false;

  const updatedUserData: UserData = {
    articles: userData.articles.filter((article) => article.id !== articleId),
  };

  await env.ecoutable_users.put(
    CURRENT_USER_ID,
    JSON.stringify(updatedUserData)
  );

  return true;
}

export async function getArticles(env: Env): Promise<Article[]> {
  const userData = (await env.ecoutable_users.get(
    CURRENT_USER_ID,
    "json"
  )) as UserData | null;
  const articles = userData?.articles || [];

  // Add status to any existing articles that don't have it
  return articles.map((article) => ({
    ...article,
    status:
      article.status ||
      (article.audioId ? "AUDIO_GENERATED" : "GENERATING_AUDIO"),
  }));
}

export async function addArticle(url: string, env: Env) {
  console.log("Adding article with URL:", url);

  const apiUrl = `https://r.jina.ai/${url}`;

  // Get existing user data
  const userData = (await env.ecoutable_users.get(
    CURRENT_USER_ID,
    "json"
  )) as UserData | null;

  const result = (await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
    },
  }).then((response) => response.json())) as {
    data: { title: string; content: string };
  };

  // Store article data
  // First create the article with ADDED status
  const tinyUid = Math.random().toString(36).substring(2, 8);

  const article: Article = {
    id: tinyUid,
    url,
    title: result?.data?.title || "Untitled",
    content: result?.data?.content,
    audioId: tinyUid,
    createdAt: new Date().toISOString(),
    status: "ADDED",
  };

  // Store initial article
  const initialUserData: UserData = {
    articles: [...(userData?.articles || []), article],
  };
  await env.ecoutable_users.put(
    CURRENT_USER_ID,
    JSON.stringify(initialUserData)
  );

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

  const cleanedArticle = await generateCompletion(prompt, env.GEMINI_API_KEY);

  if (!cleanedArticle) {
    return { success: false, error: "Failed to generate completion" };
  }

  const splitted = splitMarkdownIntoChunks(cleanedArticle);

  console.log("Augmenting splits");
  const augmentedSplits = await Promise.all(
    splitted.map(async (chunk) => {
      if (chunk.type === "image") {
        return await describeImage(chunk.content, env.GEMINI_API_KEY);
      }
      return chunk.content;
    })
  );

  // Update status to GENERATING_AUDIO
  article.status = "GENERATING_AUDIO";
  const updatedUserData: UserData = {
    articles: [
      ...(userData?.articles || []).filter((a) => a.id !== article.id),
      article,
    ],
  };

  const ttsContent = augmentedSplits.join("\n\n");
  const wavArray = await runTts(ttsContent, env.REPLICATE_API_KEY);

  console.log("Uploading audio to bucket");

  await env.AUDIO_BUCKET.put(`${tinyUid}.wav`, wavArray).catch((error) => {
    console.error("Failed to upload audio to bucket", error);
    return null;
  });

  await env.ecoutable_users.put(
    CURRENT_USER_ID,
    JSON.stringify(updatedUserData)
  );

  // After audio generation, update status to AUDIO_GENERATED
  article.status = "AUDIO_GENERATED";
  const finalUserData: UserData = {
    articles: [
      ...(userData?.articles || []).filter((a) => a.id !== article.id),
      article,
    ],
  };
  await env.ecoutable_users.put(CURRENT_USER_ID, JSON.stringify(finalUserData));

  return {
    success: true,
    articleId: tinyUid,
    article,
  };
}
