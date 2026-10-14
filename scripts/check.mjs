import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(projectRoot, "dist");
const requiredFiles = [
  "index.html",
  "404.html",
  ".nojekyll",
  "assets/styles.css",
  "assets/data.js",
  "assets/app.js",
  "assets/visual/home-campus.webp",
  "assets/visual/activity-campus.webp",
  "assets/visual/lattice-copper.svg",
  "assets/visual/crystal-cluster.svg",
  "assets/visual/technical-paper.svg",
];

for (const relative of requiredFiles) {
  const info = await stat(path.join(output, relative));
  if (!info.isFile()) throw new Error(`Missing build file: ${relative}`);
}

const index = await readFile(path.join(output, "index.html"), "utf8");
for (const match of index.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const target = match[1];
  if (target.startsWith("#") || target.startsWith("http") || target.startsWith("mailto:")) continue;
  if (target.startsWith("/")) throw new Error(`Root-relative asset breaks project Pages: ${target}`);
  const clean = target.replace(/^\.\//, "").split(/[?#]/)[0];
  await stat(path.join(output, clean));
}

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(await readFile(path.join(output, "assets/data.js"), "utf8"), sandbox);
const data = sandbox.window.DEMO_DATA;
if (!data || !Array.isArray(data.questions)) throw new Error("Demo data did not initialize.");
if (data.questions.length < 30) throw new Error("At least 30 demo questions are required.");

const expectedSpecialties = ["高分子材料科学与工程", "材料物理", "材料化学"];
for (const specialty of expectedSpecialties) {
  const count = data.questions.filter((question) => question.specialty === specialty).length;
  if (count < 10) throw new Error(`${specialty} has only ${count} questions.`);
}

const ids = new Set();
for (const question of data.questions) {
  if (ids.has(question.id)) throw new Error(`Duplicate question id: ${question.id}`);
  ids.add(question.id);
  if (!question.title || question.title.length < 12) throw new Error(`Weak title: ${question.id}`);
  if (!question.body || question.body.length < 45) throw new Error(`Weak body: ${question.id}`);
  if (!expectedSpecialties.includes(question.specialty)) throw new Error(`Invalid specialty: ${question.id}`);
  if (!question.course || !["resolved", "discussing", "waiting"].includes(question.status)) {
    throw new Error(`Incomplete metadata: ${question.id}`);
  }
  for (const answer of question.answers) {
    if (!answer.body || answer.body.length < 30) throw new Error(`Weak answer in ${question.id}`);
  }
}

const forbiddenPatterns = [
  /postgres(?:ql)?:\/\//i,
  /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/,
  /SUPABASE_SERVICE_ROLE/i,
  /DATABASE_URL\s*=/i,
  /SMTP_PASS\s*=/i,
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  }))).flat();
}

for (const file of await walk(output)) {
  if (!/\.(?:html|css|js|json|md|svg)$/i.test(file)) continue;
  const content = await readFile(file, "utf8");
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) throw new Error(`Sensitive pattern ${pattern} in ${file}`);
  }
}

console.log(JSON.stringify({
  status: "PASS",
  questions: data.questions.length,
  specialties: Object.fromEntries(expectedSpecialties.map((specialty) => [
    specialty,
    data.questions.filter((question) => question.specialty === specialty).length,
  ])),
  routes: ["home", "search", "question", "ask", "notifications", "profile", "admin", "resources", "activities", "simulator", "more"],
  relativeAssets: true,
  secretScan: "PASS",
}, null, 2));
