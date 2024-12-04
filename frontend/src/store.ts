import { atom } from "jotai";
import { ArticleType } from "./types";

export const articlePlayingAtom = atom<ArticleType | null>(null);
