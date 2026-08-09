/**
 * @codefast/di — slot-selection lanes (codefast-only, paired-A/B instrumentation).
 *
 * These rows make `#findBinding`'s slot lanes measurable. They are **not** competitive rows: every
 * one carries `excludeFromAggregates` so that promoting one to a head-to-head pair later is a
 * deliberate act rather than a silent geomean shift.
 *
 * The first four form a 2×2 over (request form × where the tag literal lives), which is what
 * separates two costs the existing `tagged-binding-resolve` row cannot tell apart:
 *
 *                        hoisted literal        inline literal
 *   { tags: [pair] }     slot-tag-array-hoisted     slot-tag-array-inline
 *   { tag: pair }        slot-tag-shorthand-hoisted slot-tag-shorthand-inline
 *
 *   - across a row  → the lane, which both spellings of a single tag must share: both reach the
 *     registry's tagged index, so a gap opening here is that equivalence breaking.
 *   - down a column → the allocation: an inline `{ tags: [[k, v]] }` mints an options object,
 *     an outer array and the pair; `{ tag: [k, v] }` mints one fewer. Whether V8's escape
 *     analysis elides any of it is part of what the row answers.
 *
 * The remaining six cover slot lanes no other row reaches: the zero-valued tag that
 * forces the index's `Object.is` re-check, a name+tag request that no index can serve, `resolveAll`
 * over a tagged token, a tagged miss walking to a parentless container, and a tagged/named pair
 * owned by a parent and resolved from a child — the two that price the named lane's memo against
 * the tagged lane's unmemoized chain walk.
 *
 * Every row above requests its criteria as a caller's argument. The last two instead resolve a class
 * whose *dependencies* carry a name, once with the class's plan compiled and once with it declined —
 * the only rows in the suite where a criterion arrives from an injection slot.
 */
import type { BindingTag } from "@codefast/di";
import { Container, inject, injectable, token } from "@codefast/di";

import { ENV_TAG, LEVEL_TAG } from "#/fixtures/bench-tags";
import { TAGGED_ENVS, TARGET_TAG_VALUE } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const SLOT_RESOLVE_BATCH = 300;

interface TaggedService {
  readonly env: string;
}

const taggedServiceToken = token<TaggedService>("bench-cf-slot-tagged-service");

/** Hoisted so the hoisted rows allocate only the options object per call. */
const HOISTED_PAIR: BindingTag = ENV_TAG.of(TARGET_TAG_VALUE);
const HOISTED_TAGS: ReadonlyArray<BindingTag> = [HOISTED_PAIR];

/** The same four-variant tagged set `tagged-binding-resolve` uses, so the rows stay comparable. */
function buildTaggedContainer(): Container {
  const container = Container.create();

  for (const env of TAGGED_ENVS) {
    container.bind(taggedServiceToken).toConstantValue({ env }).whenTagged(ENV_TAG.of(env));
  }

  return container;
}

// ── 2×2: request form × literal placement ────────────────────────────────────

// One container behind all four, so the request shape is the only thing that differs.
const matrixContainer = buildTaggedContainer();

function buildArrayHoistedScenario(): BenchScenario {
  matrixContainer.resolve(taggedServiceToken, { tags: HOISTED_TAGS });

  return {
    id: "slot-tag-array-hoisted",
    group: "slot-selection",
    what: `resolve(token, { tags }) with the tag list hoisted — tagged-index lane (codefast-only)`,
    batch: SLOT_RESOLVE_BATCH,
    excludeFromAggregates: true,
    sanity: () => matrixContainer.resolve(taggedServiceToken, { tags: HOISTED_TAGS }).env === TARGET_TAG_VALUE,
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        matrixContainer.resolve(taggedServiceToken, { tags: HOISTED_TAGS });
      }),
  };
}

function buildShorthandHoistedScenario(): BenchScenario {
  matrixContainer.resolve(taggedServiceToken, { tag: HOISTED_PAIR });

  return {
    id: "slot-tag-shorthand-hoisted",
    group: "slot-selection",
    what: `resolve(token, { tag }) with the pair hoisted — tagged-index lane, one allocation fewer than the array form (codefast-only)`,
    batch: SLOT_RESOLVE_BATCH,
    excludeFromAggregates: true,
    sanity: () => matrixContainer.resolve(taggedServiceToken, { tag: HOISTED_PAIR }).env === TARGET_TAG_VALUE,
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        matrixContainer.resolve(taggedServiceToken, { tag: HOISTED_PAIR });
      }),
  };
}

function buildArrayInlineScenario(): BenchScenario {
  matrixContainer.resolve(taggedServiceToken, { tags: [ENV_TAG.of(TARGET_TAG_VALUE)] });

  return {
    id: "slot-tag-array-inline",
    group: "slot-selection",
    what: `resolve(token, { tags: [[k, v]] }) written inline — tagged-index lane plus its literals (codefast-only)`,
    batch: SLOT_RESOLVE_BATCH,
    excludeFromAggregates: true,
    sanity: () =>
      matrixContainer.resolve(taggedServiceToken, { tags: [ENV_TAG.of(TARGET_TAG_VALUE)] }).env === TARGET_TAG_VALUE,
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        matrixContainer.resolve(taggedServiceToken, { tags: [ENV_TAG.of(TARGET_TAG_VALUE)] });
      }),
  };
}

function buildShorthandInlineScenario(): BenchScenario {
  matrixContainer.resolve(taggedServiceToken, { tag: ENV_TAG.of(TARGET_TAG_VALUE) });

  return {
    id: "slot-tag-shorthand-inline",
    group: "slot-selection",
    what: `resolve(token, { tag: [k, v] }) written inline — tagged-index lane plus its literals (codefast-only)`,
    batch: SLOT_RESOLVE_BATCH,
    excludeFromAggregates: true,
    sanity: () =>
      matrixContainer.resolve(taggedServiceToken, { tag: ENV_TAG.of(TARGET_TAG_VALUE) }).env === TARGET_TAG_VALUE,
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        matrixContainer.resolve(taggedServiceToken, { tag: ENV_TAG.of(TARGET_TAG_VALUE) });
      }),
  };
}

// ── Zero-valued tag: the one value the index and the matcher disagree on ─────

interface NumberedService {
  readonly level: number;
}

const numberedServiceToken = token<NumberedService>("bench-cf-slot-numbered-service");
const NUMBERED_LEVELS: ReadonlyArray<number> = [0, 1, 2, 3];
const ZERO_TAGS: ReadonlyArray<BindingTag> = [LEVEL_TAG.of(0)];

function buildZeroValueScenario(): BenchScenario {
  const container = Container.create();

  for (const level of NUMBERED_LEVELS) {
    container.bind(numberedServiceToken).toConstantValue({ level }).whenTagged(LEVEL_TAG.of(level));
  }

  container.resolve(numberedServiceToken, { tags: ZERO_TAGS });

  return {
    id: "slot-tag-zero-value",
    group: "slot-selection",
    what: "resolve(token, { tags: [[k, 0]] }) — the tagged index hit that must be re-checked with Object.is (codefast-only)",
    batch: SLOT_RESOLVE_BATCH,
    excludeFromAggregates: true,
    sanity: () => container.resolve(numberedServiceToken, { tags: ZERO_TAGS }).level === 0,
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        container.resolve(numberedServiceToken, { tags: ZERO_TAGS });
      }),
  };
}

// ── Name + tag: a request no single index can answer ─────────────────────────

const namedTaggedToken = token<TaggedService>("bench-cf-slot-named-tagged-service");
const NAMED_TAG_NAME = "primary";
const NAMED_TAGS: ReadonlyArray<BindingTag> = [ENV_TAG.of(TARGET_TAG_VALUE)];

function buildNameAndTagScenario(): BenchScenario {
  const container = Container.create();

  for (const env of TAGGED_ENVS) {
    container.bind(namedTaggedToken).toConstantValue({ env }).whenNamed(NAMED_TAG_NAME).whenTagged(ENV_TAG.of(env));
  }

  container.resolve(namedTaggedToken, { name: NAMED_TAG_NAME, tags: NAMED_TAGS });

  return {
    id: "slot-name-and-tag",
    group: "slot-selection",
    what: "resolve(token, { name, tags }) — neither the name index nor the tag index can serve it alone (codefast-only)",
    batch: SLOT_RESOLVE_BATCH,
    excludeFromAggregates: true,
    sanity: () =>
      container.resolve(namedTaggedToken, { name: NAMED_TAG_NAME, tags: NAMED_TAGS }).env === TARGET_TAG_VALUE,
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        container.resolve(namedTaggedToken, { name: NAMED_TAG_NAME, tags: NAMED_TAGS });
      }),
  };
}

// ── resolveAll over a tagged token ───────────────────────────────────────────

function buildResolveAllScenario(): BenchScenario {
  const container = buildTaggedContainer();

  container.resolveAll(taggedServiceToken, { tags: HOISTED_TAGS });

  return {
    id: "slot-tag-resolve-all",
    group: "slot-selection",
    what: "resolveAll(token, { tags }) — the tagged index read once per container up the chain (codefast-only)",
    batch: SLOT_RESOLVE_BATCH,
    excludeFromAggregates: true,
    sanity: () => {
      const all = container.resolveAll(taggedServiceToken, { tags: HOISTED_TAGS });

      return all.length === 1 && all[0]?.env === TARGET_TAG_VALUE;
    },
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        container.resolveAll(taggedServiceToken, { tags: HOISTED_TAGS });
      }),
  };
}

// ── Tagged miss: the lane a failed slot request pays ─────────────────────────

const MISSING_TAGS: ReadonlyArray<BindingTag> = [ENV_TAG.of("no-such-env")];

function buildMissOptionalScenario(): BenchScenario {
  const container = buildTaggedContainer();

  container.resolveOptional(taggedServiceToken, { tags: MISSING_TAGS });

  return {
    id: "slot-tag-miss-optional",
    group: "slot-selection",
    what: "resolveOptional(token, { tags }) that matches no slot — the failed lookup over a populated token (codefast-only)",
    batch: SLOT_RESOLVE_BATCH,
    excludeFromAggregates: true,
    // A miss is only a miss if the token really is bound — otherwise the row measures an empty registry.
    sanity: () =>
      container.resolveOptional(taggedServiceToken, { tags: MISSING_TAGS }) === undefined &&
      container.resolveOptional(taggedServiceToken, { tags: HOISTED_TAGS })?.env === TARGET_TAG_VALUE,
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        container.resolveOptional(taggedServiceToken, { tags: MISSING_TAGS });
      }),
  };
}

// ── Parent-owned slot: repeated resolves from a long-lived child ─────────────
//
// The child is built once, outside `batched`, on purpose: these price a warm chain walk against a
// warm memo. A per-request child disposes before a second resolve reaches either — a different
// question, and the resolution internals answer it with different numbers.

const parentTaggedToken = token<TaggedService>("bench-cf-slot-parent-tagged-service");
const parentNamedToken = token<TaggedService>("bench-cf-slot-parent-named-service");

// These two differ only in the criterion — same binding count, same constant, same one options
// object per call — so the gap between them is the lane and nothing else.
function buildTaggedParentOwnedScenario(): BenchScenario {
  const appContainer = Container.create();

  for (const env of TAGGED_ENVS) {
    appContainer.bind(parentTaggedToken).toConstantValue({ env }).whenTagged(ENV_TAG.of(env));
  }
  const longLivedChild = appContainer.createChild();

  longLivedChild.resolve(parentTaggedToken, { tags: HOISTED_TAGS });

  return {
    id: "slot-tag-parent-owned",
    group: "slot-selection",
    what: "resolve(token, { tags }) from a child for a binding the parent owns — the tagged index consulted per container up the chain, unmemoized (codefast-only)",
    batch: SLOT_RESOLVE_BATCH,
    excludeFromAggregates: true,
    // A chain walk only if the child owns nothing under the token — otherwise this is a local hit.
    sanity: () =>
      !longLivedChild.hasOwn(parentTaggedToken) &&
      longLivedChild.resolve(parentTaggedToken, { tags: HOISTED_TAGS }).env === TARGET_TAG_VALUE,
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        longLivedChild.resolve(parentTaggedToken, { tags: HOISTED_TAGS });
      }),
  };
}

function buildNamedParentOwnedScenario(): BenchScenario {
  const appContainer = Container.create();

  for (const env of TAGGED_ENVS) {
    appContainer.bind(parentNamedToken).toConstantValue({ env }).whenNamed(env);
  }
  const longLivedChild = appContainer.createChild();

  longLivedChild.resolve(parentNamedToken, { name: TARGET_TAG_VALUE });

  return {
    id: "slot-name-parent-owned",
    group: "slot-selection",
    what: "resolve(token, { name }) from a child for a binding the parent owns — the tagged row's shape on the memoized named lane (codefast-only)",
    batch: SLOT_RESOLVE_BATCH,
    excludeFromAggregates: true,
    sanity: () =>
      !longLivedChild.hasOwn(parentNamedToken) &&
      longLivedChild.resolve(parentNamedToken, { name: TARGET_TAG_VALUE }).env === TARGET_TAG_VALUE,
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        longLivedChild.resolve(parentNamedToken, { name: TARGET_TAG_VALUE });
      }),
  };
}

// ── Injected slots: the lane every request-side row above misses ─────────────

interface InjectedLeaf {
  readonly id: string;
}

const injectedLeafToken = token<InjectedLeaf>("bench-cf-slot-injected-leaf");
const INJECTED_SLOT_NAMES = ["alpha", "beta", "gamma", "delta"] as const;

@injectable([
  inject(injectedLeafToken, { name: "alpha" }),
  inject(injectedLeafToken, { name: "beta" }),
  inject(injectedLeafToken, { name: "gamma" }),
  inject(injectedLeafToken, { name: "delta" }),
])
class InjectedNamedRoot {
  constructor(
    readonly alpha: InjectedLeaf,
    readonly beta: InjectedLeaf,
    readonly gamma: InjectedLeaf,
    readonly delta: InjectedLeaf,
  ) {}
}

/** An activation hook is the cheapest thing that makes the plan compiler decline a class. */
function buildInjectedNamedContainer(declinePlan: boolean): Container {
  const container = Container.create();

  for (const name of INJECTED_SLOT_NAMES) {
    container.bind(injectedLeafToken).toConstantValue({ id: name }).whenNamed(name);
  }
  const binding = container.bind(InjectedNamedRoot).toSelf().transient();

  if (declinePlan) {
    binding.onActivation((_ctx, instance) => instance);
  }

  return container;
}

function buildInjectedNameCompiledScenario(): BenchScenario {
  const container = buildInjectedNamedContainer(false);

  container.resolve(InjectedNamedRoot);

  return {
    id: "slot-injected-name-compiled",
    group: "slot-selection",
    what: "resolve a class whose four dependencies each request a name — the compiled plan's escape thunks (codefast-only)",
    batch: SLOT_RESOLVE_BATCH,
    excludeFromAggregates: true,
    sanity: () => container.resolve(InjectedNamedRoot).alpha.id === "alpha",
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        container.resolve(InjectedNamedRoot);
      }),
  };
}

function buildInjectedNameInterpretedScenario(): BenchScenario {
  const container = buildInjectedNamedContainer(true);

  container.resolve(InjectedNamedRoot);

  return {
    id: "slot-injected-name-interpreted",
    group: "slot-selection",
    what: "the same four named dependencies with the class's plan declined — the interpreted dependency lane (codefast-only)",
    batch: SLOT_RESOLVE_BATCH,
    excludeFromAggregates: true,
    sanity: () => container.resolve(InjectedNamedRoot).delta.id === "delta",
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        container.resolve(InjectedNamedRoot);
      }),
  };
}

export function buildCodefastSlotSelectionScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildArrayHoistedScenario(),
    buildShorthandHoistedScenario(),
    buildArrayInlineScenario(),
    buildShorthandInlineScenario(),
    buildZeroValueScenario(),
    buildNameAndTagScenario(),
    buildResolveAllScenario(),
    buildMissOptionalScenario(),
    buildTaggedParentOwnedScenario(),
    buildNamedParentOwnedScenario(),
    buildInjectedNameCompiledScenario(),
    buildInjectedNameInterpretedScenario(),
  ];
}
