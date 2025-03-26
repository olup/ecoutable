export interface Env {
  GEMINI_API_KEY: string;
  REPLICATE_API_KEY: string;
  AUDIO_BUCKET: R2Bucket;
  ecoutable_users: KVNamespace;
}

export type ArticleStatus = "ADDED" | "GENERATING_AUDIO" | "AUDIO_GENERATED";

export interface Article {
  id: string;
  url: string;
  title: string;
  content: string;
  audioId: string;
  createdAt: string;
  status: ArticleStatus;
}

export interface UserData {
  articles: Article[];
}

export const CURRENT_USER_ID = "user_1";
