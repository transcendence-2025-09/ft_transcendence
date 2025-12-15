import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": apiBaseUrl,
      "/ws": {
        target: "ws://localhost:3001",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
