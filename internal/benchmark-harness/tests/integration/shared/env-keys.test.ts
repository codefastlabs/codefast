import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { BENCH_ENV_SPECS, INTERNAL_BENCH_ENV_KEYS, USER_BENCH_ENV_KEYS } from "#/shared/env-keys";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "..");

interface TurboConfig {
  readonly tasks: Readonly<Record<string, { readonly passThroughEnv?: ReadonlyArray<string> }>>;
}

function readTurboConfig(): TurboConfig {
  const turboJsonPath = join(REPO_ROOT, "turbo.json");
  const parsed: unknown = JSON.parse(readFileSync(turboJsonPath, "utf8"));
  const config = parsed as TurboConfig;
  // A wrong REPO_ROOT would otherwise read as "no bench tasks, nothing to check".
  expect(Object.keys(config.tasks)).toContain("bench");
  return config;
}

function passThroughEnvFor(taskName: string): ReadonlyArray<string> {
  return readTurboConfig().tasks[taskName]?.passThroughEnv ?? [];
}

// Turbo reads `*` in a passThroughEnv entry as a glob over the key name.
function entryCovers(entry: string, key: string): boolean {
  if (!entry.includes("*")) {
    return entry === key;
  }
  const pattern = entry.split("*").map((segment) => segment.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`^${pattern.join(".*")}$`).test(key);
}

const HARNESS_NAMESPACE_WILDCARD = "BENCH_*";

const benchTaskNames = ["bench", "bench:fast", "bench:full", "bench:isolate", "bench:serve", "bench:verbose"];

// Turbo runs in strict env mode, so a user-facing key no entry covers is silently dropped for
// every run started at the repo root — the key looks set and changes nothing.
describe("turbo passThroughEnv covers the bench env surface", () => {
  it.each(USER_BENCH_ENV_KEYS)("%s is passed through on each task its spec claims", (key) => {
    const spec = BENCH_ENV_SPECS[key];
    if (spec === undefined || spec.audience !== "user") {
      throw new Error(`${key} is listed as user-facing but has no user spec`);
    }
    expect(spec.turboTasks.length).toBeGreaterThan(0);
    for (const taskName of spec.turboTasks) {
      expect(
        passThroughEnvFor(taskName).some((entry) => entryCovers(entry, key)),
        `turbo task ${taskName} passes through ${key}`,
      ).toBe(true);
    }
  });

  // A literal entry must be a key the harness reads; the only wildcard allowed is the harness's own
  // namespace, whose stray keys `assertBenchEnvKeys` rejects at the parent instead of Turbo dropping
  // them silently.
  it.each(benchTaskNames)("%s passes through nothing the harness does not read", (taskName) => {
    const entries = passThroughEnvFor(taskName);
    const wildcards = entries.filter((entry) => entry.includes("*"));
    const literals = entries.filter((entry) => !entry.includes("*"));
    expect(wildcards, `unexpected wildcard in turbo task ${taskName}`).toEqual(
      wildcards.map(() => HARNESS_NAMESPACE_WILDCARD),
    );
    expect(
      literals.filter((entry) => !USER_BENCH_ENV_KEYS.includes(entry)),
      `stale key in turbo task ${taskName}`,
    ).toEqual([]);
  });

  it.each(benchTaskNames)("%s never names an internal protocol key", (taskName) => {
    for (const internalKey of INTERNAL_BENCH_ENV_KEYS) {
      expect(passThroughEnvFor(taskName)).not.toContain(internalKey);
    }
  });

  it("declares a turbo task for every key it expects to survive the root", () => {
    const claimedTasks = new Set(
      USER_BENCH_ENV_KEYS.flatMap((key) => {
        const spec = BENCH_ENV_SPECS[key];
        return spec !== undefined && spec.audience === "user" ? [...spec.turboTasks] : [];
      }),
    );
    expect([...claimedTasks].sort()).toEqual(benchTaskNames);
  });
});
