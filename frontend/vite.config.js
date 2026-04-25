import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const config = {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },
  };

  if (mode === "production") {
    config.define = {
      "import.meta.env.VITE_API_URL": JSON.stringify(
        "https://planningphoto.onrender.com/api",
      ),
    };
  }

  return config;
});
