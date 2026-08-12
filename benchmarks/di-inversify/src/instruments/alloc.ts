/**
 * How much a resolve allocates, counted as scavenges under a fixed young generation.
 *
 * The only question here the suite does not already answer — for time, `BENCH_ONLY=<id> pnpm
 * bench:codefast` reports ns/op with trials and percentiles, which no single loop improves on.
 *
 * Counting rather than measuring, because the two obvious instruments are silently wrong: a
 * `heapUsed` window is invalidated by any collection inside it and `PerformanceObserver` does not
 * report one, so the guard reads clean while the number halves; and V8's sampling heap profiler
 * holds its samples weakly, so the short-lived garbage under test is gone before it reports.
 *
 * Run with no `BENCH_ALLOC_SHAPE` for the table; a child measures the one shape it is given.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { assertBenchEnvKeys, parseEnvInteger } from "@codefast/benchmark-harness/shared/env-keys";

import { findShape, INSTRUMENT_SHAPES } from "#/instruments/shapes";

const OPERATIONS_ENV_KEY = "BENCH_ALLOC_OPERATIONS";
const SHAPE_ENV_KEY = "BENCH_ALLOC_SHAPE";

assertBenchEnvKeys({ allowInternalKeys: true, extraKeys: new Set([OPERATIONS_ENV_KEY, SHAPE_ENV_KEY]) });

const OPERATIONS = parseEnvInteger(OPERATIONS_ENV_KEY, { min: 1 }) ?? 2_000_000;
const WARMUP_OPERATIONS = 50_000;
const MEASURE_BEGIN = "=== MEASURE BEGIN ===";
const MEASURE_END = "=== MEASURE END ===";
const OUTPUT_LIMIT_BYTES = 256 * 1024 * 1024;

function callsFor(logicalOperations: number, batch: number): number {
  return Math.max(1, Math.round(logicalOperations / batch));
}

function measureShape(shapeId: string): void {
  const { batch, run } = findShape(shapeId).prepare();

  for (let index = 0; index < callsFor(WARMUP_OPERATIONS, batch); index += 1) {
    run();
  }
  // The markers go where --trace-gc goes — stdout — so the lines between them are this window's.
  process.stdout.write(`${MEASURE_BEGIN}\n`);
  for (let index = 0; index < callsFor(OPERATIONS, batch); index += 1) {
    run();
  }
  process.stdout.write(`${MEASURE_END}\n`);
}

/**
 * One shape per child, for the reason the suite isolates per scenario — shapes sharing an isolate
 * share inline caches. The flags stay local rather than coming from the bench's own subprocess
 * environment: a scavenge count needs a young generation the bench would never set, and must not
 * inherit its `--expose-gc`.
 */
function countScavenges(shapeId: string): number {
  const result = spawnSync(
    process.execPath,
    ["--trace-gc", "--max-semi-space-size=1", "--no-warnings", "--import", "tsx/esm", fileURLToPath(import.meta.url)],
    // One trace line per collection adds up, and a truncated buffer undercounts rather than fails.
    { encoding: "utf8", env: { ...process.env, [SHAPE_ENV_KEY]: shapeId }, maxBuffer: OUTPUT_LIMIT_BYTES },
  );

  if (result.status !== 0) {
    throw new Error(`child failed for shape "${shapeId}": ${result.stderr.slice(-800)}`);
  }
  const begin = result.stdout.indexOf(MEASURE_BEGIN);
  const end = result.stdout.indexOf(MEASURE_END);

  if (begin === -1 || end === -1) {
    throw new Error(`measure markers missing for shape "${shapeId}"`);
  }

  return result.stdout
    .slice(begin, end)
    .split("\n")
    .filter((line) => line.includes("Scavenge")).length;
}

const shapeId = process.env[SHAPE_ENV_KEY];

if (shapeId === undefined) {
  console.log(`scavenges per ${(OPERATIONS / 1e6).toFixed(1)}M resolves\n`);
  for (const shape of INSTRUMENT_SHAPES) {
    console.log(
      `${shape.id.padEnd(20)} ${String(countScavenges(shape.id)).padStart(6)}   ${shape.row ?? "(no bench row)"}`,
    );
  }
} else {
  measureShape(shapeId);
}
