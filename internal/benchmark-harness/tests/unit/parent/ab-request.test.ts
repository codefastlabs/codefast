import { describe, expect, it } from "vitest";

import { parseAbRequest } from "#/parent/ab-request";

describe("parseAbRequest", () => {
  it("applies defaults when only a scenario id is given", () => {
    const request = parseAbRequest(["tagged-binding-resolve"]);
    expect([...request.ids]).toEqual(["tagged-binding-resolve"]);
    expect(request.baseRef).toBe("HEAD~1");
    expect(request.newRef).toBeUndefined();
    expect(request.experiments).toBe(2);
    expect(request.mode).toBe("full");
  });

  it("splits a comma list, trimming blanks and empties", () => {
    const request = parseAbRequest(["a, b ,,c"]);
    expect([...request.ids]).toEqual(["a", "b", "c"]);
  });

  it("reads every flag, and treats a bare `--` as the runner's separator", () => {
    const request = parseAbRequest([
      "--",
      "one",
      "--base",
      "v1",
      "--new",
      "v2",
      "--experiments",
      "3",
      "--mode",
      "fast",
    ]);
    expect([...request.ids]).toEqual(["one"]);
    expect(request.baseRef).toBe("v1");
    expect(request.newRef).toBe("v2");
    expect(request.experiments).toBe(3);
    expect(request.mode).toBe("fast");
  });

  it("accepts every mode spelling", () => {
    expect(parseAbRequest(["x", "--mode", "default"]).mode).toBe("default");
    expect(parseAbRequest(["x", "--mode", "full"]).mode).toBe("full");
    expect(parseAbRequest(["x", "--mode", "fast"]).mode).toBe("fast");
  });

  it("throws when no scenario id is given", () => {
    expect(() => parseAbRequest([])).toThrow(/at least one scenario id/);
    expect(() => parseAbRequest([","])).toThrow(/no scenario id parsed/);
  });

  it("throws on a flag with no value", () => {
    expect(() => parseAbRequest(["x", "--base"])).toThrow(/flag --base needs a value/);
  });

  it("throws on an unknown flag", () => {
    expect(() => parseAbRequest(["x", "--nope", "y"])).toThrow(/unknown flag --nope/);
  });

  it("throws on an unknown mode", () => {
    expect(() => parseAbRequest(["x", "--mode", "turbo"])).toThrow(/--mode must be one of/);
  });

  it("throws on a non-integer or below-one experiment count", () => {
    expect(() => parseAbRequest(["x", "--experiments", "0"])).toThrow(/at least 1/);
    expect(() => parseAbRequest(["x", "--experiments", "2.5"])).toThrow(/whole number/);
    expect(() => parseAbRequest(["x", "--experiments", "abc"])).toThrow(/whole number/);
  });
});
