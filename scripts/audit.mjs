import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const failures = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", "coverage", "test-results"].includes(entry.name)) {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    inspect(full);
  }
}

function inspect(full) {
  const rel = relative(root, full).replaceAll("\\", "/");
  if (!/\.(ts|tsx|mjs|js|md)$/.test(rel)) {
    return;
  }
  const text = readFileSync(full, "utf8");
  if (rel.endsWith(".ts") || rel.endsWith(".tsx")) {
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      if (/:\s*any\b|<any>|as any/.test(line) && !line.trim().startsWith("//")) {
        failures.push(`${rel}:${index + 1} contains any`);
      }
    });
    if (text.includes("@ts-ignore")) {
      failures.push(`${rel} contains @ts-ignore`);
    }
  }
}

walk(root);

try {
  const tracked = execSync("git ls-files", { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  for (const file of tracked) {
    if (file.endsWith(".env") || file.endsWith(".env.local") || file.includes(".env.local")) {
      failures.push(`Git tracks a secret env file: ${file}`);
    }
  }
} catch {
  failures.push("git ls-files failed");
}

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
for (const script of ["lint", "type-check", "test", "audit:repo"]) {
  if (!pkg.scripts?.[script]) {
    failures.push(`Missing npm script: ${script}`);
  }
}

function dirSize(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) {
      continue;
    }
    const full = join(dir, entry.name);
    total += entry.isDirectory() ? dirSize(full) : statSync(full).size;
  }
  return total;
}

const size = dirSize(root);
if (size > 10 * 1024 * 1024) {
  failures.push(`Repository source size ${size} exceeds 10 MB`);
}

for (const file of [
  "README.md",
  "docs/ARCHITECTURE.md",
  "docs/SECURITY.md",
  "docs/TESTING.md",
  "docs/ACCESSIBILITY.md",
  "docs/ALIGNMENT.md",
]) {
  try {
    readFileSync(join(root, file));
  } catch {
    failures.push(`Missing ${file}`);
  }
}

if (failures.length > 0) {
  console.error("AUDIT FAILED");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("AUDIT PASSED");
console.log(`Source size bytes: ${size}`);
