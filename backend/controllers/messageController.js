import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;

    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      content,
      readBy: [req.user._id]
    });

    await Chat.findByIdAndUpdate(
      chatId,
      {
        lastMessage: message._id
      }
    );

    const populatedMessage =
      await Message.findById(message._id)
        .populate("sender", "username email");

    res.status(201).json(populatedMessage);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages =
      await Message.find({
        chat: req.params.chatId
      })
      .populate(
        "sender",
        "username email"
      )
      .sort({ createdAt: 1 });

    res.status(200).json(messages);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};