import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = new URL("../dist/", import.meta.url);
const port = Number(process.env.PORT || 4173);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relative = pathname === "/" ? "index.html" : normalize(pathname).replace(/^[/\\]+/, "");
    let url = new URL(relative, root);
    if (!url.href.startsWith(root.href)) throw new Error("Invalid path");
    try {
      if ((await stat(url)).isDirectory()) url = new URL("index.html", `${url.href}/`);
    } catch {
      url = new URL("404.html", root);
    }
    const body = await readFile(url);
    response.writeHead(200, {
      "Content-Type": types[extname(url.pathname)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Static demo preview: http://127.0.0.1:${port}`);
});
