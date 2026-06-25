import { Capacitor } from "@capacitor/core";

export const isNativePlatform = () =>
  Capacitor.isNativePlatform();

export const getPlatform = () =>
  Capacitor.getPlatform();

export const resolveApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (import.meta.env.DEV) {
    if (getPlatform() === "android") {
      return "http://10.0.2.2:5000";
    }

    return "http://localhost:5000";
  }

  return "https://chat-production-f570.up.railway.app";
};
