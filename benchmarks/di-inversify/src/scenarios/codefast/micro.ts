/**
 * @codefast/di — micro-benchmarks. One operation per declared scenario,
 * batched so tinybench's `performance.now()` (μs resolution) sees a
 * workload long enough to be measured meaningfully.
 *
 * Each scenario:
 * - owns its fresh container and tokens,
 * - pre-resolves once in `build()` so the first tinybench sample is already
 *   warm (no one-shot JIT cost polluting percentiles),
 * - declares a `batch` factor matching the inner loop inside `batched()`.
 *
 * The reporter multiplies tinybench `throughput.mean` by `batch` to recover
 * operations per second per *logical* operation — otherwise a batched
 * scenario would appear 1000× faster than the equivalent un-batched one.
 */
import { Container, injectable, token } from "@codefast/di";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const CONSTANT_RESOLVE_BATCH = 1000;
const CLASS_RESOLVE_BATCH = 200;
const NAMED_RESOLVE_BATCH = 500;

@injectable()
class MicroLeafDependency {}

const microLeafDependencyToken = token<MicroLeafDependency>("bench-cf-micro-leaf");
const microServiceWithOneDependencyToken =
  token<MicroServiceWithOneDependency>("bench-cf-micro-svc");

@injectable([microLeafDependencyToken])
class MicroServiceWithOneDependency {
  constructor(readonly leafDependency: MicroLeafDependency) {}
}

/**
 * Reading one constant is the lower bound on what a DI container can do:
 * no factory call, no allocation, no cache miss. This row is where a
 * container's per-resolve *overhead* becomes visible.
 */
function buildConstantResolveScenario(): BenchScenario {
  const constantValueBindingToken = token<number>("bench-cf-micro-constant");
  const container = Container.create();
  container.bind(constantValueBindingToken).toConstantValue(42);
  // Pre-warm so tinybench's first sample isn't the JIT inlining the
  // monomorphic resolve path.
  container.resolve(constantValueBindingToken);

  return {
    id: "constant-resolve",
    group: "micro",
    what: "resolve a toConstantValue binding",
    batch: CONSTANT_RESOLVE_BATCH,
    sanity: () => container.resolve(constantValueBindingToken) === 42,
    build: () =>
      batched(CONSTANT_RESOLVE_BATCH, () => {
        container.resolve(constantValueBindingToken);
      }),
  };
}

/**
 * Singleton class with one constructor dep — after warmup, the resolve
 * just returns the cached instance. Measures hot-path singleton cache hit
 * plus the dep-chain bookkeeping that still runs even on a cache hit.
 */
function buildSingletonClassOneDepScenario(): BenchScenario {
  const container = Container.create();
  container.bind(microLeafDependencyToken).to(MicroLeafDependency).singleton();
  container.bind(microServiceWithOneDependencyToken).to(MicroServiceWithOneDependency).singleton();
  const initialResolution = container.resolve(microServiceWithOneDependencyToken);

  return {
    id: "singleton-class-1-dep",
    group: "micro",
    what: "resolve a singleton class with one dependency (cache hit)",
    batch: CLASS_RESOLVE_BATCH,
    sanity: () =>
      container.resolve(microServiceWithOneDependencyToken).leafDependency ===
      initialResolution.leafDependency,
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.resolve(microServiceWithOneDependencyToken);
      }),
  };
}

/**
 * Transient class with one dep — this path *does* allocate, so it's
 * the most sensitive to factory-closure shape, activation handler
 * dispatch, and GC pressure.
 */
function buildTransientClassOneDepScenario(): BenchScenario {
  const container = Container.create();
  container.bind(microLeafDependencyToken).to(MicroLeafDependency).transient();
  container.bind(microServiceWithOneDependencyToken).to(MicroServiceWithOneDependency).transient();
  container.resolve(microServiceWithOneDependencyToken);

  return {
    id: "transient-class-1-dep",
    group: "micro",
    what: "resolve a transient class with one transient dep (fresh each call)",
    batch: CLASS_RESOLVE_BATCH,
    sanity: () => {
      const firstResolution = container.resolve(microServiceWithOneDependencyToken);
      const secondResolution = container.resolve(microServiceWithOneDependencyToken);
      return (
        firstResolution !== secondResolution &&
        firstResolution.leafDependency !== secondResolution.leafDependency
      );
    },
    build: () =>
      batched(CLASS_RESOLVE_BATCH, () => {
        container.resolve(microServiceWithOneDependencyToken);
      }),
  };
}

/**
 * Named binding: three candidates at the same token, resolve filters by
 * name. Measures the whenNamed predicate + binding-list walk that the
 * no-name path skips.
 */
function buildNamedConstantGetScenario(): BenchScenario {
  const wideNamedBindingToken = token<number>("bench-cf-micro-named");
  const container = Container.create();
  container.bind(wideNamedBindingToken).whenNamed("slot-5").toConstantValue(5);
  container.bind(wideNamedBindingToken).whenNamed("slot-12").toConstantValue(12);
  container.bind(wideNamedBindingToken).whenNamed("slot-20").toConstantValue(20);
  container.resolve(wideNamedBindingToken, { name: "slot-12" });

  return {
    id: "named-constant-get",
    group: "micro",
    what: "resolve a named constant from a 3-candidate set",
    batch: NAMED_RESOLVE_BATCH,
    sanity: () => container.resolve(wideNamedBindingToken, { name: "slot-12" }) === 12,
    build: () =>
      batched(NAMED_RESOLVE_BATCH, () => {
        container.resolve(wideNamedBindingToken, { name: "slot-12" });
      }),
  };
}

export function buildCodefastMicroScenarios(): readonly BenchScenario[] {
  return [
    buildConstantResolveScenario(),
    buildSingletonClassOneDepScenario(),
    buildTransientClassOneDepScenario(),
    buildNamedConstantGetScenario(),
  ];
}
