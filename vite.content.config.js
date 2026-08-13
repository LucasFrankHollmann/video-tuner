import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Content scripts do MV3 nao aceitam ES modules: o bundle sai como um unico
// IIFE em dist/content.js. Roda depois do build do popup, por isso o
// emptyOutDir fica desligado.
export default defineConfig({
  plugins: [react()],
  // No modo lib o Vite nao injeta isso, e `process` nao existe na pagina:
  // sem o define o React quebra em runtime e o bundle vai com o build de dev.
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: "src/content/index.jsx",
      name: "VideoTuner",
      formats: ["iife"],
      fileName: () => "content.js"
    }
  }
});
