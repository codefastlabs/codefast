/**
 * The tag index carries predicate-bearing bindings, and both lanes that read it re-check what they
 * find. These pin that re-check: an indexed hit whose predicate refuses must not reach the caller,
 * and `resolveAll` must see the same candidates through the index that full selection would give.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { NoMatchingBindingError } from "#/errors";
import { token } from "#/token";
import type { ConstraintContext } from "#/types";

const TAG = "env";
const VALUE = "prod";

function taggedContainer(predicate: (ctx: ConstraintContext) => boolean): {
  container: Container;
  serviceToken: ReturnType<typeof token<string>>;
} {
  const serviceToken = token<string>("tagged-selection-service");
  const container = Container.create();

  container.bind(serviceToken).toConstantValue("guarded").whenTagged(TAG, VALUE).when(predicate);

  return { container, serviceToken };
}

describe("an indexed tagged binding still answers to its predicate", () => {
  it("resolves when the predicate accepts", () => {
    const { container, serviceToken } = taggedContainer(() => true);

    expect(container.resolve(serviceToken, { tags: [[TAG, VALUE]] })).toBe("guarded");
    expect(container.resolve(serviceToken, { tag: [TAG, VALUE] })).toBe("guarded");
  });

  it("refuses when the predicate refuses, through either spelling", () => {
    const { container, serviceToken } = taggedContainer(() => false);

    expect(() => container.resolve(serviceToken, { tags: [[TAG, VALUE]] })).toThrow(NoMatchingBindingError);
    expect(() => container.resolve(serviceToken, { tag: [TAG, VALUE] })).toThrow(NoMatchingBindingError);
    expect(container.resolveOptional(serviceToken, { tags: [[TAG, VALUE]] })).toBeUndefined();
  });

  it("falls through to a sibling the predicate does not cover", () => {
    const serviceToken = token<string>("tagged-selection-sibling");
    const container = Container.create();

    container
      .bind(serviceToken)
      .toConstantValue("guarded")
      .whenTagged(TAG, VALUE)
      .when(() => false);
    container.bind(serviceToken).toConstantValue("plain").whenTagged(TAG, "staging");

    expect(container.resolveOptional(serviceToken, { tags: [[TAG, VALUE]] })).toBeUndefined();
    expect(container.resolve(serviceToken, { tags: [[TAG, "staging"]] })).toBe("plain");
  });

  it("keeps the predicate out of resolveAll's answer", () => {
    const { container, serviceToken } = taggedContainer(() => false);

    expect(container.resolveAll(serviceToken, { tags: [[TAG, VALUE]] })).toStrictEqual([]);
    expect(container.resolveAll(serviceToken, { tag: [TAG, VALUE] })).toStrictEqual([]);
  });
});

describe("resolveAll over a one-tag request", () => {
  it("collects the tagged binding from every container in the chain, nearest first", () => {
    const serviceToken = token<string>("tagged-selection-chain");
    const parent = Container.create();
    parent.bind(serviceToken).toConstantValue("from-parent").whenTagged(TAG, VALUE);

    const child = parent.createChild();
    child.bind(serviceToken).toConstantValue("from-child").whenTagged(TAG, VALUE);

    expect(child.resolveAll(serviceToken, { tags: [[TAG, VALUE]] })).toStrictEqual(["from-child", "from-parent"]);
    expect(child.resolveAll(serviceToken, { tag: [TAG, VALUE] })).toStrictEqual(["from-child", "from-parent"]);
  });

  it("takes only the requested slot, not every tagged binding under the token", () => {
    const serviceToken = token<string>("tagged-selection-slots");
    const container = Container.create();

    container.bind(serviceToken).toConstantValue("prod").whenTagged(TAG, VALUE);
    container.bind(serviceToken).toConstantValue("dev").whenTagged(TAG, "dev");
    container.bind(serviceToken).toConstantValue("named").whenNamed("primary").whenTagged(TAG, VALUE);
    container.bind(serviceToken).toConstantValue("untagged");

    expect(container.resolveAll(serviceToken, { tags: [[TAG, VALUE]] })).toStrictEqual(["prod"]);
  });

  it("still refuses a value the index would have conflated with the one bound", () => {
    const serviceToken = token<string>("tagged-selection-zero");
    const container = Container.create();

    container.bind(serviceToken).toConstantValue("zero").whenTagged(TAG, 0);

    // A Map keys `-0` and `0` alike; `Object.is` does not, and the lane answers to `Object.is`.
    expect(container.resolveAll(serviceToken, { tags: [[TAG, -0]] })).toStrictEqual([]);
    expect(container.resolveAll(serviceToken, { tags: [[TAG, 0]] })).toStrictEqual(["zero"]);
  });
});
