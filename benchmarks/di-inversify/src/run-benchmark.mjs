#!/usr/bin/env node
/**
 * Runs Inversify v8 and @codefast/di benches (separate TS configs) and prints a comparison table.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function runSubBench(tsconfig, entry) {
  const res = spawnSync("pnpm", ["exec", "tsx", "--tsconfig", tsconfig, join("src", entry)], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  if (res.status !== 0) {
    console.error(res.stderr || res.stdout);
    throw new Error(`Sub-benchmark failed (${entry}), exit ${res.status}`);
  }
  const line = res.stdout.trim().split("\n").filter(Boolean).at(-1);
  if (!line) {
    throw new Error(`No JSON output from ${entry}`);
  }
  return /** @type {{ id: string; hz: number; meanMs: number }[]} */ (JSON.parse(line));
}

function ratio(cfHz, invHz) {
  if (!invHz) {
    return "—";
  }
  const r = cfHz / invHz;
  return `${r.toFixed(2)}×`;
}

const inv = runSubBench("tsconfig.inversify.json", "inversify-benches.ts");
const cf = runSubBench("tsconfig.codefast.json", "codefast-benches.ts");

const invById = new Map(inv.map((r) => [r.id, r]));
const cfById = new Map(cf.map((r) => [r.id, r]));

const ids = inv.map((r) => r.id);
for (const id of cf.map((r) => r.id)) {
  if (!ids.includes(id)) {
    ids.push(id);
  }
}

console.log(
  "\n@codefast/benchmark-di-inversify — same scenario IDs, separate harnesses per library\n" +
    "(default: ~450ms wall + 800 iterations + short warm-up per task; tune BENCH_OPTIONS in *-benches.ts for longer runs)\n",
);
console.log(
  "| Scenario | Inversify v8 hz | @codefast/di hz | di / inv | mean ms (inv → di) |\n|---|---:|---:|---:|---|",
);

for (const id of ids) {
  const i = invById.get(id);
  const c = cfById.get(id);
  if (!i || !c) {
    console.log(`| ${id} | missing | missing | — | — |`);
    continue;
  }
  const r = ratio(c.hz, i.hz);
  const means = `${i.meanMs.toFixed(4)} → ${c.meanMs.toFixed(4)}`;
  const hzI = Math.round(i.hz).toLocaleString("en-US");
  const hzC = Math.round(c.hz).toLocaleString("en-US");
  console.log(`| ${id} | ${hzI} | ${hzC} | ${r} | ${means} |`);
}

console.log(
  "\nNote: `di / inv` > 1 means @codefast/di is faster (higher hz). Throughput is tinybench `throughput.mean` (ops/s scaled to workload per iteration). Run several times on a quiet machine.\n",
);
