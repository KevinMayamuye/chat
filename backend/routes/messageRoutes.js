import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  sendMessage,
  getMessages,
  markChatAsRead,
  markMessageDelivered,
} from "../controllers/messageController.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  sendMessage
);

router.put(
  "/read/:chatId",
  authMiddleware,
  markChatAsRead
);

router.put(
  "/delivered/:messageId",
  authMiddleware,
  markMessageDelivered
);

router.get(
  "/:chatId",
  authMiddleware,
  getMessages
);

export default router;
