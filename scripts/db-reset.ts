
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
    console.log("Starting database reset...");

    // Safety guard: refuse to run in production
    if (process.env.NODE_ENV === "production") {
        console.error("ERROR: Database reset is NOT allowed in production environment!");
        console.error("NODE_ENV is set to 'production'. Exiting for safety.");
        process.exit(1);
    }

    // Safety guard: require explicit flag
    if (process.env.ALLOW_DB_RESET !== "true") {
        console.error("ERROR: Database reset requires explicit permission!");
        console.error("Set ALLOW_DB_RESET=true in your environment to proceed.");
        console.error("This is a destructive operation that will DROP all tables.");
        process.exit(1);
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is not set");
    }

    try {
        const url = new URL(connectionString);
        console.log(`Resolving host: ${url.hostname}`);

        const ip = await resolveHost(url.hostname);
        console.log(`Resolved IP: ${ip}`);

        // Parse SSL configuration: default to true (secure), only disable if explicitly set to "0" or "false"
        const dbSslRejectUnauthorized =
            process.env.DB_SSL_REJECT_UNAUTHORIZED === "0" ||
                process.env.DB_SSL_REJECT_UNAUTHORIZED === "false"
                ? false
                : true;

        const poolConfig = {
            user: url.username,
            password: url.password,
            host: ip,
            port: Number(url.port) || 5432,
            database: url.pathname.slice(1),
            ssl: {
                servername: url.hostname,
                rejectUnauthorized: dbSslRejectUnauthorized
            }
        };

        const pool = new Pool(poolConfig);
        const client = await pool.connect();

        try {
            console.log("Dropping all tables in public schema...");
            await client.query(`DROP SCHEMA public CASCADE;`);
            await client.query(`CREATE SCHEMA public;`);
            await client.query(`GRANT ALL ON SCHEMA public TO public;`);
            // await client.query(`COMMENT ON SCHEMA public IS 'standard public schema';`);
            console.log("Database reset complete!");
        } finally {
            client.release();
            await pool.end();
        }
        process.exit(0);
    } catch (error: any) {
        console.error("Reset failed!");
        console.error("Error toString:", error.toString());
        process.exit(1);
    }
}

main();
