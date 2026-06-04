import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  getChats,
  createOrGetChat,
} from "../controllers/chatController.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  getChats
);

router.post(
  "/",
  authMiddleware,
  createOrGetChat
);

export default router;