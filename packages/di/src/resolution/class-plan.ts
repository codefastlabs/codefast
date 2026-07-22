/**
 * Compiler for the resolver's Dagger-style class plans: a transient class
 * binding whose dependency subgraph is pure static (class/constant/
 * cached-singleton deps, no activation hooks or postConstruct) compiles once
 * into a nested-constructor closure, cycle-checked at compile time.
 *
 * Compilation is cold-path — it runs once per (binding, cache version). The
 * closures it returns ARE the hot path and touch nothing but their captures.
 * Anything dynamic refuses to compile so the runtime cycle guard stays in
 * charge and error semantics never change.
 */
import type { Binding } from "#/binding";
import type { ConstructorInvocation } from "#/constructor-type";
import type { ConstructorMetadata } from "#/metadata/metadata-types";
import { injectionSlotToResolveOptions } from "#/resolution/resolve-options";
import type { ScopeManager } from "#/resolution/scope";
import { SINGLETON_MISS } from "#/resolution/scope";
import type { Token } from "#/token";
import type { BindingScope, Constructor } from "#/types";

// Bail out of pathological graphs — the runtime path handles them correctly.
const PLAN_DEPTH_LIMIT = 32;

/** Compilation asked to retry later (class lifecycle metadata not discovered yet). */
export const PLAN_RETRY: unique symbol = Symbol("di:plan-retry");

/**
 * A compiled plan, `null` for "not plannable under the current cache versions",
 * or {@link PLAN_RETRY} when a first runtime resolve must discover metadata first.
 */
export type ClassPlanCompileResult = (() => unknown) | null | typeof PLAN_RETRY;

/** A dependency's terminal binding plus the scope cache of the resolver that owns it. */
export interface ClassPlanDependencyEntry {
  readonly binding: Binding;
  readonly ownerScope: ScopeManager;
}

/**
 * Everything the compiler needs from its resolver, expressed as behavior so the
 * compiler stays independently testable and free of resolver internals.
 */
export interface ClassPlanHost {
  hasActivationHandlers(token: Token<unknown> | Constructor): boolean;
  /** Cached postConstruct presence — `undefined` until a runtime resolve discovers it. */
  knownPostConstruct(target: Constructor): boolean | undefined;
  needsActiveContainer(target: Constructor): boolean;
  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined;
  /** Options-less lookup with alias hops folded; `null` when the fast lane can't answer. */
  lookupDependencyEntry(token: Token<unknown> | Constructor): ClassPlanDependencyEntry | null;
  /** Full runtime resolve — used by singleton thunks for the first materialization. */
  resolveFallback(token: Token<unknown> | Constructor): unknown;
}

/**
 * @since 0.3.16-canary.1
 */
export class ClassPlanCompiler {
  readonly #host: ClassPlanHost;

  constructor(host: ClassPlanHost) {
    this.#host = host;
  }

  compile(binding: Binding & { kind: "class" }): ClassPlanCompileResult {
    return this.#compileClassPlan(binding, new Set(), 0);
  }

  #compileClassPlan(
    binding: Binding & { kind: "class" },
    compileStack: Set<Binding["id"]>,
    depth: number,
  ): ClassPlanCompileResult {
    if (depth > PLAN_DEPTH_LIMIT || compileStack.has(binding.id)) {
      return null;
    }
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
    compileStack.add(binding.id);
    try {
      for (let index = 0; index < params.length; index += 1) {
        const param = params[index]!;
        if (param.multi || param.optional || injectionSlotToResolveOptions(param) !== undefined) {
          return null;
        }
        const entry = this.#host.lookupDependencyEntry(param.token);
        if (entry === null) {
          return null;
        }
        const thunk = this.#compileDepThunk(entry, compileStack, depth);
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
    entry: ClassPlanDependencyEntry,
    compileStack: Set<Binding["id"]>,
    depth: number,
  ): ClassPlanCompileResult {
    const { binding, ownerScope } = entry;
    if (binding.kind === "constant") {
      if (binding.onActivation !== undefined || this.#host.hasActivationHandlers(binding.token)) {
        return null;
      }
      const value = binding.value;
      return () => value;
    }
    const scope = (binding as Binding & { scope: BindingScope }).scope ?? "transient";
    if (scope === "singleton") {
      // Cached-singleton read with a full-resolve fallback for the first materialization.
      const host = this.#host;
      const bindingId = binding.id;
      const singletonToken = binding.token;
      return () => {
        const cachedSingleton = ownerScope.peekSingleton(bindingId);
        return cachedSingleton === SINGLETON_MISS ? host.resolveFallback(singletonToken) : cachedSingleton;
      };
    }
    if (scope === "transient" && binding.kind === "class") {
      return this.#compileClassPlan(binding as Binding & { kind: "class" }, compileStack, depth + 1);
    }
    // Dynamic/resolved/scoped deps keep the runtime path (and its cycle guard).
    return null;
  }
}
