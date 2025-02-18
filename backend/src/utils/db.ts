import * as trpc from "@trpc/server";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import * as schema from "../db/schema";
import ws from "ws";
import { Resource } from "sst";

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: Resource.DbUrl.value });
const db = drizzle(pool, { schema });

export const getDb = () => db;
