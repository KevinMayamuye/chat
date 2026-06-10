import Chat from "../models/Chat.js";
import User from "../models/User.js";

import { serverError } from "../utils/serverError.js";
import { getUnreadCountsForChats } from "../utils/unreadCount.js";

const participantFields =
  "username email isOnline lastSeen profilePicture";

const populateChat = (query) =>
  query
    .populate(
      "participants",
      participantFields
    )
    .populate({
      path: "lastMessage",
      select:
        "content messageType attachment editedAt replyTo reactions createdAt sender readBy deliveredTo",
      populate: {
        path: "sender",
        select: "username",
      },
    });

const attachUnreadCounts = async (
  chats,
  userId
) => {
  const unreadMap =
    await getUnreadCountsForChats(
      chats.map((chat) => chat._id),
      userId
    );

  return chats.map((chat) => {
    const chatObject =
      chat.toObject?.() ?? chat;

    return {
      ...chatObject,
      unreadCount:
        unreadMap[chat._id.toString()] || 0,
    };
  });
};

export const getChats = async (req, res) => {
  try {
    const chats = await populateChat(
      Chat.find({
        participants: req.user._id,
      })
    ).sort({ updatedAt: -1 });

    const chatsWithUnread =
      await attachUnreadCounts(
        chats,
        req.user._id
      );

    res.status(200).json(chatsWithUnread);
  } catch (error) {
    return serverError(res, error);
  }
};

export const createOrGetChat = async (
  req,
  res
) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const currentUser = req.user._id;

    if (
      userId.toString() ===
      currentUser.toString()
    ) {
      return res.status(400).json({
        message:
          "Cannot start a chat with yourself",
      });
    }

    const otherUser =
      await User.findById(userId);

    if (!otherUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    let chat = await Chat.findOne({
      isGroup: { $ne: true },
      participants: {
        $all: [currentUser, userId],
        $size: 2,
      },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [
          currentUser,
          userId,
        ],
      });
    }

    const populatedChat = await populateChat(
      Chat.findById(chat._id)
    );

    const [chatWithUnread] =
      await attachUnreadCounts(
        [populatedChat],
        req.user._id
      );

    res.status(200).json(chatWithUnread);

  } catch (error) {
    return serverError(res, error);
  }
};

const MAX_GROUP_NAME_LENGTH = 100;
const MAX_GROUP_MEMBERS = 50;
const MIN_GROUP_OTHER_MEMBERS = 2;

export const createGroupChat = async (
  req,
  res
) => {
  try {
    const { name, memberIds } = req.body;
    const trimmedName = name?.trim();

    if (!trimmedName) {
      return res.status(400).json({
        message: "Group name is required",
      });
    }

    if (trimmedName.length > MAX_GROUP_NAME_LENGTH) {
      return res.status(400).json({
        message: "Group name is too long",
      });
    }

    if (!Array.isArray(memberIds)) {
      return res.status(400).json({
        message: "memberIds must be an array",
      });
    }

    const currentUserId = req.user._id.toString();

    const uniqueMemberIds = [
      ...new Set(
        memberIds.map((id) => id.toString())
      ),
    ].filter((id) => id !== currentUserId);

    if (uniqueMemberIds.length < MIN_GROUP_OTHER_MEMBERS) {
      return res.status(400).json({
        message:
          "Select at least 2 other members for a group",
      });
    }

    if (uniqueMemberIds.length > MAX_GROUP_MEMBERS - 1) {
      return res.status(400).json({
        message: `Groups can have at most ${MAX_GROUP_MEMBERS} members`,
      });
    }

    const users = await User.find({
      _id: { $in: uniqueMemberIds },
    }).select("_id");

    if (users.length !== uniqueMemberIds.length) {
      return res.status(400).json({
        message: "One or more members were not found",
      });
    }

    const participants = [
      req.user._id,
      ...uniqueMemberIds,
    ];

    const chat = await Chat.create({
      participants,
      isGroup: true,
      name: trimmedName,
      createdBy: req.user._id,
    });

    const populatedChat = await populateChat(
      Chat.findById(chat._id)
    );

    const [chatWithUnread] =
      await attachUnreadCounts(
        [populatedChat],
        req.user._id
      );

    res.status(201).json(chatWithUnread);
  } catch (error) {
    return serverError(res, error);
  }
};
