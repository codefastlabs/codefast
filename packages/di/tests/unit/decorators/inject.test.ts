/**
 * Descriptor-shaping tests for `inject()` / `optional()` / `injectAll()`.
 *
 * `inject()` is dual-role: the returned value is a function that also carries the injection
 * descriptor's fields, so `name` and `tags` have to be read back from own enumerable property
 * descriptors — a plain property read would pick up `Function.prototype.name`. These cases pin
 * that materialization and the option combinations around it.
 *
 * Accessor injection itself (the `addInitializer` path) is covered end-to-end by
 * `tests/integration/decorators.test.ts`, which runs it in a tsx subprocess.
 */
import { describe, expect, it } from "vitest";

import type { InjectionDescriptor } from "#/decorators/inject";
import { inject, injectAll, isInjectionDescriptor, normalizeToDescriptor, optional } from "#/decorators/inject";
import { InternalError } from "#/errors";
import { token } from "#/token";

const serviceToken = token<string>("inject-service");

describe("isInjectionDescriptor", () => {
  it("rejects nullish and primitive values", () => {
    for (const value of [null, undefined, "token", 42, true, Symbol("s")]) {
      expect(isInjectionDescriptor(value)).toBe(false);
    }
  });

  it("rejects objects missing the descriptor fields", () => {
    expect(isInjectionDescriptor({})).toBe(false);
    expect(isInjectionDescriptor({ token: serviceToken })).toBe(false);
    // Present but wrong types.
    expect(isInjectionDescriptor({ token: serviceToken, optional: "yes", multi: false })).toBe(false);
    expect(isInjectionDescriptor({ token: serviceToken, optional: false, multi: "no" })).toBe(false);
  });

  it("accepts a plain descriptor and the dual-role function returned by inject()", () => {
    expect(isInjectionDescriptor({ token: serviceToken, optional: false, multi: false })).toBe(true);
    expect(isInjectionDescriptor(inject(serviceToken))).toBe(true);
  });
});

describe("descriptor options", () => {
  it("defaults to a required single dependency with no slot constraints", () => {
    const descriptor = normalizeToDescriptor(inject(serviceToken));

    expect(descriptor.token).toBe(serviceToken);
    expect(descriptor.optional).toBe(false);
    expect(descriptor.multi).toBe(false);
    expect(descriptor.name).toBeUndefined();
    expect(descriptor.tags).toBeUndefined();
  });

  it("carries a name on its own, tags on their own, and both together", () => {
    const tags = [["env", "prod"]] as const;

    const named = normalizeToDescriptor(inject(serviceToken, { name: "primary" }));
    expect(named.name).toBe("primary");
    expect(named.tags).toBeUndefined();

    const tagged = normalizeToDescriptor(inject(serviceToken, { tags }));
    expect(tagged.name).toBeUndefined();
    expect(tagged.tags).toEqual(tags);

    const both = normalizeToDescriptor(inject(serviceToken, { name: "primary", tags }));
    expect(both.name).toBe("primary");
    expect(both.tags).toEqual(tags);
  });

  it("never mistakes Function.prototype.name for an injection slot name", () => {
    // The dual-role value is a function, so an unguarded `value.name` read would yield the
    // function's own name instead of `undefined`.
    const descriptor = normalizeToDescriptor(inject(serviceToken));
    expect(descriptor.name).toBeUndefined();
  });
});

describe("optional()", () => {
  it("marks the dependency optional and keeps slot options", () => {
    const tags = [["env", "dev"]] as const;

    const plain = optional(serviceToken);
    expect(plain.optional).toBe(true);
    expect(plain.multi).toBe(false);
    expect(plain.name).toBeUndefined();

    expect(optional(serviceToken, { name: "fallback" }).name).toBe("fallback");
    expect(optional(serviceToken, { tags }).tags).toEqual(tags);

    const both = optional(serviceToken, { name: "fallback", tags });
    expect(both.name).toBe("fallback");
    expect(both.tags).toEqual(tags);
  });
});

describe("injectAll()", () => {
  it("marks the dependency multi and keeps slot options", () => {
    const tags = [["kind", "handler"]] as const;

    const plain = injectAll(serviceToken);
    expect(plain.multi).toBe(true);
    expect(plain.optional).toBe(false);
    expect(plain.tags).toBeUndefined();

    expect(injectAll(serviceToken, { name: "handlers" }).name).toBe("handlers");
    expect(injectAll(serviceToken, { tags }).tags).toEqual(tags);

    const both = injectAll(serviceToken, { name: "handlers", tags });
    expect(both.name).toBe("handlers");
    expect(both.tags).toEqual(tags);
  });
});

describe("normalizeToDescriptor", () => {
  it("wraps a bare token", () => {
    const descriptor = normalizeToDescriptor(serviceToken);

    expect(descriptor.token).toBe(serviceToken);
    expect(descriptor.optional).toBe(false);
    expect(descriptor.multi).toBe(false);
  });

  it("wraps a bare constructor", () => {
    class Service {}
    const descriptor = normalizeToDescriptor(Service);

    expect(descriptor.token).toBe(Service);
    expect(descriptor.optional).toBe(false);
  });

  it("passes a plain descriptor object through unchanged", () => {
    const source: InjectionDescriptor = { token: serviceToken, optional: true, multi: true, name: "slot" };
    expect(normalizeToDescriptor(source)).toBe(source);
  });
});

describe("inject() as an accessor decorator", () => {
  it("rejects a static accessor at class evaluation time", () => {
    expect(() => {
      class Holder {
        // Type-legal but unsupported: only instance accessors participate in property injection.
        @inject(serviceToken) static accessor dependency: string;
      }
      return Holder;
    }).toThrow(InternalError);
  });
});
