import { describe, expect, it } from "vitest";
import { Container, token } from "@codefast/di";

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
});
