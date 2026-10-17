import { describe, expect, it } from "vitest";

import type { ConstraintRequirement } from "#core/constraint-requirement";
import * as full from "#error-messages";
import * as production from "#error-messages.production";

type Messages = typeof full;

const requirement: ConstraintRequirement = {
  requires: "ancestorSlotName",
  name: "primary",
  helperName: "whenParentNamed",
  tokenName: "app:Parent",
};

/** One call per message, typed against the full module so a message added without a case does not compile. */
const CASES: { readonly [Name in keyof Messages]: Parameters<Messages[Name]> } = {
  tokenNotBound: ["app:Logger", ["app:Service", "app:Logger"]],
  noMatchingBinding: ["app:Logger", { name: "file" }, ["default"], ["app:Logger"]],
  ambiguousBinding: ["app:Logger", []],
  circularDependency: [["app:A", "app:B", "app:A"]],
  asyncResolution: ["app:Root", "app:Db"],
  asyncDeactivation: ["app:Db"],
  scopeViolation: ["app:Cache", "singleton", "app:Request", "scoped", ["app:Cache", "app:Request"]],
  emptyTagCriteria: ["whenParentTaggedAll"],
  unreachableConstraint: ["app:Logger", requirement],
  unreachableLifecycleHook: ["app:Logger", "onDeactivation", "no-deactivatable-binding"],
  invalidMetadata: ["Service", "params is not an array"],
  missingMetadata: ["Service", { baseName: "Base", dependencyCount: 2 }],
  asyncModuleLoad: ["app:Infra"],
  missingScopeContext: ["app:Request"],
  missingContainerContext: ["Controller", "logger"],
  chainAlreadyRegistered: ["app:Logger"],
  manyBindingSlot: ["app:Plugin"],
  chainNotRegistered: ["app:Logger"],
  rebindUnboundToken: ["app:Logger"],
  selfBindingRequiresClass: ["app:Logger"],
  staticMemberDecorator: ["inject", "clock"],
  symbolKeyedLifecycle: ["postConstruct", "Symbol(init)"],
  privateLifecycleMethod: ["preDestroy", "#close"],
  missingDecoratorMetadata: ["injectable"],
  invalidBindingDeclaration: ["app:Logger", "no strategy"],
  disposedContainer: [],
  asyncActivation: ["app:Db", "postConstruct", "connect"],
  invalidMetadataShape: ["accessor", "", "array"],
  lifecycleMethodMissing: ["init"],
  deactivationHooksThrew: ["dispose()"],
  moduleRollbackThrew: [],
  foreignContainer: [],
};

// Every message is called with its arguments spread, so one loop exercises both modules in full.
function render(messages: Messages, name: keyof Messages): string {
  const message = messages[name] as (...args: ReadonlyArray<unknown>) => string;
  return message(...CASES[name]);
}

describe("every error message", () => {
  const names = Object.keys(CASES) as Array<keyof Messages>;

  it.each(names)("%s renders in both builds, the production one no longer than the full one", (name) => {
    const fullText = render(full, name);
    const productionText = render(production, name);

    expect(fullText.length).toBeGreaterThan(0);
    expect(productionText.length).toBeLessThanOrEqual(fullText.length);
  });
});

describe("the production error messages", () => {
  it("cover every message the full module writes", () => {
    expect(Object.keys(production).sort()).toEqual(Object.keys(full).sort());
  });

  it("keep the identifiers a message names and drop its prose", () => {
    expect(production.tokenNotBound("app:Logger", ["app:Service", "app:Logger"])).toBe("app:Service → app:Logger");
    expect(production.circularDependency(["app:A", "app:B", "app:A"])).toBe("app:A → app:B → app:A");
    expect(production.asyncResolution("app:Root", "app:Db")).toBe("app:Root → app:Db");
    expect(production.missingScopeContext("app:Request")).toBe("app:Request");
    expect(production.invalidMetadataShape("constructor", "params[0].token", "token")).toBe(
      "constructor params[0].token",
    );
    expect(full.tokenNotBound("app:Logger", ["app:Logger"])).toContain("Did you forget");
  });
});
