// A stand-in bench child: speaks the parent's stderr progress protocol and stdout framing without the harness.
// Behaviour comes from the environment so one script covers every path the parent has to handle. Node runs
// it as-is through type stripping, so every annotation here must be erasable syntax.
import type { BenchScenarioTier } from "#/child/bench-scenario";
import type {
  Fingerprint,
  ScenarioListing,
  ScenarioTrialResult,
  SubprocessPayload,
  TrialPayload,
} from "#/shared/protocol";

const scenarioIds = (process.env["FAKE_SCENARIOS"] ?? "alpha,beta").split(",").filter((id) => id.length > 0);
// FAKE_TIERS names the engine rows (`beta,gamma`); everything else is a contract row, as in a real suite.
const engineIds = (process.env["FAKE_TIERS"] ?? "").split(",").filter((id) => id.length > 0);
const tierOf = (id: string): BenchScenarioTier => (engineIds.includes(id) ? "engine" : "contract");
const requiresOf = (id: string): Array<string> =>
  (process.env["FAKE_REQUIRES"] ?? "")
    .split(";")
    .filter(Boolean)
    .map((entry) => entry.split("="))
    .filter(([scenarioId]) => scenarioId === id)
    .flatMap(([, features]) => (features ?? "").split(",").filter(Boolean));
const scenarioListings: Array<ScenarioListing> = scenarioIds.map((id) => ({
  id,
  tier: tierOf(id),
  requires: requiresOf(id),
}));
const trialCount = Number(process.env["FAKE_TRIALS"] ?? "1");
const mode = process.env["FAKE_MODE"] ?? "ok";
const scenarioName = process.env["FAKE_NAME"] ?? "fake";

const fingerprint: Fingerprint = {
  nodeVersion: process.versions.node,
  v8Version: process.versions.v8,
  platform: process.platform,
  arch: process.arch,
  cpuModel: "fake",
  cpuCount: 1,
  nodeOptions: process.env["NODE_OPTIONS"] ?? "",
  libraryName: process.env["FAKE_LIBRARY"] ?? "fake-lib",
  libraryVersion: "0.0.0",
  gcExposed: false,
  timestampIso: new Date().toISOString(),
};

function emit(payload: SubprocessPayload): void {
  process.stdout.write(`\nBENCH_RESULT_JSON_START\n${JSON.stringify(payload)}\nBENCH_RESULT_JSON_END\n`);
}

console.error(`[bench] subprocess ${scenarioName} started`);

if (mode === "fail") {
  console.error("boom: the fake child failed on purpose");
  process.exit(1);
}

if (process.env["BENCH_LIST"] !== undefined) {
  emit({ fingerprint, trials: [], sanityFailures: [], scenarioIds, scenarioListings });
  console.error(`[bench] subprocess ${scenarioName} completed (list mode)`);
  process.exit(0);
}

const requested = process.env["BENCH_ONLY"]
  ?.split(",")
  .map((id) => id.trim())
  .filter((id) => id.length > 0);
const requestedTier = process.env["BENCH_TIER"];
const measured = scenarioIds.filter(
  (id) =>
    (requested === undefined || requested.includes(id)) &&
    (requestedTier === undefined || tierOf(id) === requestedTier),
);

console.log("stdout chatter from the fake child");
console.error("[sanity] a stray line the parent must keep");
console.error(`[bench] plan trials=${String(trialCount)} scenarios=${String(measured.length)}`);

const trials: Array<TrialPayload> = [];
for (let trial = 1; trial <= trialCount; trial += 1) {
  const scenarios: Array<ScenarioTrialResult> = measured.map((id, index) => {
    console.error(
      `[bench] trial ${String(trial)}/${String(trialCount)} scenario ${String(index + 1)}/${String(measured.length)} done: ${id}`,
    );
    return {
      id,
      group: "micro",
      tier: tierOf(id),
      stress: false,
      excludeFromAggregates: false,
      batch: 1,
      what: id,
      hzPerIteration: 100 + index,
      hzPerOp: 100 + index,
      meanMs: 1,
      p75Ms: 1,
      p99Ms: 1,
      p999Ms: 1,
      samples: 5,
    };
  });
  trials.push({ trialIndex: trial - 1, scenarios });
  console.error(`[bench] trial ${String(trial)}/${String(trialCount)} all scenarios finished`);
}
console.error("[bench] all scenarios wall time: 12ms");

if (mode === "no-markers") {
  process.stdout.write(JSON.stringify({ fingerprint, trials, sanityFailures: [] }));
} else if (mode === "bad-json") {
  process.stdout.write("\nBENCH_RESULT_JSON_START\n{not json\nBENCH_RESULT_JSON_END\n");
} else {
  emit({ fingerprint, trials, sanityFailures: [], scenarioIds, scenarioListings });
}
console.error(`[bench] subprocess ${scenarioName} completed`);
