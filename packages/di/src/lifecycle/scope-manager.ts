import type { Binding } from "#/core/binding";
import { NO_INSTANCE } from "#/core/binding";
import { tokenName } from "#/core/token";
import type { BindingIdentifier } from "#/core/types";
import { MissingScopeContextError } from "#/errors/errors";

/**
 * One container's instance caches — singletons, in-flight async creations, and the scoped cache.
 *
 * @since 0.3.16-canary.0
 */
export class ScopeManager {
  // Instances live on their binding; this list only lets disposal and `inspect()` enumerate them.
  #singletonBindings: Array<Binding<unknown>> | undefined;
  // In-flight promises for async singleton creation — only an async resolve ever needs it.
  #inflight: Map<BindingIdentifier, Promise<unknown>> | undefined;
  // Scoped cache — only a child container resolving a `scoped` binding ever needs it.
  #scoped: Map<BindingIdentifier, unknown> | undefined;
  // Set once by the owning container's dispose — refuses new materializations into torn-down state.
  #closed = false;

  readonly isChild: boolean;

  constructor(isChild = false) {
    this.isChild = isChild;
  }

  get isClosed(): boolean {
    return this.#closed;
  }

  markClosed(): void {
    this.#closed = true;
  }

  /** Awaits every in-flight async materialization, so teardown deactivates what they produce. */
  async settleInflight(): Promise<void> {
    let previousSize = -1;
    while (this.#inflight !== undefined && this.#inflight.size > 0 && this.#inflight.size !== previousSize) {
      previousSize = this.#inflight.size;
      await Promise.allSettled(this.#inflight.values());
    }
  }

  setSingleton<Value>(binding: Binding<Value>, instance: unknown): void {
    if (binding.instance === NO_INSTANCE) {
      (this.#singletonBindings ??= []).push(binding as Binding<unknown>);
    }
    binding.instance = instance;
  }

  /** Every binding in this container holding a cached singleton. */
  cachedSingletons(): ReadonlyArray<Binding<unknown>> {
    return this.#singletonBindings ?? EMPTY_BINDINGS;
  }

  deleteSingleton<Value>(binding: Binding<Value>): boolean {
    if (binding.instance === NO_INSTANCE) {
      return false;
    }
    binding.instance = NO_INSTANCE;
    const tracked = this.#singletonBindings;
    if (tracked !== undefined) {
      const index = tracked.indexOf(binding as Binding<unknown>);
      if (index !== -1) {
        tracked.splice(index, 1);
      }
    }
    return true;
  }

  /** Swaps a re-slotted binding's tracked entry, so teardown pairs the instance with the live object. */
  replaceSingleton(previous: Binding, next: Binding): void {
    const tracked = this.#singletonBindings;
    if (tracked === undefined) {
      return;
    }
    const index = tracked.indexOf(previous as Binding<unknown>);
    if (index !== -1) {
      tracked[index] = next as Binding<unknown>;
    }
  }

  getInflight(id: BindingIdentifier): Promise<unknown> | undefined {
    return this.#inflight?.get(id);
  }

  setInflight(id: BindingIdentifier, promise: Promise<unknown>): void {
    (this.#inflight ??= new Map<BindingIdentifier, Promise<unknown>>()).set(id, promise);
  }

  clearInflight(id: BindingIdentifier): void {
    this.#inflight?.delete(id);
  }

  /**
   * The cached scoped instance, or {@link SCOPED_MISS}.
   *
   * @remarks One map read answers both existence and value; a cached `undefined` is the only
   * shape that pays for a second, and it is the rare one.
   */
  readScoped(id: BindingIdentifier): unknown {
    const scoped = this.#scoped;
    if (scoped === undefined) {
      return SCOPED_MISS;
    }
    const cached = scoped.get(id);
    if (cached !== undefined) {
      return cached;
    }
    return scoped.has(id) ? undefined : SCOPED_MISS;
  }

  /** Takes the binding rather than its id, so a failure here can name the token — as `setSingleton` does. */
  setScoped(binding: Binding, instance: unknown): void {
    if (!this.isChild) {
      throw new MissingScopeContextError(tokenName(binding.token));
    }
    (this.#scoped ??= new Map<BindingIdentifier, unknown>()).set(binding.id, instance);
  }

  /** Releases a removed binding's scoped instance. A scoped instance has no deactivation. */
  deleteScoped(id: BindingIdentifier): void {
    this.#scoped?.delete(id);
  }

  /** Scoped instances currently cached — a structural count for diagnostics. */
  get scopedCount(): number {
    return this.#scoped?.size ?? 0;
  }

  clearAll(): void {
    const tracked = this.#singletonBindings;
    if (tracked !== undefined) {
      for (const binding of tracked) {
        binding.instance = NO_INSTANCE;
      }
      tracked.length = 0;
    }
    this.#inflight?.clear();
    this.#scoped?.clear();
  }
  /** Whether the deferred scoped-instance cache has had to be built. */
  get isScopedCacheBuilt(): boolean {
    return this.#scoped !== undefined;
  }
}

const EMPTY_BINDINGS: ReadonlyArray<Binding<unknown>> = [];

/**
 * Absent scoped entry — distinguishes it from a cached `undefined`.
 *
 * @remarks A `unique symbol`, so no value a caller could cache can ever equal it.
 *
 * @since 0.6.0
 */
export const SCOPED_MISS: unique symbol = Symbol("di:scoped-miss");
