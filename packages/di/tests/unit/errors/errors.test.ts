/**
 * Error-path robustness: building a diagnostic must never itself throw and mask the real error.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { tag } from "#/core/tag";
import { token } from "#/core/token";
import { NoMatchingBindingError } from "#/errors/errors";

describe("NoMatchingBindingError diagnostics", () => {
  it("survives a bigint tag value in the request options", () => {
    const serviceToken = token<number>("errors.bigint");
    const versionTag = tag<bigint>("version");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue(1).whenTagged(versionTag.of(1n));

    expect(() => container.resolve(serviceToken, { tags: [versionTag.of(2n)] })).toThrow(NoMatchingBindingError);
  });

  it("survives a circular tag value in the request options", () => {
    const serviceToken = token<number>("errors.circular");
    const contextTag = tag<object>("context");
    const cyclic: { self?: object } = {};
    cyclic.self = cyclic;
    const container = Container.create();
    container.bind(serviceToken).toConstantValue(1).whenTagged(contextTag.of({}));

    expect(() => container.resolve(serviceToken, { tags: [contextTag.of(cyclic)] })).toThrow(NoMatchingBindingError);
  });
});
