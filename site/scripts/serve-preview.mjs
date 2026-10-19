import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";

const root = resolve("out");
const port = Number(process.env.PORT || 3001);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".pdf": "application/pdf", ".woff2": "font/woff2", ".woff": "font/woff", ".ico": "image/x-icon" };

createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405); response.end(); return; }
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + sep)) { response.writeHead(403); response.end(); return; }
    let info;
    try { info = await stat(file); } catch { /* Use the exported 404 below. */ }
    if (info?.isDirectory()) file = resolve(file, "index.html");
    let status = 200;
    try { info = await stat(file); if (!info.isFile()) throw new Error("Not a file"); }
    catch { file = resolve(root, "404.html"); status = 404; info = await stat(file); }
    response.writeHead(status, { "Content-Type": types[extname(file)] || "application/octet-stream", "Content-Length": info.size, "X-Content-Type-Options": "nosniff" });
    if (request.method === "HEAD") response.end();
    else createReadStream(file).pipe(response);
  } catch { response.writeHead(400); response.end("Bad request"); }
}).listen(port, "127.0.0.1", () => console.log(`Local: http://127.0.0.1:${port}`));
