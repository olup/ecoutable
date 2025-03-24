import { defineConfig } from "drizzle-kit";
import { readdirSync } from "fs";
import path from "path";

export default defineConfig({
  schema: "./functions/db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  driver: "d1-http",
});
