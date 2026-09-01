import { describe, expect, it } from "vitest";

import { createSpy } from "#/mocking/spy";

describe("createSpy", () => {
  it("records each call's arguments", () => {
    const spy = createSpy();
    spy("a", 1);
    spy("b");

    expect(spy.mock.calls).toEqual([["a", 1], ["b"]]);
  });

  it("returns undefined until configured", () => {
    const spy = createSpy();
    expect(spy()).toBeUndefined();
  });

  it("returns a configured fixed value", () => {
    const spy = createSpy().mockReturnValue(42);
    expect(spy()).toBe(42);
    expect(spy()).toBe(42);
  });

  it("runs a configured implementation and records its result", () => {
    const spy = createSpy().mockImplementation((value) => `seen:${String(value)}`);
    expect(spy("x")).toBe("seen:x");
    expect(spy.mock.results.at(0)).toEqual({ type: "return", value: "seen:x" });
  });

  it("records a thrown error as a throw result and rethrows", () => {
    const boom = new Error("boom");
    const spy = createSpy().mockImplementation(() => {
      throw boom;
    });

    expect(() => spy()).toThrow(boom);
    expect(spy.mock.results.at(0)).toEqual({ type: "throw", value: boom });
  });

  it("clears calls and configuration on reset", () => {
    const spy = createSpy().mockReturnValue(1);
    spy();
    spy.mockReset();

    expect(spy.mock.calls).toEqual([]);
    expect(spy()).toBeUndefined();
  });
});
