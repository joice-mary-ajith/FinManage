import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, every request starting with /api is forwarded to the Express backend, so the browser never hits CORS.
export default defineConfig({ plugins: [react()], server: { port: 5173, proxy: { "/api": { target: "http://localhost:5000", changeOrigin: true } } } });
