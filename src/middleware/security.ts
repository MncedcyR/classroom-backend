import { Request, Response, NextFunction } from "express";
import arcjet, { tokenBucket } from "@arcjet/node";
import aj, { roleLimits } from "../config/arcjet.js";
import type { RateLimitRole } from "../type.js";


/**
 * Security middleware that applies Arcjet protection including:
 * - Shield (DDoS, bot protection)
 * - Role-based rate limiting
 */
export const securityMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get user role from request (default to guest if not authenticated)
        const userRole = (req.user?.role || "guest") as RateLimitRole;

        const userId = req.user?.id || req.ip || "anonymous";

        // Get rate limit config for this role
        const limit = roleLimits[userRole];


        // Create role-specific instance with rate limiting
        const ajWithRateLimit = aj.withRule(
            tokenBucket({
                mode: "LIVE",
                characteristics: [`userId:${userId}`],
                refillRate: limit.max,
                interval: limit.interval,
                capacity: limit.max,
            })
        );

        // Run Arcjet protection
        const decision = await ajWithRateLimit.protect(req, {
            userId,
            requested: 1,
        });

        // Log decision for debugging
        console.log("Arcjet decision:", decision);

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                res.status(429).json({
                    error: "Too Many Requests",
                    message: "Rate limit exceeded. Please try again later.",
                    retryAfter: decision.reason.resetTime,
                });
                return;
            }

            if (decision.reason.isBot()) {
                res.status(403).json({
                    error: "Forbidden",
                    message: "Bot traffic detected",
                });
                return;
            }

            // Generic denial
            res.status(403).json({
                error: "Forbidden",
                message: "Request denied by security policy",
            });
            return;
        }

        // Request is allowed, continue
        next();
    } catch (error) {
        console.error("Security middleware error:", error);
        // Fail open - allow request to continue if Arcjet fails
        next();
    }
};

export default securityMiddleware;
