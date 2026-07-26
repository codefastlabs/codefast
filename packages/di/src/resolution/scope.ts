import { MissingScopeContextError } from "#/errors";
import type { BindingIdentifier } from "#/types";

/**
 * Sentinel returned by {@link ScopeManager.peekSingleton} when nothing is cached —
 * lets hot paths read the cache with a single Map.get even for `undefined` values.
 *
 * @since 0.5.0-canary.7
 */
export const SINGLETON_MISS: unique symbol = Symbol("di:singleton-miss");

/**
 * @since 0.3.16-canary.0
 */
export class ScopeManager {
  // Singleton cache: bindingId -> instance
  readonly #singletons = new Map<BindingIdentifier, unknown>();
  // In-flight promises for async singleton creation — only an async resolve ever needs it.
  #inflight: Map<BindingIdentifier, Promise<unknown>> | undefined;
  // Scoped cache — only a child container resolving a `scoped` binding ever needs it.
  #scoped: Map<BindingIdentifier, unknown> | undefined;

  readonly isChild: boolean;

  constructor(isChild = false) {
    this.isChild = isChild;
  }

  hasSingleton(id: BindingIdentifier): boolean {
    return this.#singletons.has(id);
  }

  getSingleton<Value>(id: BindingIdentifier): Value {
    return this.#singletons.get(id) as Value;
  }

  /** Cached value, or {@link SINGLETON_MISS} — one Map.get on the hot path. */
  peekSingleton(id: BindingIdentifier): unknown {
    const value = this.#singletons.get(id);
    if (value === undefined && !this.#singletons.has(id)) {
      return SINGLETON_MISS;
    }
    return value;
  }

  setSingleton(id: BindingIdentifier, instance: unknown): void {
    this.#singletons.set(id, instance);
  }

  deleteSingleton(id: BindingIdentifier): boolean {
    return this.#singletons.delete(id);
  }

  getAllSingletons(): ReadonlyMap<BindingIdentifier, unknown> {
    return this.#singletons;
  }

  getInflight(id: BindingIdentifier): Promise<unknown> | undefined {
    return this.#inflight?.get(id);
  }

  setInflight(id: BindingIdentifier, p: Promise<unknown>): void {
    (this.#inflight ??= new Map()).set(id, p);
  }

  clearInflight(id: BindingIdentifier): void {
    this.#inflight?.delete(id);
  }

  hasScoped(id: BindingIdentifier): boolean {
    return this.#scoped !== undefined && this.#scoped.has(id);
  }

  getScoped<Value>(id: BindingIdentifier): Value {
    return this.#scoped?.get(id) as Value;
  }

  setScoped(id: BindingIdentifier, instance: unknown): void {
    if (!this.isChild) {
      throw new MissingScopeContextError("(unknown)");
    }
    (this.#scoped ??= new Map()).set(id, instance);
  }

  clearAll(): void {
    this.#singletons.clear();
    this.#inflight?.clear();
    this.#scoped?.clear();
  }
}
