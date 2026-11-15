import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Em desenvolvimento, `netlify dev` serve a API em /api; o Vite só trata do frontend.
export default defineConfig({ plugins: [react()] });
