import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertBenchEnvKeys,
  BENCH_LIST_ENV_KEY,
  BENCH_MODE_ENV_KEY,
  BENCH_PORT_ENV_KEY,
  BENCH_TRIALS_ENV_KEY,
  isEnvFlagEnabled,
  parseEnvInteger,
  parseScenarioFilter,
  resolveBenchModeFromEnvironment,
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
