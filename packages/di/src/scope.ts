import type { Binding, BindingIdentifier } from "#/binding";
import { InternalError } from "#/errors";
import { isPromiseLike, runPreDestroy, runPreDestroyAsync } from "#/lifecycle";
type CacheEntry = {
  readonly binding: Binding<unknown>;
  readonly instance: unknown;
};
export class ScopeManager {
  private readonly singletonCache: Map<BindingIdentifier, CacheEntry>;
  private readonly scopedCache: Map<BindingIdentifier, CacheEntry>;
  private readonly ownsSingletonDisposal: boolean;
  private readonly singletonPendingPromises: Map<BindingIdentifier, Promise<unknown>>;
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
  static createRoot(): ScopeManager {
    return new ScopeManager(new Map(), new Map(), true, new Map(), new Map());
  }
  createChildScope(): ScopeManager {
    return new ScopeManager(
      this.singletonCache,
      new Map(),
      false,
      this.singletonPendingPromises,
      new Map(),
    );
  }
  isBindingCached(binding: Binding<unknown>): boolean {
    if (binding.scope === "transient") {
      return false;
    }
    const cache = binding.scope === "singleton" ? this.singletonCache : this.scopedCache;
    return cache.has(binding.id);
  }
  getCached(binding: Binding<unknown>): unknown {
    if (binding.scope === "transient") {
      return undefined;
    }
    const cache = binding.scope === "singleton" ? this.singletonCache : this.scopedCache;
    const entry = cache.get(binding.id);
    return entry?.instance;
  }
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
  dispose(): void {
    this.disposeMap(this.scopedCache);
    if (this.ownsSingletonDisposal) {
      this.disposeMap(this.singletonCache);
    }
  }
  async disposeAsync(): Promise<void> {
    await this.disposeMapAsync(this.scopedCache);
    if (this.ownsSingletonDisposal) {
      await this.disposeMapAsync(this.singletonCache);
    }
  }
  releaseByBindingId(bindingId: BindingIdentifier): void {
    this.releaseFromStore(this.singletonCache, bindingId);
    this.releaseFromStore(this.scopedCache, bindingId);
  }
  async releaseByBindingIdAsync(bindingId: BindingIdentifier): Promise<void> {
    await this.releaseFromStoreAsync(this.singletonCache, bindingId);
    await this.releaseFromStoreAsync(this.scopedCache, bindingId);
  }
  releaseBinding(binding: Binding<unknown>): void {
    this.releaseByBindingId(binding.id);
  }
  async releaseBindingAsync(binding: Binding<unknown>): Promise<void> {
    await this.releaseByBindingIdAsync(binding.id);
  }
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
