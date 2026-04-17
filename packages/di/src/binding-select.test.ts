import { describe, expect, it } from "vitest";
import {
  filterMatchingBindings,
  registryKeyLabel,
  selectBindingForRegistry,
  selectDefaultBindingForKey,
} from "#/binding-select";
import type { Binding, ConstraintContext, ConstantBinding } from "#/binding";
import { createBindingIdentifier } from "#/binding";
import { NoMatchingBindingError, TokenNotBoundError } from "#/errors";
import { token } from "#/token";

function mockBinding(options: Partial<ConstantBinding<unknown>> = {}): ConstantBinding<unknown> {
  return {
    id: createBindingIdentifier(),
    kind: "constant",
    scope: "transient",
    value: null,
    tags: new Map(),
    ...options,
  };
}

function mockConstraintContext(options: Partial<ConstraintContext> = {}): ConstraintContext {
  return {
    resolutionPath: [],
    materializationStack: [],
    parent: undefined,
    ancestors: [],
    currentResolveHint: undefined,
    ...options,
  };
}

describe("binding-select", () => {
  describe("registryKeyLabel", () => {
    it("returns class name for constructors", () => {
      class MyService {}
      expect(registryKeyLabel(MyService)).toBe("MyService");
    });

    it("returns anonymous class for unnamed constructors", () => {
      expect(registryKeyLabel(class {})).toBe("(anonymous class)");
    });

    it("returns token name for tokens", () => {
      const t = token("MyToken");
      expect(registryKeyLabel(t)).toBe("MyToken");
    });

    it("returns anonymous token for empty named tokens", () => {
      const t = token("");
      expect(registryKeyLabel(t)).toBe("(anonymous token)");
    });
  });

  describe("filterMatchingBindings", () => {
    it("filters by name hint", () => {
      const b1 = mockBinding({ bindingName: "alpha" });
      const b2 = mockBinding({ bindingName: "beta" });

      const res = filterMatchingBindings([b1, b2], { name: "alpha" }, undefined);
      expect(res).toEqual([b1]);
    });

    it("filters by tag hint", () => {
      const tags1 = new Map<string | symbol, unknown>();
      tags1.set("role", "admin");
      const b1 = mockBinding({ tags: tags1 });

      const tags2 = new Map<string | symbol, unknown>();
      tags2.set("role", "user");
      const b2 = mockBinding({ tags: tags2 });

      const res = filterMatchingBindings([b1, b2], { tag: ["role", "admin"] }, undefined);
      expect(res).toEqual([b1]);
    });

    it("filters by constraint context", () => {
      const b1 = mockBinding({ constraint: (ctx) => ctx.resolutionPath.length === 1 });
      const b2 = mockBinding({ constraint: (ctx) => ctx.resolutionPath.length > 5 });

      const ctx = mockConstraintContext({ resolutionPath: ["a"] });
      const res = filterMatchingBindings([b1, b2], undefined, ctx);
      expect(res).toEqual([b1]);
    });
  });

  describe("selectBindingForRegistry", () => {
    it("throws TokenNotBoundError if bindings array is empty", () => {
      expect(() => {
        selectBindingForRegistry([], undefined, "MyToken", ["path"], undefined);
      }).toThrow(TokenNotBoundError);
    });

    it("returns the single matching binding", () => {
      const b1 = mockBinding();
      const res = selectBindingForRegistry([b1], undefined, "MyToken", ["path"], undefined);
      expect(res).toBe(b1);
    });

    it("throws NoMatchingBindingError if candidates length is 0 and hint was provided", () => {
      const b1 = mockBinding({ bindingName: "alpha" });
      expect(() => {
        selectBindingForRegistry([b1], { name: "beta" }, "MyToken", ["path"], undefined);
      }).toThrowError(NoMatchingBindingError);
    });

    it("throws TokenNotBoundError if candidates length is 0 and hint was not provided", () => {
      const b1 = mockBinding({ constraint: () => false }); // fails constraint
      expect(() => {
        selectBindingForRegistry([b1], undefined, "MyToken", ["path"], mockConstraintContext());
      }).toThrowError(TokenNotBoundError);
    });

    it("throws DiError (Ambiguous) if multiple candidates match", () => {
      const b1 = mockBinding();
      const b2 = mockBinding();
      expect(() => {
        selectBindingForRegistry([b1, b2], undefined, "MyToken", ["path"], undefined);
      }).toThrow(/Ambiguous binding for "MyToken"/);
    });

    it("throws DiError Internal if candidate is undefined (array hole)", () => {
      const candidates: Binding<unknown>[] = new Array(1);
      expect(() => {
        // Force pass undefined constraint to trigger the hole condition if the function is naive
        // Wait, the logic is `candidates.length === 1; const [only] = candidates; if (only === undefined) throw ...`
        selectBindingForRegistry(candidates, undefined, "MyToken", ["path"], undefined);
      }).toThrowError(/Internal: expected binding candidate/);
    });
  });

  describe("selectDefaultBindingForKey", () => {
    it("throws TokenNotBoundError if lookup returns undefined", () => {
      const t = token("MyToken");
      expect(() => {
        selectDefaultBindingForKey(() => undefined, t, ["Root"]);
      }).toThrowError(TokenNotBoundError);
    });

    it("throws TokenNotBoundError if lookup returns empty array", () => {
      const t = token("MyToken");
      expect(() => {
        selectDefaultBindingForKey(() => [], t, ["Root"]);
      }).toThrowError(TokenNotBoundError);
    });

    it("selects default binding successfully", () => {
      const t = token("MyToken");
      const b = mockBinding();
      const result = selectDefaultBindingForKey(() => [b], t, ["Root"]);
      expect(result).toBe(b);
    });
  });
});
