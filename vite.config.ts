import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import CloudflarePagesFunctions from "vite-plugin-cloudflare-functions";

export default defineConfig({
  plugins: [react(), CloudflarePagesFunctions()],
});
