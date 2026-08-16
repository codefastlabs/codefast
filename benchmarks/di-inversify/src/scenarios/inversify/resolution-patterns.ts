/**
 * InversifyJS 8 — resolution pattern scenarios. Parallel to
 * {@link ../codefast/resolution-patterns.ts}.
 *
 * Inversify mapping:
 *   - `resolveOptional(token)` → `container.get(id, { optional: true })`
 *     (overloaded `get` returns `T | undefined` when `optional: true`)
 *   - `resolve(token, { tags: [...] })` → `container.get(id, { tag: { key, value } })`
 *     (single-tag shorthand in inversify v8 `GetOptions`)
 */
import "reflect-metadata";
import { Container } from "inversify";

import {
  OPTIONAL_HIT_BATCH,
  OPTIONAL_MISS_BATCH,
  RESOLVE_OPTIONAL_HIT,
  RESOLVE_OPTIONAL_MISS,
  TAGGED_BINDING_RESOLVE,
  TAGGED_ENVS,
  TAGGED_RESOLVE_BATCH,
  TARGET_TAG_VALUE,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

// Hoisted like the codefast side's TARGET_TAGS, so the measured closures allocate alike.
const OPTIONAL_GET = { optional: true } as const;
const TARGET_TAG_GET = { tag: { key: "env", value: TARGET_TAG_VALUE } } as const;

// ── scenario 1: optional get — hit ───────────────────────────────────────────────────────────────────────────────────

const optionalHitId = Symbol("bench-inv-rp-optional-hit");

function buildGetOptionalHitScenario(): BenchScenario {
  const container = new Container({ jitless: false });
  container.bind<number>(optionalHitId).toConstantValue(42);
  container.get<number>(optionalHitId, { optional: true });

  return {
    ...RESOLVE_OPTIONAL_HIT,
    // inversify-specific wording — the shared descriptor supplies the paired id/group
    what: "get(id, { optional: true }) when the binding exists — returns the value without throwing",
    batch: OPTIONAL_HIT_BATCH,
    sanity: () => container.get<number>(optionalHitId, { optional: true }) === 42,
    build: () =>
      batched(OPTIONAL_HIT_BATCH, () => {
        container.get(optionalHitId, OPTIONAL_GET);
      }),
  };
}

// ── scenario 2: optional get — miss ──────────────────────────────────────────────────────────────────────────────────

const optionalMissId = Symbol("bench-inv-rp-optional-miss");

function buildGetOptionalMissScenario(): BenchScenario {
  const container = new Container({ jitless: false });
  // Intentionally NOT binding the identifier — miss path returns undefined.
  container.get<string>(optionalMissId, { optional: true });

  return {
    ...RESOLVE_OPTIONAL_MISS,
    what: "get(id, { optional: true }) when no binding exists — returns undefined without throwing",
    batch: OPTIONAL_MISS_BATCH,
    sanity: () => container.get<string>(optionalMissId, { optional: true }) === undefined,
    build: () =>
      batched(OPTIONAL_MISS_BATCH, () => {
        container.get(optionalMissId, OPTIONAL_GET);
      }),
  };
}

// ── scenario 3: whenTagged binding selection ─────────────────────────────────────────────────────────────────────────

interface TaggedService {
  readonly env: string;
}

const taggedServiceId = Symbol("bench-inv-rp-tagged-service");

function buildTaggedBindingResolveScenario(): BenchScenario {
  const container = new Container({ jitless: false });

  for (const env of TAGGED_ENVS) {
    container.bind<TaggedService>(taggedServiceId).toConstantValue({ env }).whenTagged("env", env);
  }

  container.get<TaggedService>(taggedServiceId, { tag: { key: "env", value: TARGET_TAG_VALUE } });

  return {
    ...TAGGED_BINDING_RESOLVE,
    what: `get(id, { tag: { key:"env", value:"${TARGET_TAG_VALUE}" } }) from ${String(TAGGED_ENVS.length)}-variant tagged set`,
    batch: TAGGED_RESOLVE_BATCH,
    sanity: () => {
      const result = container.get<TaggedService>(taggedServiceId, {
        tag: { key: "env", value: TARGET_TAG_VALUE },
      });
      return result.env === TARGET_TAG_VALUE;
    },
    build: () =>
      batched(TAGGED_RESOLVE_BATCH, () => {
        container.get(taggedServiceId, TARGET_TAG_GET);
      }),
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildInversifyResolutionPatternScenarios(): ReadonlyArray<BenchScenario> {
  return [buildGetOptionalHitScenario(), buildGetOptionalMissScenario(), buildTaggedBindingResolveScenario()];
}
