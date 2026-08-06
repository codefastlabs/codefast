import {
  ChainNotRegisteredError,
  Container,
  DiError,
  NoMatchingBindingError,
  SelfBindingRequiresClassError,
  token,
} from "@codefast/di";
import type { BindToBuilder } from "@codefast/di";
import { describe, expect, it } from "vitest";

import { tag } from "#/core/tag";

const ENV_TAG = tag("env");

/**
 * SPEC §2.4 / §5.6: constraints and scope come after `to*()`, never before.
 *
 * The ordering is a type-level guarantee — `bind()` returns `BindToBuilder`, which declares only
 * `to*()`, so the out-of-order call does not compile (pinned in `tests/types/container-api.test.ts`).
 * These tests cover the runtime half of the contract: what a caller who has no types, or who casts
 * past them, actually gets. The guarantee is that the misuse *fails loudly* — not that the method
 * happens to be absent from the object.
 */
/** Returns what `run` threw, so the assertions about it stay unconditional. */
function captureThrown(run: () => void): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  return expect.fail("expected the call to throw");
}

describe("BindToBuilder fluent surface", () => {
  it("offers every to* entry point on the object bind() returns", () => {
    const container = Container.create();
    const bindBuilder = container.bind(token<number>("api-order"));

    expect(typeof bindBuilder.to).toBe("function");
    expect(typeof bindBuilder.toSelf).toBe("function");
    expect(typeof bindBuilder.toConstantValue).toBe("function");
    expect(typeof bindBuilder.toDynamic).toBe("function");
    expect(typeof bindBuilder.toDynamicAsync).toBe("function");
    expect(typeof bindBuilder.toResolved).toBe("function");
    expect(typeof bindBuilder.toResolvedAsync).toBe("function");
    expect(typeof bindBuilder.toAlias).toBe("function");
  });

  describe("refining before to*() fails loudly", () => {
    // Each of these is unreachable from TypeScript; the cast is what a JS caller does implicitly.
    const refinements: ReadonlyArray<[string, (builder: BindToBuilder<number>) => unknown]> = [
      ["when", (builder) => (builder as never as { when: (p: () => boolean) => unknown }).when(() => true)],
      ["whenNamed", (builder) => (builder as never as { whenNamed: (n: string) => unknown }).whenNamed("primary")],
      [
        "whenTagged",
        (builder) =>
          (builder as never as { whenTagged: (criterion: unknown) => unknown }).whenTagged(ENV_TAG.of("prod")),
      ],
      ["whenDefault", (builder) => (builder as never as { whenDefault: () => unknown }).whenDefault()],
      ["singleton", (builder) => (builder as never as { singleton: () => unknown }).singleton()],
      ["transient", (builder) => (builder as never as { transient: () => unknown }).transient()],
      ["scoped", (builder) => (builder as never as { scoped: () => unknown }).scoped()],
      [
        "onActivation",
        (builder) =>
          (builder as never as { onActivation: (fn: () => unknown) => unknown }).onActivation(() => undefined),
      ],
      [
        "onDeactivation",
        (builder) =>
          (builder as never as { onDeactivation: (fn: () => unknown) => unknown }).onDeactivation(() => undefined),
      ],
      ["id", (builder) => (builder as never as { id: () => unknown }).id()],
    ];

    for (const [name, refine] of refinements) {
      it(`throws ChainNotRegisteredError from ${name}()`, () => {
        const container = Container.create();
        const bindBuilder = container.bind(token<number>(`api-order-${name}`));

        expect(() => refine(bindBuilder)).toThrow(ChainNotRegisteredError);
      });
    }

    it("names the token and points at to*() in the message", () => {
      const container = Container.create();
      const bindBuilder = container.bind(token<number>("api-order-message"));

      expect(() => (bindBuilder as never as { singleton: () => unknown }).singleton()).toThrow(
        /api-order-message[\s\S]*to\*\(\)/,
      );
    });

    it("registers nothing when the misuse is caught", () => {
      const ServiceToken = token<number>("api-order-no-partial-write");
      const container = Container.create();
      const bindBuilder = container.bind(ServiceToken);

      expect(() => (bindBuilder as never as { whenNamed: (n: string) => unknown }).whenNamed("x")).toThrow(
        ChainNotRegisteredError,
      );
      expect(container.has(ServiceToken)).toBe(false);
      expect(container.lookupBindings(ServiceToken)).toHaveLength(0);
    });

    it("still works normally once to*() has run", () => {
      const ServiceToken = token<number>("api-order-recovers");
      const container = Container.create();
      const bindBuilder = container.bind(ServiceToken);

      expect(() => (bindBuilder as never as { singleton: () => unknown }).singleton()).toThrow(ChainNotRegisteredError);
      bindBuilder.toConstantValue(7).whenNamed("primary");

      expect(container.resolve(ServiceToken, { name: "primary" })).toBe(7);
    });
  });

  it("allows whenNamed after toConstantValue", () => {
    const container = Container.create();
    const NamedValueToken = token<number>("named-after-to");
    container.bind(NamedValueToken).toConstantValue(1).whenNamed("a");
    expect(container.resolve(NamedValueToken, { name: "a" })).toBe(1);
  });

  it("rejects toSelf() on a token that is not a constructor, inside the error taxonomy", () => {
    const container = Container.create();
    const ValueToken = token<number>("to-self-non-constructor");

    // A consumer's `catch (error) { if (error instanceof DiError) … }` must see this one too.
    const thrown = captureThrown(() => container.bind(ValueToken).toSelf());

    expect(thrown).toBeInstanceOf(SelfBindingRequiresClassError);
    expect(thrown).toBeInstanceOf(DiError);
    expect((thrown as SelfBindingRequiresClassError).code).toBe("SELF_BINDING_REQUIRES_CLASS");
    expect((thrown as SelfBindingRequiresClassError).tokenName).toBe("to-self-non-constructor");
  });

  it("overwrites a tag value when whenTagged repeats the same key", () => {
    const container = Container.create();
    const TaggedToken = token<string>("tag-overwrite");
    container.bind(TaggedToken).toConstantValue("final").whenTagged(ENV_TAG.of("dev")).whenTagged(ENV_TAG.of("prod"));

    expect(container.resolve(TaggedToken, { tags: [ENV_TAG.of("prod")] })).toBe("final");
    expect(() => container.resolve(TaggedToken, { tags: [ENV_TAG.of("dev")] })).toThrow(NoMatchingBindingError);
  });

  it("keeps the chain id stable across every refinement", () => {
    const container = Container.create();
    const ServiceToken = token<string>("stable-chain-id");

    const chain = container.bind(ServiceToken).toDynamic(() => "value");
    const afterTo = chain.id();
    const scoped = chain.whenNamed("primary").singleton();

    // An id captured mid-chain must still name the binding the chain settled on.
    expect(scoped.id()).toBe(afterTo);
    container.unbind(afterTo);
    expect(container.has(ServiceToken)).toBe(false);
  });

  it("gives each to*() on one entry its own binding id", () => {
    const container = Container.create();
    const ServiceToken = token<number>("entry-reused");
    const bindBuilder = container.bind(ServiceToken);

    const first = bindBuilder.toConstantValue(1).id();
    const second = bindBuilder.toConstantValue(2).id();

    expect(second).not.toBe(first);
    // Same default slot, so last-wins leaves exactly one binding registered.
    expect(container.lookupBindings(ServiceToken)).toHaveLength(1);
    expect(container.resolve(ServiceToken)).toBe(2);
  });
});
