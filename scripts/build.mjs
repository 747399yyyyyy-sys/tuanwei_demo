import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(projectRoot, "src");
const output = path.join(projectRoot, "dist");

if (path.dirname(output) !== projectRoot || path.basename(output) !== "dist") {
  throw new Error("Refusing to clean an unexpected output path.");
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });

const index = await readFile(path.join(output, "index.html"), "utf8");
await writeFile(path.join(output, "404.html"), index, "utf8");
await writeFile(path.join(output, ".nojekyll"), "", "utf8");

console.log(`Static demo built: ${output}`);
