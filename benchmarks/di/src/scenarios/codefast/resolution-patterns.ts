/**
 * `@codefast/di` — resolution pattern scenarios.
 *
 * Exercises resolution APIs that have no coverage elsewhere:
 *
 *   - `resolve-optional-hit` — `resolveOptional(token)` when a binding exists.
 *     Returns the resolved value without throwing.  Measures the overhead of the
 *     optional fast-path vs the regular `resolve()` call.
 *
 *   - `resolve-optional-miss` — `resolveOptional(token)` when no binding is
 *     registered.  Returns `undefined` without throwing `TokenNotBoundError`.
 *     Measures the "not found" branch cost — critical for optional dep patterns.
 *
 *   - `tagged-binding-resolve` — `whenTagged(tag, value)` multi-binding selection.
 *     Four variants registered under the same token, each with a different tag
 *     value.  `resolve(token, { tags: [...] })` filters to the matching candidate.
 *     Measures the tag-based slot lookup on the hot path.
 *
 *   - `conditional-injection-tagged` — the same tagged set, but selected by the
 *     *consumer's* tag rather than a call-site hint: a transient consumer declares
 *     `inject(token, { tag })` and resolving it picks the matching binding. This is
 *     the injection-context idiom brandi also expresses (its only conditional form).
 */
import type { BindingTag } from "@codefast/di";
import { Container, inject, injectable, token } from "@codefast/di";

import { ENV_TAG } from "#/fixtures/bench-tags";
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

// ── scenario 1: resolveOptional — hit ────────────────────────────────────────────────────────────────────────────────

const optionalHitToken = token<number>("bench-cf-rp-optional-hit");

function buildResolveOptionalHitScenario(): BenchScenario {
  const container = Container.create();
  container.bind(optionalHitToken).toConstantValue(42);
  container.resolveOptional(optionalHitToken);

  return {
    ...RESOLVE_OPTIONAL_HIT,
    batch: OPTIONAL_HIT_BATCH,
    sanity: () => container.resolveOptional(optionalHitToken) === 42,
    build: () =>
      batched(OPTIONAL_HIT_BATCH, () => {
        container.resolveOptional(optionalHitToken);
      }),
  };
}

// ── scenario 2: resolveOptional — miss ───────────────────────────────────────────────────────────────────────────────

const optionalMissToken = token<string>("bench-cf-rp-optional-miss");

function buildResolveOptionalMissScenario(): BenchScenario {
  const container = Container.create();
  // Intentionally NOT binding the token — miss path returns undefined.
  container.resolveOptional(optionalMissToken);

  return {
    ...RESOLVE_OPTIONAL_MISS,
    batch: OPTIONAL_MISS_BATCH,
    sanity: () => container.resolveOptional(optionalMissToken) === undefined,
    build: () =>
      batched(OPTIONAL_MISS_BATCH, () => {
        container.resolveOptional(optionalMissToken);
      }),
  };
}

// ── scenario 3: whenTagged binding selection ─────────────────────────────────────────────────────────────────────────

interface TaggedService {
  readonly env: string;
}

const taggedServiceToken = token<TaggedService>("bench-cf-rp-tagged-service");

const TARGET_TAGS: ReadonlyArray<BindingTag> = [ENV_TAG.of(TARGET_TAG_VALUE)];

function buildTaggedBindingResolveScenario(): BenchScenario {
  const container = Container.create();

  for (const env of TAGGED_ENVS) {
    container.bind(taggedServiceToken).toConstantValue({ env }).whenTagged(ENV_TAG.of(env));
  }

  container.resolve(taggedServiceToken, { tags: TARGET_TAGS });

  return {
    ...TAGGED_BINDING_RESOLVE,
    batch: TAGGED_RESOLVE_BATCH,
    sanity: () => {
      const result = container.resolve(taggedServiceToken, { tags: TARGET_TAGS });
      return result.env === TARGET_TAG_VALUE;
    },
    build: () =>
      batched(TAGGED_RESOLVE_BATCH, () => {
        container.resolve(taggedServiceToken, { tags: TARGET_TAGS });
      }),
  };
}

// ── scenario 4: conditional injection by consumer tag ────────────────────────────────────────────────────────────────

const conditionalServiceToken = token<TaggedService>("bench-cf-rp-conditional-service");
const conditionalConsumerToken = token<ConditionalConsumer>("bench-cf-rp-conditional-consumer");

@injectable([inject(conditionalServiceToken, { tag: ENV_TAG.of(TARGET_TAG_VALUE) })])
class ConditionalConsumer {
  constructor(readonly service: TaggedService) {}
}

// The tagged-selection axis: the last-bound tag value is the target, the far end of any linear scan.
function buildTaggedResolveSlotsScenario(count: number): BenchScenario {
  const slotsToken = token<TaggedService>(`bench-cf-rp-tagged-slots-${String(count)}`);
  const container = Container.create();
  for (let index = 0; index < count; index++) {
    const env = `env-${String(index)}`;
    container.bind(slotsToken).toConstantValue({ env }).whenTagged(ENV_TAG.of(env));
  }
  const targetEnv = `env-${String(count - 1)}`;
  const target = { tags: [ENV_TAG.of(targetEnv)] } as const;
  container.resolve(slotsToken, target);

  return {
    ...taggedResolveSlotsDescriptor(count),
    batch: TAGGED_RESOLVE_BATCH,
    sanity: () => container.resolve(slotsToken, target).env === targetEnv,
    build: () =>
      batched(TAGGED_RESOLVE_BATCH, () => {
        container.resolve(slotsToken, target);
      }),
  };
}

function buildConditionalInjectionTaggedScenario(): BenchScenario {
  const container = Container.create();

  for (const env of TAGGED_ENVS) {
    container.bind(conditionalServiceToken).toConstantValue({ env }).whenTagged(ENV_TAG.of(env));
  }
  container.bind(conditionalConsumerToken).to(ConditionalConsumer).transient();
  container.resolve(conditionalConsumerToken);

  return {
    ...CONDITIONAL_INJECTION_TAGGED,
    batch: CONDITIONAL_INJECTION_BATCH,
    sanity: () => container.resolve(conditionalConsumerToken).service.env === TARGET_TAG_VALUE,
    build: () =>
      batched(CONDITIONAL_INJECTION_BATCH, () => {
        container.resolve(conditionalConsumerToken);
      }),
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastResolutionPatternScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildResolveOptionalHitScenario(),
    buildResolveOptionalMissScenario(),
    buildTaggedBindingResolveScenario(),
    ...SLOT_COUNTS.map((count) => buildTaggedResolveSlotsScenario(count)),
    buildConditionalInjectionTaggedScenario(),
  ];
}
