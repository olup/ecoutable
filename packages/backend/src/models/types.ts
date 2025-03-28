export type ArticleStatus =
  | "ADDED"
  | "PROCESSING"
  | "AUDIO_GENERATED"
  | "ERROR";

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
