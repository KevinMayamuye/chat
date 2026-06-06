import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://chat-production-f570.up.railway.app" || "http://localhost:5000"; // "http://localhost:5000" reminder to self for localhost don't forget to change to this

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

let onUnauthorized = null;

export const setUnauthorizedHandler = (
  handler
) => {
  onUnauthorized = handler;
};

api.interceptors.request.use((config) => {
  const storedUser =
    localStorage.getItem("userInfo");

  if (storedUser) {
    const { token } = JSON.parse(storedUser);

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest =
      error.config?.url?.startsWith("/auth/");

    if (
      error.response?.status === 401 &&
      !isAuthRequest
    ) {
      localStorage.removeItem("userInfo");

      if (onUnauthorized) {
        onUnauthorized();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
