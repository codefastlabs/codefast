// Runs every numbered example with consistent framing and a final PASS/FAIL summary.

import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const examplesDir = dirname(fileURLToPath(import.meta.url));
const useColor = process.stdout.isTTY === true;

const paint = (code, text) => (useColor ? `[${code}m${text}[0m` : text);
const bold = (text) => paint("1", text);
const green = (text) => paint("32", text);
const red = (text) => paint("31", text);
const dim = (text) => paint("2", text);

const names = readdirSync(examplesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d+-/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

const results = [];

for (const name of names) {
  const entry = join(examplesDir, name, `${name}.ts`);
  console.log(bold(`\n▶ ${name}`));

  const startedAt = Date.now();
  const { status } = spawnSync("node", ["--import", "tsx/esm", entry], { stdio: "inherit" });
  const elapsedMs = Date.now() - startedAt;
  const passed = status === 0;

  results.push({ name, passed, elapsedMs, status });
  console.log(passed ? green(`✔ ${name} ${dim(`(${elapsedMs}ms)`)}`) : red(`✗ ${name} FAILED (exit ${status})`));
}

const failed = results.filter((result) => !result.passed);

console.log(`\n${"─".repeat(60)}`);

for (const result of results) {
  const mark = result.passed ? green("✔") : red("✗");
  console.log(`${mark} ${result.name.padEnd(32)} ${dim(`${result.elapsedMs}ms`)}`);
}

console.log(
  `\n${results.length} examples: ${green(`${results.length - failed.length} passed`)}, ${failed.length > 0 ? red(`${failed.length} failed`) : "0 failed"}`,
);

process.exit(failed.length > 0 ? 1 : 0);
