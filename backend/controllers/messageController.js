import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

import { getIO } from "../socket/socketManager.js";
import { serverError } from "../utils/serverError.js";
import { getMessageTypeFromMime, getMaxSizeForMime } from "../utils/fileType.js";
import { uploadFile, deleteFile } from "../utils/gridfs.js";

const isChatParticipant = (chat, userId) =>
  chat.participants.some(
    (id) => id.toString() === userId.toString()
  );

const markChatMessagesAsRead = async (
  chatId,
  userId
) => {
  await Message.updateMany(
    {
      chat: chatId,
      readBy: { $nin: [userId] },
    },
    {
      $addToSet: {
        readBy: userId,
        deliveredTo: userId,
      },
    }
  );
};

const notifyMessagesRead = (chat, readerId) => {
  const io = getIO();

  chat.participants
    .filter(
      (id) =>
        id.toString() !==
        readerId.toString()
    )
    .forEach((id) => {
      io.to(id.toString()).emit(
        "messagesRead",
        {
          chatId: chat._id.toString(),
          readBy: readerId.toString(),
        }
      );
    });
};

const notifyMessageDelivered = (
  message,
  deliveredToUserId
) => {
  const io = getIO();

  io.to(message.sender.toString()).emit(
    "messageDelivered",
    {
      messageId: message._id.toString(),
      chatId: message.chat.toString(),
      deliveredTo: deliveredToUserId.toString(),
    }
  );
};

export const markMessageDelivered = async (
  req,
  res
) => {
  try {
    const message = await Message.findById(
      req.params.messageId
    );

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    const chat = await Chat.findById(
      message.chat
    );

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    if (!isChatParticipant(chat, req.user._id)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    if (
      message.sender.toString() ===
      req.user._id.toString()
    ) {
      return res.status(400).json({
        message:
          "Cannot mark own message as delivered",
      });
    }

    const updated = await Message.findByIdAndUpdate(
      message._id,
      {
        $addToSet: {
          deliveredTo: req.user._id,
        },
      },
      { new: true }
    );

    notifyMessageDelivered(
      updated,
      req.user._id
    );

    res.status(200).json(updated);
  } catch (error) {
    return serverError(res, error);
  }
};

export const markChatAsRead = async (req, res) => {
  try {
    const chat = await Chat.findById(
      req.params.chatId
    );

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    if (!isChatParticipant(chat, req.user._id)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    await markChatMessagesAsRead(
      req.params.chatId,
      req.user._id
    );

    notifyMessagesRead(
      chat,
      req.user._id
    );

    res.status(200).json({
      message: "Messages marked as read",
    });
  } catch (error) {
    return serverError(res, error);
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const file = req.file;

    const trimmedContent = content?.trim() ?? "";

    if (!chatId) {
      return res.status(400).json({
        message: "Chat ID is required",
      });
    }

    if (!file && !trimmedContent) {
      return res.status(400).json({
        message: "Message content or file is required",
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    if (!isChatParticipant(chat, req.user._id)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    let attachment = null;
    let messageType = "text";
    let uploadedFileId = null;

    if (file) {
      const maxSize = getMaxSizeForMime(file.mimetype);

      if (file.size > maxSize) {
        return res.status(400).json({
          message: "File exceeds maximum allowed size for this type",
        });
      }

      const derivedType = getMessageTypeFromMime(
        file.mimetype
      );

      if (!derivedType) {
        return res.status(400).json({
          message: "File type not allowed",
        });
      }

      if (!file.buffer?.length) {
        return res.status(400).json({
          message: "No file received. Upload may have failed.",
        });
      }

      try {
        uploadedFileId = await uploadFile(
          file.buffer,
          {
            fileName: file.originalname,
            mimeType: file.mimetype,
            chatId,
            senderId: req.user._id,
          }
        );
      } catch (uploadError) {
        console.error("GridFS upload failed:", uploadError);

        return res.status(500).json({
          message: "Failed to store file",
        });
      }

      messageType = derivedType;
      attachment = {
        fileId: uploadedFileId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    let message;

    const messagePayload = {
      chat: chatId,
      sender: req.user._id,
      messageType,
      content: trimmedContent,
      readBy: [req.user._id],
      deliveredTo: [],
    };

    if (attachment) {
      messagePayload.attachment = attachment;
    }

    try {
      message = await Message.create(messagePayload);
    } catch (error) {
      if (uploadedFileId) {
        await deleteFile(uploadedFileId).catch(
          console.error
        );
      }

      throw error;
    }

    await Chat.findByIdAndUpdate(
      chatId,
      {
        lastMessage: message._id
      },
      { timestamps: true }
    );

    const populatedMessage =
      await Message.findById(message._id)
        .populate(
          "sender",
          "username email profilePicture"
        );

    const io = getIO();

    const receiverId =
      chat.participants.find(
        (id) =>
          id.toString() !==
          req.user._id.toString()
      );

    if (receiverId) {
      io.to(receiverId.toString())
        .emit(
          "newMessage",
          populatedMessage
        );
    }

    res.status(201).json(
      populatedMessage
    );

  } catch (error) {
    return serverError(res, error);
  }
};

export const getMessages = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    if (!isChatParticipant(chat, req.user._id)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    await markChatMessagesAsRead(
      req.params.chatId,
      req.user._id
    );

    notifyMessagesRead(
      chat,
      req.user._id
    );

    const messages =
      await Message.find({
        chat: req.params.chatId
      })
      .populate(
        "sender",
        "username email profilePicture"
      )
      .sort({
        createdAt: 1
      });

    res.status(200).json(
      messages
    );

  } catch (error) {
    return serverError(res, error);
  }
};
