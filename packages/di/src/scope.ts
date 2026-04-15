import type {
  Binding,
  BindingIdentifier,
  ConstraintContext,
  ResolutionContext,
} from "#lib/binding";
import { InvalidBindingError } from "#lib/errors";

const DISPOSE_CONSTRAINT_CONTEXT: ConstraintContext = {
  resolutionPath: [],
  materializationStack: [],
  parent: undefined,
  ancestors: [],
  currentResolveHint: undefined,
};

type CacheEntry = {
  readonly binding: Binding<unknown>;
  readonly instance: unknown;
};

function createDisposeOnlyContext(): ResolutionContext {
  const unavailable = (): never => {
    throw new InvalidBindingError(
      "resolve() and resolveAsync() are not available during scope disposal.",
    );
  };
  return {
    resolve: unavailable,
    resolveAsync: async (): Promise<never> => unavailable(),
    constraint: DISPOSE_CONSTRAINT_CONTEXT,
  };
}

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
  disposeSync(): void {
    const disposeContext = createDisposeOnlyContext();
    this.disposeMapSync(this.scopedStore, disposeContext);
    if (this.ownsSingletonDisposal) {
      this.disposeMapSync(this.singletonStore, disposeContext);
    }
  }

  /**
   * Synchronous disposal (alias of {@link disposeSync}).
   */
  dispose(): void {
    this.disposeSync();
  }

  /**
   * Runs `onDeactivation` hooks for scoped instances; root also disposes shared singletons.
   */
  async disposeAsync(): Promise<void> {
    const disposeContext = createDisposeOnlyContext();
    await this.disposeMapAsync(this.scopedStore, disposeContext);
    if (this.ownsSingletonDisposal) {
      await this.disposeMapAsync(this.singletonStore, disposeContext);
    }
  }

  /**
   * Drops a cached singleton/scoped instance for `bindingId` and runs `onDeactivation` synchronously.
   */
  releaseByBindingIdSync(bindingId: BindingIdentifier): void {
    const disposeContext = createDisposeOnlyContext();
    this.releaseFromStoreSync(this.singletonStore, bindingId, disposeContext);
    this.releaseFromStoreSync(this.scopedStore, bindingId, disposeContext);
  }

  /**
   * Drops a cached singleton/scoped instance for `bindingId` and awaits `onDeactivation`.
   */
  async releaseByBindingIdAsync(bindingId: BindingIdentifier): Promise<void> {
    const disposeContext = createDisposeOnlyContext();
    await this.releaseFromStoreAsync(this.singletonStore, bindingId, disposeContext);
    await this.releaseFromStoreAsync(this.scopedStore, bindingId, disposeContext);
  }

  /**
   * Drops a cached singleton/scoped instance for `binding.id` and runs `onDeactivation` synchronously.
   */
  releaseBindingSync(binding: Binding<unknown>): void {
    this.releaseByBindingIdSync(binding.id);
  }

  /**
   * Drops a cached singleton/scoped instance for `binding.id` and awaits `onDeactivation`.
   */
  async releaseBindingAsync(binding: Binding<unknown>): Promise<void> {
    await this.releaseByBindingIdAsync(binding.id);
  }

  private releaseFromStoreSync(
    store: Map<BindingIdentifier, CacheEntry>,
    bindingId: BindingIdentifier,
    disposeContext: ResolutionContext,
  ): void {
    const entry = store.get(bindingId);
    if (entry === undefined) {
      return;
    }
    store.delete(bindingId);
    const handler = entry.binding.onDeactivation;
    if (handler === undefined) {
      return;
    }
    const result = handler(disposeContext, entry.instance);
    if (isPromiseLike(result)) {
      throw new InvalidBindingError(
        "onDeactivation returned a Promise during synchronous scope release; use releaseBindingAsync() or unloadAsync().",
      );
    }
  }

  private async releaseFromStoreAsync(
    store: Map<BindingIdentifier, CacheEntry>,
    bindingId: BindingIdentifier,
    disposeContext: ResolutionContext,
  ): Promise<void> {
    const entry = store.get(bindingId);
    if (entry === undefined) {
      return;
    }
    store.delete(bindingId);
    const handler = entry.binding.onDeactivation;
    if (handler === undefined) {
      return;
    }
    await handler(disposeContext, entry.instance);
  }

  private disposeMapSync(
    store: Map<BindingIdentifier, CacheEntry>,
    disposeContext: ResolutionContext,
  ): void {
    const entries = [...store.values()];
    store.clear();
    for (const entry of entries) {
      const handler = entry.binding.onDeactivation;
      if (handler === undefined) {
        continue;
      }
      const result = handler(disposeContext, entry.instance);
      if (isPromiseLike(result)) {
        throw new InvalidBindingError(
          "onDeactivation returned a Promise; use disposeAsync() instead of disposeSync().",
        );
      }
    }
  }

  private async disposeMapAsync(
    store: Map<BindingIdentifier, CacheEntry>,
    disposeContext: ResolutionContext,
  ): Promise<void> {
    const entries = [...store.values()];
    store.clear();
    for (const entry of entries) {
      const handler = entry.binding.onDeactivation;
      if (handler === undefined) {
        continue;
      }
      await handler(disposeContext, entry.instance);
    }
  }
}
