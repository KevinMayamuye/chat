import api from "./api.js";

export const searchUsers = async (username) => {
  const response = await api.get(
    "/users/search",
    {
      params: { username },
    }
  );

  return response.data;
};
