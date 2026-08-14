/**
 * Servidor estatico minimo usado pelo render das imagens da loja.
 *
 * Precisa ser HTTP e nao file://: a tela de configuracao carrega um ES module,
 * e o Chrome bloqueia modules em file:// por CORS.
 *
 *   node scripts/static-server.mjs <raiz> <porta>
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.argv[2];
const port = Number(process.argv[3] || 8123);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  // normalize + prefixo: barra contra path traversal.
  const file = normalize(join(root, path === "/" ? "/index.html" : path));
  if (!file.startsWith(normalize(root))) {
    res.writeHead(403).end("forbidden");
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch (_) {
    res.writeHead(404).end("not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`serving ${root} on http://127.0.0.1:${port}`);
});
