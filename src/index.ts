import AgentAPI from 'apminsight';
AgentAPI.config()
import express from 'express';
import subjectsRouter from "./routes/subjects.js";
import cors from "cors";
import securityMiddleware from "./middleware/security.js";
import { auth } from './lib/auth.js';
import { toNodeHandler } from 'better-auth/node';

const app = express();
const port = 8000;

app.use(express.json());

// Apply CORS first to prevent preflight failures
app.use(
    cors({
        origin: process.env.FRONTEND_URL, // React app URL
        methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
        credentials: true, // allow cookies
    })
);

// Apply security middleware after CORS
app.use(securityMiddleware);

app.all('/api/auth/*splat', toNodeHandler(auth));




app.use("/api/subjects", subjectsRouter)

app.get('/', (req, res) => {
    res.send('Backend server running here...');
});

app.listen(port, () => {
    console.log(`Backend app listening at http://localhost:${port}`);
});