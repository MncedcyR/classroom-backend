export type UserRoles = "admin" | "teacher" | "student";

export type RateLimitRole = UserRoles | "guest";

// Extend Express Request to include user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: UserRoles;
                email?: string;
            };
        }
    }
}
