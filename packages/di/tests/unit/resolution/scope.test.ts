/**
 * ScopeManager's scoped-cache bookkeeping: entries release on unbind (no deactivation,
 * per SPEC §5.2) and the structural count diagnostics rely on stays exact.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import type { DiagnosableContainer } from "#/resolution/diagnostics";
import { RESOLUTION_DIAGNOSTICS } from "#/resolution/diagnostics";
import { ScopeManager } from "#/resolution/scope";
import { token } from "#/token";
import type { BindingIdentifier } from "#/types";

function scopedInstanceCount(container: unknown): number {
  return (container as DiagnosableContainer)[RESOLUTION_DIAGNOSTICS]().scopedInstanceCount;
}

const FIRST_ID = "binding-1" as BindingIdentifier;
const UNSEEN_ID = "binding-never-seen" as BindingIdentifier;

describe("ScopeManager scoped entries", () => {
  it("deleteScoped releases a cached entry and is a no-op for unknown ids", () => {
    const scope = new ScopeManager(true);
    scope.setScoped(FIRST_ID, { alive: true });
    expect(scope.hasScoped(FIRST_ID)).toBe(true);
    expect(scope.scopedCount).toBe(1);

    scope.deleteScoped(FIRST_ID);
    expect(scope.hasScoped(FIRST_ID)).toBe(false);
    expect(scope.scopedCount).toBe(0);

    scope.deleteScoped(UNSEEN_ID);
    expect(scope.scopedCount).toBe(0);
  });
});

describe("scoped instances release when their binding leaves the registry", () => {
  it("unbind drops the child's cached scoped instance", () => {
    const scopedToken = token<{ id: number }>("scoped-unbind-release");
    const child = Container.create().createChild();
    child
      .bind(scopedToken)
      .toDynamic(() => ({ id: 1 }))
      .scoped();
    child.resolve(scopedToken);
    expect(scopedInstanceCount(child)).toBe(1);

    child.unbind(scopedToken);
    expect(scopedInstanceCount(child)).toBe(0);
  });

  it("unbindAll drops every cached scoped instance", () => {
    const firstToken = token<object>("scoped-unbind-all-1");
    const secondToken = token<object>("scoped-unbind-all-2");
    const child = Container.create().createChild();
    child
      .bind(firstToken)
      .toDynamic(() => ({}))
      .scoped();
    child
      .bind(secondToken)
      .toDynamic(() => ({}))
      .scoped();
    child.resolve(firstToken);
    child.resolve(secondToken);
    expect(scopedInstanceCount(child)).toBe(2);

    child.unbindAll();
    expect(scopedInstanceCount(child)).toBe(0);
  });

  it("rebinding a scoped token hands the child a fresh instance", () => {
    const scopedToken = token<{ generation: number }>("scoped-rebind-fresh");
    const child = Container.create().createChild();
    child
      .bind(scopedToken)
      .toDynamic(() => ({ generation: 1 }))
      .scoped();
    expect(child.resolve(scopedToken).generation).toBe(1);

    child
      .rebind(scopedToken)
      .toDynamic(() => ({ generation: 2 }))
      .scoped();
    expect(child.resolve(scopedToken).generation).toBe(2);
    expect(scopedInstanceCount(child)).toBe(1);
  });
});
