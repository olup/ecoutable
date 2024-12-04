import { router } from "../trpc";
import articleRouter from "./article";
import { userRouter } from "./user";

export const appRouter = router({
  article: articleRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
