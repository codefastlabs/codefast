/**
 * Compiler for the resolver's Dagger-style instantiation plans: a transient class or
 * resolved-factory binding compiles once into a nested-constructor/factory closure whose
 * static subgraph (class/constant/cached-singleton deps) is cycle-checked at compile time
 * and therefore executes with no per-resolve bookkeeping at all.
 *
 * A dependency the compiler cannot see through — a factory, a scoped binding, an activation
 * hook, a class past the depth limit — does not sink the plan. It compiles to an *escape*:
 * a re-entry into the runtime resolver seeded with the ancestors the interpreted path would
 * have pushed by that point, so cycle detection, constraint contexts and error paths are
 * identical to never having compiled at all. Only the opaque dep pays the runtime price;
 * its siblings and ancestors stay compiled.
 *
 * Compilation is cold-path — it runs once per (binding, cache version). The closures it
 * returns ARE the hot path and touch nothing but their captures.
 */
import type { Binding } from "#/binding";
import type { ConstructorInvocation } from "#/constructor-type";
import type { InjectionDescriptor } from "#/decorators/inject";
import { AsyncResolutionError } from "#/errors";
import type { ConstructorMetadata } from "#/metadata/metadata-types";
import { injectionSlotToResolveOptions } from "#/resolution/resolve-options";
import type { ScopeManager } from "#/resolution/scope";
import { SINGLETON_MISS } from "#/resolution/scope";
import type { Token } from "#/token";
import { tokenName } from "#/token";
import type { BindingScope, Constructor, ResolutionFrame, ResolveOptions } from "#/types";

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
 * A dependency's terminal binding plus the scope cache of the resolver that owns it.
 *
 * @since 0.5.0-canary.7
 */
export interface InstantiationPlanDependencyEntry {
  readonly binding: Binding;
  readonly ownerScope: ScopeManager;
}

/**
 * Everything the compiler needs from its resolver, expressed as behavior so the
 * compiler stays independently testable and free of resolver internals.
 *
 * @since 0.5.0-canary.7
 */
export interface InstantiationPlanHost {
  hasActivationHandlers(token: Token<unknown> | Constructor): boolean;
  /** Cached postConstruct presence — `undefined` until a runtime resolve discovers it. */
  knownPostConstruct(target: Constructor): boolean | undefined;
  needsActiveContainer(target: Constructor): boolean;
  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined;
  /** Options-less lookup with alias hops folded; `null` when the fast lane can't answer. */
  lookupDependencyEntry(token: Token<unknown> | Constructor): InstantiationPlanDependencyEntry | null;
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
 * @since 0.5.0-canary.7
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
    if (binding.onActivation !== undefined || this.#host.hasActivationHandlers(binding.token)) {
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
        if (thunk === null || thunk === PLAN_RETRY) {
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
        throw new AsyncResolutionError(tokenDisplayName, tokenDisplayName);
      }
      return factoryResult;
    };
  }

  /**
   * One dependency of a plan node — a class constructor param or a `toResolved` descriptor.
   *
   * Anything but a plain single required dependency (multi, optional, name/tag-constrained,
   * or a token needing full binding selection) escapes with the exact resolve the interpreter
   * would have called for it.
   */
  #compileInjectionThunk(
    descriptor: InjectionDescriptor,
    compileStack: Set<Binding["id"]>,
    depth: number,
    ancestors: ReadonlyArray<Binding>,
  ): InstantiationPlanCompileResult {
    const token = descriptor.token as Token<unknown> | Constructor;
    const options = injectionSlotToResolveOptions(descriptor);
    if (descriptor.multi) {
      return this.#compileEscapeThunk(token, ancestors, "all", options);
    }
    if (descriptor.optional) {
      return this.#compileEscapeThunk(token, ancestors, "optional", options);
    }
    if (options !== undefined) {
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
    if (binding.onActivation !== undefined || this.#host.hasActivationHandlers(binding.token)) {
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
        if (thunk === null || thunk === PLAN_RETRY) {
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
  ): InstantiationPlanCompileResult {
    const { binding, ownerScope } = entry;
    if (binding.kind === "constant" && binding.onActivation === undefined) {
      if (!this.#host.hasActivationHandlers(binding.token)) {
        const value = binding.value;
        return () => value;
      }
    }
    const scope = (binding as Binding & { scope: BindingScope }).scope ?? "transient";
    if (scope === "singleton") {
      // Cached-singleton read; the first materialization escapes so it sees the same ancestors
      // (and therefore the same cycle detection) the interpreted path would have built.
      const escape = this.#compileEscapeThunk(binding.token, ancestors);
      const bindingId = binding.id;
      return () => {
        const cachedSingleton = ownerScope.peekSingleton(bindingId);
        return cachedSingleton === SINGLETON_MISS ? escape() : cachedSingleton;
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
    return this.#compileEscapeThunk(binding.token, ancestors);
  }
}
