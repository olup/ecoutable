import { initTRPC, TRPCError } from "@trpc/server";
import { getDb } from "../utils/db";

export type Context = {
  db: ReturnType<typeof getDb>;
  user: {
    email: string;
  };
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const procedure = t.procedure;
