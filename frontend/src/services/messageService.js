import axios from "axios";

const API_URL =
  "http://localhost:5000/api/messages";

export const getMessages = async (
  chatId,
  token
) => {

  const response =
    await axios.get(
      `${API_URL}/${chatId}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;
};

export const sendMessage = async (
  chatId,
  content,
  token
) => {

  const response =
    await axios.post(
      API_URL,
      {
        chatId,
        content
      },
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;
};