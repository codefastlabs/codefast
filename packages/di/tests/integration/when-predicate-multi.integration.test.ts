import { describe, expect, it } from "vitest";
import { Container } from "#/container";
import { InternalError } from "#/errors";
import { token } from "#/token";
describe("Integration: predicate-only when() multi-bind (no registration-time last-wins)", () => {
  it("resolve picks the binding whose when() matches the constraint context", () => {
    const t = token<string>("when-predicate-pick");
    const container = Container.create();
    container
      .bind(t)
      .toConstantValue("child-branch")
      .when((ctx) => ctx.parent !== undefined);
    container
      .bind(t)
      .toConstantValue("root")
      .when((ctx) => ctx.parent === undefined);
    expect(container.resolve(t)).toBe("root");
    const parentToken = token<{
      child: string;
    }>("when-predicate-parent");
    container
      .bind(parentToken)
      .toDynamic((ctx) => ({
        child: ctx.resolve(t),
      }))
      .when(() => true);
    expect(container.resolve(parentToken).child).toBe("child-branch");
  });
  it("two bindings with the same when() body still register twice and resolve() is ambiguous", () => {
    const t = token<string>("when-predicate-ambiguous");
    const container = Container.create();
    const samePredicate = (): boolean => true;
    container.bind(t).toConstantValue("a").when(samePredicate);
    container.bind(t).toConstantValue("b").when(samePredicate);
    expect(container.resolveAll(t)).toEqual(["a", "b"]);
    expect(() => container.resolve(t)).toThrow(InternalError);
    expect(() => container.resolve(t)).toThrow(
      'Ambiguous binding for "when-predicate-ambiguous": 2 candidates matched after applying ResolveHint (resolution path: when-predicate-ambiguous)',
    );
  });
  it("resolveAll returns every binding whose when() passes for the current context", () => {
    const t = token<string>("when-predicate-resolve-all");
    const container = Container.create();
    container
      .bind(t)
      .toConstantValue("always-a")
      .when(() => true);
    container
      .bind(t)
      .toConstantValue("always-b")
      .when(() => true);
    expect(container.resolveAll(t).sort()).toEqual(["always-a", "always-b"]);
  });
});
