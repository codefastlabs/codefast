import { Container, NoMatchingBindingError, token } from "@codefast/di";
import { describe, expect, it } from "vitest";

/**
 * SPEC §2.4 / §5.6: `bind()` returns `BindToBuilder` with only `to*` — constraints come after `to*()`.
 */
describe("BindToBuilder fluent surface", () => {
  it("does not expose when* on the object returned from bind() before to*", () => {
    const container = Container.create();
    const bindBuilder = container.bind(token<number>("api-order"));

    expect("whenNamed" in bindBuilder).toBe(false);
    expect("whenTagged" in bindBuilder).toBe(false);
    expect("whenDefault" in bindBuilder).toBe(false);
    expect("when" in bindBuilder).toBe(false);

    expect(typeof bindBuilder.to).toBe("function");
    expect(typeof bindBuilder.toSelf).toBe("function");
    expect(typeof bindBuilder.toConstantValue).toBe("function");
    expect(typeof bindBuilder.toDynamic).toBe("function");
    expect(typeof bindBuilder.toDynamicAsync).toBe("function");
    expect(typeof bindBuilder.toResolved).toBe("function");
    expect(typeof bindBuilder.toResolvedAsync).toBe("function");
    expect(typeof bindBuilder.toAlias).toBe("function");
  });

  it("allows whenNamed after toConstantValue", () => {
    const container = Container.create();
    const NamedValueToken = token<number>("named-after-to");
    container.bind(NamedValueToken).toConstantValue(1).whenNamed("a");
    expect(container.resolve(NamedValueToken, { name: "a" })).toBe(1);
  });

  it("rejects toSelf() on a token that is not a constructor", () => {
    const container = Container.create();
    const ValueToken = token<number>("to-self-non-constructor");
    expect(() => container.bind(ValueToken).toSelf()).toThrow("toSelf() requires token to be a Constructor");
  });

  it("overwrites a tag value when whenTagged repeats the same key", () => {
    const container = Container.create();
    const TaggedToken = token<string>("tag-overwrite");
    container.bind(TaggedToken).toConstantValue("final").whenTagged("env", "dev").whenTagged("env", "prod");

    expect(container.resolve(TaggedToken, { tags: [["env", "prod"]] })).toBe("final");
    expect(() => container.resolve(TaggedToken, { tags: [["env", "dev"]] })).toThrow(NoMatchingBindingError);
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
});
