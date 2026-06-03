import Chat from "../models/Chat.js";

export const createOrGetChat = async (
  req,
  res
) => {
  try {
    const { userId } = req.body;

    const currentUser =
      req.user.id;

    let chat = await Chat.findOne({
      participants: {
        $all: [
          currentUser,
          userId,
        ],
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

    res.status(200).json(chat);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};