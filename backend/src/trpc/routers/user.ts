import { router, procedure } from "../trpc";
import { z } from "zod";
import { users } from "../../db/schema";
import { getDb } from "../../utils/db";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const userRouter = router({
  registerUser: procedure.mutation(async ({ ctx }) => {
    // Get the database instance
    const db = getDb();

    const user = await db.query.users.findFirst({
      where: eq(users.email, ctx.user.email),
    });

    if (user) {
      return { success: true, message: "User already exists" };
    }

    // Add the user to the database
    await db.insert(users).values({
      email: ctx.user.email,
    });

    return { success: true, message: "User registered successfully" };
  }),

  getUserRssFeedUuid: procedure.query(async ({ ctx }) => {
    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(users.email, ctx.user.email),
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to add articles",
      });
    }

    return { rssFeedUuid: user.uuid };
  }),
});
