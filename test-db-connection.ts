import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

console.log("DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 50) + "...");

async function testConnection() {
    try {
        console.log("Creating pool...");
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });

        console.log("Testing connection...");
        const client = await pool.connect();

        console.log("Connected! Running test query...");
        const result = await client.query("SELECT NOW()");

        console.log("Query result:", result.rows[0]);

        client.release();
        await pool.end();

        console.log("✅ Database connection successful!");
    } catch (error) {
        console.error("❌ Database connection failed:");
        console.error(error);
        console.error("\nError details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
}

testConnection();
