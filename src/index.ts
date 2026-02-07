import express from 'express';
import subjectsRouter from "./routes/subjects";
import cors from "cors";

const app = express();
const port = 8000;

app.use(express.json());

app.use(
    cors({
        origin: process.env.FRONTEND_URL, // React app URL
        methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
        credentials: true, // allow cookies
    })
);




app.use("/api/subjects",subjectsRouter)

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});