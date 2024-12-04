import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "../../backend/src/trpc/routers/app";

export type InferOuput = inferRouterOutputs<AppRouter>;
export type ArticleType = InferOuput["article"]["list"][number];
