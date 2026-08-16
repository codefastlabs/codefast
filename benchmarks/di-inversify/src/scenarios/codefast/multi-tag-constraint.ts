/**
 * @codefast/di — multi-tag scenarios (codefast-only).
 *
 * InversifyJS 8's `GetOptions` only accepts a single `tag: { key, value }` pair,
 * so there is no head-to-head inversify equivalent. Both scenarios show "—" on the
 * inversify column and serve as regression protection for codefast's multi-tag paths.
 *
 *   - `multi-tag-slot-resolve` — resolves a binding selected by two slot tags
 *     simultaneously (`{ tags: [ENV_TAG.of("prod"),TIER_TAG.of("premium")] }`). Four binding
 *     variants, each registered with a distinct `[env, tier]` combination. Exercises
 *     the multi-pair slot-matching loop on the hot path.
 *
 *   - `multi-tag-constraint-resolve` — resolves a parent service whose own slot carries
 *     two tags. The inner `IPlugin` dependency has three bindings, one of which uses
 *     `whenParentTaggedAll([ENV_TAG.of("prod"),TIER_TAG.of("premium")])`. Exercises the new
 *     multi-tag predicate helper: all pairs must match the parent slot in a single
 *     closure call, with no intermediate allocation.
 */
import type { BindingTag } from "@codefast/di";
import { Container, token, whenParentTaggedAll } from "@codefast/di";

import { ENV_TAG, TIER_TAG } from "#/fixtures/bench-tags";
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

const TARGET_SLOT_TAGS: ReadonlyArray<BindingTag> = [ENV_TAG.of("prod"), TIER_TAG.of("premium")];

function buildMultiTagSlotResolveScenario(): BenchScenario {
  const container = Container.create();

  for (const [env, tier] of SLOT_VARIANTS) {
    container
      .bind(slottedServiceToken)
      .toConstantValue({ env, tier })
      .whenTagged(ENV_TAG.of(env))
      .whenTagged(TIER_TAG.of(tier));
  }

  container.resolve(slottedServiceToken, { tags: TARGET_SLOT_TAGS });

  return {
    id: "multi-tag-slot-resolve",
    group: "micro",
    what: `resolve(token, { tags: [ENV_TAG.of("prod"),TIER_TAG.of("premium")] }) from ${String(SLOT_VARIANTS.length)}-variant multi-tag set (codefast-only)`,
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

const CONSTRAINT_TAGS: ReadonlyArray<BindingTag> = [ENV_TAG.of("prod"), TIER_TAG.of("premium")];

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
    .whenTagged(ENV_TAG.of("prod"))
    .whenTagged(TIER_TAG.of("premium"))
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

// ── scenario 3: multi-tag selection at scale ──────────────────────────────────

const MULTI_TAG_SELECT_BATCH = 300;
const SELECT_ENV_COUNT = 8;
const SELECT_TIER_COUNT = 4;

const selectServiceToken = token<SlottedService>("bench-cf-mt-select-service");

/** The 4-variant row prices the matching loop; this one prices selection over a wide variant set. */
function buildMultiTagSelectAtScaleScenario(): BenchScenario {
  const container = Container.create();

  for (let envIndex = 0; envIndex < SELECT_ENV_COUNT; envIndex++) {
    for (let tierIndex = 0; tierIndex < SELECT_TIER_COUNT; tierIndex++) {
      container
        .bind(selectServiceToken)
        .toConstantValue({ env: `env-${String(envIndex)}`, tier: `tier-${String(tierIndex)}` })
        .whenTagged(ENV_TAG.of(`env-${String(envIndex)}`))
        .whenTagged(TIER_TAG.of(`tier-${String(tierIndex)}`));
    }
  }

  const variantCount = SELECT_ENV_COUNT * SELECT_TIER_COUNT;
  const targetTags: ReadonlyArray<BindingTag> = [
    ENV_TAG.of(`env-${String(SELECT_ENV_COUNT - 1)}`),
    TIER_TAG.of(`tier-${String(SELECT_TIER_COUNT - 1)}`),
  ];

  container.resolve(selectServiceToken, { tags: targetTags });

  return {
    id: `multi-tag-select-${String(variantCount)}`,
    group: "micro",
    what: `resolve(token, { tags }) selecting one of ${String(variantCount)} two-tag variants under one token (codefast-only)`,
    batch: MULTI_TAG_SELECT_BATCH,
    sanity: () => {
      const result = container.resolve(selectServiceToken, { tags: targetTags });
      return (
        result.env === `env-${String(SELECT_ENV_COUNT - 1)}` && result.tier === `tier-${String(SELECT_TIER_COUNT - 1)}`
      );
    },
    build: () =>
      batched(MULTI_TAG_SELECT_BATCH, () => {
        container.resolve(selectServiceToken, { tags: targetTags });
      }),
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastMultiTagScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildMultiTagSlotResolveScenario(),
    buildMultiTagConstraintResolveScenario(),
    buildMultiTagSelectAtScaleScenario(),
  ];
}
