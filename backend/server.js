import connectDB from "./config/db.js";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes)

const PORT = process.env.PORT;

app.get('/', (req, res) => {
    res.send('server is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

connectDB();