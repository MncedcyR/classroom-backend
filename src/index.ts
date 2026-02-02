import express from 'express';
import subjectsRouter from "./routes/subjects";
import cors from "cors";

const app = express();
const port = 8000;

app.use(express.json());

const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
       throw new Error("FRONTEND_URL is not defined");
    }


app.use(cors({
    origin: frontendUrl,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true


}))

app.use('/api/subjects',subjectsRouter)

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});