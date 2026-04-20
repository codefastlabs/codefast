import type { Binding, BindingIdentifier } from "#/binding";
import { InternalError } from "#/errors";
import { isPromiseLike, runPreDestroy, runPreDestroyAsync } from "#/lifecycle";

/**
 * Cached singleton or scoped instance together with its binding (needed for deactivation).
 */
type CacheEntry = {
  readonly binding: Binding<unknown>;
  readonly instance: unknown;
};

/**
 * Caches singleton and scoped instances, deduplicates concurrent async creation, and runs
 * deactivation hooks (`onDeactivation`, `@preDestroy`) on disposal.
 *
 * A root scope manager owns both singleton and scoped caches. A child scope manager (created
 * via {@link createChildScope}) shares the parent's singleton cache but receives a fresh scoped
 * cache — singletons are shared across the hierarchy, scoped instances are isolated per child.
 *
 * Invariant: `ownsSingletonDisposal` is `true` only for the root. When a child disposes, only
 * its scoped bindings are deactivated; singletons remain alive until the root disposes.
 */
export class ScopeManager {
  /**
   * Cached singleton instances: `bindingId → { binding, instance }`.
   */
  private readonly singletonCache: Map<BindingIdentifier, CacheEntry>;
  /**
   * Cached scoped instances for this container level: `bindingId → { binding, instance }`.
   */
  private readonly scopedCache: Map<BindingIdentifier, CacheEntry>;
  /**
   * True only for the root scope manager. Controls whether {@link dispose} / {@link disposeAsync}
   * also drain the shared singleton cache; child scopes leave singleton disposal to the root.
   */
  private readonly ownsSingletonDisposal: boolean;
  /**
   * In-flight async singleton creation promises.
   * Guards against double-instantiation when multiple `resolveAsync` calls for the same
   * singleton binding overlap before the first one settles.
   */
  private readonly singletonPendingPromises: Map<BindingIdentifier, Promise<unknown>>;
  /**
   * In-flight async scoped creation promises (same deduplication role as
   * {@link singletonPendingPromises} but for scoped bindings).
   */
  private readonly scopedPendingPromises: Map<BindingIdentifier, Promise<unknown>>;

  private constructor(
    singletonCache: Map<BindingIdentifier, CacheEntry>,
    scopedCache: Map<BindingIdentifier, CacheEntry>,
    ownsSingletonDisposal: boolean,
    singletonPendingPromises: Map<BindingIdentifier, Promise<unknown>>,
    scopedPendingPromises: Map<BindingIdentifier, Promise<unknown>>,
  ) {
    this.singletonCache = singletonCache;
    this.scopedCache = scopedCache;
    this.ownsSingletonDisposal = ownsSingletonDisposal;
    this.singletonPendingPromises = singletonPendingPromises;
    this.scopedPendingPromises = scopedPendingPromises;
  }

  /**
   * Creates a root scope manager that owns both the singleton cache and scoped cache.
   */
  static createRoot(): ScopeManager {
    return new ScopeManager(new Map(), new Map(), true, new Map(), new Map());
  }

  /**
   * Shares the parent singleton cache; receives a fresh scoped cache (for child containers).
   */
  createChildScope(): ScopeManager {
    return new ScopeManager(
      this.singletonCache,
      new Map(),
      false,
      this.singletonPendingPromises,
      new Map(),
    );
  }

  /**
   * Whether a singleton/scoped binding currently has a cached instance (always false for transient).
   */
  isBindingCached(binding: Binding<unknown>): boolean {
    if (binding.scope === "transient") {
      return false;
    }
    const cache = binding.scope === "singleton" ? this.singletonCache : this.scopedCache;
    return cache.has(binding.id);
  }

  /**
   * Returns the cached instance for singleton/scoped bindings, or calls `createInstance` on first access.
   */
  getOrCreate(binding: Binding<unknown>, createInstance: () => unknown): unknown {
    if (binding.scope === "transient") {
      return createInstance();
    }

    const cache = binding.scope === "singleton" ? this.singletonCache : this.scopedCache;
    const cached = cache.get(binding.id);
    if (cached !== undefined) {
      return cached.instance;
    }

    const instance = createInstance();
    cache.set(binding.id, { binding, instance });
    return instance;
  }

  /**
   * Async variant of {@link getOrCreate}. Deduplicates concurrent creation calls for the same
   * binding using an in-flight promise map, preventing double-instantiation under parallel resolves.
   */
  async getOrCreateAsync(
    binding: Binding<unknown>,
    createInstance: () => Promise<unknown>,
  ): Promise<unknown> {
    if (binding.scope === "transient") {
      return createInstance();
    }

    const cache = binding.scope === "singleton" ? this.singletonCache : this.scopedCache;
    const pendingCreationMap =
      binding.scope === "singleton" ? this.singletonPendingPromises : this.scopedPendingPromises;
    const cached = cache.get(binding.id);
    if (cached !== undefined) {
      return cached.instance;
    }

    let pendingCreation = pendingCreationMap.get(binding.id);
    if (pendingCreation === undefined) {
      pendingCreation = (async () => {
        try {
          const instance = await createInstance();
          cache.set(binding.id, { binding, instance });
          return instance;
        } finally {
          pendingCreationMap.delete(binding.id);
        }
      })();
      pendingCreationMap.set(binding.id, pendingCreation);
    }
    return pendingCreation;
  }

  /**
   * Runs synchronous `onDeactivation` hooks for scoped instances owned by this manager.
   * Throws if any hook returns a Promise.
   */
  dispose(): void {
    this.disposeMap(this.scopedCache);
    if (this.ownsSingletonDisposal) {
      this.disposeMap(this.singletonCache);
    }
  }

  /**
   * Runs `onDeactivation` hooks for scoped instances; root also disposes shared singletons.
   */
  async disposeAsync(): Promise<void> {
    await this.disposeMapAsync(this.scopedCache);
    if (this.ownsSingletonDisposal) {
      await this.disposeMapAsync(this.singletonCache);
    }
  }

  /**
   * Drops a cached singleton/scoped instance for `bindingId` and runs `onDeactivation` synchronously.
   */
  releaseByBindingId(bindingId: BindingIdentifier): void {
    this.releaseFromStore(this.singletonCache, bindingId);
    this.releaseFromStore(this.scopedCache, bindingId);
  }

  /**
   * Drops a cached singleton/scoped instance for `bindingId` and awaits `onDeactivation`.
   */
  async releaseByBindingIdAsync(bindingId: BindingIdentifier): Promise<void> {
    await this.releaseFromStoreAsync(this.singletonCache, bindingId);
    await this.releaseFromStoreAsync(this.scopedCache, bindingId);
  }

  /**
   * Drops a cached singleton/scoped instance for `binding.id` and runs `onDeactivation` synchronously.
   */
  releaseBinding(binding: Binding<unknown>): void {
    this.releaseByBindingId(binding.id);
  }

  /**
   * Drops a cached singleton/scoped instance for `binding.id` and awaits `onDeactivation`.
   */
  async releaseBindingAsync(binding: Binding<unknown>): Promise<void> {
    await this.releaseByBindingIdAsync(binding.id);
  }

  /**
   * Removes a single entry from `store`, runs `onDeactivation` synchronously, then calls
   * `@preDestroy`. Throws {@link InternalError} if the handler returns a Promise.
   */
  private releaseFromStore(
    store: Map<BindingIdentifier, CacheEntry>,
    bindingId: BindingIdentifier,
  ): void {
    const entry = store.get(bindingId);
    if (entry === undefined) {
      return;
    }
    store.delete(bindingId);
    const handler = entry.binding.onDeactivation;
    if (handler !== undefined) {
      const result = handler(entry.instance);
      if (isPromiseLike(result)) {
        throw new InternalError(
          "onDeactivation returned a Promise during synchronous scope release; use releaseBindingAsync() or unloadAsync().",
        );
      }
    }
    if (entry.binding.kind === "class") {
      runPreDestroy(entry.binding.implementationClass, entry.instance);
    }
  }

  /**
   * Async counterpart of {@link releaseFromStore}: awaits `onDeactivation` then `@preDestroy`.
   */
  private async releaseFromStoreAsync(
    store: Map<BindingIdentifier, CacheEntry>,
    bindingId: BindingIdentifier,
  ): Promise<void> {
    const entry = store.get(bindingId);
    if (entry === undefined) {
      return;
    }
    store.delete(bindingId);
    const handler = entry.binding.onDeactivation;
    if (handler !== undefined) {
      await handler(entry.instance);
    }
    if (entry.binding.kind === "class") {
      await runPreDestroyAsync(entry.binding.implementationClass, entry.instance);
    }
  }

  /**
   * Iterates all entries in `store`, clears each one, runs `onDeactivation` + `@preDestroy`
   * synchronously. Throws {@link InternalError} if any handler returns a Promise.
   */
  private disposeMap(store: Map<BindingIdentifier, CacheEntry>): void {
    const entries = [...store.values()];
    store.clear();
    for (const entry of entries) {
      const handler = entry.binding.onDeactivation;
      if (handler !== undefined) {
        const result = handler(entry.instance);
        if (isPromiseLike(result)) {
          throw new InternalError(
            "onDeactivation returned a Promise; use disposeAsync() instead of dispose().",
          );
        }
      }
      if (entry.binding.kind === "class") {
        runPreDestroy(entry.binding.implementationClass, entry.instance);
      }
    }
  }

  /**
   * Async counterpart of {@link disposeMap}: clears the store first, then runs all
   * deactivation hooks; collects errors and rethrows as `AggregateError` when multiple fail.
   */
  private async disposeMapAsync(store: Map<BindingIdentifier, CacheEntry>): Promise<void> {
    const entries = [...store.values()];
    store.clear();
    const errors: unknown[] = [];
    for (const entry of entries) {
      try {
        const handler = entry.binding.onDeactivation;
        if (handler !== undefined) {
          await handler(entry.instance);
        }
        if (entry.binding.kind === "class") {
          await runPreDestroyAsync(entry.binding.implementationClass, entry.instance);
        }
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length === 1) {
      throw errors[0];
    }
    if (errors.length > 1) {
      throw new AggregateError(errors, "disposeAsync: multiple deactivation handlers failed");
    }
  }
}
