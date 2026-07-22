/**
 * The constraint predicates are pure functions over ConstraintContext, so they
 * are tested directly against fabricated frames — plus one end-to-end check
 * that a predicate actually gates binding selection through the container.
 */
import { describe, expect, it } from "vitest";

import type { BindingSlot } from "#/binding";
import { Container } from "#/container/container";
import {
  whenAnyAncestorIs,
  whenAnyAncestorNamed,
  whenAnyAncestorTagged,
  whenAnyAncestorTaggedAll,
  whenNoAncestorIs,
  whenNoParentIs,
  whenParentIs,
  whenParentNamed,
  whenParentTagged,
  whenParentTaggedAll,
} from "#/resolution/constraints";
import { token } from "#/token";
import type { BindingIdentifier, ConstraintContext, ResolutionFrame } from "#/types";

function frame(tokenName: string, slot: Partial<BindingSlot> = {}): ResolutionFrame {
  return {
    tokenName,
    scope: "transient",
    bindingId: "test" as BindingIdentifier,
    kind: "dynamic",
    slot: { name: slot.name, tags: slot.tags ?? [] },
  };
}

function contextWith(stack: ReadonlyArray<ResolutionFrame>): ConstraintContext {
  return {
    resolutionPath: stack.map((entry) => entry.tokenName),
    resolutionStack: stack,
    parent: stack.at(-1),
    ancestors: stack,
    currentResolveOptions: undefined,
  };
}

const ROOT_CONTEXT = contextWith([]);

describe("parent predicates", () => {
  const serviceToken = token<number>("service");

  it("whenParentIs matches only the direct parent's token name", () => {
    const predicate = whenParentIs(serviceToken);
    expect(predicate(contextWith([frame("other"), frame("service")]))).toBe(true);
    expect(predicate(contextWith([frame("service"), frame("other")]))).toBe(false);
    expect(predicate(ROOT_CONTEXT)).toBe(false);
  });

  it("whenNoParentIs is the negation, including at the root", () => {
    const predicate = whenNoParentIs(serviceToken);
    expect(predicate(contextWith([frame("service")]))).toBe(false);
    expect(predicate(contextWith([frame("other")]))).toBe(true);
    expect(predicate(ROOT_CONTEXT)).toBe(true);
  });

  it("whenParentNamed matches the parent binding's slot name", () => {
    const predicate = whenParentNamed("primary");
    expect(predicate(contextWith([frame("svc", { name: "primary" })]))).toBe(true);
    expect(predicate(contextWith([frame("svc", { name: "secondary" })]))).toBe(false);
    expect(predicate(ROOT_CONTEXT)).toBe(false);
  });

  it("whenParentTagged compares tag values with Object.is", () => {
    const predicate = whenParentTagged("tier", Number.NaN);
    expect(predicate(contextWith([frame("svc", { tags: [["tier", Number.NaN]] })]))).toBe(true);
    expect(predicate(contextWith([frame("svc", { tags: [["tier", "gold"]] })]))).toBe(false);
  });

  it("whenParentTaggedAll requires every pair on the direct parent", () => {
    const predicate = whenParentTaggedAll([
      ["tier", "gold"],
      ["region", "eu"],
    ]);
    expect(
      predicate(
        contextWith([
          frame("svc", {
            tags: [
              ["tier", "gold"],
              ["region", "eu"],
              ["extra", 1],
            ],
          }),
        ]),
      ),
    ).toBe(true);
    expect(predicate(contextWith([frame("svc", { tags: [["tier", "gold"]] })]))).toBe(false);
    expect(predicate(ROOT_CONTEXT)).toBe(false);
  });
});

describe("ancestor predicates", () => {
  const rootToken = token<number>("root");
  const deepStack = [frame("root", { name: "app", tags: [["env", "prod"]] }), frame("mid"), frame("leafParent")];

  it("whenAnyAncestorIs scans the whole stack; whenNoAncestorIs negates it", () => {
    expect(whenAnyAncestorIs(rootToken)(contextWith(deepStack))).toBe(true);
    expect(whenNoAncestorIs(rootToken)(contextWith(deepStack))).toBe(false);
    expect(whenAnyAncestorIs(rootToken)(contextWith([frame("mid")]))).toBe(false);
    expect(whenNoAncestorIs(rootToken)(ROOT_CONTEXT)).toBe(true);
  });

  it("whenAnyAncestorNamed / whenAnyAncestorTagged match any frame's slot", () => {
    expect(whenAnyAncestorNamed("app")(contextWith(deepStack))).toBe(true);
    expect(whenAnyAncestorNamed("missing")(contextWith(deepStack))).toBe(false);
    expect(whenAnyAncestorTagged("env", "prod")(contextWith(deepStack))).toBe(true);
    expect(whenAnyAncestorTagged("env", "dev")(contextWith(deepStack))).toBe(false);
  });

  it("whenAnyAncestorTaggedAll requires all pairs on one single frame", () => {
    const split = [frame("a", { tags: [["x", 1]] }), frame("b", { tags: [["y", 2]] })];
    const combined = [
      frame("a", {
        tags: [
          ["x", 1],
          ["y", 2],
        ],
      }),
    ];
    const predicate = whenAnyAncestorTaggedAll([
      ["x", 1],
      ["y", 2],
    ]);
    expect(predicate(contextWith(split))).toBe(false);
    expect(predicate(contextWith(combined))).toBe(true);
  });
});

describe("predicates gate binding selection end-to-end", () => {
  interface Logger {
    readonly source: string;
  }

  it("a pure-predicate binding is only eligible when its predicate matches", () => {
    const loggerToken = token<Logger>("logger");
    const apiToken = token<{ logger: Logger }>("api");
    const jobToken = token<{ logger: Logger }>("job");

    const container = Container.create();
    // Predicate binding FIRST: registering it after a default would replace that
    // default at the builder's eager commit (see the order-sensitivity test below).
    container
      .bind(loggerToken)
      .toDynamic(() => ({ source: "api" }))
      .when(whenParentIs(apiToken));
    container.bind(loggerToken).toConstantValue({ source: "default" });
    container.bind(apiToken).toDynamic((ctx) => ({ logger: ctx.resolve(loggerToken) }));
    container.bind(jobToken).toDynamic((ctx) => ({ logger: ctx.resolve(loggerToken) }));

    // job's parent frame does not satisfy the predicate → only the default matches.
    expect(container.resolve(jobToken).logger.source).toBe("default");
    expect(container.resolve(loggerToken).source).toBe("default");
  });

  it("registration order does not matter: a chain that morphs to pure-predicate restores the displaced default", () => {
    // The fluent chain commits eagerly, so `.toDynamic()` momentarily displaces the
    // existing default binding — the `.when()` re-commit must restore it.
    const loggerToken = token<Logger>("logger");
    const container = Container.create();
    container.bind(loggerToken).toConstantValue({ source: "default" });
    container
      .bind(loggerToken)
      .toDynamic(() => ({ source: "narrow" }))
      .when(() => false);

    expect(container.resolve(loggerToken).source).toBe("default");
  });

  it("a chain that morphs to a named slot restores the displaced default too", () => {
    const loggerToken = token<Logger>("logger");
    const container = Container.create();
    container.bind(loggerToken).toConstantValue({ source: "default" });
    container.bind(loggerToken).toConstantValue({ source: "named" }).whenNamed("special");

    expect(container.resolve(loggerToken).source).toBe("default");
    expect(container.resolve(loggerToken, { name: "special" }).source).toBe("named");
  });

  it("a chain that settles on the same default slot legitimately replaces the previous default", () => {
    const loggerToken = token<Logger>("logger");
    const container = Container.create();
    container.bind(loggerToken).toConstantValue({ source: "old" });
    container
      .bind(loggerToken)
      .toDynamic(() => ({ source: "new" }))
      .singleton();

    expect(container.resolve(loggerToken).source).toBe("new");
  });
});
