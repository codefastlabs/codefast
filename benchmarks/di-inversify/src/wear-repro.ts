/** Temp: real-suite wear reproducer for dynamic-async-chain-8. Not committed. */
const { collectAllCodefastScenarios } = await import("#/scenarios/collect-codefast-scenarios");
const scenarios = collectAllCodefastScenarios();

function runSync(fn: () => void, ms: number): void {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    fn();
  }
}

const wearIds = new Set(
  (process.env["WEAR"] ?? "constant-resolve,singleton-class-1-dep,transient-class-1-dep").split(","),
);
for (const scenario of scenarios) {
  if (wearIds.has(scenario.id)) {
    runSync(scenario.build() as () => void, 400);
  }
}

const chain = scenarios.find((scenario) => scenario.id === "dynamic-async-chain-8")!;
const fn = chain.build() as () => Promise<void>;
for (let i = 0; i < 20000; i += 1) {
  await fn();
}
const start = performance.now();
let n = 0;
while (performance.now() - start < 2000) {
  await fn();
  n += 1;
}
console.error(`worn chains/s: ${Math.round(n / ((performance.now() - start) / 1000)).toLocaleString("en-US")}`);
