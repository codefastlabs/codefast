// Runs every numbered example with consistent framing and a final PASS/FAIL summary.

import { spawnSync } from "node:child_process";
import { readdirSync, writeSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const examplesDir = dirname(fileURLToPath(import.meta.url));
const useColor = process.stdout.isTTY === true;

const paint = (code, text) => (useColor ? `[${code}m${text}[0m` : text);
const bold = (text) => paint("1", text);
const green = (text) => paint("32", text);
const red = (text) => paint("31", text);
const dim = (text) => paint("2", text);

// Write framing synchronously so it stays ordered with each child's inherited
// stdout and survives the final exit even when stdout is a pipe.
const line = (text = "") => writeSync(1, `${text}\n`);

const names = readdirSync(examplesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d+-/.test(entry.name))
  .map((entry) => entry.name)
  // Numeric compare so a future 3-digit prefix sorts by value, not lexically.
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const results = [];

for (const name of names) {
  const entry = join(examplesDir, name, `${name}.ts`);
  line(bold(`\n▶ ${name}`));

  const startedAt = Date.now();
  const { status } = spawnSync("node", ["--import", "tsx/esm", entry], { stdio: "inherit" });
  const elapsedMs = Date.now() - startedAt;
  const passed = status === 0;

  results.push({ name, passed, elapsedMs, status });
  line(passed ? green(`✔ ${name} ${dim(`(${elapsedMs}ms)`)}`) : red(`✗ ${name} FAILED (exit ${status})`));
}

const failed = results.filter((result) => !result.passed);

line(`\n${"─".repeat(60)}`);

for (const result of results) {
  const mark = result.passed ? green("✔") : red("✗");
  line(`${mark} ${result.name.padEnd(32)} ${dim(`${result.elapsedMs}ms`)}`);
}

line(
  `\n${results.length} examples: ${green(`${results.length - failed.length} passed`)}, ${failed.length > 0 ? red(`${failed.length} failed`) : "0 failed"}`,
);

process.exitCode = failed.length > 0 ? 1 : 0;
