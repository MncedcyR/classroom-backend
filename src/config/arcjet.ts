import arcjet, { tokenBucket, shield } from "@arcjet/node";
import type { RateLimitRole } from "../type.js";

// Validate ARCJET_KEY before initialization
const ARCJET_KEY = process.env.ARCJET_KEY;
if (!ARCJET_KEY) {
    console.error("FATAL: ARCJET_KEY environment variable is not set");
    process.exit(1);
}

const aj = arcjet({
    key: ARCJET_KEY,
    characteristics: ["userId"], // Track requests per user
    rules: [
        // Shield protects against common attacks
        shield({
            mode: "LIVE",
        }),
    ],
});

// Role-based rate limits (interval in seconds)
export const roleLimits: Record<RateLimitRole, { max: number; interval: number }> = {
    admin: { max: 1000, interval: 3600 }, // 1 hour
    teacher: { max: 500, interval: 3600 }, // 1 hour
    student: { max: 200, interval: 3600 }, // 1 hour
    guest: { max: 50, interval: 3600 }, // 1 hour
};


export default aj;
