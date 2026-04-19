import { describe, expect, it } from "vitest";
import { whenAnyAncestorIs, whenParentIs, whenTargetTagged } from "#/constraints";
import type { ConstraintContext, ConstraintParentFrame } from "#/binding";
import { token } from "#/token";
import { createBindingIdentifier } from "#/binding";
import type { RegistryKey } from "#/registry";

describe("constraints", () => {
  const tokenA = token<unknown>("A");
  const tokenB = token<unknown>("B");
  const tokenC = token<unknown>("C");

  function createMockFrame(
    registryKey: RegistryKey,
    tags: Map<string, unknown> = new Map(),
  ): ConstraintParentFrame {
    return {
      registryKey,
      bindingId: createBindingIdentifier(),
      bindingKind: "constant",
      tags,
      scope: "transient",
    };
  }

  function createMockContext(overrides: Partial<ConstraintContext> = {}): ConstraintContext {
    return {
      resolutionPath: [],
      materializationStack: [],
      ancestors: [],
      ...overrides,
    } as ConstraintContext;
  }

  describe("whenParentIs", () => {
    it("returns true if the immediate parent matches the registry key", () => {
      const predicate = whenParentIs(tokenA);
      const ctx = createMockContext({
        parent: createMockFrame(tokenA),
      });
      expect(predicate(ctx)).toBe(true);
    });

    it("returns false if the immediate parent does not match the registry key", () => {
      const predicate = whenParentIs(tokenA);
      const ctx = createMockContext({
        parent: createMockFrame(tokenB),
      });
      expect(predicate(ctx)).toBe(false);
    });

    it("returns false if there is no parent", () => {
      const predicate = whenParentIs(tokenA);
      const ctx = createMockContext({
        parent: undefined,
      });
      expect(predicate(ctx)).toBe(false);
    });
  });

  describe("whenAnyAncestorIs", () => {
    it("returns true if any ancestor matches the registry key", () => {
      const predicate = whenAnyAncestorIs(tokenA);
      const ctx = createMockContext({
        materializationStack: [
          createMockFrame(tokenB),
          createMockFrame(tokenA),
          createMockFrame(tokenC),
        ],
      });
      expect(predicate(ctx)).toBe(true);
    });

    it("returns false if no ancestor matches the registry key", () => {
      const predicate = whenAnyAncestorIs(tokenA);
      const ctx = createMockContext({
        materializationStack: [createMockFrame(tokenB), createMockFrame(tokenC)],
      });
      expect(predicate(ctx)).toBe(false);
    });

    it("returns false if materialization stack is empty", () => {
      const predicate = whenAnyAncestorIs(tokenA);
      const ctx = createMockContext({
        materializationStack: [],
      });
      expect(predicate(ctx)).toBe(false);
    });
  });

  describe("whenTargetTagged", () => {
    it("returns true if the parent has the specified tag and value", () => {
      const predicate = whenTargetTagged("role", "admin");
      const tags = new Map<string, unknown>();
      tags.set("role", "admin");

      const ctx = createMockContext({
        parent: createMockFrame(tokenA, tags),
      });
      expect(predicate(ctx)).toBe(true);
    });

    it("returns false if the parent has the specified tag but wrong value", () => {
      const predicate = whenTargetTagged("role", "admin");
      const tags = new Map<string, unknown>();
      tags.set("role", "user");

      const ctx = createMockContext({
        parent: createMockFrame(tokenA, tags),
      });
      expect(predicate(ctx)).toBe(false);
    });

    it("returns false if the parent does not have the specified tag", () => {
      const predicate = whenTargetTagged("role", "admin");
      const ctx = createMockContext({
        parent: createMockFrame(tokenA),
      });
      expect(predicate(ctx)).toBe(false);
    });

    it("returns false if there is no parent", () => {
      const predicate = whenTargetTagged("role", "admin");
      const ctx = createMockContext({
        parent: undefined,
      });
      expect(predicate(ctx)).toBe(false);
    });
  });
});
