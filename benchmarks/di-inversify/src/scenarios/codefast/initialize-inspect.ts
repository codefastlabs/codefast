/**
 * @codefast/di — initialization and introspection scenarios (codefast-only).
 *
 * These APIs have no InversifyJS equivalent, so the comparison table shows "—"
 * on the inversify column.  They still provide useful regression protection for
 * the codefast-specific code paths.
 *
 *   - `initialize-async-warmup` — `container.initializeAsync()` resolves and
 *     caches all singleton bindings eagerly.  Each iteration: fresh container +
 *     4 async-singleton bindings + `initializeAsync()`.  Measures the warm-up
 *     cost before serving the first request — the "fail fast at startup" pattern.
 *
 *   - `inspect-snapshot` — `container.inspect()` returns a `ContainerSnapshot`
 *     of all bindings in the container.  Each call on a fixed 10-binding
 *     registry represents the introspection cost for dev-tools, health checks,
 *     or dynamic dependency graph rendering.
 *
 *   - `lookup-bindings` — `container.lookupBindings(token)` returns the
 *     `BindingSnapshot[]` for a single token without building a full snapshot.
 *     Faster than `inspect()` when only one token's metadata is needed.
 */
import { Container, token } from "@codefast/di";
import { batched } from "#/harness/batched";
import type { AsyncBenchScenario, BenchScenario } from "#/scenarios/types";

// ─── scenario 1: initializeAsync warm-up ─────────────────────────────────────

const ASYNC_SINGLETON_COUNT = 4;

function buildInitializeAsyncWarmupScenario(): AsyncBenchScenario {
  const tokens = Array.from({ length: ASYNC_SINGLETON_COUNT }, (_v, i) =>
    token<number>(`bench-cf-ii-async-${String(i)}`),
  );

  async function runOneColdStart(): Promise<void> {
    const container = Container.create();
    for (const [index, tok] of tokens.entries()) {
      container
        .bind(tok)
        .toDynamicAsync(async () => {
          await Promise.resolve();
          return index;
        })
        .singleton();
    }
    await container.initializeAsync();
  }

  return {
    id: "initialize-async-warmup",
    kind: "async",
    group: "boot",
    what: `fresh container + ${String(ASYNC_SINGLETON_COUNT)} async singletons + initializeAsync() (codefast-only)`,
    batch: 1,
    sanity: async () => {
      await runOneColdStart();
      return true;
    },
    build: () => runOneColdStart,
  };
}

// ─── scenario 2: inspect snapshot ────────────────────────────────────────────

const INSPECT_BINDING_COUNT = 10;
const INSPECT_BATCH = 20;

const inspectTokens = Array.from({ length: INSPECT_BINDING_COUNT }, (_v, i) =>
  token<number>(`bench-cf-ii-inspect-${String(i)}`),
);

function buildInspectSnapshotScenario(): BenchScenario {
  const container = Container.create();
  for (const [index, tok] of inspectTokens.entries()) {
    container.bind(tok).toConstantValue(index);
  }

  // Pre-warm
  container.inspect();

  return {
    id: "inspect-snapshot",
    group: "introspection",
    what: `container.inspect() over ${String(INSPECT_BINDING_COUNT)}-binding registry → full ContainerSnapshot (codefast-only)`,
    batch: INSPECT_BATCH,
    sanity: () => {
      const snapshot = container.inspect();
      return snapshot.bindings.length === INSPECT_BINDING_COUNT;
    },
    build: () =>
      batched(INSPECT_BATCH, () => {
        container.inspect();
      }),
  };
}

// ─── scenario 3: lookupBindings single token ─────────────────────────────────

const LOOKUP_BATCH = 200;

const lookupMultiToken = token<string>("bench-cf-ii-lookup-multi");

function buildLookupBindingsScenario(): BenchScenario {
  const container = Container.create();
  const VARIANT_COUNT = 4;
  for (let i = 0; i < VARIANT_COUNT; i++) {
    container
      .bind(lookupMultiToken)
      .toConstantValue(`v${String(i)}`)
      .whenNamed(`slot-${String(i)}`);
  }

  // Pre-warm
  container.lookupBindings(lookupMultiToken);

  return {
    id: "lookup-bindings",
    group: "introspection",
    what: `container.lookupBindings(token) returning ${String(VARIANT_COUNT)} BindingSnapshot entries (codefast-only)`,
    batch: LOOKUP_BATCH,
    sanity: () => {
      const result = container.lookupBindings(lookupMultiToken);
      return result.length === VARIANT_COUNT;
    },
    build: () =>
      batched(LOOKUP_BATCH, () => {
        container.lookupBindings(lookupMultiToken);
      }),
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastInitializeInspectScenarios(): ReadonlyArray<
  AsyncBenchScenario | BenchScenario
> {
  return [
    buildInitializeAsyncWarmupScenario(),
    buildInspectSnapshotScenario(),
    buildLookupBindingsScenario(),
  ];
}
