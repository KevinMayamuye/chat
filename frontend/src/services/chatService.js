import api from "./api.js";

export const getChats = async () => {
  const response = await api.get("/chats");

  return response.data;
};

export const createChat = async (userId) => {
  const response = await api.post(
    "/chats",
    { userId }
  );

  return response.data;
};
