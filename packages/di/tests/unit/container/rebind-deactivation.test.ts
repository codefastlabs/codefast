/**
 * A sync `rebind()` whose old binding owes an async deactivation fails the way a sync `unbind()`
 * does, whatever shape the token has: the old binding is removed, `rebind()` itself throws, and no
 * replacement is ever committed by a call that then reports failure.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { token } from "#core/token";
import { AsyncDeactivationError, TokenNotBoundError } from "#errors/errors";

/** A container whose `service` singleton is cached and owes an async `onDeactivation`. */
function containerOwingAsyncDeactivation(withNamedSibling: boolean): {
  container: Container;
  service: ReturnType<typeof token<string>>;
} {
  const service = token<string>(`rd:Service${withNamedSibling ? "WithSibling" : "Lone"}`);
  const container = Container.create();
  container
    .bind(service)
    .toDynamic(() => "old")
    .singleton()
    .onDeactivation(async () => {});
  if (withNamedSibling) {
    container.bind(service).toConstantValue("named").whenNamed("n");
  }
  container.resolve(service);
  return { container, service };
}

describe("rebind over an async deactivation", () => {
  it.each([
    ["a lone default binding", false],
    ["a default binding beside a named one", true],
  ])("throws from rebind() itself and leaves the token unbound, for %s", (_shape, withNamedSibling) => {
    const { container, service } = containerOwingAsyncDeactivation(withNamedSibling);

    expect(() => container.rebind(service)).toThrow(AsyncDeactivationError);
    expect(container.has(service)).toBe(false);
    expect(() => container.resolve(service)).toThrow(TokenNotBoundError);
  });

  it("still swaps a lone binding that owes no deactivation in one step", () => {
    const service = token<string>("rd:NothingOwed");
    const container = Container.create();
    container
      .bind(service)
      .toDynamic(() => "old")
      .singleton();
    const chain = container.rebind(service);

    // Nothing was cached, so nothing is owed and the old binding answers until the new one commits.
    expect(container.resolve(service)).toBe("old");
    chain.toConstantValue("new");
    expect(container.resolve(service)).toBe("new");
  });

  it("runs a sync deactivation once and commits the replacement", () => {
    const service = token<string>("rd:SyncDeactivation");
    const deactivated: Array<string> = [];
    const container = Container.create();
    container
      .bind(service)
      .toDynamic(() => "old")
      .singleton()
      .onDeactivation((value) => {
        deactivated.push(value);
      });
    container.resolve(service);

    container.rebind(service).toConstantValue("new");

    expect(deactivated).toStrictEqual(["old"]);
    expect(container.resolve(service)).toBe("new");
  });
});
