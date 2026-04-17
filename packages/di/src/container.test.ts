import { afterEach, describe, expect, it, vi } from "vitest";
import { DefaultContainer } from "#/container";
import * as environment from "#/environment";
import { token } from "#/token";

describe("DefaultContainer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs validate again in dev after a new binding is registered (dev validation lock reset)", () => {
    vi.spyOn(environment, "isDevelopmentOrTestEnvironment").mockReturnValue(true);
    const container = DefaultContainer.create();
    const validateSpy = vi.spyOn(container, "validate");

    const first = token<number>("container-test-first");
    container.bind(first).toConstantValue(1);
    container.resolve(first);
    expect(validateSpy).toHaveBeenCalledTimes(1);

    container.resolve(first);
    expect(validateSpy).toHaveBeenCalledTimes(1);

    const second = token<number>("container-test-second");
    container.bind(second).toConstantValue(2);
    container.resolve(first);
    expect(validateSpy).toHaveBeenCalledTimes(2);
  });

  it("has(key, hint) matches bindings by name and tag metadata", () => {
    const container = DefaultContainer.create();
    const multi = token<string>("container-test-multi");
    const tagKey = Symbol("container-test-tag");

    container.bind(multi).whenNamed("alpha").toConstantValue("A");
    container.bind(multi).whenNamed("beta").toConstantValue("B");
    container.bind(multi).whenTagged(tagKey, 1).toConstantValue("tagged");

    expect(container.has(multi)).toBe(true);
    expect(container.has(multi, { name: "alpha" })).toBe(true);
    expect(container.has(multi, { name: "beta" })).toBe(true);
    expect(container.has(multi, { name: "gamma" })).toBe(false);
    expect(container.has(multi, { tag: [tagKey, 1] })).toBe(true);
    expect(container.has(multi, { tag: [tagKey, 2] })).toBe(false);
    expect(container.has(multi, { name: "alpha", tag: [tagKey, 1] })).toBe(false);
  });
});
