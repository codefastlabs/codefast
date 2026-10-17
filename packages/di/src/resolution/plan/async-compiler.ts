/** The plan compiler for the async lane, apart from the sync one so a program that never awaits never ships it. */
import type { Binding } from "#core/binding";
import { NO_INSTANCE } from "#core/binding";
import type { ConstructorInvocation } from "#core/constructor-type";
import type { Token } from "#core/token";
import type { Constructor, ResolutionFrame, ResolveOptions } from "#core/types";
import type { DependencySlot } from "#injection/dependency-slot";
import { injectionSlotToResolveOptions } from "#injection/dependency-slot";
import { settleInOrder } from "#resolution/async-fan-out";
import type { AsyncPlanNode } from "#resolution/plan/async-codegen";
import { generateAsyncPlan } from "#resolution/plan/async-codegen";
import type {
  EscapeArity,
  InstantiationPlanCompileResult,
  InstantiationPlanDependencyEntry,
  InstantiationPlanHost,
} from "#resolution/plan/compiler";
import { PLAN_RETRY, tieredPlan } from "#resolution/plan/compiler";

/**
 * Whether a compiled async thunk's return needs awaiting: never, at runtime's discretion, or always.
 *
 * @remarks Settled at compile time so a fully synchronous subtree touches no promise, while anything
 * that may yield one routes through `Promise.all` — the interpreted async path awaits every dependency.
 */
type ThunkPromiseShape = "never" | "maybe" | "always";

/** One compiled async dependency: its thunk, what its return needs from the consumer, and its shape for the generator. */
interface AsyncNodeThunk {
  readonly run: () => unknown;
  readonly promiseShape: ThunkPromiseShape;
  readonly node: AsyncPlanNode;
}

type AsyncDependencyCompileResult = AsyncNodeThunk | typeof PLAN_RETRY;

function allSynchronous(deps: ReadonlyArray<AsyncNodeThunk>): boolean {
  for (let index = 0; index < deps.length; index += 1) {
    if (deps[index]!.promiseShape !== "never") {
      return false;
    }
  }
  return true;
}

/**
 * The promise-aware combinator: run every dep thunk, settle them together, then apply.
 *
 * @remarks A dep's sync throw becomes that slot's rejection so its siblings still start — the
 * interpreted path starts every sibling before any failure is reported, and so does this; a failure
 * is the first in declaration order, as it is on every other lane.
 */
function settleThenApply(
  deps: ReadonlyArray<AsyncNodeThunk>,
  apply: (values: Array<unknown>) => unknown,
): () => Promise<unknown> {
  if (deps.length === 1) {
    // One dependency has one outcome, so there is nothing to order and no fan-out to settle.
    const only = deps[0]!.run;
    const applyOne = (value: unknown): unknown => apply([value]);
    return () => {
      let pending: unknown;
      try {
        pending = only();
      } catch (dependencyError) {
        pending = Promise.reject(dependencyError);
      }
      return Promise.resolve(pending).then(applyOne);
    };
  }
  return () => {
    const pending = new Array<unknown>(deps.length);
    for (let index = 0; index < deps.length; index += 1) {
      try {
        pending[index] = deps[index]!.run();
      } catch (dependencyError) {
        pending[index] = Promise.reject(dependencyError);
      }
    }
    return settleInOrder(pending, apply);
  };
}

/**
 * Everything the async compiler needs from its lane: the sync host, plus the async plan map and dispatch.
 */
export interface AsyncPlanHost extends InstantiationPlanHost {
  /** Swaps an async plan the host still holds for its successor; a plan the host has since dropped stays dropped. */
  replaceAsyncPlan(binding: Binding, current: () => unknown, next: () => unknown): void;
  /** Runtime resolve for an escaped dependency on the async lane, seeded with the ancestor frames above it. */
  resolveEscapedAsync(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
    arity: EscapeArity,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<unknown>;
}

/**
 * The compiler that flattens a transient binding's statically visible graph into an async instantiation plan.
 */
export class AsyncPlanCompiler {
  readonly #host: AsyncPlanHost;
  #generatedPlanCount = 0;

  constructor(host: AsyncPlanHost) {
    this.#host = host;
  }

  /** Plans this compiler has generated as functions of their own. */
  get generatedPlanCount(): number {
    return this.#generatedPlanCount;
  }

  /**
   * Compiles a transient binding whose graph is statically visible, for the async entry point.
   *
   * @remarks Same gates as the sync lane; the differences are downstream — escapes replay the async
   * dispatch, and a node whose dependencies may yield promises awaits them together, exactly as the
   * interpreted async path does.
   */
  compile(binding: Binding & { kind: "class" | "resolved" | "resolved-async" }): InstantiationPlanCompileResult {
    const node =
      binding.kind === "class"
        ? this.#compileAsyncClassNode(binding, new Set(), 0, [])
        : this.#compileAsyncResolvedNode(binding, new Set(), 0, []);
    if (node === null || node === PLAN_RETRY) {
      return node;
    }
    const host = this.#host;
    return tieredPlan(
      node.run,
      () => generateAsyncPlan(node.node),
      (current, next) => host.replaceAsyncPlan(binding, current, next),
      () => {
        this.#generatedPlanCount += 1;
      },
    );
  }

  #compileAsyncEscapeThunk(
    token: Token<unknown> | Constructor,
    ancestors: ReadonlyArray<Binding>,
    arity: EscapeArity = "single",
    options?: ResolveOptions,
  ): AsyncNodeThunk {
    const host = this.#host;
    const frames = ancestors.map((ancestor) => host.getResolutionFrame(ancestor));
    const run = (): unknown => host.resolveEscapedAsync(token, options, arity, [...frames]);
    return { run, promiseShape: "always", node: { kind: "thunk", run } };
  }

  #compileAsyncClassNode(
    binding: Binding & { kind: "class" },
    compileStack: Set<Binding["identifier"]>,
    depth: number,
    ancestors: ReadonlyArray<Binding>,
  ): AsyncNodeThunk | null | typeof PLAN_RETRY {
    if (binding.activationHook !== undefined || this.#host.hasActivationHandlers(binding)) {
      return null;
    }
    const target = binding.target;
    const hasPostConstruct = this.#host.knownPostConstruct(target);
    if (hasPostConstruct === undefined) {
      return PLAN_RETRY;
    }
    if (hasPostConstruct || this.#host.needsActiveContainer(target)) {
      return null;
    }
    const invokable = target as ConstructorInvocation;
    const meta = this.#host.getConstructorMetadata(target);
    const leaf: AsyncNodeThunk = {
      run: () => new invokable(),
      promiseShape: "never",
      node: { kind: "construct", target: invokable, deps: [], awaits: false },
    };
    if (meta === undefined) {
      // Metadata-less classes with required params throw on the runtime path — keep them there.
      return target.length === 0 ? leaf : null;
    }
    const params = meta.params;
    if (params.length === 0) {
      return leaf;
    }
    const depThunks = new Array<AsyncNodeThunk>(params.length);
    const depAncestors = [...ancestors, binding];
    compileStack.add(binding.identifier);
    try {
      for (let index = 0; index < params.length; index += 1) {
        const thunk = this.#compileAsyncInjectionThunk(params[index]!, compileStack, depth, depAncestors);
        if (thunk === PLAN_RETRY) {
          return thunk;
        }
        depThunks[index] = thunk;
      }
    } finally {
      compileStack.delete(binding.identifier);
    }
    const nodes = depThunks.map((thunk) => thunk.node);
    if (allSynchronous(depThunks)) {
      const node: AsyncPlanNode = { kind: "construct", target: invokable, deps: nodes, awaits: false };
      switch (depThunks.length) {
        case 1: {
          const dep0 = depThunks[0]!.run;
          return { run: () => new invokable(dep0()), promiseShape: "never", node };
        }
        case 2: {
          const dep0 = depThunks[0]!.run;
          const dep1 = depThunks[1]!.run;
          return { run: () => new invokable(dep0(), dep1()), promiseShape: "never", node };
        }
        default:
          return {
            run: () => new invokable(...depThunks.map((thunk) => thunk.run())),
            promiseShape: "never",
            node,
          };
      }
    }
    return {
      run: settleThenApply(depThunks, (values) => new invokable(...values)),
      promiseShape: "always",
      node: { kind: "construct", target: invokable, deps: nodes, awaits: true },
    };
  }

  #compileAsyncResolvedNode(
    binding: Binding & { kind: "resolved" | "resolved-async" },
    compileStack: Set<Binding["identifier"]>,
    depth: number,
    ancestors: ReadonlyArray<Binding>,
  ): AsyncNodeThunk | null | typeof PLAN_RETRY {
    if (binding.activationHook !== undefined || this.#host.hasActivationHandlers(binding)) {
      return null;
    }
    const factory = binding.factory;
    const depThunks = new Array<AsyncNodeThunk>(binding.deps.length);
    const depAncestors = [...ancestors, binding];
    compileStack.add(binding.identifier);
    try {
      for (let index = 0; index < binding.deps.length; index += 1) {
        const thunk = this.#compileAsyncInjectionThunk(binding.deps[index]!, compileStack, depth, depAncestors);
        if (thunk === PLAN_RETRY) {
          return thunk;
        }
        depThunks[index] = thunk;
      }
    } finally {
      compileStack.delete(binding.identifier);
    }
    // A sync-kind factory may still hand back a promise on this path — the async entry awaits it,
    // so the consumer is told to as well.
    const directShape: ThunkPromiseShape = binding.kind === "resolved-async" ? "always" : "maybe";
    const nodes = depThunks.map((thunk) => thunk.node);
    if (allSynchronous(depThunks)) {
      return {
        run: () => factory(...depThunks.map((thunk) => thunk.run())),
        promiseShape: directShape,
        node: { kind: "call", factory, deps: nodes, awaits: false },
      };
    }
    return {
      run: settleThenApply(depThunks, (values) => factory(...values)),
      promiseShape: "always",
      node: { kind: "call", factory, deps: nodes, awaits: true },
    };
  }

  /** Mirrors the sync compiler's injection thunk, escaping through the async dispatch. */
  #compileAsyncInjectionThunk(
    descriptor: DependencySlot,
    compileStack: Set<Binding["identifier"]>,
    depth: number,
    ancestors: ReadonlyArray<Binding>,
  ): AsyncDependencyCompileResult {
    const token = descriptor.token;
    const options = injectionSlotToResolveOptions(descriptor);
    if (descriptor.multi) {
      return this.#compileAsyncEscapeThunk(token, ancestors, "all", options);
    }
    if (descriptor.optional) {
      return this.#compileAsyncEscapeThunk(token, ancestors, "optional", options);
    }
    if (options !== undefined) {
      const indexed = this.#host.lookupPathIndependentEntry(token, options);
      if (indexed !== null) {
        return this.#compileAsyncDepThunk(indexed, compileStack, depth, ancestors, options);
      }
      return this.#compileAsyncEscapeThunk(token, ancestors, "single", options);
    }
    const entry = this.#host.lookupDependencyEntry(token);
    if (entry === null) {
      return this.#compileAsyncEscapeThunk(token, ancestors);
    }
    return this.#compileAsyncDepThunk(entry, compileStack, depth, ancestors);
  }

  #compileAsyncDepThunk(
    entry: InstantiationPlanDependencyEntry,
    compileStack: Set<Binding["identifier"]>,
    depth: number,
    ancestors: ReadonlyArray<Binding>,
    options?: ResolveOptions,
  ): AsyncDependencyCompileResult {
    const { binding } = entry;
    if (binding.kind === "constant" && binding.activationHook === undefined) {
      if (!this.#host.hasActivationHandlers(binding)) {
        const value = binding.value;
        // The interpreted path funnels every dependency through an await, which unwraps a
        // promise-valued constant — so one compiles as needing that same await.
        return {
          run: () => value,
          promiseShape: value instanceof Promise ? "always" : "never",
          node: { kind: "value", value },
        };
      }
    }
    const scope = binding.scope;
    if (scope === "singleton") {
      // Cached-singleton read; the cold materialization escapes with the same criteria.
      const escape = this.#compileAsyncEscapeThunk(binding.token, ancestors, "single", options).run;
      const singletonBinding = binding;
      return {
        run: () => {
          const cached = singletonBinding.instance;
          return cached === NO_INSTANCE ? escape() : cached;
        },
        promiseShape: "maybe",
        node: { kind: "singleton", binding: singletonBinding, escape },
      };
    }
    if (scope === "transient" && !compileStack.has(binding.identifier)) {
      let inlined: AsyncNodeThunk | null | typeof PLAN_RETRY = null;
      if (binding.kind === "class") {
        inlined = this.#compileAsyncClassNode(binding, compileStack, depth + 1, ancestors);
      } else if (binding.kind === "resolved" || binding.kind === "resolved-async") {
        inlined = this.#compileAsyncResolvedNode(binding, compileStack, depth + 1, ancestors);
      }
      if (inlined !== null) {
        return inlined;
      }
    }
    return this.#compileAsyncEscapeThunk(binding.token, ancestors, "single", options);
  }
}
