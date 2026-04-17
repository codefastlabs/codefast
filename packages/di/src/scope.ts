import type { Binding, BindingIdentifier } from "#/binding";
import { DiError } from "#/errors";

type CacheEntry = {
  readonly binding: Binding<unknown>;
  readonly instance: unknown;
};

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as Promise<unknown>).then === "function"
  );
}

/**
 * Caches singleton and scoped instances and runs deactivation hooks on disposal.
 */
export class ScopeManager {
  private readonly singletonStore: Map<BindingIdentifier, CacheEntry>;
  private readonly scopedStore: Map<BindingIdentifier, CacheEntry>;
  private readonly ownsSingletonDisposal: boolean;

  private constructor(
    singletonStore: Map<BindingIdentifier, CacheEntry>,
    scopedStore: Map<BindingIdentifier, CacheEntry>,
    ownsSingletonDisposal: boolean,
  ) {
    this.singletonStore = singletonStore;
    this.scopedStore = scopedStore;
    this.ownsSingletonDisposal = ownsSingletonDisposal;
  }

  static createRoot(): ScopeManager {
    return new ScopeManager(new Map(), new Map(), true);
  }

  /**
   * Shares the parent singleton cache; receives a fresh scoped cache (for child containers).
   */
  createChildScope(): ScopeManager {
    return new ScopeManager(this.singletonStore, new Map(), false);
  }

  /**
   * Whether a singleton/scoped binding currently has a cached instance (always false for transient).
   */
  isBindingCached(binding: Binding<unknown>): boolean {
    if (binding.scope === "transient") {
      return false;
    }
    const store = binding.scope === "singleton" ? this.singletonStore : this.scopedStore;
    return store.has(binding.id);
  }

  getOrCreate(binding: Binding<unknown>, createInstance: () => unknown): unknown {
    if (binding.scope === "transient") {
      return createInstance();
    }

    const store = binding.scope === "singleton" ? this.singletonStore : this.scopedStore;
    const cached = store.get(binding.id);
    if (cached !== undefined) {
      return cached.instance;
    }

    const instance = createInstance();
    store.set(binding.id, { binding, instance });
    return instance;
  }

  async getOrCreateAsync(
    binding: Binding<unknown>,
    createInstance: () => Promise<unknown>,
  ): Promise<unknown> {
    if (binding.scope === "transient") {
      return createInstance();
    }

    const store = binding.scope === "singleton" ? this.singletonStore : this.scopedStore;
    const cached = store.get(binding.id);
    if (cached !== undefined) {
      return cached.instance;
    }

    const instance = await createInstance();
    store.set(binding.id, { binding, instance });
    return instance;
  }

  /**
   * Runs synchronous `onDeactivation` hooks for scoped instances owned by this manager.
   * Throws if any hook returns a Promise.
   */
  dispose(): void {
    this.disposeMap(this.scopedStore);
    if (this.ownsSingletonDisposal) {
      this.disposeMap(this.singletonStore);
    }
  }

  /**
   * Runs `onDeactivation` hooks for scoped instances; root also disposes shared singletons.
   */
  async disposeAsync(): Promise<void> {
    await this.disposeMapAsync(this.scopedStore);
    if (this.ownsSingletonDisposal) {
      await this.disposeMapAsync(this.singletonStore);
    }
  }

  /**
   * Drops a cached singleton/scoped instance for `bindingId` and runs `onDeactivation` synchronously.
   */
  releaseByBindingId(bindingId: BindingIdentifier): void {
    this.releaseFromStore(this.singletonStore, bindingId);
    this.releaseFromStore(this.scopedStore, bindingId);
  }

  /**
   * Drops a cached singleton/scoped instance for `bindingId` and awaits `onDeactivation`.
   */
  async releaseByBindingIdAsync(bindingId: BindingIdentifier): Promise<void> {
    await this.releaseFromStoreAsync(this.singletonStore, bindingId);
    await this.releaseFromStoreAsync(this.scopedStore, bindingId);
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
    if (handler === undefined || entry.binding.scope !== "singleton") {
      return;
    }
    const result = handler(entry.instance);
    if (isPromiseLike(result)) {
      throw new DiError(
        "onDeactivation returned a Promise during synchronous scope release; use releaseBindingAsync() or unloadAsync().",
      );
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
    if (handler === undefined || entry.binding.scope !== "singleton") {
      return;
    }
    await handler(entry.instance);
  }

  private disposeMap(store: Map<BindingIdentifier, CacheEntry>): void {
    const entries = [...store.values()];
    store.clear();
    for (const entry of entries) {
      const handler = entry.binding.onDeactivation;
      if (handler === undefined || entry.binding.scope !== "singleton") {
        continue;
      }
      const result = handler(entry.instance);
      if (isPromiseLike(result)) {
        throw new DiError(
          "onDeactivation returned a Promise; use disposeAsync() instead of dispose().",
        );
      }
    }
  }

  private async disposeMapAsync(store: Map<BindingIdentifier, CacheEntry>): Promise<void> {
    const entries = [...store.values()];
    store.clear();
    for (const entry of entries) {
      const handler = entry.binding.onDeactivation;
      if (handler === undefined || entry.binding.scope !== "singleton") {
        continue;
      }
      await handler(entry.instance);
    }
  }
}
