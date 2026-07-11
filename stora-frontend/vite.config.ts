import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Required so Telegram's in-app browser can load the dev server over HTTPS tunnels (ngrok, etc.)
    host: true,
  },
});
