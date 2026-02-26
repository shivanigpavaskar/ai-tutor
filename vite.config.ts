import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 3000,
    proxy: {
      "/api/v1": {
        target: "https://api.conversational-dev.trellissoft.ai",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, "/api/v1"), // keep the path
      },
    },
  },
});
