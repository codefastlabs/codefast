/**
 * Compiles a transient class or resolved-factory binding into a nested-constructor closure.
 *
 * @remarks A dependency the compiler cannot inline escapes to a resolver callback instead; the
 * closure must stay callable for it, which is what bounds what may be inlined.
 */
import type { Binding } from "#/core/binding";
import { NO_INSTANCE } from "#/core/binding";
import type { ConstructorInvocation } from "#/core/constructor-type";
import type { Token } from "#/core/token";
import { tokenName } from "#/core/token";
import type { Constructor, ResolutionFrame, ResolveOptions } from "#/core/types";
import { AsyncResolutionError } from "#/errors/errors";
import type { DependencySlot } from "#/injection/resolve-options";
import { injectionSlotToResolveOptions } from "#/injection/resolve-options";
import type { ConstructorMetadata } from "#/metadata/metadata-types";
import type { PlanNode } from "#/resolution/plan/plan-codegen";
import { generatePlan, isPlanCodegenAvailable, PLAN_CODEGEN_THRESHOLD } from "#/resolution/plan/plan-codegen";

// Past this depth a dependency escapes to the runtime path rather than inlining further —
// compiled closures nest one JS frame per level, and pathological graphs are the runtime's job.
const PLAN_DEPTH_LIMIT = 32;

/**
 * Compilation asked to retry later (class lifecycle metadata not discovered yet).
 *
 * @since 0.5.0-canary.7
 */
export const PLAN_RETRY: unique symbol = Symbol("di:plan-retry");

/**
 * A compiled plan, `null` for "not plannable under the current cache versions",
 * or {@link PLAN_RETRY} when a first runtime resolve must discover metadata first.
 *
 * @since 0.5.0-canary.7
 */
export type InstantiationPlanCompileResult = (() => unknown) | null | typeof PLAN_RETRY;

/** One compiled sync node: the closure that runs it and the shape the code generator renders. */
interface SyncNode {
  readonly run: () => unknown;
  readonly node: PlanNode;
}

/**
 * What compiling one *dependency* can yield.
 *
 * @remarks No `null`: a dependency escapes rather than failing, so "no plan" is only ever a
 * verdict on a plan's root.
 */
type DependencyCompileResult = SyncNode | typeof PLAN_RETRY;

type SyncPlanCompileResult = SyncNode | null | typeof PLAN_RETRY;

/**
 * Whether a compiled async thunk's return needs awaiting: never, at runtime's discretion, or always.
 *
 * @remarks Settled at compile time so a fully synchronous subtree touches no promise, while anything
 * that may yield one routes through `Promise.all` — the interpreted async path awaits every dependency.
 */
type ThunkPromiseShape = "never" | "maybe" | "always";

/** One compiled async dependency: its thunk plus what its return needs from the consumer. */
interface AsyncNodeThunk {
  readonly run: () => unknown;
  readonly promiseShape: ThunkPromiseShape;
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
 * The promise-aware combinator: run every dep thunk, await them together, then apply.
 *
 * @remarks A dep's sync throw becomes that slot's rejection so its siblings still start — the
 * interpreted path starts every sibling before the first rejection propagates, and so does this.
 */
function settleThenApply(
  deps: ReadonlyArray<AsyncNodeThunk>,
  apply: (values: Array<unknown>) => unknown,
): () => Promise<unknown> {
  return () => {
    const pending = new Array<unknown>(deps.length);
    for (let index = 0; index < deps.length; index += 1) {
      try {
        pending[index] = deps[index]!.run();
      } catch (dependencyError) {
        pending[index] = Promise.reject(dependencyError);
      }
    }
    return Promise.all(pending).then(apply);
  };
}

/**
 * A dependency's terminal binding — all a compiled thunk needs.
 *
 * @since 0.5.0-canary.7
 */
export interface InstantiationPlanDependencyEntry {
  readonly binding: Binding;
}

/**
 * Everything the compiler needs from its resolver, expressed as behavior so the
 * compiler stays independently testable and free of resolver internals.
 *
 * @since 0.5.0-canary.7
 */
export interface InstantiationPlanHost {
  /** Owner-aware: container-level hooks belong to the binding's owner, which may be a parent. */
  hasActivationHandlers(binding: Binding): boolean;
  /** Cached postConstruct presence — `undefined` until a runtime resolve discovers it. */
  knownPostConstruct(target: Constructor): boolean | undefined;
  needsActiveContainer(target: Constructor): boolean;
  /**
   * Constructs a class whose accessors resolve during construction, with the container ambient and
   * the binding's frame on the path so an accessor that cycles back is still caught.
   */
  constructWithAccessors(binding: Binding, target: ConstructorInvocation, deps: Array<unknown>): unknown;
  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined;
  /** Options-less lookup with alias hops folded; `null` when the fast lane can't answer. */
  lookupDependencyEntry(token: Token<unknown> | Constructor): InstantiationPlanDependencyEntry | null;
  /**
   * A single-criterion lookup a plan may bake in, or `null` when the answer is not the compiler's
   * to make.
   *
   * @remarks Selection for such a request is an index hit *and* a predicate, and a predicate reads
   * the resolution path — so only a candidate carrying none of one can be decided ahead of time.
   */
  lookupPathIndependentEntry(
    token: Token<unknown> | Constructor,
    options: ResolveOptions,
  ): InstantiationPlanDependencyEntry | null;
  /** The frame the interpreted path pushes for this binding, so escapes can replay it. */
  getResolutionFrame(binding: Binding): ResolutionFrame;
  /** Swaps a plan the host still holds for its successor; a plan the host has since dropped stays dropped. */
  replacePlan(binding: Binding, current: () => unknown, next: () => unknown): void;
  /** Runtime resolve for an escaped dependency, seeded with the ancestor frames above it. */
  resolveEscaped(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
    arity: EscapeArity,
    resolutionStack: Array<ResolutionFrame>,
  ): unknown;
  /** The async counterpart of {@link InstantiationPlanHost.resolveEscaped}, replaying the async dispatch. */
  resolveEscapedAsync(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
    arity: EscapeArity,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<unknown>;
}

/**
 * Which resolve an escaped dependency replays — mirrors how the interpreted path dispatches
 * a constructor param.
 *
 * @since 0.5.0-canary.8
 */
export type EscapeArity = "all" | "optional" | "single";

/**
 * The compiler that flattens a class or resolved binding's dependencies into an instantiation plan.
 *
 * @since 0.3.16-canary.1
 */
export class InstantiationPlanCompiler {
  readonly #host: InstantiationPlanHost;
  #generatedPlanCount = 0;

  constructor(host: InstantiationPlanHost) {
    this.#host = host;
  }

  /** Plans this compiler has generated as functions of their own. */
  get generatedPlanCount(): number {
    return this.#generatedPlanCount;
  }

  compile(binding: Binding & { kind: "class" | "resolved" }): InstantiationPlanCompileResult {
    const compiled =
      binding.kind === "class"
        ? this.#compileClassPlan(binding, new Set(), 0, [])
        : this.#compileResolvedPlan(binding, new Set(), 0, []);
    if (compiled === null || compiled === PLAN_RETRY) {
      return compiled;
    }
    return this.#tiered(binding, compiled);
  }

  /**
   * The closure runs first; a plan that keeps running is generated as a function of its own and
   * takes the closure's place in the host's map, so nothing resolved a few times ever compiles one.
   */
  #tiered(binding: Binding, compiled: SyncNode): () => unknown {
    if (!isPlanCodegenAvailable()) {
      return compiled.run;
    }
    const host = this.#host;
    const closure = compiled.run;
    let runs = 0;
    const plan = (): unknown => {
      runs += 1;
      if (runs === PLAN_CODEGEN_THRESHOLD) {
        const generated = generatePlan(compiled.node);
        if (generated !== null) {
          this.#generatedPlanCount += 1;
        }
        host.replacePlan(binding, plan, generated ?? closure);
      }
      return closure();
    };
    return plan;
  }

  /**
   * Re-entry into the runtime resolver for a dependency the plan can't see through.
   *
   * The ancestors are fixed at compile time, so the seed is built once and lent per call — the
   * root-stack rule one level down: every sync lane pops what it pushes, so the owned array still
   * holds exactly the seed when a call returns. A reentrant call finds it claimed and mints its
   * own copy; a return that did not restore the length hands nothing back, so the next call mints.
   */
  #compileEscapeThunk(
    token: Token<unknown> | Constructor,
    ancestors: ReadonlyArray<Binding>,
    arity: EscapeArity = "single",
    options?: ResolveOptions,
  ): SyncNode {
    const host = this.#host;
    const frames = ancestors.map((ancestor) => host.getResolutionFrame(ancestor));
    const depth = frames.length;
    let owned: Array<ResolutionFrame> | undefined = [...frames];
    const run = (): unknown => {
      const stack = owned ?? [...frames];
      owned = undefined;
      try {
        return host.resolveEscaped(token, options, arity, stack);
      } finally {
        if (stack.length === depth) {
          owned = stack;
        }
      }
    };
    return { run, node: { kind: "thunk", run } };
  }

  // A resolved binding declares its deps as explicit descriptors — same rules as
  // class params, with the factory call (and its sync-only check) in place of `new`.
  #compileResolvedPlan(
    binding: Binding & { kind: "resolved" },
    compileStack: Set<Binding["identifier"]>,
    depth: number,
    ancestors: ReadonlyArray<Binding>,
  ): SyncPlanCompileResult {
    if (binding.activationHook !== undefined || this.#host.hasActivationHandlers(binding)) {
      return null;
    }
    const factory = binding.factory;
    const tokenDisplayName = tokenName(binding.token);
    const deps = new Array<SyncNode>(binding.deps.length);
    const depAncestors = [...ancestors, binding];
    compileStack.add(binding.identifier);
    try {
      for (let index = 0; index < binding.deps.length; index += 1) {
        const dep = this.#compileInjectionThunk(binding.deps[index]!, compileStack, depth, depAncestors);
        if (dep === PLAN_RETRY) {
          return dep;
        }
        deps[index] = dep;
      }
    } finally {
      compileStack.delete(binding.identifier);
    }
    const runs = deps.map((dep) => dep.run);
    const settle = (factoryResult: unknown): unknown => {
      if (factoryResult instanceof Promise) {
        throw new AsyncResolutionError(tokenDisplayName);
      }
      return factoryResult;
    };
    return {
      run: () => settle(factory(...runs.map((run) => run()))),
      node: { kind: "call", factory, settle, deps: deps.map((dep) => dep.node) },
    };
  }

  /**
   * One dependency of a plan node — a constructor param or a `toResolved` descriptor.
   *
   * @remarks Anything but a plain required single dependency escapes to the runtime path.
   */
  #compileInjectionThunk(
    descriptor: DependencySlot,
    compileStack: Set<Binding["identifier"]>,
    depth: number,
    ancestors: ReadonlyArray<Binding>,
  ): DependencyCompileResult {
    const token = descriptor.token;
    const options = injectionSlotToResolveOptions(descriptor);
    if (descriptor.multi) {
      return this.#compileEscapeThunk(token, ancestors, "all", options);
    }
    if (descriptor.optional) {
      return this.#compileEscapeThunk(token, ancestors, "optional", options);
    }
    if (options !== undefined) {
      // A criterion the registry can settle without reading a path is a dependency like any other:
      // it escapes only because the host cannot decide it ahead of time.
      const indexed = this.#host.lookupPathIndependentEntry(token, options);
      if (indexed !== null) {
        return this.#compileDepThunk(indexed, compileStack, depth, ancestors, options);
      }
      return this.#compileEscapeThunk(token, ancestors, "single", options);
    }
    const entry = this.#host.lookupDependencyEntry(token);
    if (entry === null) {
      return this.#compileEscapeThunk(token, ancestors);
    }
    return this.#compileDepThunk(entry, compileStack, depth, ancestors);
  }

  #compileClassPlan(
    binding: Binding & { kind: "class" },
    compileStack: Set<Binding["identifier"]>,
    depth: number,
    ancestors: ReadonlyArray<Binding>,
  ): SyncPlanCompileResult {
    if (binding.activationHook !== undefined || this.#host.hasActivationHandlers(binding)) {
      return null;
    }
    const target = binding.target;
    const hasPostConstruct = this.#host.knownPostConstruct(target);
    if (hasPostConstruct === undefined) {
      return PLAN_RETRY;
    }
    if (hasPostConstruct) {
      return null;
    }
    // An accessor-injected class compiles only as the plan's root: its accessors resolve during
    // construction with the class's own frame on the path, and a root has no static ancestors to replay.
    const withAccessors = this.#host.needsActiveContainer(target);
    if (withAccessors && depth !== 0) {
      return null;
    }
    const invokable = target as ConstructorInvocation;
    const meta = this.#host.getConstructorMetadata(target);
    if (meta === undefined) {
      // Metadata-less classes with required params throw on the runtime path — keep them there.
      if (target.length !== 0) {
        return null;
      }
      return this.#classNode(binding, invokable, withAccessors, []);
    }
    const params = meta.params;
    if (params.length === 0) {
      return this.#classNode(binding, invokable, withAccessors, []);
    }
    const deps = new Array<SyncNode>(params.length);
    const depAncestors = [...ancestors, binding];
    compileStack.add(binding.identifier);
    try {
      for (let index = 0; index < params.length; index += 1) {
        const dep = this.#compileInjectionThunk(params[index]!, compileStack, depth, depAncestors);
        if (dep === PLAN_RETRY) {
          return dep;
        }
        deps[index] = dep;
      }
    } finally {
      compileStack.delete(binding.identifier);
    }
    return this.#classNode(binding, invokable, withAccessors, deps);
  }

  // The closure is hand-written per arity up to three so the common shapes spread nothing.
  #classNode(
    binding: Binding,
    invokable: ConstructorInvocation,
    withAccessors: boolean,
    deps: ReadonlyArray<SyncNode>,
  ): SyncNode {
    const nodes = deps.map((dep) => dep.node);
    if (withAccessors) {
      const host = this.#host;
      const construct = (values: Array<unknown>): unknown => host.constructWithAccessors(binding, invokable, values);
      const runs = deps.map((dep) => dep.run);
      return { run: () => construct(runs.map((run) => run())), node: { kind: "accessors", construct, deps: nodes } };
    }
    const node: PlanNode = { kind: "construct", target: invokable, deps: nodes };
    switch (deps.length) {
      case 0:
        return { run: () => new invokable(), node };
      case 1: {
        const dep0 = deps[0]!.run;
        return { run: () => new invokable(dep0()), node };
      }
      case 2: {
        const dep0 = deps[0]!.run;
        const dep1 = deps[1]!.run;
        return { run: () => new invokable(dep0(), dep1()), node };
      }
      case 3: {
        const dep0 = deps[0]!.run;
        const dep1 = deps[1]!.run;
        const dep2 = deps[2]!.run;
        return { run: () => new invokable(dep0(), dep1(), dep2()), node };
      }
      default: {
        const runs = deps.map((dep) => dep.run);
        return { run: () => new invokable(...runs.map((run) => run())), node };
      }
    }
  }

  #compileDepThunk(
    entry: InstantiationPlanDependencyEntry,
    compileStack: Set<Binding["identifier"]>,
    depth: number,
    ancestors: ReadonlyArray<Binding>,
    options?: ResolveOptions,
  ): DependencyCompileResult {
    const { binding } = entry;
    if (binding.kind === "constant" && binding.activationHook === undefined) {
      if (!this.#host.hasActivationHandlers(binding)) {
        const value = binding.value;
        return { run: () => value, node: { kind: "value", value } };
      }
    }
    const scope = binding.scope;
    if (scope === "singleton") {
      // Cached-singleton read; the first materialization escapes so it sees the same ancestors
      // (and therefore the same cycle detection) the interpreted path would have built.
      const escape = this.#compileEscapeThunk(binding.token, ancestors, "single", options).run;
      const singletonBinding = binding;
      return {
        run: () => {
          const cached = singletonBinding.instance;
          return cached === NO_INSTANCE ? escape() : cached;
        },
        node: { kind: "singleton", binding: singletonBinding, escape },
      };
    }
    if (
      scope === "transient" &&
      binding.kind === "class" &&
      depth < PLAN_DEPTH_LIMIT &&
      !compileStack.has(binding.identifier)
    ) {
      const inlined = this.#compileClassPlan(
        binding as Binding & { kind: "class" },
        compileStack,
        depth + 1,
        ancestors,
      );
      if (inlined !== null) {
        return inlined;
      }
    }
    // Anything opaque — a factory, a scoped binding, an activation hook, a class the compiler
    // declined — runs on the runtime path, seeded with this plan's ancestors.
    return this.#compileEscapeThunk(binding.token, ancestors, "single", options);
  }

  // ── The async lane ─────────────────────────────────────────────────────────────────────────────────────────────────

  /**
   * Compiles a transient binding whose graph is statically visible, for the async entry point.
   *
   * @remarks Same gates as the sync lane; the differences are downstream — escapes replay the async
   * dispatch, and a node whose dependencies may yield promises awaits them together, exactly as the
   * interpreted async path does.
   */
  compileAsync(binding: Binding & { kind: "class" | "resolved" | "resolved-async" }): InstantiationPlanCompileResult {
    const node =
      binding.kind === "class"
        ? this.#compileAsyncClassNode(binding, new Set(), 0, [])
        : this.#compileAsyncResolvedNode(binding, new Set(), 0, []);
    if (node === null || node === PLAN_RETRY) {
      return node;
    }
    return node.run;
  }

  #compileAsyncEscapeThunk(
    token: Token<unknown> | Constructor,
    ancestors: ReadonlyArray<Binding>,
    arity: EscapeArity = "single",
    options?: ResolveOptions,
  ): AsyncNodeThunk {
    const host = this.#host;
    const frames = ancestors.map((ancestor) => host.getResolutionFrame(ancestor));
    return {
      run: () => host.resolveEscapedAsync(token, options, arity, [...frames]),
      promiseShape: "always",
    };
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
    if (meta === undefined) {
      // Metadata-less classes with required params throw on the runtime path — keep them there.
      return target.length === 0 ? { run: () => new invokable(), promiseShape: "never" } : null;
    }
    const params = meta.params;
    if (params.length === 0) {
      return { run: () => new invokable(), promiseShape: "never" };
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
    if (allSynchronous(depThunks)) {
      switch (depThunks.length) {
        case 1: {
          const dep0 = depThunks[0]!.run;
          return { run: () => new invokable(dep0()), promiseShape: "never" };
        }
        case 2: {
          const dep0 = depThunks[0]!.run;
          const dep1 = depThunks[1]!.run;
          return { run: () => new invokable(dep0(), dep1()), promiseShape: "never" };
        }
        default:
          return {
            run: () => new invokable(...depThunks.map((thunk) => thunk.run())),
            promiseShape: "never",
          };
      }
    }
    return { run: settleThenApply(depThunks, (values) => new invokable(...values)), promiseShape: "always" };
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
    if (allSynchronous(depThunks)) {
      return { run: () => factory(...depThunks.map((thunk) => thunk.run())), promiseShape: directShape };
    }
    return { run: settleThenApply(depThunks, (values) => factory(...values)), promiseShape: "always" };
  }

  /** Mirrors {@link InstantiationPlanCompiler.#compileInjectionThunk}, escaping through the async dispatch. */
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
        return { run: () => value, promiseShape: value instanceof Promise ? "always" : "never" };
      }
    }
    const scope = binding.scope;
    if (scope === "singleton") {
      // Cached-singleton read; the cold materialization escapes with the same criteria.
      const escape = this.#compileAsyncEscapeThunk(binding.token, ancestors, "single", options);
      const singletonBinding = binding;
      return {
        run: () => {
          const cached = singletonBinding.instance;
          return cached === NO_INSTANCE ? escape.run() : cached;
        },
        promiseShape: "maybe",
      };
    }
    if (scope === "transient" && depth < PLAN_DEPTH_LIMIT && !compileStack.has(binding.identifier)) {
      let inlined: AsyncNodeThunk | null | typeof PLAN_RETRY = null;
      if (binding.kind === "class") {
        inlined = this.#compileAsyncClassNode(
          binding as Binding & { kind: "class" },
          compileStack,
          depth + 1,
          ancestors,
        );
      } else if (binding.kind === "resolved" || binding.kind === "resolved-async") {
        inlined = this.#compileAsyncResolvedNode(
          binding as Binding & { kind: "resolved" | "resolved-async" },
          compileStack,
          depth + 1,
          ancestors,
        );
      }
      if (inlined !== null) {
        return inlined;
      }
    }
    return this.#compileAsyncEscapeThunk(binding.token, ancestors, "single", options);
  }
}
