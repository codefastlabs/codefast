/**
 * @codefast/di — slot-selection lanes (codefast-only, paired-A/B instrumentation).
 *
 * These rows exist to make `#findBinding`'s slot lanes measurable before anything changes them.
 * They are **not** competitive rows: every one carries `excludeFromAggregates` so that promoting
 * one to a head-to-head pair later is a deliberate act rather than a silent geomean shift.
 *
 * The first four form a 2×2 over (request form × where the tag literal lives), which is what
 * separates two costs the existing `tagged-binding-resolve` row cannot tell apart:
 *
 *                        hoisted literal        inline literal
 *   { tags: [pair] }     slot-tag-array-hoisted     slot-tag-array-inline
 *   { tag: pair }        slot-tag-shorthand-hoisted slot-tag-shorthand-inline
 *
 *   - across a row  → the lane: `{ tags: [pair] }` reaches the registry's tagged index,
 *     `{ tag: pair }` does not and falls through to full candidate selection.
 *   - down a column → the allocation: an inline `{ tags: [[k, v]] }` mints an options object,
 *     an outer array and the pair; `{ tag: [k, v] }` mints one fewer. Whether V8's escape
 *     analysis elides any of it is part of what the row answers.
 *
 * The remaining four cover slot lanes with no measurement at all today: the zero-valued tag that
 * forces the index's `Object.is` re-check, a name+tag request that no index can serve, `resolveAll`
 * over a tagged token, and a tagged miss walking to a parentless container.
 */
import { Container, token } from "@codefast/di";

import { TAGGED_ENVS, TARGET_TAG_VALUE } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const SLOT_RESOLVE_BATCH = 300;

interface TaggedService {
  readonly env: string;
}

const taggedServiceToken = token<TaggedService>("bench-cf-slot-tagged-service");

/** Hoisted so the hoisted rows allocate only the options object per call. */
const HOISTED_PAIR: readonly [string, unknown] = ["env", TARGET_TAG_VALUE];
const HOISTED_TAGS: ReadonlyArray<readonly [string, unknown]> = [HOISTED_PAIR];

/** The same four-variant tagged set `tagged-binding-resolve` uses, so the rows stay comparable. */
function buildTaggedContainer(): Container {
  const container = Container.create();

  for (const env of TAGGED_ENVS) {
    container.bind(taggedServiceToken).toConstantValue({ env }).whenTagged("env", env);
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
    what: `resolve(token, { tag }) with the pair hoisted — full-selection lane (codefast-only)`,
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
  matrixContainer.resolve(taggedServiceToken, { tags: [["env", TARGET_TAG_VALUE]] });

  return {
    id: "slot-tag-array-inline",
    group: "slot-selection",
    what: `resolve(token, { tags: [[k, v]] }) written inline — tagged-index lane plus its literals (codefast-only)`,
    batch: SLOT_RESOLVE_BATCH,
    excludeFromAggregates: true,
    sanity: () =>
      matrixContainer.resolve(taggedServiceToken, { tags: [["env", TARGET_TAG_VALUE]] }).env === TARGET_TAG_VALUE,
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        matrixContainer.resolve(taggedServiceToken, { tags: [["env", TARGET_TAG_VALUE]] });
      }),
  };
}

function buildShorthandInlineScenario(): BenchScenario {
  matrixContainer.resolve(taggedServiceToken, { tag: ["env", TARGET_TAG_VALUE] });

  return {
    id: "slot-tag-shorthand-inline",
    group: "slot-selection",
    what: `resolve(token, { tag: [k, v] }) written inline — full-selection lane plus its literals (codefast-only)`,
    batch: SLOT_RESOLVE_BATCH,
    excludeFromAggregates: true,
    sanity: () =>
      matrixContainer.resolve(taggedServiceToken, { tag: ["env", TARGET_TAG_VALUE] }).env === TARGET_TAG_VALUE,
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        matrixContainer.resolve(taggedServiceToken, { tag: ["env", TARGET_TAG_VALUE] });
      }),
  };
}

// ── Zero-valued tag: the one value the index and the matcher disagree on ─────

interface NumberedService {
  readonly level: number;
}

const numberedServiceToken = token<NumberedService>("bench-cf-slot-numbered-service");
const NUMBERED_LEVELS: ReadonlyArray<number> = [0, 1, 2, 3];
const ZERO_TAGS: ReadonlyArray<readonly [string, unknown]> = [["level", 0]];

function buildZeroValueScenario(): BenchScenario {
  const container = Container.create();

  for (const level of NUMBERED_LEVELS) {
    container.bind(numberedServiceToken).toConstantValue({ level }).whenTagged("level", level);
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
const NAMED_TAGS: ReadonlyArray<readonly [string, unknown]> = [["env", TARGET_TAG_VALUE]];

function buildNameAndTagScenario(): BenchScenario {
  const container = Container.create();

  for (const env of TAGGED_ENVS) {
    container.bind(namedTaggedToken).toConstantValue({ env }).whenNamed(NAMED_TAG_NAME).whenTagged("env", env);
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
    what: "resolveAll(token, { tags }) — candidate selection rather than the single-binding index (codefast-only)",
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

const MISSING_TAGS: ReadonlyArray<readonly [string, unknown]> = [["env", "no-such-env"]];

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
  ];
}
