import User from "../models/User.js";

import { serverError } from "../utils/serverError.js";

export const searchUsers = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username?.trim()) {
      return res.status(400).json({
        message: "Username is required",
      });
    }

    const users = await User.find({
      username: {
        $regex: username.trim(),
        $options: "i",
      },
      _id: { $ne: req.user._id },
    })
      .select("-password")
      .limit(10);

    res.status(200).json(users);
  } catch (error) {
    return serverError(res, error);
  }
};
