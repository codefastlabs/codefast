/**
 * The generator renders a plan tree as one function; these cases pin that every node kind renders
 * to what the closure does — construction order, opaque thunks, the singleton read, the settled
 * factory call — and that no two plans share a function.
 */
import { describe, expect, it } from "vitest";

import type { Binding } from "#core/binding";
import { NO_INSTANCE } from "#core/binding";
import type { ConstructorInvocation } from "#core/constructor-type";
import type { AsyncPlanNode, PlanNode } from "#resolution/plan/plan-codegen";
import {
  generateAsyncPlan,
  generatePlan,
  isPlanCodegenAvailable,
  PLAN_CODEGEN_THRESHOLD,
} from "#resolution/plan/plan-codegen";

class Leaf {
  constructor(readonly tag: unknown) {}
}

class Root {
  constructor(
    readonly first: unknown,
    readonly second: unknown,
    readonly third: unknown,
  ) {}
}

const leaf = Leaf as unknown as ConstructorInvocation;
const root = Root as unknown as ConstructorInvocation;

function generated(node: PlanNode): () => unknown {
  const plan = generatePlan(node);
  if (plan === null) {
    throw new Error("this runtime refused to generate a plan");
  }
  return plan;
}

function generatedAsync(node: AsyncPlanNode): () => unknown {
  const plan = generateAsyncPlan(node);
  if (plan === null) {
    throw new Error("this runtime refused to generate an async plan");
  }
  return plan;
}

describe("generatePlan", () => {
  it("is available on this runtime and the threshold leaves room for a closure tier", () => {
    expect(isPlanCodegenAvailable()).toBe(true);
    expect(PLAN_CODEGEN_THRESHOLD).toBeGreaterThan(1);
  });

  it("constructs the tree with dependencies evaluated in declaration order", () => {
    const order: Array<string> = [];
    const thunk = (label: string) => () => {
      order.push(label);
      return label;
    };
    const plan = generated({
      kind: "construct",
      target: root,
      deps: [
        { kind: "construct", target: leaf, deps: [{ kind: "thunk", run: thunk("a") }] },
        { kind: "value", value: 42 },
        { kind: "thunk", run: thunk("c") },
      ],
    });

    const instance = plan() as Root;

    expect(instance).toBeInstanceOf(Root);
    expect(instance.first).toBeInstanceOf(Leaf);
    expect((instance.first as Leaf).tag).toBe("a");
    expect(instance.second).toBe(42);
    expect(instance.third).toBe("c");
    expect(order).toEqual(["a", "c"]);
    expect(plan()).not.toBe(instance);
  });

  it("reads a singleton's cached instance and escapes only while it has none", () => {
    const binding = { instance: NO_INSTANCE } as unknown as { instance: unknown };
    let escapes = 0;
    const materialized = { materialized: true };
    const plan = generated({
      kind: "construct",
      target: leaf,
      deps: [
        {
          kind: "singleton",
          binding: binding as unknown as Binding,
          escape: () => {
            escapes += 1;
            return materialized;
          },
        },
      ],
    });

    expect((plan() as Leaf).tag).toBe(materialized);
    expect(escapes).toBe(1);

    binding.instance = materialized;

    expect((plan() as Leaf).tag).toBe(materialized);
    expect(escapes).toBe(1);
  });

  it("passes a factory its dependencies and settles the result", () => {
    const settle = (result: unknown): unknown => {
      if (result instanceof Promise) {
        throw new Error("async factory");
      }
      return result;
    };
    const sum = generated({
      kind: "call",
      factory: (left: unknown, right: unknown) => (left as number) + (right as number),
      settle,
      deps: [
        { kind: "value", value: 2 },
        { kind: "value", value: 3 },
      ],
    });
    const pending = generated({ kind: "call", factory: () => Promise.resolve(1), settle, deps: [] });

    expect(sum()).toBe(5);
    expect(() => pending()).toThrow("async factory");
  });

  it("hands an accessor root its dependency list", () => {
    let received: Array<unknown> | undefined;
    const plan = generated({
      kind: "accessors",
      construct: (deps) => {
        received = deps;
        return "constructed";
      },
      deps: [
        { kind: "value", value: "x" },
        { kind: "construct", target: leaf, deps: [{ kind: "value", value: "y" }] },
      ],
    });

    expect(plan()).toBe("constructed");
    expect(received).toHaveLength(2);
    expect(received?.[0]).toBe("x");
    expect(received?.[1]).toBeInstanceOf(Leaf);
  });

  it("constructs a repeated class once per site", () => {
    const one = { kind: "construct", target: leaf, deps: [{ kind: "value", value: 1 }] } as const;
    const plan = generated({ kind: "construct", target: root, deps: [one, one, one] });

    const instance = plan() as Root;

    expect(instance.first).toBeInstanceOf(Leaf);
    expect(instance.second).toBeInstanceOf(Leaf);
    expect(instance.third).toBeInstanceOf(Leaf);
    expect(instance.first).not.toBe(instance.second);
  });

  it("gives every plan a function of its own, even for one shape", () => {
    const node: PlanNode = { kind: "construct", target: leaf, deps: [{ kind: "value", value: "same" }] };

    const first = generated(node);
    const second = generated(node);

    expect(first).not.toBe(second);
    expect((first() as Leaf).tag).toBe("same");
    expect((second() as Leaf).tag).toBe("same");
  });
});

describe("generateAsyncPlan", () => {
  it("renders a tree that awaits nothing as plain construction", () => {
    const plan = generatedAsync({
      kind: "construct",
      target: root,
      deps: [
        { kind: "construct", target: leaf, deps: [{ kind: "value", value: "a" }], awaits: false },
        { kind: "value", value: 2 },
        { kind: "thunk", run: () => "c" },
      ],
      awaits: false,
    });

    const instance = plan() as Root;

    expect(instance).toBeInstanceOf(Root);
    expect((instance.first as Leaf).tag).toBe("a");
    expect(instance.second).toBe(2);
    expect(instance.third).toBe("c");
  });

  it("starts every dependency in order and applies to the settled values", async () => {
    const order: Array<string> = [];
    const plan = generatedAsync({
      kind: "construct",
      target: root,
      deps: [
        {
          kind: "thunk",
          run: () => {
            order.push("first");
            return Promise.resolve("p");
          },
        },
        { kind: "value", value: Promise.resolve("q") },
        {
          kind: "construct",
          target: leaf,
          deps: [
            {
              kind: "thunk",
              run: () => {
                order.push("third");
                return "r";
              },
            },
          ],
          awaits: false,
        },
      ],
      awaits: true,
    });

    const pending = plan();

    expect(pending).toBeInstanceOf(Promise);
    expect(order).toEqual(["first", "third"]);
    const instance = (await pending) as Root;
    expect(instance.first).toBe("p");
    expect(instance.second).toBe("q");
    expect((instance.third as Leaf).tag).toBe("r");
  });

  it("turns a dependency's sync throw into a rejection and still starts its siblings", async () => {
    let siblingStarted = false;
    const plan = generatedAsync({
      kind: "call",
      factory: (...values: Array<unknown>) => values,
      deps: [
        {
          kind: "thunk",
          run: () => {
            throw new Error("leaf exploded");
          },
        },
        {
          kind: "thunk",
          run: () => {
            siblingStarted = true;
            return Promise.resolve("ok");
          },
        },
      ],
      awaits: true,
    });

    await expect(plan()).rejects.toThrow("leaf exploded");
    expect(siblingStarted).toBe(true);
  });

  it("nests an awaiting node under an awaiting node", async () => {
    const plan = generatedAsync({
      kind: "construct",
      target: root,
      deps: [
        {
          kind: "call",
          factory: (value: unknown) => `inner:${String(value)}`,
          deps: [{ kind: "thunk", run: () => Promise.resolve(1) }],
          awaits: true,
        },
        { kind: "value", value: "sync" },
        { kind: "thunk", run: () => Promise.resolve(3) },
      ],
      awaits: true,
    });

    const instance = (await plan()) as Root;

    expect(instance.first).toBe("inner:1");
    expect(instance.second).toBe("sync");
    expect(instance.third).toBe(3);
  });

  it("reads a singleton's cache inside an awaiting node", async () => {
    const binding = { instance: NO_INSTANCE } as unknown as { instance: unknown };
    let escapes = 0;
    const plan = generatedAsync({
      kind: "construct",
      target: leaf,
      deps: [
        {
          kind: "call",
          factory: (shared: unknown, tag: unknown) => [shared, tag],
          deps: [
            {
              kind: "singleton",
              binding: binding as unknown as Binding,
              escape: () => {
                escapes += 1;
                return Promise.resolve("materialized");
              },
            },
            { kind: "thunk", run: () => Promise.resolve("tag") },
          ],
          awaits: true,
        },
      ],
      awaits: true,
    });

    expect(((await plan()) as Leaf).tag).toEqual(["materialized", "tag"]);
    expect(escapes).toBe(1);

    binding.instance = "cached";

    expect(((await plan()) as Leaf).tag).toEqual(["cached", "tag"]);
    expect(escapes).toBe(1);
  });
});
