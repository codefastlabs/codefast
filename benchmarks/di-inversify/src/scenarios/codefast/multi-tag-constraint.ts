/**
 * @codefast/di — multi-tag scenarios (codefast-only).
 *
 * InversifyJS 8's `GetOptions` only accepts a single `tag: { key, value }` pair,
 * so there is no head-to-head inversify equivalent. Both scenarios show "—" on the
 * inversify column and serve as regression protection for codefast's multi-tag paths.
 *
 *   - `multi-tag-slot-resolve` — resolves a binding selected by two slot tags
 *     simultaneously (`{ tags: [["env","prod"],["tier","premium"]] }`). Four binding
 *     variants, each registered with a distinct `[env, tier]` combination. Exercises
 *     the multi-pair slot-matching loop on the hot path.
 *
 *   - `multi-tag-constraint-resolve` — resolves a parent service whose own slot carries
 *     two tags. The inner `IPlugin` dependency has three bindings, one of which uses
 *     `whenParentTaggedAll([["env","prod"],["tier","premium"]])`. Exercises the new
 *     multi-tag predicate helper: all pairs must match the parent slot in a single
 *     closure call, with no intermediate allocation.
 */
import { Container, token, whenParentTaggedAll } from "@codefast/di";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

// ── scenario 1: multi-tag slot resolve ───────────────────────────────────────

const MULTI_TAG_SLOT_BATCH = 300;

interface SlottedService {
  readonly env: string;
  readonly tier: string;
}

const slottedServiceToken = token<SlottedService>("bench-cf-mt-slotted-service");

const SLOT_VARIANTS: ReadonlyArray<readonly [env: string, tier: string]> = [
  ["dev", "standard"],
  ["dev", "premium"],
  ["prod", "standard"],
  ["prod", "premium"],
] as const;

const TARGET_SLOT_TAGS: ReadonlyArray<readonly [string, unknown]> = [
  ["env", "prod"],
  ["tier", "premium"],
];

function buildMultiTagSlotResolveScenario(): BenchScenario {
  const container = Container.create();

  for (const [env, tier] of SLOT_VARIANTS) {
    container
      .bind(slottedServiceToken)
      .toConstantValue({ env, tier })
      .whenTagged("env", env)
      .whenTagged("tier", tier);
  }

  container.resolve(slottedServiceToken, { tags: TARGET_SLOT_TAGS });

  return {
    id: "multi-tag-slot-resolve",
    group: "micro",
    what: `resolve(token, { tags: [["env","prod"],["tier","premium"]] }) from ${String(SLOT_VARIANTS.length)}-variant multi-tag set (codefast-only)`,
    batch: MULTI_TAG_SLOT_BATCH,
    sanity: () => {
      const result = container.resolve(slottedServiceToken, { tags: TARGET_SLOT_TAGS });
      return result.env === "prod" && result.tier === "premium";
    },
    build: () =>
      batched(MULTI_TAG_SLOT_BATCH, () => {
        container.resolve(slottedServiceToken, { tags: TARGET_SLOT_TAGS });
      }),
  };
}

// ── scenario 2: multi-tag constraint resolve ──────────────────────────────────

const MULTI_TAG_CONSTRAINT_BATCH = 200;

interface Plugin {
  readonly name: string;
}

interface AppService {
  readonly plugin: Plugin;
}

const pluginToken = token<Plugin>("bench-cf-mt-plugin");
const appServiceToken = token<AppService>("bench-cf-mt-app-service");

const CONSTRAINT_TAGS: ReadonlyArray<readonly [string, unknown]> = [
  ["env", "prod"],
  ["tier", "premium"],
];

function buildMultiTagConstraintResolveScenario(): BenchScenario {
  const container = Container.create();

  // Default binding — matches when parent does NOT carry the premium tags
  container
    .bind(pluginToken)
    .toDynamic(() => ({ name: "dev" }))
    .transient();

  // Constrained binding — only activates when the parent slot has BOTH tags
  container
    .bind(pluginToken)
    .toDynamic(() => ({ name: "premium" }))
    .when(whenParentTaggedAll(CONSTRAINT_TAGS))
    .transient();

  // Parent service: slot carries the same tags so MaterializationFrame.slot.tags
  // is visible to whenParentTaggedAll when IPlugin is resolved inside the factory.
  container
    .bind(appServiceToken)
    .toDynamic((ctx) => ({ plugin: ctx.resolve(pluginToken) }))
    .whenTagged("env", "prod")
    .whenTagged("tier", "premium")
    .transient();

  // Pre-warm
  container.resolve(appServiceToken, { tags: CONSTRAINT_TAGS });

  return {
    id: "multi-tag-constraint-resolve",
    group: "micro",
    what: "whenParentTaggedAll([env,tier]) predicate — 2-tag multi-condition constraint selection (codefast-only)",
    batch: MULTI_TAG_CONSTRAINT_BATCH,
    sanity: () => {
      const result = container.resolve(appServiceToken, { tags: CONSTRAINT_TAGS });
      return result.plugin.name === "premium";
    },
    build: () =>
      batched(MULTI_TAG_CONSTRAINT_BATCH, () => {
        container.resolve(appServiceToken, { tags: CONSTRAINT_TAGS });
      }),
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastMultiTagScenarios(): ReadonlyArray<BenchScenario> {
  return [buildMultiTagSlotResolveScenario(), buildMultiTagConstraintResolveScenario()];
}
