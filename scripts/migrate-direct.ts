
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import dns from "dns";
import "dotenv/config";
import { URL } from "url";

const { Pool } = pg;

// Helper to resolve hostname to IPv4
function resolveHost(host: string): Promise<string> {
    return new Promise((resolve, reject) => {
        dns.lookup(host, { family: 4 }, (err, address) => {
            if (err) reject(err);
            else resolve(address);
        });
    });
}

async function main() {
    console.log("Starting direct migration...");

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is not set");
    }

    try {
        const url = new URL(connectionString);
        console.log(`Resolving host: ${url.hostname}`);

        const ip = await resolveHost(url.hostname);
        console.log(`Resolved IP: ${ip}`);

        const poolConfig = {
            user: url.username,
            password: url.password,
            host: ip,
            port: Number(url.port) || 5432,
            database: url.pathname.slice(1),
            ssl: {
                servername: url.hostname,
                rejectUnauthorized: false
            }
        };

        console.log("Connecting to database via pool...");
        const pool = new Pool(poolConfig);

        const db = drizzle(pool);

        console.log("Running migrations...");
        await migrate(db, { migrationsFolder: "./drizzle" });

        console.log("Migrations applied successfully!");

        await pool.end();
        process.exit(0);
    } catch (error: any) {
        console.error("Migration failed!");
        console.error("Error toString:", error.toString());
        console.error("Error JSON:", JSON.stringify(error, null, 2));
        process.exit(1);
    }
}

main();
