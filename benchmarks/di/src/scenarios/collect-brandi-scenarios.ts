/**
 * Central list of all brandi bench scenarios (core subset). Used by the bench
 * subprocess. Brandi is token-based and supports singleton and transient scopes,
 * so it covers the full factory/class-binding core subset shared by every library,
 * plus its native conditional-injection (`when`/`tagged`), cold module composition
 * (`use().from()`), async (`AsyncFactory`), and per-scope lifetime
 * (`inContainerScope`) rows — the codefast-only introspection/lifecycle rows are
 * absent.
 */
import { buildBrandiAsyncScenarios } from "#/scenarios/brandi/async";
import { buildBrandiBootScenarios } from "#/scenarios/brandi/boot";
import { buildBrandiConditionalScenarios } from "#/scenarios/brandi/conditional";
import { buildBrandiFanOutScenarios } from "#/scenarios/brandi/fan-out";
import { buildBrandiMicroScenarios } from "#/scenarios/brandi/micro";
import { buildBrandiModuleScenarios } from "#/scenarios/brandi/module";
import { buildBrandiRealisticScenarios } from "#/scenarios/brandi/realistic";
import { buildBrandiRealisticClassScenarios } from "#/scenarios/brandi/realistic-class";
import { buildBrandiScaleScenarios } from "#/scenarios/brandi/scale";
import { buildBrandiScopeScenarios } from "#/scenarios/brandi/scope";
import type { AnyScenario } from "#/scenarios/types";

/**
 * Collects every brandi bench scenario.
 */
export function collectAllBrandiScenarios(): ReadonlyArray<AnyScenario> {
  return [
    ...buildBrandiMicroScenarios(),
    ...buildBrandiRealisticScenarios(),
    ...buildBrandiRealisticClassScenarios(),
    ...buildBrandiFanOutScenarios(),
    ...buildBrandiConditionalScenarios(),
    ...buildBrandiModuleScenarios(),
    ...buildBrandiAsyncScenarios(),
    ...buildBrandiScopeScenarios(),
    ...buildBrandiScaleScenarios(),
    ...buildBrandiBootScenarios(),
  ];
}
