import type { Binding } from "#core/binding";
import { NO_INSTANCE } from "#core/binding";
import { tokenName } from "#core/token";
import type { BindingIdentifier } from "#core/types";
import { MissingScopeContextError } from "#errors";

/**
 * What deactivates a scoped instance: the resolver owning its binding, which activated it.
 *
 * @remarks Answers `undefined` when the binding owes no teardown, so disposing a per-request child awaits nothing.
 */
export interface ScopedInstanceOwner {
  deactivateScoped(binding: Binding, instance: unknown): Promise<void> | undefined;
}

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
  // Scoped bindings in the order their instances were cached, each beside its owner, so disposal can deactivate them
  // latest first. The first sits in fields: a per-request child caching one scoped instance allocates nothing for it.
  #firstScopedBinding: Binding | undefined;
  #firstScopedOwner: ScopedInstanceOwner | undefined;
  #laterScopedBindings: Array<Binding> | undefined;
  #laterScopedOwners: Array<ScopedInstanceOwner> | undefined;
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
      (this.#singletonBindings ??= []).push(binding);
    }
    binding.instance = instance;
  }

  // A removal only clears the instance; the list keeps its entry until a read compacts it, so a
  // teardown of a hundred singletons is a hundred field writes, not a hundred splices.
  #compacted = true;

  /** Every binding in this container holding a cached singleton. */
  cachedSingletons(): ReadonlyArray<Binding<unknown>> {
    const tracked = this.#singletonBindings;
    if (tracked === undefined) {
      return EMPTY_BINDINGS;
    }
    if (!this.#compacted) {
      // Latest materialization wins the position: walk from the end keeping each live binding once.
      const seen = new Set<Binding<unknown>>();
      const live: Array<Binding<unknown>> = [];
      for (let index = tracked.length - 1; index >= 0; index -= 1) {
        const binding = tracked[index]!;
        if (binding.instance !== NO_INSTANCE && !seen.has(binding)) {
          seen.add(binding);
          live.push(binding);
        }
      }
      live.reverse();
      this.#singletonBindings = live;
      this.#compacted = true;
      return live;
    }
    return tracked;
  }

  deleteSingleton<Value>(binding: Binding<Value>): boolean {
    if (binding.instance === NO_INSTANCE) {
      return false;
    }
    binding.instance = NO_INSTANCE;
    this.#compacted = false;
    return true;
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
  readScoped(key: BindingIdentifier): unknown {
    const scoped = this.#scoped;
    if (scoped === undefined) {
      return SCOPED_MISS;
    }
    const cached = scoped.get(key);
    if (cached !== undefined) {
      return cached;
    }
    return scoped.has(key) ? undefined : SCOPED_MISS;
  }

  /** Takes the binding rather than its id, so a failure here can name the token — as `setSingleton` does. */
  setScoped(binding: Binding, instance: unknown, owner: ScopedInstanceOwner): void {
    if (!this.isChild) {
      throw new MissingScopeContextError(tokenName(binding.token));
    }
    (this.#scoped ??= new Map<BindingIdentifier, unknown>()).set(binding.scopedCacheKey, instance);
    if (this.#firstScopedBinding === undefined) {
      this.#firstScopedBinding = binding;
      this.#firstScopedOwner = owner;
    } else {
      (this.#laterScopedBindings ??= []).push(binding);
      (this.#laterScopedOwners ??= []).push(owner);
    }
  }

  /** Drops the instance cached under a scoped cache key, owing it nothing — what a binding leaving `scoped` retires. */
  deleteScoped(key: BindingIdentifier): void {
    this.#scoped?.delete(key);
  }

  /** Removes the instance cached under a scoped cache key and hands it back, or {@link SCOPED_MISS} when none is. */
  takeScoped(key: BindingIdentifier): unknown {
    const scoped = this.#scoped;
    if (scoped === undefined || !scoped.has(key)) {
      return SCOPED_MISS;
    }
    const instance = scoped.get(key);
    scoped.delete(key);
    return instance;
  }

  /**
   * Deactivates every cached scoped instance through its owner, the latest cached first and one at a time, collecting
   * each failure into `errors` — or answers `undefined` when no owner had a teardown to run.
   *
   * @remarks A binding cached again after its instance was taken is listed twice; only its current instance is owed.
   */
  deactivateScoped(errors: Array<unknown>): Promise<void> | undefined {
    if (this.#firstScopedBinding === undefined) {
      return undefined;
    }
    return this.#deactivateScopedFrom(this.#laterScopedBindings?.length ?? 0, errors);
  }

  // Positions count down from the latest: `position - 1` in the later lists while positive, then the first at 0.
  #deactivateScopedFrom(position: number, errors: Array<unknown>): Promise<void> | undefined {
    for (let current = position; current >= 0; current -= 1) {
      const pending = this.#deactivateScopedAt(current, errors);
      if (pending !== undefined) {
        return this.#finishDeactivatingScoped(pending, current - 1, errors);
      }
    }
    return undefined;
  }

  // The rest of the walk once a teardown is pending: each one settles before the next starts.
  async #finishDeactivatingScoped(pending: Promise<void>, position: number, errors: Array<unknown>): Promise<void> {
    let current: Promise<void> | undefined = pending;
    for (let next = position; ; next -= 1) {
      if (current !== undefined) {
        try {
          await current;
        } catch (error) {
          errors.push(error);
        }
      }
      if (next < 0) {
        return;
      }
      current = this.#deactivateScopedAt(next, errors);
    }
  }

  #deactivateScopedAt(position: number, errors: Array<unknown>): Promise<void> | undefined {
    const binding = position === 0 ? this.#firstScopedBinding! : this.#laterScopedBindings![position - 1]!;
    const owner = position === 0 ? this.#firstScopedOwner! : this.#laterScopedOwners![position - 1]!;
    // The first is read last, so only a later entry can find a key cached twice; taking it leaves the rest a miss.
    const instance = position === 0 ? this.readScoped(binding.scopedCacheKey) : this.takeScoped(binding.scopedCacheKey);
    if (instance === SCOPED_MISS) {
      return undefined;
    }
    try {
      return owner.deactivateScoped(binding, instance);
    } catch (error) {
      errors.push(error);
      return undefined;
    }
  }

  /** Scoped instances currently cached — a structural count for diagnostics. */
  get scopedCount(): number {
    return this.#scoped?.size ?? 0;
  }

  clearAll(): void {
    const tracked = this.#singletonBindings;
    if (tracked !== undefined) {
      for (let index = 0; index < tracked.length; index += 1) {
        tracked[index]!.instance = NO_INSTANCE;
      }
      tracked.length = 0;
      this.#compacted = true;
    }
    this.#inflight?.clear();
    this.#scoped?.clear();
    this.#firstScopedBinding = undefined;
    this.#firstScopedOwner = undefined;
    this.#laterScopedBindings = undefined;
    this.#laterScopedOwners = undefined;
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
