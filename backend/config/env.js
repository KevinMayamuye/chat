import dotenv from "dotenv";

dotenv.config();

export const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

export const PORT =
  process.env.PORT || 5000;
