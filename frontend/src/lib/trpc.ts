import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "../../../backend/src/trpc/routers/app";

export const trpc = createTRPCReact<AppRouter>();
