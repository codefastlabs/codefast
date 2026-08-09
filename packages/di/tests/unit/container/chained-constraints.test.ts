/**
 * A chain's `when()` calls narrow rather than replace.
 *
 * SPEC calls a candidate a binding that passes *all* of a chain's `when(ctx)` predicates, and §5.4
 * describes a binding as carrying "one or several constraints combined". The chain's type says the
 * same by returning `this`. Only the implementation used to disagree, and it did so silently: the
 * earlier predicate vanished, leaving the binding strictly more permissive than it was written.
 */
import { describe, expect, it, vi } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";

interface Logger {
  name: string;
}

const LoggerToken = token<Logger>("Logger");

describe("chained when()", () => {
  it("asks every predicate, not just the last", () => {
    const container = Container.create();
    const first = vi.fn(() => false);
    const second = vi.fn(() => true);

    container.bind(LoggerToken).toConstantValue({ name: "constrained" }).when(first).when(second);

    expect(container.resolveOptional(LoggerToken)).toBeUndefined();
    expect(first).toHaveBeenCalled();
  });

  it("selects the binding only when all of them hold", () => {
    const container = Container.create();

    container.bind(LoggerToken).toConstantValue({ name: "default" });
    container
      .bind(LoggerToken)
      .toConstantValue({ name: "both" })
      .when(() => true)
      .when(() => true);

    expect(container.resolve(LoggerToken).name).toBe("both");
  });

  it("does not let a later predicate widen what an earlier one refused", () => {
    // The shape that made this worst: specificity prefers a binding carrying a predicate, so a
    // discarded first condition handed the constrained binding to callers meant for the default.
    const container = Container.create();

    container.bind(LoggerToken).toConstantValue({ name: "default" });
    container
      .bind(LoggerToken)
      .toConstantValue({ name: "constrained" })
      .when(() => false)
      .when(() => true);

    expect(container.resolve(LoggerToken).name).toBe("default");
  });
});
