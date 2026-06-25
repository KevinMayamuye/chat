import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Keyboard } from "@capacitor/keyboard";

export const initNativePlatform = async () => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await StatusBar.setStyle({
      style: Style.Light,
    });
  } catch {
    // Status bar plugin unavailable
  }

  try {
    Keyboard.setAccessoryBarVisible({
      isVisible: true,
    });
  } catch {
    // Keyboard plugin unavailable
  }
};
