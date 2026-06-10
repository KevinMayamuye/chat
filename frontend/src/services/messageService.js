import api from "./api.js";

export const getMessages = async (
  chatId,
  { limit, before, after } = {}
) => {
  const params = {};

  if (limit != null) params.limit = limit;
  if (before) params.before = before;
  if (after) params.after = after;

  const response = await api.get(
    `/messages/${chatId}`,
    { params }
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
  content,
  replyToMessageId = null
) => {
  const payload = { chatId, content };

  if (replyToMessageId) {
    payload.replyToMessageId = replyToMessageId;
  }

  const response = await api.post(
    "/messages",
    payload
  );

  return response.data;
};

export const sendMessageWithFile = async (
  chatId,
  file,
  content = "",
  replyToMessageId = null
) => {
  const formData = new FormData();
  formData.append("chatId", chatId);
  formData.append("file", file);

  if (content.trim()) {
    formData.append("content", content.trim());
  }

  if (replyToMessageId) {
    formData.append(
      "replyToMessageId",
      replyToMessageId
    );
  }

  const response = await api.post(
    "/messages",
    formData
  );

  return response.data;
};

export const editMessage = async (
  messageId,
  content
) => {
  const response = await api.put(
    `/messages/${messageId}`,
    { content }
  );

  return response.data;
};

export const deleteMessage = async (messageId) => {
  const response = await api.delete(
    `/messages/${messageId}`
  );

  return response.data;
};

export const toggleReaction = async (
  messageId,
  emoji
) => {
  const response = await api.put(
    `/messages/${messageId}/reaction`,
    { emoji }
  );

  return response.data;
};
