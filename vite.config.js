import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// O popup e a unica parte com UI, entao e a unica que passa pelo bundler.
// manifest.json, background.js, content/ e icons/ vivem em public/ e sao
// copiados para dist/ sem transformacao.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    // Limpeza fica no script `clean`: apagar aqui removeria o content.js do
    // outro build (e vice-versa) durante os watchers.
    emptyOutDir: false,
    rollupOptions: {
      input: { popup: "popup.html" }
    }
  }
});
