import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Web-only Vite config for `npm run web:dev`.
// Electron dev/build uses `electron.vite.config.ts`.
export default defineConfig(async () => ({
  plugins: [react()],
  server: {
    port: 1420,
    strictPort: true
  }
}));
