import express from 'express';
import { Router } from 'express';
import { eq, ilike, or, and, desc, sql, getTableColumns } from "drizzle-orm";
import {subjects,departments} from "../db/schema";
import {db} from "../db";


const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const { search, department } = req.query;

        const pageDefault = 1;
        const limitDefault = 10;
        const MAX_LIMIT = 100;

        const rawPage = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page;
        const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;

        const parsedPage = Number.parseInt(String(rawPage ?? pageDefault), 10);
        const parsedLimit = Number.parseInt(String(rawLimit ?? limitDefault), 10);

        const currentPage = Math.max(1, Number.isNaN(parsedPage) ? pageDefault : parsedPage);
        const limitPerPage = Math.min(
            MAX_LIMIT,
            Math.max(1, Number.isNaN(parsedLimit) ? limitDefault : parsedLimit)
        );
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

        // Count query MUST include the join
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        // Data query
        const subjectsList = await db
            .select({
                ...getTableColumns(subjects),
                department: {
                    ...getTableColumns(departments),
                },
            })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)
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