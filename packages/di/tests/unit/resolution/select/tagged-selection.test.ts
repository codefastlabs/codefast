/**
 * The tag index carries predicate-bearing bindings, and both lanes that read it evaluate the
 * predicate on what they find. These pin that: an indexed hit whose predicate refuses must not reach
 * the caller, `resolveAll` must see the same candidates through the index that full selection would
 * give, and `±0` must stay two criteria — the index answers by identity, so interning is what keeps
 * `Object.is` (SPEC §3.5) true of it.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { tag } from "#/core/tag";
import { token } from "#/core/token";
import type { BindingConstraint } from "#/core/types";
import { NoMatchingBindingError } from "#/errors/errors";

const ENV = tag<number | string>("env");
const PROD = ENV.of("prod");
const STAGING = ENV.of("staging");
const DEV = ENV.of("dev");

function taggedContainer(predicate: BindingConstraint): {
  container: Container;
  serviceToken: ReturnType<typeof token<string>>;
} {
  const serviceToken = token<string>("tagged-selection-service");
  const container = Container.create();

  container.bind(serviceToken).toConstantValue("guarded").whenTagged(PROD).when(predicate);

  return { container, serviceToken };
}

describe("an indexed tagged binding still answers to its predicate", () => {
  it("resolves when the predicate accepts", () => {
    const { container, serviceToken } = taggedContainer(() => true);

    expect(container.resolve(serviceToken, { tags: [PROD] })).toBe("guarded");
    expect(container.resolve(serviceToken, { tag: PROD })).toBe("guarded");
  });

  it("refuses when the predicate refuses, through either spelling", () => {
    const { container, serviceToken } = taggedContainer(() => false);

    expect(() => container.resolve(serviceToken, { tags: [PROD] })).toThrow(NoMatchingBindingError);
    expect(() => container.resolve(serviceToken, { tag: PROD })).toThrow(NoMatchingBindingError);
    expect(container.resolveOptional(serviceToken, { tags: [PROD] })).toBeUndefined();
  });

  it("falls through to a sibling the predicate does not cover", () => {
    const serviceToken = token<string>("tagged-selection-sibling");
    const container = Container.create();

    container
      .bind(serviceToken)
      .toConstantValue("guarded")
      .whenTagged(PROD)
      .when(() => false);
    container.bind(serviceToken).toConstantValue("plain").whenTagged(STAGING);

    expect(container.resolveOptional(serviceToken, { tags: [PROD] })).toBeUndefined();
    expect(container.resolve(serviceToken, { tags: [STAGING] })).toBe("plain");
  });

  it("keeps the predicate out of resolveAll's answer", () => {
    const { container, serviceToken } = taggedContainer(() => false);

    expect(container.resolveAll(serviceToken, { tags: [PROD] })).toStrictEqual([]);
    expect(container.resolveAll(serviceToken, { tag: PROD })).toStrictEqual([]);
  });
});

describe("resolveAll over a one-tag request", () => {
  it("collects the tagged binding from every container in the chain, nearest first", () => {
    const serviceToken = token<string>("tagged-selection-chain");
    const parent = Container.create();
    parent.bind(serviceToken).toConstantValue("from-parent").whenTagged(PROD);

    const child = parent.createChild();
    child.bind(serviceToken).toConstantValue("from-child").whenTagged(PROD);

    expect(child.resolveAll(serviceToken, { tags: [PROD] })).toStrictEqual(["from-child", "from-parent"]);
    expect(child.resolveAll(serviceToken, { tag: PROD })).toStrictEqual(["from-child", "from-parent"]);
  });

  it("answers from the parent when the child owns nothing under the tag", () => {
    const serviceToken = token<string>("tagged-selection-child-empty");
    const parent = Container.create();
    parent.bind(serviceToken).toConstantValue("from-parent").whenTagged(PROD);

    // The child starts the walk with an empty result — the shape a per-request container takes.
    const child = parent.createChild();

    expect(child.resolveAll(serviceToken, { tags: [PROD] })).toStrictEqual(["from-parent"]);
  });

  it("steps over a container in the chain that has nothing under the tag", () => {
    const serviceToken = token<string>("tagged-selection-chain-gap");
    const grandparent = Container.create();
    grandparent.bind(serviceToken).toConstantValue("from-grandparent").whenTagged(PROD);

    const parent = grandparent.createChild();
    const child = parent.createChild();
    child.bind(serviceToken).toConstantValue("from-child").whenTagged(PROD);

    expect(child.resolveAll(serviceToken, { tags: [PROD] })).toStrictEqual(["from-child", "from-grandparent"]);
  });

  it("takes only the requested slot, not every tagged binding under the token", () => {
    const serviceToken = token<string>("tagged-selection-slots");
    const container = Container.create();

    container.bind(serviceToken).toConstantValue("prod").whenTagged(PROD);
    container.bind(serviceToken).toConstantValue("dev").whenTagged(DEV);
    container.bind(serviceToken).toConstantValue("named").whenNamed("primary").whenTagged(PROD);
    container.bind(serviceToken).toConstantValue("untagged");

    expect(container.resolveAll(serviceToken, { tags: [PROD] })).toStrictEqual(["prod"]);
  });

  it("keeps -0 and 0 two criteria, which is what the index is keyed by", () => {
    const serviceToken = token<string>("tagged-selection-zero");
    const container = Container.create();
    const positiveZero = ENV.of(0);
    const negativeZero = ENV.of(-0);

    container.bind(serviceToken).toConstantValue("zero").whenTagged(positiveZero);

    // Interning splits them, so the identity-keyed index answers as `Object.is` does — a
    // value-keyed map would have conflated the two under SameValueZero.
    expect(positiveZero).not.toBe(negativeZero);
    expect(container.resolveAll(serviceToken, { tags: [negativeZero] })).toStrictEqual([]);
    expect(container.resolveAll(serviceToken, { tags: [positiveZero] })).toStrictEqual(["zero"]);
  });

  it("interns one criterion per value, so equal requests are the same object", () => {
    expect(ENV.of("prod")).toBe(PROD);
    expect(ENV.of(Number.NaN)).toBe(ENV.of(Number.NaN));
    expect(ENV.of("prod")).not.toBe(ENV.of("staging"));
  });
});
