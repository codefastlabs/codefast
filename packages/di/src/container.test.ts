import { afterEach, describe, expect, it, vi } from "vitest";
import { Container } from "#/container";
import { injectAll } from "#/decorators/inject";
import { injectable } from "#/decorators/injectable";
import * as environment from "#/environment";
import { Module } from "#/module";
import { token } from "#/token";

describe("Container", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs validate again in dev after a new binding is registered (dev validation lock reset)", () => {
    vi.spyOn(environment, "isDevelopmentOrTestEnvironment").mockReturnValue(true);
    const container = Container.create();
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

  it("runs validate again in dev after lazy-loading a module that registers bindings", () => {
    vi.spyOn(environment, "isDevelopmentOrTestEnvironment").mockReturnValue(true);
    const container = Container.create();
    const validateSpy = vi.spyOn(container, "validate");
    const first = token<number>("container-test-mod-first");
    container.bind(first).toConstantValue(1);
    container.resolve(first);
    expect(validateSpy).toHaveBeenCalledTimes(1);

    const second = token<number>("container-test-mod-second");
    const mod = Module.create("container-test-mod", (api) => {
      api.bind(second).toConstantValue(2);
    });
    container.load(mod);
    expect(validateSpy).toHaveBeenCalledTimes(2);
  });

  it("has(token, hint) matches bindings by name and tag metadata", () => {
    const container = Container.create();
    const multi = token<string>("container-test-multi");
    const tagKey = "container-test-tag";

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

  it("injectAll in @injectable receives resolveAll() for that constructor parameter", () => {
    const part = token<string>("container-inject-all-part");
    const aggregatorServiceToken = token<{ parts: string[] }>("container-inject-all-svc");

    @injectable([injectAll(part)])
    class Aggregator {
      constructor(readonly parts: string[]) {}
    }

    const mod = Module.create("inject-all-mod", (api) => {
      api.bind(part).whenNamed("a").toConstantValue("x");
      api.bind(part).whenNamed("b").toConstantValue("y");
      api.bind(aggregatorServiceToken).to(Aggregator).singleton();
    });

    const container = Container.fromModules(mod);
    const instance = container.resolve(aggregatorServiceToken);
    expect(instance.parts.sort()).toEqual(["x", "y"]);
  });

  it("resolve without hint uses last default binding on repeated container.bind()", () => {
    const loggerToken = token<string>("container-last-default");
    const container = Container.create();
    container.bind(loggerToken).toConstantValue("first");
    container.bind(loggerToken).toConstantValue("second");

    expect(container.resolve(loggerToken)).toBe("second");
    expect(container.resolveAll(loggerToken)).toEqual(["second"]);
  });

  it("whenNamed chained after to* is treated as named binding (same as before to*)", () => {
    const namedToken = token<string>("container-when-after-to");
    const container = Container.create();

    container.bind(namedToken).toConstantValue("first").whenNamed("alpha");
    container.bind(namedToken).whenNamed("alpha").toConstantValue("second");

    expect(container.resolve(namedToken, { name: "alpha" })).toBe("second");
    expect(container.resolveAll(namedToken, { name: "alpha" })).toEqual(["second"]);
  });

  it("replaces tagged slot on repeated bind to avoid duplicate registrations", () => {
    const taggedToken = token<string>("container-tagged-slot");
    const container = Container.create();

    container.bind(taggedToken).whenTagged("role", "api").toConstantValue("first");
    container.bind(taggedToken).whenTagged("role", "api").toConstantValue("second");

    expect(container.resolve(taggedToken, { tag: ["role", "api"] })).toBe("second");
    expect(container.resolveAll(taggedToken, { tag: ["role", "api"] })).toEqual(["second"]);
  });

  it("keeps constraint-based bindings as multi registrations (no last-wins slot)", () => {
    const constrainedToken = token<string>("container-constraint-slot");
    const container = Container.create();

    container
      .bind(constrainedToken)
      .toConstantValue("first")
      .when(() => true);
    container
      .bind(constrainedToken)
      .toConstantValue("second")
      .when(() => true);

    expect(container.resolveAll(constrainedToken)).toEqual(["first", "second"]);
  });
});
