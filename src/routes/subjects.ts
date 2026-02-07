import express from "express";
import { eq, ilike, or, and, desc, sql, getTableColumns } from "drizzle-orm";
import { subjects, departments } from "../db/schema";
import { db } from "../db";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { search, department, page = "1", limit = "10" } = req.query;

        const currentPage = Math.max(1, parseInt(page as string) || 1);
        const limitPerPage = Math.max(1, parseInt(limit as string) || 10);
        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        if (search) {
            filterConditions.push(
                or(
                    ilike(subjects.name, `%${search}%`),
                    ilike(subjects.code, `%${search}%`)
                )
            );
        }

        if (department) {
            filterConditions.push(ilike(departments.name, `%${department}%`));
        }

        const whereClause =
            filterConditions.length > 0 ? and(...filterConditions) : undefined;

        // COUNT query
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause); // TS-safe: drizzle allows undefined here

        const totalCount = countResult[0]?.count ?? 0;

        // DATA query
        const subjectsList = await db
            .select({
                id: subjects.id,
                name: subjects.name,
                code: subjects.code,
                createdAt: subjects.createdAt,
                department: {
                    id: departments.id,
                    name: departments.name,
                },
            })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause) // Safe: undefined is allowed
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: subjectsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            },
        });
    } catch (error) {
        console.error("GET /subjects error:", error);
        res.status(500).json({ error: "Failed to fetch subjects" });
    }
});

export default router;
