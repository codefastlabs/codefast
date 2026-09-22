/**
 * Error-path robustness: building a diagnostic must never itself throw and mask the real error.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { tag } from "#core/tag";
import { token } from "#core/token";
import {
  AsyncActivationError,
  AsyncDeactivationError,
  InternalError,
  NoMatchingBindingError,
  SyncDisposalNotSupportedError,
} from "#errors/errors";

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

  it("survives an unprintable tag value on a bound slot rendered in the available slots", () => {
    const serviceToken = token<number>("errors.slot-nullproto");
    const contextTag = tag<object>("slot-context");
    const container = Container.create();
    container
      .bind(serviceToken)
      .toConstantValue(1)
      .whenTagged(contextTag.of(Object.create(null) as object));

    // The bound value cannot be stringified; the miss must still surface as the domain error.
    expect(() => container.resolve(serviceToken, { tags: [contextTag.of({ shape: "other" })] })).toThrow(
      NoMatchingBindingError,
    );
    expect(() => container.resolve(serviceToken, { tags: [contextTag.of({ shape: "other" })] })).toThrow(
      /<unprintable>/,
    );
  });

  it("survives a throwing toString on a bound slot value", () => {
    const serviceToken = token<number>("errors.slot-thrower");
    const contextTag = tag<object>("slot-thrower-context");
    const thrower = {
      toString() {
        throw new Error("boom");
      },
    };
    const container = Container.create();
    container.bind(serviceToken).toConstantValue(1).whenTagged(contextTag.of(thrower));

    expect(() => container.resolve(serviceToken, { tags: [contextTag.of({ shape: "other" })] })).toThrow(
      NoMatchingBindingError,
    );
  });
});

describe("error classes carry their name, code and message", () => {
  it("InternalError names an internal invariant breach", () => {
    const error = new InternalError("cache invariant broke");
    expect(error.name).toBe("InternalError");
    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.message).toBe("cache invariant broke");
  });

  it("AsyncActivationError distinguishes postConstruct from onActivation", () => {
    const fromMethod = new AsyncActivationError("svc", "postConstruct", "init");
    expect(fromMethod.name).toBe("AsyncActivationError");
    expect(fromMethod.code).toBe("ASYNC_ACTIVATION");
    expect(fromMethod.hookKind).toBe("postConstruct");
    expect(fromMethod.methodName).toBe("init");
    expect(fromMethod.message).toContain("@postConstruct method 'init'");

    const fromHook = new AsyncActivationError("svc", "onActivation");
    expect(fromHook.methodName).toBeUndefined();
    expect(fromHook.message).toContain("onActivation for 'svc'");
  });

  it("AsyncDeactivationError names the token and points at unbindAsync", () => {
    const error = new AsyncDeactivationError("svc");
    expect(error.name).toBe("AsyncDeactivationError");
    expect(error.code).toBe("ASYNC_DEACTIVATION");
    expect(error.tokenName).toBe("svc");
    expect(error.message).toContain("unbindAsync()");
  });

  it("SyncDisposalNotSupportedError is thrown by the sync dispose protocol", () => {
    const container = Container.create();
    expect(() => container[Symbol.dispose]()).toThrow(SyncDisposalNotSupportedError);
  });
});
