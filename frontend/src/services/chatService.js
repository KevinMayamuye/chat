import axios from "axios";

const API_URL =
  "http://localhost:5000/api/chats";

export const createChat = async (
  userId,
  token
) => {

  const response =
    await axios.post(
      API_URL,
      { userId },
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
};