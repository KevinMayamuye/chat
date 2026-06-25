import axios from "axios";

import { resolveApiUrl } from "../utils/platform.js";

export const API_URL = resolveApiUrl();

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

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
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
