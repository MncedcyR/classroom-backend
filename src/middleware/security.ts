import { slidingWindow } from "@arcjet/node";
import type { ArcjetNodeRequest } from "@arcjet/node";
import type { NextFunction, Request, Response } from "express";
import aj from "../config/arcjet.js";


const securityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // If NODE_ENV is TEST, skip security middleware
    if (process.env.NODE_ENV === "test") return next();

    try {
        const role: RateLimitRole = req.user?.role ?? "guest";

        let limit: number;
        let message: string;

        switch (role) {
            case "admin":
                limit = 20;
                message = "Admin request limit exceeded (20 per minute). Slow down!";
                break;
            case "teacher":
            case "student":
                limit = 10;
                message = "User request limit exceeded (10 per minute). Please wait.";
                break;
            default:
                limit = 5;
                message =
                    "Guest request limit exceeded (5 per minute). Please sign up for higher limits.";
                break;
        }

        const client = aj.withRule(
            slidingWindow({
                mode: "LIVE",
                interval: "1m",
                max: limit,
            })
        );

        // Extract IP address from various sources
        const ip =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            (req.headers['x-real-ip'] as string) ||
            req.socket.remoteAddress ||
            req.ip ||
            "127.0.0.1";

        const arcjetRequest: ArcjetNodeRequest = {
            headers: req.headers,
            method: req.method,
            url: req.originalUrl ?? req.url,
            socket: {
                remoteAddress: ip,
            },
        };

        const decision = await client.protect(arcjetRequest, {
            ip,
        });

        if (decision.isDenied() && decision.reason.isBot()) {
            return res.status(429).json({
                error: "Forbidden",
                message: "Automated requests are not allowed",
            });
        }

        if (decision.isDenied() && decision.reason.isShield()) {
            return res.status(429).json({
                error: "Forbidden",
                message: "Request blocked by security policy",
            });
        }

        if (decision.isDenied() && decision.reason.isRateLimit()) {
            return res.status(429).json({
                error: "Too Many Requests",
                message,
            });
        }

        next();
    } catch (error) {
        console.error("Arcjet middleware error:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Something went wrong with the security middleware.",
        });
    }
};

export default securityMiddleware;