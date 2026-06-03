import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  createOrGetChat,
} from "../controllers/chatController.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  createOrGetChat
);

export default router;