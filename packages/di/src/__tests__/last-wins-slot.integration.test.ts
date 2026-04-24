import { describe, expect, it } from "vitest";
import { Container } from "#/container";
import { token } from "#/token";
describe("Integration: last-wins slot key (SPEC §4.8)", () => {
  it("uses the same slot when whenTagged is chained in different orders (sorted tag keys)", async () => {
    const multiTagToken = token<string>("slot-stable-multi-tag");
    const container = Container.create();
    container.bind(multiTagToken).whenTagged("z", 1).whenTagged("a", 2).toConstantValue("first");
    await Promise.resolve();
    container.bind(multiTagToken).whenTagged("a", 2).whenTagged("z", 1).toConstantValue("second");
    expect(container.lookupBindings(multiTagToken)?.length).toBe(1);
    expect(container.resolve(multiTagToken, { tag: ["a", 2] })).toBe("second");
    expect(container.resolve(multiTagToken, { tag: ["z", 1] })).toBe("second");
  });
  it("last-wins on BigInt tag values (non-JSON to stable string)", async () => {
    const bigIntTagToken = token<string>("slot-bigint-tag");
    const container = Container.create();
    container.bind(bigIntTagToken).whenTagged("id", 1n).toConstantValue("first");
    await Promise.resolve();
    container.bind(bigIntTagToken).whenTagged("id", 1n).toConstantValue("second");
    expect(container.resolve(bigIntTagToken, { tag: ["id", 1n] })).toBe("second");
  });
  it("does not collapse two different circular tag objects into one slot", async () => {
    const circularToken = token<string>("slot-circular-tag");
    const a: Record<string, unknown> = {};
    a.self = a;
    const b: Record<string, unknown> = {};
    b.self = b;
    const container = Container.create();
    container.bind(circularToken).whenTagged("env", a).toConstantValue("A");
    await Promise.resolve();
    container.bind(circularToken).whenTagged("env", b).toConstantValue("B");
    expect(container.lookupBindings(circularToken)?.length).toBe(2);
    expect(container.resolve(circularToken, { tag: ["env", a] })).toBe("A");
    expect(container.resolve(circularToken, { tag: ["env", b] })).toBe("B");
    const all = container.resolveAll(circularToken);
    expect(new Set(all)).toEqual(new Set(["A", "B"]));
  });
});
