import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    proxy: {
      "/food-name-search": {
        target: "https://world.openfoodfacts.org",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/food-name-search/, "/cgi/search.pl")
      }
    }
  }
});
