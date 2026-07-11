import { useEffect } from "react";

/**
 * Reads Telegram's themeParams (sent by the client app) and writes them
 * onto :root as CSS vars, overriding the light-mode defaults in theme.css.
 * Falls back silently to those defaults outside Telegram (e.g. local dev).
 */
export function useTelegramTheme() {
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;

    webApp.ready();
    webApp.expand();

    const applyTheme = () => {
      const params = webApp.themeParams;
      const root = document.documentElement;

      if (params.bg_color) root.style.setProperty("--tg-bg-color", params.bg_color);
      if (params.secondary_bg_color)
        root.style.setProperty("--tg-secondary-bg-color", params.secondary_bg_color);
      if (params.text_color) root.style.setProperty("--tg-text-color", params.text_color);
      if (params.hint_color) root.style.setProperty("--tg-hint-color", params.hint_color);
      if (params.link_color) root.style.setProperty("--tg-link-color", params.link_color);
      if (params.button_color) root.style.setProperty("--tg-button-color", params.button_color);
      if (params.button_text_color)
        root.style.setProperty("--tg-button-text-color", params.button_text_color);

      // Card background: Telegram doesn't send this directly, so derive it —
      // dark mode uses a slightly lighter surface than bg, light mode uses white.
      const cardBg = webApp.colorScheme === "dark" ? "#1c1c1e" : "#ffffff";
      root.style.setProperty("--tg-card-bg", cardBg);
    };

    applyTheme();
    webApp.onEvent("themeChanged", applyTheme);
    return () => webApp.offEvent("themeChanged", applyTheme);
  }, []);
}
