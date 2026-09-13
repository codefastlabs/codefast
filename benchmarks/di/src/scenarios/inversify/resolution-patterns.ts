/**
 * InversifyJS 8 — resolution pattern scenarios. Parallel to
 * `../codefast/resolution-patterns.ts`.
 *
 * Inversify mapping:
 *   - `resolveOptional(token)` → `container.get(id, { optional: true })`
 *     (overloaded `get` returns `T | undefined` when `optional: true`)
 *   - `resolve(token, { tags: [...] })` → `container.get(id, { tag: { key, value } })`
 *     (single-tag shorthand in inversify v8 `GetOptions`)
 */
import "reflect-metadata";
import { Container, inject, injectable, tagged } from "inversify";

import {
  CONDITIONAL_INJECTION_BATCH,
  CONDITIONAL_INJECTION_TAGGED,
  OPTIONAL_HIT_BATCH,
  OPTIONAL_MISS_BATCH,
  RESOLVE_OPTIONAL_HIT,
  RESOLVE_OPTIONAL_MISS,
  SLOT_COUNTS,
  TAGGED_BINDING_RESOLVE,
  TAGGED_ENVS,
  TAGGED_RESOLVE_BATCH,
  taggedResolveSlotsDescriptor,
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

const conditionalServiceId = Symbol("bench-inv-rp-conditional-service");
const conditionalConsumerId = Symbol("bench-inv-rp-conditional-consumer");

@injectable()
class ConditionalConsumer {
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(conditionalServiceId)
    // @ts-ignore reflect-metadata + explicit token injection
    @tagged("env", TARGET_TAG_VALUE)
    readonly service: TaggedService,
  ) {}
}

function buildConditionalInjectionTaggedScenario(): BenchScenario {
  const container = new Container({ jitless: false });
  for (const env of TAGGED_ENVS) {
    container.bind<TaggedService>(conditionalServiceId).toConstantValue({ env }).whenTagged("env", env);
  }
  container.bind<ConditionalConsumer>(conditionalConsumerId).to(ConditionalConsumer).inTransientScope();
  container.get(conditionalConsumerId);

  return {
    ...CONDITIONAL_INJECTION_TAGGED,
    what: `get() a transient consumer whose @tagged parameter selects its binding (1 of ${String(TAGGED_ENVS.length)})`,
    batch: CONDITIONAL_INJECTION_BATCH,
    sanity: () => container.get<ConditionalConsumer>(conditionalConsumerId).service.env === TARGET_TAG_VALUE,
    build: () =>
      batched(CONDITIONAL_INJECTION_BATCH, () => {
        container.get(conditionalConsumerId);
      }),
  };
}

// The tagged-selection axis: the last-bound tag value is the target, the far end of any linear scan.
function buildTaggedResolveSlotsScenario(count: number): BenchScenario {
  const slotsIdentifier = Symbol(`bench-inv-rp-tagged-slots-${String(count)}`);
  const container = new Container({ jitless: false });
  for (let index = 0; index < count; index++) {
    const env = `env-${String(index)}`;
    container.bind<TaggedService>(slotsIdentifier).toConstantValue({ env }).whenTagged("env", env);
  }
  const targetEnv = `env-${String(count - 1)}`;
  const target = { tag: { key: "env", value: targetEnv } } as const;
  container.get<TaggedService>(slotsIdentifier, target);

  return {
    ...taggedResolveSlotsDescriptor(count),
    what: `get() one tagged constant out of ${String(count)} whenTagged() bindings on one identifier`,
    batch: TAGGED_RESOLVE_BATCH,
    sanity: () => container.get<TaggedService>(slotsIdentifier, target).env === targetEnv,
    build: () =>
      batched(TAGGED_RESOLVE_BATCH, () => {
        container.get(slotsIdentifier, target);
      }),
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildInversifyResolutionPatternScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildGetOptionalHitScenario(),
    buildGetOptionalMissScenario(),
    buildTaggedBindingResolveScenario(),
    ...SLOT_COUNTS.map((count) => buildTaggedResolveSlotsScenario(count)),
    buildConditionalInjectionTaggedScenario(),
  ];
}
