import { describe, expect, it } from "vitest";
import { Container, token } from "@codefast/di";

/**
 * SPEC §2.4 / §5.6: `bind()` returns `BindToBuilder` with only `to*` — constraints come after `to*()`.
 */
describe("BindToBuilder fluent surface", () => {
  it("does not expose when* on the object returned from bind() before to*", () => {
    const container = Container.create();
    const builder = container.bind(token<number>("api-order"));

    expect("whenNamed" in builder).toBe(false);
    expect("whenTagged" in builder).toBe(false);
    expect("whenDefault" in builder).toBe(false);
    expect("when" in builder).toBe(false);

    expect(typeof builder.to).toBe("function");
    expect(typeof builder.toSelf).toBe("function");
    expect(typeof builder.toConstantValue).toBe("function");
    expect(typeof builder.toDynamic).toBe("function");
    expect(typeof builder.toDynamicAsync).toBe("function");
    expect(typeof builder.toResolved).toBe("function");
    expect(typeof builder.toResolvedAsync).toBe("function");
    expect(typeof builder.toAlias).toBe("function");
  });

  it("allows whenNamed after toConstantValue", () => {
    const container = Container.create();
    const t = token<number>("named-after-to");
    container.bind(t).toConstantValue(1).whenNamed("a");
    expect(container.resolve(t, { name: "a" })).toBe(1);
  });
});
