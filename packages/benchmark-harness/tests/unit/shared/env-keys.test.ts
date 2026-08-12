import { afterEach, describe, expect, it, vi } from "vitest";

import {
  BENCH_MODE_ENV_KEY,
  isEnvFlagEnabled,
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

  it.each([
    ["BENCH_FAST", "fast"],
    ["BENCH_FULL", "full"],
  ])("points %j at its replacement instead of ignoring it", (retiredKey, replacementMode) => {
    vi.stubEnv(retiredKey, "1");
    expect(() => resolveBenchModeFromEnvironment()).toThrow(`${BENCH_MODE_ENV_KEY}=${replacementMode}`);
  });

  it("rejects a retired key even when it is set to an off value", () => {
    vi.stubEnv("BENCH_FULL", "0");
    expect(() => resolveBenchModeFromEnvironment()).toThrow(/is not read/);
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
