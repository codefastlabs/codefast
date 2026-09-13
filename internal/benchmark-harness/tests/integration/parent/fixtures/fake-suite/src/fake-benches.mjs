// A stand-in bench child: speaks the parent's stderr progress protocol and stdout framing without the harness.
// Behaviour comes from the environment so one script covers every path the parent has to handle.
const scenarioIds = (process.env.FAKE_SCENARIOS ?? "alpha,beta").split(",").filter((id) => id.length > 0);
const trialCount = Number(process.env.FAKE_TRIALS ?? "1");
const mode = process.env.FAKE_MODE ?? "ok";
const scenarioName = process.env.FAKE_NAME ?? "fake";

const fingerprint = {
  nodeVersion: process.versions.node,
  v8Version: process.versions.v8,
  platform: process.platform,
  arch: process.arch,
  cpuModel: "fake",
  cpuCount: 1,
  nodeOptions: process.env.NODE_OPTIONS ?? "",
  libraryName: process.env.FAKE_LIBRARY ?? "fake-lib",
  libraryVersion: "0.0.0",
  gcExposed: false,
  timestampIso: new Date().toISOString(),
};

function emit(payload) {
  process.stdout.write(`\nBENCH_RESULT_JSON_START\n${JSON.stringify(payload)}\nBENCH_RESULT_JSON_END\n`);
}

console.error(`[bench] subprocess ${scenarioName} started`);

if (mode === "fail") {
  console.error("boom: the fake child failed on purpose");
  process.exit(1);
}

if (process.env.BENCH_LIST !== undefined) {
  emit({ fingerprint, trials: [], sanityFailures: [], scenarioIds });
  console.error(`[bench] subprocess ${scenarioName} completed (list mode)`);
  process.exit(0);
}

const requested = process.env.BENCH_ONLY?.split(",")
  .map((id) => id.trim())
  .filter((id) => id.length > 0);
const measured = requested === undefined ? scenarioIds : scenarioIds.filter((id) => requested.includes(id));

console.log("stdout chatter from the fake child");
console.error("[sanity] a stray line the parent must keep");
console.error(`[bench] plan trials=${trialCount} scenarios=${measured.length}`);

const trials = [];
for (let trial = 1; trial <= trialCount; trial += 1) {
  const scenarios = measured.map((id, index) => {
    console.error(`[bench] trial ${trial}/${trialCount} scenario ${index + 1}/${measured.length} done: ${id}`);
    return {
      id,
      group: "micro",
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
  console.error(`[bench] trial ${trial}/${trialCount} all scenarios finished`);
}
console.error("[bench] all scenarios wall time: 12ms");

if (mode === "no-markers") {
  process.stdout.write(JSON.stringify({ fingerprint, trials, sanityFailures: [] }));
} else if (mode === "bad-json") {
  process.stdout.write("\nBENCH_RESULT_JSON_START\n{not json\nBENCH_RESULT_JSON_END\n");
} else {
  emit({ fingerprint, trials, sanityFailures: [], scenarioIds });
}
console.error(`[bench] subprocess ${scenarioName} completed`);
