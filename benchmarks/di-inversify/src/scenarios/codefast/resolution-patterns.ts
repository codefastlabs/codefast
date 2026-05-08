/**
 * @codefast/di — resolution pattern scenarios.
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
 */
import { Container, token } from "@codefast/di";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

// ─── scenario 1: resolveOptional — hit ───────────────────────────────────────

const OPTIONAL_HIT_BATCH = 500;

const optionalHitToken = token<number>("bench-cf-rp-optional-hit");

function buildResolveOptionalHitScenario(): BenchScenario {
  const container = Container.create();
  container.bind(optionalHitToken).toConstantValue(42);
  container.resolveOptional(optionalHitToken);

  return {
    id: "resolve-optional-hit",
    group: "micro",
    what: "resolveOptional() when the binding exists — returns the value without throwing",
    batch: OPTIONAL_HIT_BATCH,
    sanity: () => container.resolveOptional(optionalHitToken) === 42,
    build: () =>
      batched(OPTIONAL_HIT_BATCH, () => {
        container.resolveOptional(optionalHitToken);
      }),
  };
}

// ─── scenario 2: resolveOptional — miss ──────────────────────────────────────

const OPTIONAL_MISS_BATCH = 500;

const optionalMissToken = token<string>("bench-cf-rp-optional-miss");

function buildResolveOptionalMissScenario(): BenchScenario {
  const container = Container.create();
  // Intentionally NOT binding the token — miss path returns undefined.
  container.resolveOptional(optionalMissToken);

  return {
    id: "resolve-optional-miss",
    group: "micro",
    what: "resolveOptional() when no binding exists — returns undefined without throwing",
    batch: OPTIONAL_MISS_BATCH,
    sanity: () => container.resolveOptional(optionalMissToken) === undefined,
    build: () =>
      batched(OPTIONAL_MISS_BATCH, () => {
        container.resolveOptional(optionalMissToken);
      }),
  };
}

// ─── scenario 3: whenTagged binding selection ────────────────────────────────

const TAGGED_RESOLVE_BATCH = 300;

interface TaggedService {
  readonly env: string;
}

const taggedServiceToken = token<TaggedService>("bench-cf-rp-tagged-service");

const TAGGED_ENVS = ["dev", "staging", "prod", "canary"] as const;
const TARGET_TAG_VALUE = "prod";
const TARGET_TAGS: ReadonlyArray<readonly [string, unknown]> = [["env", TARGET_TAG_VALUE]];

function buildTaggedBindingResolveScenario(): BenchScenario {
  const container = Container.create();

  for (const env of TAGGED_ENVS) {
    container.bind(taggedServiceToken).toConstantValue({ env }).whenTagged("env", env);
  }

  container.resolve(taggedServiceToken, { tags: TARGET_TAGS });

  return {
    id: "tagged-binding-resolve",
    group: "micro",
    what: `resolve(token, { tags: [["env","${TARGET_TAG_VALUE}"]] }) from ${String(TAGGED_ENVS.length)}-variant tagged set`,
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

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastResolutionPatternScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildResolveOptionalHitScenario(),
    buildResolveOptionalMissScenario(),
    buildTaggedBindingResolveScenario(),
  ];
}
