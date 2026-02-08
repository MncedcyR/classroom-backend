import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set in environment");
}

const dbUrl = new URL(process.env.DATABASE_URL!);

// Parse SSL configuration: default to true (secure), only disable if explicitly set to "0" or "false"
const dbSslRejectUnauthorized =
    process.env.DB_SSL_REJECT_UNAUTHORIZED === "0" ||
        process.env.DB_SSL_REJECT_UNAUTHORIZED === "false"
        ? false
        : true;

export default defineConfig({
    schema: "./src/db/schema/index.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        host: dbUrl.hostname,
        port: Number(dbUrl.port) || 5432,
        user: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.slice(1),
        ssl: {
            rejectUnauthorized: dbSslRejectUnauthorized
        }
    },
});