import { drizzle } from 'drizzle-orm/neon-serverless'
import { Pool } from '@neondatabase/serverless'

// Initialize the connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// Create the database instance
export const db = drizzle(pool)
