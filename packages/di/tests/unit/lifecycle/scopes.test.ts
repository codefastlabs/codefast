/**
 * ScopeManager's scoped-cache bookkeeping: entries release on unbind, disposal deactivates each current instance once
 * through its owner, latest first, and the structural count diagnostics rely on stays exact.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { token } from "#core/token";
import type { BindingIdentifier } from "#core/types";
import type { DiagnosableContainer } from "#introspection/diagnostics";
import { RESOLUTION_DIAGNOSTICS } from "#introspection/diagnostics";
import type { ScopedInstanceOwner } from "#lifecycle/scopes";
import { SCOPED_MISS, ScopeManager } from "#lifecycle/scopes";
import { registeredBinding } from "#tests/unit/support/registered-binding";

function scopedInstanceCount(container: unknown): number {
  return (container as DiagnosableContainer)[RESOLUTION_DIAGNOSTICS]().scopedInstanceCount;
}

// `setScoped` takes the binding so a scope failure can name the token, as `setSingleton` does.
const FIRST_BINDING = registeredBinding("scoped-first").binding;
const FIRST_ID: BindingIdentifier = FIRST_BINDING.identifier;
const UNSEEN_ID = -1 as BindingIdentifier;
const SECOND_BINDING = registeredBinding("scoped-second").binding;
const NOTHING_OWED: ScopedInstanceOwner = { deactivateScoped: () => undefined };

/** An owner recording what it was asked to deactivate, answering with `answer` for each instance. */
function recordingOwner(
  seen: Array<unknown>,
  answer: (instance: unknown) => Promise<void> | undefined = () => undefined,
): ScopedInstanceOwner {
  return {
    deactivateScoped: (_binding, instance) => {
      seen.push(instance);
      return answer(instance);
    },
  };
}

describe("ScopeManager scoped entries", () => {
  it("deleteScoped releases a cached entry and is a no-op for unknown ids", () => {
    const scope = new ScopeManager(true);
    scope.setScoped(FIRST_BINDING, { alive: true }, NOTHING_OWED);
    expect(scope.readScoped(FIRST_ID)).toEqual({ alive: true });
    expect(scope.scopedCount).toBe(1);

    scope.deleteScoped(FIRST_ID);
    expect(scope.readScoped(FIRST_ID)).toBe(SCOPED_MISS);
    expect(scope.scopedCount).toBe(0);

    scope.deleteScoped(UNSEEN_ID);
    expect(scope.scopedCount).toBe(0);
  });

  it("deactivateScoped answers undefined when no owner has a teardown to run", () => {
    const scope = new ScopeManager(true);
    scope.setScoped(FIRST_BINDING, "first", NOTHING_OWED);

    expect(scope.deactivateScoped([])).toBeUndefined();
  });

  it("deactivateScoped runs owed teardowns latest first, each after the one before settles", async () => {
    const seen: Array<unknown> = [];
    const settled: Array<unknown> = [];
    const owner = recordingOwner(seen, async (instance) => {
      await Promise.resolve();
      settled.push(instance);
    });
    const scope = new ScopeManager(true);
    scope.setScoped(FIRST_BINDING, "first", owner);
    scope.setScoped(SECOND_BINDING, "second", owner);

    await scope.deactivateScoped([]);

    expect(seen).toEqual(["second", "first"]);
    expect(settled).toEqual(["second", "first"]);
  });

  it("deactivateScoped owes a binding cached again only its current instance", async () => {
    const seen: Array<unknown> = [];
    const owner = recordingOwner(seen);
    const scope = new ScopeManager(true);
    scope.setScoped(FIRST_BINDING, "released", owner);
    scope.takeScoped(FIRST_ID);
    scope.setScoped(FIRST_BINDING, "current", owner);

    expect(scope.deactivateScoped([])).toBeUndefined();
    expect(seen).toEqual(["current"]);
  });

  it("deactivateScoped collects a thrown and a rejected teardown and still runs the rest", async () => {
    const errors: Array<unknown> = [];
    const seen: Array<unknown> = [];
    const scope = new ScopeManager(true);
    scope.setScoped(FIRST_BINDING, "first", recordingOwner(seen));
    scope.setScoped(
      SECOND_BINDING,
      "second",
      recordingOwner(seen, () => Promise.reject(new Error("rejected"))),
    );
    const throwing: ScopedInstanceOwner = {
      deactivateScoped: () => {
        throw new Error("thrown");
      },
    };
    scope.setScoped(registeredBinding("scoped-third").binding, "third", throwing);

    await scope.deactivateScoped(errors);

    expect(seen).toEqual(["second", "first"]);
    expect(errors.map((error) => (error as Error).message)).toEqual(["thrown", "rejected"]);
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
