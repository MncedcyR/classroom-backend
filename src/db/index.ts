import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import ws from "ws";

// Polyfill WebSocket for @neondatabase/serverless on Node.js
if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws as any;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql);

