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
import { injectionSlotToResolveOptions, isNameOnlyOptions } from "#/injection/resolve-options";
import type { ConstructorMetadata } from "#/metadata/metadata-types";

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

/**
 * What compiling one *dependency* can yield.
 *
 * @remarks No `null`: a dependency escapes rather than failing, so "no plan" is only ever a
 * verdict on a plan's root.
 */
type DependencyCompileResult = (() => unknown) | typeof PLAN_RETRY;

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
  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined;
  /** Options-less lookup with alias hops folded; `null` when the fast lane can't answer. */
  lookupDependencyEntry(token: Token<unknown> | Constructor): InstantiationPlanDependencyEntry | null;
  /**
   * A name-only lookup a plan may bake in, or `null` when the answer is not the compiler's to make.
   *
   * @remarks Selection for a named request is an index hit *and* a predicate, and a predicate reads
   * the resolution path — so only a candidate carrying none of one can be decided ahead of time.
   */
  lookupPathIndependentNamedEntry(
    token: Token<unknown> | Constructor,
    options: ResolveOptions & { name: string },
  ): InstantiationPlanDependencyEntry | null;
  /** The frame the interpreted path pushes for this binding, so escapes can replay it. */
  getResolutionFrame(binding: Binding): ResolutionFrame;
  /** Runtime resolve for an escaped dependency, seeded with the ancestors above it. */
  resolveEscaped(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
    arity: EscapeArity,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): unknown;
}

/**
 * Which resolve an escaped dependency replays — mirrors how the interpreted path dispatches
 * a constructor param.
 *
 * @since 0.5.0-canary.8
 */
export type EscapeArity = "all" | "optional" | "single";

/**
 * @since 0.3.16-canary.1
 */
export class InstantiationPlanCompiler {
  readonly #host: InstantiationPlanHost;

  constructor(host: InstantiationPlanHost) {
    this.#host = host;
  }

  compile(binding: Binding & { kind: "class" | "resolved" }): InstantiationPlanCompileResult {
    return binding.kind === "class"
      ? this.#compileClassPlan(binding, new Set(), 0, [])
      : this.#compileResolvedPlan(binding, new Set(), 0, []);
  }

  /**
   * Re-entry into the runtime resolver for a dependency the plan can't see through.
   *
   * The ancestors are fixed at compile time, so the seeds are built once; each call copies
   * them because the resolver pushes and pops on the arrays it is given.
   */
  #compileEscapeThunk(
    token: Token<unknown> | Constructor,
    ancestors: ReadonlyArray<Binding>,
    arity: EscapeArity = "single",
    options?: ResolveOptions,
  ): () => unknown {
    const host = this.#host;
    const frames = ancestors.map((ancestor) => host.getResolutionFrame(ancestor));
    const names = frames.map((frame) => frame.tokenName);
    return () => host.resolveEscaped(token, options, arity, [...names], [...frames]);
  }

  // A resolved binding declares its deps as explicit descriptors — same rules as
  // class params, with the factory call (and its sync-only check) in place of `new`.
  #compileResolvedPlan(
    binding: Binding & { kind: "resolved" },
    compileStack: Set<Binding["id"]>,
    depth: number,
    ancestors: ReadonlyArray<Binding>,
  ): InstantiationPlanCompileResult {
    if (binding.onActivation !== undefined || this.#host.hasActivationHandlers(binding)) {
      return null;
    }
    const factory = binding.factory;
    const tokenDisplayName = tokenName(binding.token);
    const depThunks = new Array<() => unknown>(binding.deps.length);
    const depAncestors = [...ancestors, binding];
    compileStack.add(binding.id);
    try {
      for (let index = 0; index < binding.deps.length; index += 1) {
        const thunk = this.#compileInjectionThunk(binding.deps[index]!, compileStack, depth, depAncestors);
        if (thunk === PLAN_RETRY) {
          return thunk;
        }
        depThunks[index] = thunk;
      }
    } finally {
      compileStack.delete(binding.id);
    }
    return () => {
      const factoryResult = factory(...depThunks.map((thunk) => thunk()));
      if (factoryResult instanceof Promise) {
        throw new AsyncResolutionError(tokenDisplayName);
      }
      return factoryResult;
    };
  }

  /**
   * One dependency of a plan node — a constructor param or a `toResolved` descriptor.
   *
   * @remarks Anything but a plain required single dependency escapes to the runtime path.
   */
  #compileInjectionThunk(
    descriptor: DependencySlot,
    compileStack: Set<Binding["id"]>,
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
      // A name the registry can settle without reading a path is a dependency like any other: it
      // escapes only because it carries a criterion, not because anything about it is opaque.
      if (isNameOnlyOptions(options)) {
        const named = this.#host.lookupPathIndependentNamedEntry(token, options);
        if (named !== null) {
          return this.#compileDepThunk(named, compileStack, depth, ancestors, options);
        }
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
    compileStack: Set<Binding["id"]>,
    depth: number,
    ancestors: ReadonlyArray<Binding>,
  ): InstantiationPlanCompileResult {
    if (binding.onActivation !== undefined || this.#host.hasActivationHandlers(binding)) {
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
      return target.length === 0 ? () => new invokable() : null;
    }
    const params = meta.params;
    if (params.length === 0) {
      return () => new invokable();
    }
    const depThunks = new Array<() => unknown>(params.length);
    const depAncestors = [...ancestors, binding];
    compileStack.add(binding.id);
    try {
      for (let index = 0; index < params.length; index += 1) {
        const thunk = this.#compileInjectionThunk(params[index]!, compileStack, depth, depAncestors);
        if (thunk === PLAN_RETRY) {
          return thunk;
        }
        depThunks[index] = thunk;
      }
    } finally {
      compileStack.delete(binding.id);
    }
    switch (depThunks.length) {
      case 1: {
        const dep0 = depThunks[0]!;
        return () => new invokable(dep0());
      }
      case 2: {
        const dep0 = depThunks[0]!;
        const dep1 = depThunks[1]!;
        return () => new invokable(dep0(), dep1());
      }
      case 3: {
        const dep0 = depThunks[0]!;
        const dep1 = depThunks[1]!;
        const dep2 = depThunks[2]!;
        return () => new invokable(dep0(), dep1(), dep2());
      }
      default:
        return () => new invokable(...depThunks.map((thunk) => thunk()));
    }
  }

  #compileDepThunk(
    entry: InstantiationPlanDependencyEntry,
    compileStack: Set<Binding["id"]>,
    depth: number,
    ancestors: ReadonlyArray<Binding>,
    options?: ResolveOptions,
  ): DependencyCompileResult {
    const { binding } = entry;
    if (binding.kind === "constant" && binding.onActivation === undefined) {
      if (!this.#host.hasActivationHandlers(binding)) {
        const value = binding.value;
        return () => value;
      }
    }
    const scope = binding.scope;
    if (scope === "singleton") {
      // Cached-singleton read; the first materialization escapes so it sees the same ancestors
      // (and therefore the same cycle detection) the interpreted path would have built.
      const escape = this.#compileEscapeThunk(binding.token, ancestors, "single", options);
      const singletonBinding = binding;
      return () => {
        const cached = singletonBinding.instance;
        return cached === NO_INSTANCE ? escape() : cached;
      };
    }
    if (
      scope === "transient" &&
      binding.kind === "class" &&
      depth < PLAN_DEPTH_LIMIT &&
      !compileStack.has(binding.id)
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
}
