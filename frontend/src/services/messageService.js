import api from "./api.js";

export const getMessages = async (chatId) => {
  const response = await api.get(
    `/messages/${chatId}`
  );

  return response.data;
};

export const markChatAsRead = async (chatId) => {
  const response = await api.put(
    `/messages/read/${chatId}`
  );

  return response.data;
};

export const markMessageDelivered = async (
  messageId
) => {
  const response = await api.put(
    `/messages/delivered/${messageId}`
  );

  return response.data;
};

export const sendMessage = async (
  chatId,
  content
) => {
  const response = await api.post(
    "/messages",
    { chatId, content }
  );

  return response.data;
};
