import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertBenchEnvKeys,
  BENCH_ISOLATE_ENV_KEY,
  BENCH_LIST_ENV_KEY,
  BENCH_MODE_ENV_KEY,
  BENCH_ONLY_ENV_KEY,
  BENCH_PORT_ENV_KEY,
  BENCH_TIER_ENV_KEY,
  BENCH_TRIALS_ENV_KEY,
  isEnvFlagEnabled,
  isRunNarrowedByEnvironment,
  parseEnvInteger,
  parseScenarioFilter,
  PORT_ENV_KEY,
  resolveBenchModeFromEnvironment,
  resolvePreferredPortFromEnvironment,
  resolveRunShapeFromEnvironment,
  resolveTierFilterFromEnvironment,
} from "#/shared/env-keys";

const FLAG_KEY = "BENCH_TEST_FLAG";

describe("isEnvFlagEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads an unset key as off", () => {
    expect(isEnvFlagEnabled(FLAG_KEY)).toBe(false);
  });

  it.each(["1", "true", "yes", "on", "TRUE", "  On  "])("reads %j as on", (value) => {
    vi.stubEnv(FLAG_KEY, value);
    expect(isEnvFlagEnabled(FLAG_KEY)).toBe(true);
  });

  it.each(["", "0", "false", "no", "off", "OFF", "  0 "])("reads %j as off", (value) => {
    vi.stubEnv(FLAG_KEY, value);
    expect(isEnvFlagEnabled(FLAG_KEY)).toBe(false);
  });

  // The whole point of the strict parse: a misspelling that reads as off would hand back
  // numbers from a profile nobody asked for, indistinguishable from a real measurement.
  it.each(["ture", "enabled", "2", "y"])("throws on %j rather than reading it as off", (value) => {
    vi.stubEnv(FLAG_KEY, value);
    expect(() => isEnvFlagEnabled(FLAG_KEY)).toThrow(/is not an on\/off value/);
  });

  it("names the offending key and value in the error", () => {
    vi.stubEnv(FLAG_KEY, "ture");
    expect(() => isEnvFlagEnabled(FLAG_KEY)).toThrow(`${FLAG_KEY}="ture"`);
  });
});

describe("resolveBenchModeFromEnvironment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves an unset key to the default profile", () => {
    expect(resolveBenchModeFromEnvironment()).toBeUndefined();
  });

  it.each([
    ["fast", "fast"],
    ["full", "full"],
    ["FAST", "fast"],
    ["  full  ", "full"],
  ])("resolves %j to %j", (value, expected) => {
    vi.stubEnv(BENCH_MODE_ENV_KEY, value);
    expect(resolveBenchModeFromEnvironment()).toBe(expected);
  });

  it.each(["default", ""])("resolves %j to the default profile", (value) => {
    vi.stubEnv(BENCH_MODE_ENV_KEY, value);
    expect(resolveBenchModeFromEnvironment()).toBeUndefined();
  });

  it("throws on an unknown mode", () => {
    vi.stubEnv(BENCH_MODE_ENV_KEY, "quick");
    expect(() => resolveBenchModeFromEnvironment()).toThrow(/is not a bench mode/);
  });
});

describe("parseScenarioFilter", () => {
  it("treats an unset value as run-everything", () => {
    expect(parseScenarioFilter(undefined)).toBeUndefined();
  });

  it("treats a value with no usable ids as run-everything", () => {
    expect(parseScenarioFilter(" , ,")).toBeUndefined();
  });

  it("trims and drops empty entries", () => {
    expect(parseScenarioFilter("alpha, beta ,,gamma")).toEqual(new Set(["alpha", "beta", "gamma"]));
  });
});

describe("parseEnvInteger", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(["", "   "])("reads %j as unset", (value) => {
    vi.stubEnv(BENCH_TRIALS_ENV_KEY, value);
    expect(parseEnvInteger(BENCH_TRIALS_ENV_KEY)).toBeUndefined();
  });

  it.each([
    ["3", 3],
    ["10", 10],
    [" 4 ", 4],
  ])("reads %j as %i", (value, expected) => {
    vi.stubEnv(BENCH_TRIALS_ENV_KEY, value);
    expect(parseEnvInteger(BENCH_TRIALS_ENV_KEY)).toBe(expected);
  });

  // Each of these is a value `Number()` or `parseInt` turns into a different, plausible number.
  it.each(["3abc", "1e9", "3.9", "0x10", "abc", "-5", "+4"])("throws on %j", (value) => {
    vi.stubEnv(BENCH_TRIALS_ENV_KEY, value);
    expect(() => parseEnvInteger(BENCH_TRIALS_ENV_KEY)).toThrow(/is not a whole number/);
  });

  it("rejects a value below the spec minimum", () => {
    vi.stubEnv(BENCH_TRIALS_ENV_KEY, "1");
    expect(() => parseEnvInteger(BENCH_TRIALS_ENV_KEY)).toThrow(/out of range/);
  });

  it.each(["0", "65536"])("rejects port %j as out of range", (value) => {
    vi.stubEnv(BENCH_PORT_ENV_KEY, value);
    expect(() => parseEnvInteger(BENCH_PORT_ENV_KEY)).toThrow(/out of range/);
  });

  it("honours explicit bounds for a key the harness does not own", () => {
    vi.stubEnv("BENCH_ALLOC_OPERATIONS", "5");
    expect(parseEnvInteger("BENCH_ALLOC_OPERATIONS", { min: 1 })).toBe(5);
  });

  it("refuses a non-integer harness key rather than guessing bounds", () => {
    expect(() => parseEnvInteger(BENCH_MODE_ENV_KEY)).toThrow(/pass explicit bounds/);
  });
});

describe("resolvePreferredPortFromEnvironment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to the suite default when neither key is set", () => {
    expect(resolvePreferredPortFromEnvironment(3002)).toBe(3002);
  });

  // A launcher that assigns a free port announces it through the generic key.
  it("reads the generic PORT a launcher set", () => {
    vi.stubEnv(PORT_ENV_KEY, "64957");
    expect(resolvePreferredPortFromEnvironment(3002)).toBe(64957);
  });

  it("lets BENCH_PORT override a PORT the launcher set", () => {
    vi.stubEnv(PORT_ENV_KEY, "3000");
    vi.stubEnv(BENCH_PORT_ENV_KEY, "4322");
    expect(resolvePreferredPortFromEnvironment(3002)).toBe(4322);
  });

  it("treats an empty PORT as unset", () => {
    vi.stubEnv(PORT_ENV_KEY, "");
    expect(resolvePreferredPortFromEnvironment(3002)).toBe(3002);
  });

  it("range-checks PORT like BENCH_PORT", () => {
    vi.stubEnv(PORT_ENV_KEY, "65536");
    expect(() => resolvePreferredPortFromEnvironment(3002)).toThrow(/out of range/);
  });
});

describe("assertBenchEnvKeys", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts an environment with no bench keys set", () => {
    expect(() => assertBenchEnvKeys()).not.toThrow();
  });

  it("accepts every user-facing key", () => {
    vi.stubEnv(BENCH_MODE_ENV_KEY, "full");
    vi.stubEnv(BENCH_TRIALS_ENV_KEY, "3");
    expect(() => assertBenchEnvKeys()).not.toThrow();
  });

  // A misspelled key was the last way left to ask for something and be silently ignored.
  it("rejects a misspelled key", () => {
    vi.stubEnv("BENCH_MODEE", "fast");
    expect(() => assertBenchEnvKeys()).toThrow(/BENCH_MODEE is not a bench environment key/);
  });

  it.each([
    ["BENCH_FAST", "BENCH_MODE=fast"],
    ["BENCH_FULL", "BENCH_MODE=full"],
  ])("points %j at its replacement instead of ignoring it", (retiredKey, replacement) => {
    vi.stubEnv(retiredKey, "1");
    expect(() => assertBenchEnvKeys()).toThrow(`Use ${replacement} instead.`);
  });

  it("rejects a retired key even when set to an off value", () => {
    vi.stubEnv("BENCH_FULL", "0");
    expect(() => assertBenchEnvKeys()).toThrow(/is not read/);
  });

  it("rejects a protocol key set from the shell", () => {
    vi.stubEnv(BENCH_LIST_ENV_KEY, "true");
    expect(() => assertBenchEnvKeys()).toThrow(/set by the harness per subprocess/);
  });

  it("accepts a protocol key on a child, which receives it from its parent", () => {
    vi.stubEnv(BENCH_LIST_ENV_KEY, "true");
    expect(() => assertBenchEnvKeys({ allowInternalKeys: true })).not.toThrow();
  });

  it("accepts suite-owned keys the caller declares", () => {
    vi.stubEnv("BENCH_ALLOC_OPERATIONS", "10");
    expect(() => assertBenchEnvKeys()).toThrow(/is not a bench environment key/);
    expect(() => assertBenchEnvKeys({ extraKeys: new Set(["BENCH_ALLOC_OPERATIONS"]) })).not.toThrow();
  });
});

describe("resolveRunShapeFromEnvironment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads the default shape when nothing is set", () => {
    expect(resolveRunShapeFromEnvironment()).toStrictEqual({ isolated: false, mode: "default" });
  });

  it("reads the isolated flag", () => {
    vi.stubEnv(BENCH_ISOLATE_ENV_KEY, "1");
    expect(resolveRunShapeFromEnvironment().isolated).toBe(true);
  });

  it.each(["fast", "default", "full"] as const)("reads the %j profile", (mode) => {
    vi.stubEnv(BENCH_MODE_ENV_KEY, mode);
    expect(resolveRunShapeFromEnvironment().mode).toBe(mode);
  });

  it("combines shape and profile", () => {
    vi.stubEnv(BENCH_ISOLATE_ENV_KEY, "true");
    vi.stubEnv(BENCH_MODE_ENV_KEY, "full");
    expect(resolveRunShapeFromEnvironment()).toStrictEqual({ isolated: true, mode: "full" });
  });
});

describe("resolveTierFilterFromEnvironment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads an unset key as every tier", () => {
    expect(resolveTierFilterFromEnvironment()).toBeUndefined();
  });

  it.each(["contract", "engine", " Engine "])("accepts %j in any case with surrounding blanks", (value) => {
    vi.stubEnv(BENCH_TIER_ENV_KEY, value);
    expect(resolveTierFilterFromEnvironment()).toBe(value.trim().toLowerCase());
  });

  // Running both tiers when one was asked for reports numbers for a different run than the one requested.
  it("throws on an unknown tier rather than running everything", () => {
    vi.stubEnv(BENCH_TIER_ENV_KEY, "public");
    expect(() => resolveTierFilterFromEnvironment()).toThrow(`${BENCH_TIER_ENV_KEY}="public" is not a scenario tier`);
  });
});

describe("isRunNarrowedByEnvironment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false with neither filter set", () => {
    expect(isRunNarrowedByEnvironment()).toBe(false);
  });

  it("is true under an id filter", () => {
    vi.stubEnv(BENCH_ONLY_ENV_KEY, "alpha");
    expect(isRunNarrowedByEnvironment()).toBe(true);
  });

  it("is true under a tier filter alone", () => {
    vi.stubEnv(BENCH_TIER_ENV_KEY, "contract");
    expect(isRunNarrowedByEnvironment()).toBe(true);
  });
});
