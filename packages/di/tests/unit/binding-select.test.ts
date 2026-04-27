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
describe("binding selection helpers", () => {
  describe("registryKeyLabel", () => {
    it("returns class name for constructors", () => {
      class MyService {}
      expect(registryKeyLabel(MyService)).toBe("MyService");
    });
    it("returns anonymous class for unnamed constructors", () => {
      expect(registryKeyLabel(class {})).toBe("(anonymous class)");
    });
    it("returns token name for tokens", () => {
      const sampleToken = token("MyToken");
      expect(registryKeyLabel(sampleToken)).toBe("MyToken");
    });
    it("returns anonymous token for empty named tokens", () => {
      const unnamedToken = token("");
      expect(registryKeyLabel(unnamedToken)).toBe("(anonymous token)");
    });
  });
  describe("filterMatchingBindings", () => {
    it("filters by name hint", () => {
      const alphaBinding = mockBinding({ bindingName: "alpha" });
      const betaBinding = mockBinding({ bindingName: "beta" });
      const matchedBindings = filterMatchingBindings(
        [alphaBinding, betaBinding],
        { name: "alpha" },
        undefined,
      );
      expect(matchedBindings).toEqual([alphaBinding]);
    });
    it("filters by tag hint", () => {
      const adminTags = new Map<string, unknown>();
      adminTags.set("role", "admin");
      const adminRoleBinding = mockBinding({ tags: adminTags });
      const userTags = new Map<string, unknown>();
      userTags.set("role", "user");
      const userRoleBinding = mockBinding({ tags: userTags });
      const matchedBindings = filterMatchingBindings(
        [adminRoleBinding, userRoleBinding],
        { tag: ["role", "admin"] },
        undefined,
      );
      expect(matchedBindings).toEqual([adminRoleBinding]);
    });
    it("filters by constraint context", () => {
      const shortPathBinding = mockBinding({
        constraint: (constraintContext) => constraintContext.resolutionPath.length === 1,
      });
      const longPathBinding = mockBinding({
        constraint: (constraintContext) => constraintContext.resolutionPath.length > 5,
      });
      const constraintContext = mockConstraintContext({ resolutionPath: ["a"] });
      const matchedBindings = filterMatchingBindings(
        [shortPathBinding, longPathBinding],
        undefined,
        constraintContext,
      );
      expect(matchedBindings).toEqual([shortPathBinding]);
    });
  });
  describe("selectBindingForRegistry", () => {
    it("throws TokenNotBoundError if bindings array is empty", () => {
      expect(() => {
        selectBindingForRegistry([], undefined, "MyToken", ["path"], undefined);
      }).toThrow(TokenNotBoundError);
    });
    it("returns the single matching binding", () => {
      const onlyBinding = mockBinding();
      const selectedBinding = selectBindingForRegistry(
        [onlyBinding],
        undefined,
        "MyToken",
        ["path"],
        undefined,
      );
      expect(selectedBinding).toBe(onlyBinding);
    });
    it("throws NoMatchingBindingError if candidates length is 0 and hint was provided", () => {
      const alphaNamedBinding = mockBinding({ bindingName: "alpha" });
      expect(() => {
        selectBindingForRegistry(
          [alphaNamedBinding],
          { name: "beta" },
          "MyToken",
          ["path"],
          undefined,
        );
      }).toThrowError(NoMatchingBindingError);
    });
    it("throws TokenNotBoundError if candidates length is 0 and hint was not provided", () => {
      const neverMatchingBinding = mockBinding({ constraint: () => false });
      expect(() => {
        selectBindingForRegistry(
          [neverMatchingBinding],
          undefined,
          "MyToken",
          ["path"],
          mockConstraintContext(),
        );
      }).toThrowError(TokenNotBoundError);
    });
    it("throws DiError (Ambiguous) if multiple candidates match", () => {
      const firstAmbiguousBinding = mockBinding();
      const secondAmbiguousBinding = mockBinding();
      expect(() => {
        selectBindingForRegistry(
          [firstAmbiguousBinding, secondAmbiguousBinding],
          undefined,
          "MyToken",
          ["path"],
          undefined,
        );
      }).toThrow(/Ambiguous binding for "MyToken"/);
    });
    it("throws DiError (Ambiguous) for duplicate name matches", () => {
      const firstNamedBinding = mockBinding({ bindingName: "alpha" });
      const secondNamedBinding = mockBinding({ bindingName: "alpha" });
      expect(() => {
        selectBindingForRegistry(
          [firstNamedBinding, secondNamedBinding],
          { name: "alpha" },
          "MyToken",
          ["path"],
          undefined,
        );
      }).toThrow(/Ambiguous binding for "MyToken"/);
    });
    it("throws DiError (Ambiguous) when both named and default candidates match without hint", () => {
      const namedBinding = mockBinding({ bindingName: "named" });
      const firstDefaultBinding = mockBinding();
      const secondDefaultBinding = mockBinding();
      expect(() => {
        selectBindingForRegistry(
          [namedBinding, firstDefaultBinding, secondDefaultBinding],
          undefined,
          "MyToken",
          ["path"],
          undefined,
        );
      }).toThrow(/Ambiguous binding for "MyToken"/);
    });
    it("returns named binding when no-hint resolution has only one candidate", () => {
      const namedBinding = mockBinding({ bindingName: "alpha" });
      const selectedBinding = selectBindingForRegistry(
        [namedBinding],
        undefined,
        "MyToken",
        ["path"],
        undefined,
      );
      expect(selectedBinding).toBe(namedBinding);
    });
    it("throws DiError Internal if candidate is undefined (array hole)", () => {
      const candidates: Binding<unknown>[] = new Array(1);
      expect(() => {
        selectBindingForRegistry(candidates, undefined, "MyToken", ["path"], undefined);
      }).toThrowError(/Internal: expected binding candidate/);
    });
  });
  describe("selectDefaultBindingForKey", () => {
    it("throws TokenNotBoundError if lookup returns undefined", () => {
      const registryKeyToken = token("MyToken");
      expect(() => {
        selectDefaultBindingForKey(() => undefined, registryKeyToken, ["Root"]);
      }).toThrowError(TokenNotBoundError);
    });
    it("throws TokenNotBoundError if lookup returns empty array", () => {
      const registryKeyToken = token("MyToken");
      expect(() => {
        selectDefaultBindingForKey(() => [], registryKeyToken, ["Root"]);
      }).toThrowError(TokenNotBoundError);
    });
    it("selects default binding successfully", () => {
      const registryKeyToken = token("MyToken");
      const registeredBinding = mockBinding();
      const selectedBinding = selectDefaultBindingForKey(
        () => [registeredBinding],
        registryKeyToken,
        ["Root"],
      );
      expect(selectedBinding).toBe(registeredBinding);
    });
  });
});
