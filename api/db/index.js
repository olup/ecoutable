"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const neon_serverless_1 = require("drizzle-orm/neon-serverless");
const serverless_1 = require("@neondatabase/serverless");
// Initialize the connection pool
const pool = new serverless_1.Pool({ connectionString: process.env.DATABASE_URL });
// Create the database instance
exports.db = (0, neon_serverless_1.drizzle)(pool);
