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
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

// ─── scenario 1: optional get — hit ──────────────────────────────────────────

const OPTIONAL_HIT_BATCH = 500;

const optionalHitId = Symbol("bench-inv-rp-optional-hit");

function buildGetOptionalHitScenario(): BenchScenario {
  const container = new Container();
  container.bind<number>(optionalHitId).toConstantValue(42);
  container.get<number>(optionalHitId, { optional: true });

  return {
    id: "resolve-optional-hit",
    group: "micro",
    what: "get(id, { optional: true }) when the binding exists — returns the value without throwing",
    batch: OPTIONAL_HIT_BATCH,
    sanity: () => container.get<number>(optionalHitId, { optional: true }) === 42,
    build: () =>
      batched(OPTIONAL_HIT_BATCH, () => {
        container.get(optionalHitId, { optional: true });
      }),
  };
}

// ─── scenario 2: optional get — miss ─────────────────────────────────────────

const OPTIONAL_MISS_BATCH = 500;

const optionalMissId = Symbol("bench-inv-rp-optional-miss");

function buildGetOptionalMissScenario(): BenchScenario {
  const container = new Container();
  // Intentionally NOT binding the identifier — miss path returns undefined.
  container.get<string>(optionalMissId, { optional: true });

  return {
    id: "resolve-optional-miss",
    group: "micro",
    what: "get(id, { optional: true }) when no binding exists — returns undefined without throwing",
    batch: OPTIONAL_MISS_BATCH,
    sanity: () => container.get<string>(optionalMissId, { optional: true }) === undefined,
    build: () =>
      batched(OPTIONAL_MISS_BATCH, () => {
        container.get(optionalMissId, { optional: true });
      }),
  };
}

// ─── scenario 3: whenTagged binding selection ────────────────────────────────

const TAGGED_RESOLVE_BATCH = 300;

interface TaggedService {
  readonly env: string;
}

const taggedServiceId = Symbol("bench-inv-rp-tagged-service");

const TAGGED_ENVS = ["dev", "staging", "prod", "canary"] as const;
const TARGET_TAG_VALUE = "prod";

function buildTaggedBindingResolveScenario(): BenchScenario {
  const container = new Container();

  for (const env of TAGGED_ENVS) {
    container.bind<TaggedService>(taggedServiceId).toConstantValue({ env }).whenTagged("env", env);
  }

  container.get<TaggedService>(taggedServiceId, { tag: { key: "env", value: TARGET_TAG_VALUE } });

  return {
    id: "tagged-binding-resolve",
    group: "micro",
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
        container.get(taggedServiceId, { tag: { key: "env", value: TARGET_TAG_VALUE } });
      }),
  };
}

export function buildInversifyResolutionPatternScenarios(): readonly BenchScenario[] {
  return [
    buildGetOptionalHitScenario(),
    buildGetOptionalMissScenario(),
    buildTaggedBindingResolveScenario(),
  ];
}
