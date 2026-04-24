import type { Binding, BindingIdentifier, Constructor, ResolveHint } from "#/binding";
import { BindingBuilder } from "#/binding";
import { getAutoRegistered } from "#/decorators/injectable";
import type { MetadataReader } from "#/metadata/metadata-types";
import { SymbolMetadataReader } from "#/metadata/symbol-metadata-reader";
import { AsyncModuleLoadError, CircularDependencyError, InternalError } from "#/errors";
import type {
  ContainerGraphJson,
  GraphOptions,
  ContainerInspectorContext,
  ContainerSnapshot,
} from "#/inspector";
import { ContainerInspector } from "#/inspector";
import type { AsyncModuleBuilder, ModuleBuilder } from "#/module";
import { AsyncModule, Module } from "#/module";
import type { RegistryKey } from "#/registry";
import { BindingRegistry } from "#/registry";
import { DependencyResolver } from "#/resolver";
import { validateScopeRules } from "#/scope-validation";
import { ScopeManager } from "#/scope";
import type { Token } from "#/token";
import { isDevelopmentOrTestEnvironment } from "#/environment";
import { buildLastWinsSlotKey, resolveHintForBinding } from "#/container-internals";

/**
 * Mutable holder used to break the circular reference between container and resolver at creation time.
 */
type ContainerRef = { current: DefaultContainer | undefined };

/**
 * Union of sync and async modules accepted by `loadAsync` / `unloadAsync`.
 */
type ModuleLike = Module | AsyncModule;

const NOT_FOUND = Symbol("container-fast-path-not-found");

/**
 * Public contract for an IoC container (registry, modules, resolution, lifecycle).
 * Construct instances with {@link Container.create} or {@link Container.fromModules}.
 *
 * Implements {@link AsyncDisposable} so `await using container = Container.create()` runs
 * {@link Container.dispose} automatically at scope exit (TC39 Explicit Resource Management).
 */
export interface Container extends AsyncDisposable {
  /**
   * Starts a fluent binding builder for the given token or constructor.
   */
  bind<Value>(token: Token<Value> | Constructor<Value>): BindingBuilder<Value>;
  /**
   * Removes all existing bindings for the token (with sync deactivation) then starts a fresh builder.
   */
  rebind<Value>(token: Token<Value> | Constructor<Value>): BindingBuilder<Value>;
  /**
   * Removes all bindings for a token or a single binding by its {@link BindingIdentifier}; runs sync deactivation.
   */
  unbind(tokenOrId: RegistryKey | BindingIdentifier): void;
  /**
   * Same as {@link unbind} but awaits async `onDeactivation` handlers before removing.
   */
  unbindAsync(tokenOrId: RegistryKey | BindingIdentifier): Promise<void>;
  /**
   * Returns `true` if at least one binding exists for `token`, optionally filtered by `hint`.
   */
  has(token: RegistryKey, hint?: ResolveHint): boolean;
  /**
   * Resolves the token synchronously. Throws {@link AsyncResolutionError} if any binding in the chain is async.
   */
  resolve<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveHint): Value;
  /**
   * Resolves the token, awaiting any async factory in the chain. Safe for both sync and async bindings.
   */
  resolveAsync<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveHint): Promise<Value>;
  /**
   * Resolves all bindings registered for the token (multi-binding). Throws {@link AsyncResolutionError} if any is async.
   */
  resolveAll<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveHint): Value[];
  /**
   * Async variant of {@link resolveAll} — safe when the multi-binding set contains async factories.
   */
  resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveHint,
  ): Promise<Value[]>;
  /**
   * Resolves the token or returns `undefined` if no binding is registered (never throws on missing).
   */
  resolveOptional<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveHint,
  ): Value | undefined;
  /**
   * Registers bindings from one or more synchronous modules. Re-loading a module already present is a no-op.
   */
  load(...modules: Module[]): void;
  /**
   * Registers bindings from sync and/or async modules, awaiting each async setup in sequence.
   */
  loadAsync(...modules: ModuleLike[]): Promise<void>;
  /**
   * Removes all bindings contributed by the given modules; runs sync deactivation on released singletons.
   */
  unload(...modules: ModuleLike[]): void;
  /**
   * Same as {@link unload} but awaits async `onDeactivation` handlers.
   */
  unloadAsync(...modules: ModuleLike[]): Promise<void>;
  /**
   * Eagerly constructs every singleton binding so the first request is never cold.
   */
  initializeAsync(): Promise<void>;
  /**
   * Scans {@link getAutoRegistered} entries and binds each to its declared scope. Returns the count added.
   */
  loadAutoRegistered(): number;
  /**
   * Checks for scope violations (captive dependencies). Throws {@link ScopeViolationError} on the first violation found.
   */
  validate(): void;
  /**
   * Returns a debug snapshot of all registered bindings and their activation state.
   */
  inspect(): ContainerSnapshot;
  /**
   * Returns the canonical dependency graph as typed JSON (`nodes` + `edges`).
   */
  generateDependencyGraph(options?: GraphOptions): ContainerGraphJson;
  /**
   * Creates a child container that inherits bindings from this container without polluting its registry.
   */
  createChild(): Container;
  /**
   * @throws Always — container disposal is async; use `await using` or `await container.dispose()`.
   */
  [Symbol.dispose](): never;
  /**
   * Returns the raw binding list for a token without triggering resolution. `undefined` means no binding.
   */
  lookupBindings(token: RegistryKey): readonly Binding<unknown>[] | undefined;
  /**
   * Runs all `onDeactivation` hooks on active singletons and releases all caches.
   */
  dispose(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
}

/**
 * Default IoC container: registry + scoped caches + synchronous / asynchronous resolution.
 * @internal Implementation of {@link Container}; not part of the public package contract.
 */
class DefaultContainer implements Container {
  /**
   * Stack guard for detecting circular sync module imports during {@link ensureSyncModuleLoaded}.
   */
  private readonly syncModuleStack: Module[] = [];
  /**
   * Stack guard for detecting circular async module imports during {@link ensureAsyncModuleLoaded}.
   */
  private readonly asyncModuleStack: AsyncModule[] = [];
  /**
   * Tracks loaded modules → their binding IDs so {@link unload} / {@link unloadAsync} can
   * remove exactly the bindings contributed by each module.
   * Also serves as a deduplication set: a module present as a key is considered loaded.
   */
  private readonly loadedModules = new Map<ModuleLike, BindingIdentifier[]>();
  /**
   * True after the first dev/test one-shot scope validation has run for the current registry state.
   * Reset to `false` by {@link invalidateDevValidationState} on every registry mutation.
   */
  private hasDevValidationRun = false;
  /** Pending staged registrations that belong to this container instance. */
  private readonly pendingRegistrationBuilders = new Set<BindingBuilder<unknown>>();
  /**
   * Fast last-wins slot index by own registry key.
   */
  private readonly slotIndexByToken = new Map<RegistryKey, Map<string, BindingIdentifier>>();
  /**
   * Reverse index to quickly clear slot entries when a binding id is removed.
   */
  private readonly tokenByBindingId = new Map<BindingIdentifier, RegistryKey>();
  private readonly slotKeyByBindingId = new Map<BindingIdentifier, string>();
  private readonly inheritedConstantCache = new Map<RegistryKey, unknown>();
  private readonly isDevEnv: boolean = isDevelopmentOrTestEnvironment();

  /**
   * Internal constructor for root/child instances.
   * Use {@link Container.create}, {@link Container.fromModules}, or {@link createChild}.
   */
  private constructor(
    /**
     * This container's own registry (does not include parent bindings).
     */
    private readonly ownRegistry: BindingRegistry,
    /**
     * Scope cache manager; root owns singleton disposal, children share the singleton map.
     */
    private readonly ownScopeManager: ScopeManager,
    /**
     * Parent container for binding lookup fallback; `undefined` for root containers.
     */
    private readonly parent: DefaultContainer | undefined,
    /**
     * Stateless graph walker that delegates caching and lookup back to the container.
     */
    private readonly resolver: DependencyResolver,
    /**
     * Strategy for reading `@injectable()` / `@postConstruct()` metadata from constructors.
     */
    private readonly metadataReader: MetadataReader,
  ) {}

  /**
   * Creates a root container with an empty registry and fresh singleton/scoped caches.
   * Wires the circular container↔resolver reference via a mutable {@link ContainerRef} holder.
   */
  static create(): Container {
    const ownRegistry = new BindingRegistry();
    const ownScopeManager = ScopeManager.createRoot();
    const metadataReader = new SymbolMetadataReader();
    const holder: ContainerRef = { current: undefined };
    const resolver = new DependencyResolver({
      lookup: (token) => {
        const current = holder.current;
        if (current === undefined) {
          throw new InternalError("container is not initialized");
        }
        return current.lookupBindingsInternal(token);
      },
      scopeManager: ownScopeManager,
      metadataReader,
    });
    const container = new DefaultContainer(
      ownRegistry,
      ownScopeManager,
      undefined,
      resolver,
      metadataReader,
    );
    holder.current = container;
    return container;
  }

  /**
   * Starts a fluent {@link BindingBuilder} for the given token or constructor.
   * The `to*()` call selects the binding strategy; the first registry commit runs in a
   * microtask (see {@link BindingBuilder}), then later chain calls update the committed binding.
   */
  bind<Value>(token: Token<Value> | Constructor<Value>): BindingBuilder<Value> {
    return new BindingBuilder<Value>(token, undefined, {
      onPending: (builder) =>
        this.pendingRegistrationBuilders.add(builder as unknown as BindingBuilder<unknown>),
      onCommitted: (builder) =>
        this.pendingRegistrationBuilders.delete(builder as unknown as BindingBuilder<unknown>),
      register: (built) => {
        this.invalidateDevValidationState();
        this.registerOwnedBinding(
          token as Token<unknown> | Constructor<unknown>,
          built as Binding<unknown>,
        );
      },
      update: (built) => {
        this.invalidateDevValidationState();
        this.updateOwnedBinding(
          token as Token<unknown> | Constructor<unknown>,
          built as Binding<unknown>,
        );
      },
    });
  }

  /**
   * Fast registry presence check without instantiation.
   *
   * When `hint` is provided, this only verifies that at least one binding matches
   * the name/tag discriminator; it does not evaluate runtime `when()` predicates.
   */
  has(token: RegistryKey, hint?: ResolveHint): boolean {
    this.flushPendingBindings();
    const list = this.lookupBindingsInternal(token);
    if (list === undefined || list.length === 0) {
      return false;
    }
    if (hint === undefined) {
      return true;
    }
    return list.some((binding) => {
      if (hint.name !== undefined && binding.bindingName !== hint.name) {
        return false;
      }
      if (hint.tag !== undefined) {
        const tag = hint.tag;
        if (binding.tags.get(tag[0]) !== tag[1]) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Removes bindings by token or by binding id and synchronously releases cached instances.
   *
   * - `binding id` path removes one binding and its cache entry.
   * - `token` path removes all owned bindings for that key at once.
   */
  unbind(tokenOrId: RegistryKey | BindingIdentifier): void {
    this.prepareRegistryMutation();
    if (typeof tokenOrId === "string") {
      this.removeOwnedBindingById(tokenOrId);
      return;
    }
    this.releaseOwnedBindingsByToken(tokenOrId);
    this.ownRegistry.remove(tokenOrId);
    this.slotIndexByToken.delete(tokenOrId);
  }

  /**
   * Async counterpart of {@link unbind}; awaits deactivation hooks before registry removal.
   */
  async unbindAsync(tokenOrId: RegistryKey | BindingIdentifier): Promise<void> {
    this.prepareRegistryMutation();
    if (typeof tokenOrId === "string") {
      await this.removeOwnedBindingByIdAsync(tokenOrId);
      return;
    }
    await this.releaseOwnedBindingsByTokenAsync(tokenOrId);
    this.ownRegistry.remove(tokenOrId);
    this.slotIndexByToken.delete(tokenOrId);
  }

  /**
   * Replaces all owned bindings for `token` and returns a fresh builder.
   *
   * Existing cached instances for the removed bindings are synchronously released first.
   */
  rebind<Value>(token: Token<Value> | Constructor<Value>): BindingBuilder<Value> {
    this.prepareRegistryMutation();
    this.releaseOwnedBindingsByToken(token as RegistryKey);
    this.ownRegistry.remove(token as RegistryKey);
    this.slotIndexByToken.delete(token as RegistryKey);
    return this.bind(token);
  }

  /**
   * Registers bindings from synchronous modules. Re-loading a module already present on this
   * container is a no-op (deduplication, spec §7.3 Phase 3). When {@link isDevelopmentOrTestEnvironment}
   * is true, runs {@link validate} at most once after the registry changes.
   */
  load(...modules: Module[]): void {
    this.prepareRegistryMutation();
    for (const syncModule of modules) {
      if (syncModule instanceof AsyncModule) {
        throw new AsyncModuleLoadError(syncModule.name);
      }
      this.ensureSyncModuleLoaded(syncModule);
    }
    this.completeLoadMutation();
  }

  /**
   * Like {@link load} but allows async modules. Re-loading is deduplicated the same way.
   */
  async loadAsync(...modules: ModuleLike[]): Promise<void> {
    this.prepareRegistryMutation();
    for (const moduleOrAsync of modules) {
      if (moduleOrAsync instanceof AsyncModule) {
        await this.ensureAsyncModuleLoaded(moduleOrAsync);
      } else {
        this.ensureSyncModuleLoaded(moduleOrAsync);
      }
    }
    this.completeLoadMutation();
  }

  unload(...modules: ModuleLike[]): void {
    this.prepareRegistryMutation();
    for (const module of modules) {
      this.unloadLoadedModuleSync(module);
    }
  }

  async unloadAsync(...modules: ModuleLike[]): Promise<void> {
    this.prepareRegistryMutation();
    for (const module of modules) {
      await this.unloadLoadedModuleAsync(module);
    }
  }

  /**
   * Resolves synchronously. Captive dependency (singleton holding scoped/transient) throws
   * {@link ScopeViolationError} with binding ids and full resolution path. In dev/test, the first
   * successful resolution also triggers a one-time static {@link validate} when not in production.
   */
  resolve<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveHint): Value {
    this.flushPendingBindings();
    try {
      const fastResult = this.tryFastResolve<Value>(token, hint);
      if (fastResult !== NOT_FOUND) {
        return fastResult;
      }
      return this.resolver.resolveRoot(token, hint);
    } finally {
      this.maybeRunDevValidationOnce();
    }
  }

  /**
   * Async variant of {@link resolve}; same dev/test validation and runtime scope enforcement.
   */
  async resolveAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveHint,
  ): Promise<Value> {
    this.flushPendingBindings();
    try {
      return await this.resolver.resolveAsyncRoot(token, hint);
    } finally {
      this.maybeRunDevValidationOnce();
    }
  }

  /**
   * Optional root resolution: returns `undefined` when the requested key is absent (or filtered out
   * without a name/tag hint), while preserving normal errors for nested required dependencies.
   */
  resolveOptional<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveHint,
  ): Value | undefined {
    this.flushPendingBindings();
    try {
      return this.resolver.resolveOptionalRoot(token, hint);
    } finally {
      this.maybeRunDevValidationOnce();
    }
  }

  /**
   * Synchronously resolves every matching binding for a key.
   * Returns an empty array when no binding exists.
   */
  resolveAll<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveHint): Value[] {
    this.flushPendingBindings();
    try {
      return this.resolver.resolveAllRoot(token, hint);
    } finally {
      this.maybeRunDevValidationOnce();
    }
  }

  /**
   * Async variant of {@link resolveAll}: safe for multi-bindings that mix sync and async factories
   * (spec §5.2).
   */
  async resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveHint,
  ): Promise<Value[]> {
    this.flushPendingBindings();
    try {
      return await this.resolver.resolveAllAsyncRoot<Value>(token, hint);
    } finally {
      this.maybeRunDevValidationOnce();
    }
  }

  /**
   * Eagerly resolves every registered `singleton` binding, including `async-dynamic` factories.
   */
  async initializeAsync(): Promise<void> {
    this.flushPendingBindings();
    for (const registryKey of this.collectAllRegistryKeysInHierarchy()) {
      const list = this.lookupBindings(registryKey);
      if (list === undefined) {
        continue;
      }
      for (const binding of list) {
        if (binding.scope !== "singleton") {
          continue;
        }
        const hint = resolveHintForBinding(binding);
        await this.resolveAsync(registryKey as Token<unknown> | Constructor<unknown>, hint);
      }
    }
  }

  /**
   * Validates static dependency scope rules: a singleton must not depend on scoped/transient
   * class/factory/alias targets. Constant dependencies are always allowed.
   */
  validate(): void {
    this.flushPendingBindings();
    validateScopeRules({
      collectAllRegistryKeys: () => this.collectAllRegistryKeysInHierarchy(),
      lookupBindings: (registryKey) => this.lookupBindingsInternal(registryKey),
      getMetadataReader: () => this.metadataReader,
    });
  }

  /**
   * Dev/debug snapshot of registered bindings and activation status (design spec §5.5).
   */
  inspect(): ContainerSnapshot {
    this.flushPendingBindings();
    return this.createInspector().getSnapshot();
  }

  /**
   * Delegates canonical dependency-graph generation to {@link ContainerInspector}.
   */
  generateDependencyGraph(options?: GraphOptions): ContainerGraphJson {
    this.flushPendingBindings();
    return this.createInspector().generateDependencyGraph(options);
  }

  /**
   * Registers every class collected by `@injectable({ autoRegister: true })`.
   * Returns how many entries were processed.
   */
  loadAutoRegistered(): number {
    const entries = getAutoRegistered();
    let count = 0;
    for (const { implementationClass, scope } of entries) {
      const builder = this.bind(implementationClass as Constructor<unknown>).toSelf();
      switch (scope) {
        case "singleton":
          (builder as BindingBuilder<unknown>).singleton();
          break;
        case "scoped":
          (builder as BindingBuilder<unknown>).scoped();
          break;
        default:
          (builder as BindingBuilder<unknown>).transient();
      }
      count++;
    }
    return count;
  }

  [Symbol.dispose](): never {
    throw new InternalError(
      "Container disposal is async. Use `await using container = Container.create()` or call `await container.dispose()` instead of `using`.",
    );
  }

  /**
   * Child inherits parent bindings via lookup fallback and shares singleton instances,
   * but receives an isolated scoped cache.
   */
  createChild(): Container {
    const childRegistry = new BindingRegistry();
    const childScope = this.ownScopeManager.createChildScope();
    const holder: ContainerRef = { current: undefined };
    const resolver = new DependencyResolver({
      lookup: (token) => {
        const current = holder.current;
        if (current === undefined) {
          throw new InternalError("child container is not initialized");
        }
        return current.lookupBindingsInternal(token);
      },
      scopeManager: childScope,
      metadataReader: this.metadataReader,
    });
    const child = new DefaultContainer(
      childRegistry,
      childScope,
      this,
      resolver,
      this.metadataReader,
    );
    holder.current = child;
    return child;
  }

  lookupBindings(token: RegistryKey): readonly Binding<unknown>[] | undefined {
    this.flushPendingBindings();
    return this.lookupBindingsInternal(token);
  }

  /**
   * Disposes this container's scope manager and runs async deactivation hooks.
   */
  async dispose(): Promise<void> {
    this.flushPendingBindings();
    await this.ownScopeManager.disposeAsync();
  }

  /**
   * Async-dispose protocol hook used by `await using`.
   */
  [Symbol.asyncDispose](): Promise<void> {
    return this.dispose();
  }

  private flushPendingBindings(): void {
    if (this.pendingRegistrationBuilders.size === 0) {
      return;
    }
    while (this.pendingRegistrationBuilders.size > 0) {
      const nextPendingBuilder = this.pendingRegistrationBuilders.values().next().value as
        | BindingBuilder<unknown>
        | undefined;
      if (nextPendingBuilder === undefined) {
        return;
      }
      nextPendingBuilder.flushPendingRegistration();
    }
  }

  private getOrCreateSlotIndexForToken(token: RegistryKey): Map<string, BindingIdentifier> {
    const existing = this.slotIndexByToken.get(token);
    if (existing !== undefined) {
      return existing;
    }
    const created = new Map<string, BindingIdentifier>();
    this.slotIndexByToken.set(token, created);
    return created;
  }

  private reserveLastWinsSlot(
    token: Token<unknown> | Constructor<unknown>,
    nextBinding: Binding<unknown>,
  ): string | undefined {
    const slotKey = buildLastWinsSlotKey(nextBinding);
    if (slotKey === undefined) {
      return undefined;
    }
    const slotIndex = this.getOrCreateSlotIndexForToken(token);
    const existingBindingId = slotIndex.get(slotKey);
    if (existingBindingId !== undefined && existingBindingId !== nextBinding.id) {
      this.removeOwnedBindingById(existingBindingId);
    }
    slotIndex.set(slotKey, nextBinding.id);
    return slotKey;
  }

  private clearReservedLastWinsSlot(
    token: Token<unknown> | Constructor<unknown>,
    bindingId: BindingIdentifier,
  ): void {
    const previousSlotKey = this.slotKeyByBindingId.get(bindingId);
    if (previousSlotKey === undefined) {
      return;
    }
    const previousSlotIndex = this.slotIndexByToken.get(token);
    if (previousSlotIndex?.get(previousSlotKey) === bindingId) {
      previousSlotIndex.delete(previousSlotKey);
    }
    if (previousSlotIndex !== undefined && previousSlotIndex.size === 0) {
      this.slotIndexByToken.delete(token);
    }
  }

  private untrackBinding(bindingId: BindingIdentifier): void {
    const token = this.tokenByBindingId.get(bindingId);
    const slotKey = this.slotKeyByBindingId.get(bindingId);
    if (token !== undefined && slotKey !== undefined) {
      const slotIndex = this.slotIndexByToken.get(token);
      if (slotIndex?.get(slotKey) === bindingId) {
        slotIndex.delete(slotKey);
      }
      if (slotIndex !== undefined && slotIndex.size === 0) {
        this.slotIndexByToken.delete(token);
      }
    }
    this.tokenByBindingId.delete(bindingId);
    this.slotKeyByBindingId.delete(bindingId);
  }

  private removeOwnedBindingById(bindingId: BindingIdentifier): void {
    this.ownScopeManager.releaseByBindingId(bindingId);
    this.ownRegistry.removeById(bindingId);
    this.untrackBinding(bindingId);
  }

  private async removeOwnedBindingByIdAsync(bindingId: BindingIdentifier): Promise<void> {
    await this.ownScopeManager.releaseByBindingIdAsync(bindingId);
    this.ownRegistry.removeById(bindingId);
    this.untrackBinding(bindingId);
  }

  private releaseOwnedBindingsByToken(token: RegistryKey): void {
    const ownedBindings = this.ownRegistry.get(token as Token<unknown> | Constructor<unknown>);
    if (ownedBindings === undefined) {
      return;
    }
    for (const binding of ownedBindings) {
      this.ownScopeManager.releaseBinding(binding);
      this.untrackBinding(binding.id);
    }
  }

  private async releaseOwnedBindingsByTokenAsync(token: RegistryKey): Promise<void> {
    const ownedBindings = this.ownRegistry.get(token as Token<unknown> | Constructor<unknown>);
    if (ownedBindings === undefined) {
      return;
    }
    for (const binding of ownedBindings) {
      await this.ownScopeManager.releaseBindingAsync(binding);
      this.untrackBinding(binding.id);
    }
  }

  private prepareRegistryMutation(): void {
    this.flushPendingBindings();
    this.invalidateDevValidationState();
  }

  private completeLoadMutation(): void {
    this.flushPendingBindings();
    this.maybeRunDevValidationOnce();
  }

  private getLoadedBindingIdsOrThrow(module: ModuleLike): readonly BindingIdentifier[] {
    const ownedBindingIds = this.loadedModules.get(module);
    if (ownedBindingIds === undefined) {
      throw new InternalError(`Module "${module.name}" is not loaded on this container.`);
    }
    return ownedBindingIds;
  }

  private unloadLoadedModuleSync(module: ModuleLike): void {
    const ownedBindingIds = this.getLoadedBindingIdsOrThrow(module);
    for (const bindingId of [...ownedBindingIds].reverse()) {
      this.removeOwnedBindingById(bindingId);
    }
    this.loadedModules.delete(module);
  }

  private async unloadLoadedModuleAsync(module: ModuleLike): Promise<void> {
    const ownedBindingIds = this.getLoadedBindingIdsOrThrow(module);
    for (const bindingId of [...ownedBindingIds].reverse()) {
      await this.removeOwnedBindingByIdAsync(bindingId);
    }
    this.loadedModules.delete(module);
  }

  private registerOwnedBinding(
    token: Token<unknown> | Constructor<unknown>,
    nextBinding: Binding<unknown>,
  ): void {
    const slotKey = this.reserveLastWinsSlot(token, nextBinding);
    const trackedToken = this.tokenByBindingId.get(nextBinding.id);
    if (trackedToken !== undefined) {
      this.removeOwnedBindingById(nextBinding.id);
    }
    this.ownRegistry.add(token, nextBinding);
    this.tokenByBindingId.set(nextBinding.id, token);
    if (slotKey !== undefined) {
      this.slotKeyByBindingId.set(nextBinding.id, slotKey);
    } else {
      this.slotKeyByBindingId.delete(nextBinding.id);
    }
  }

  private updateOwnedBinding(
    token: Token<unknown> | Constructor<unknown>,
    nextBinding: Binding<unknown>,
  ): void {
    this.clearReservedLastWinsSlot(token, nextBinding.id);
    this.ownRegistry.replaceById(nextBinding.id, nextBinding);
    const slotKey = this.reserveLastWinsSlot(token, nextBinding);
    if (slotKey !== undefined) {
      this.slotKeyByBindingId.set(nextBinding.id, slotKey);
    } else {
      this.slotKeyByBindingId.delete(nextBinding.id);
    }
    this.tokenByBindingId.set(nextBinding.id, token);
  }

  private tryFastResolve<Value>(
    token: Token<Value> | Constructor<Value>,
    hint: ResolveHint | undefined,
  ): Value | typeof NOT_FOUND {
    const registryKey = token as RegistryKey;
    if (
      this.parent !== undefined &&
      hint === undefined &&
      this.inheritedConstantCache.has(registryKey)
    ) {
      return this.inheritedConstantCache.get(registryKey) as Value;
    }
    const binding = this.getSingleBindingInHierarchy(token, hint);
    if (binding === undefined) {
      return NOT_FOUND;
    }
    if (binding.constraint !== undefined) {
      return NOT_FOUND;
    }
    if (binding.onActivation !== undefined) {
      return NOT_FOUND;
    }
    if (binding.onDeactivation !== undefined) {
      return NOT_FOUND;
    }
    if (binding.kind === "async-dynamic") {
      return NOT_FOUND;
    }
    if (binding.kind === "constant") {
      if (this.parent !== undefined && hint === undefined) {
        const own = this.ownRegistry.get(registryKey as Token<unknown> | Constructor<unknown>);
        if (own === undefined || own.length === 0) {
          this.inheritedConstantCache.set(registryKey, binding.value);
        }
      }
      return binding.value as Value;
    }
    if (this.ownScopeManager.isBindingCached(binding)) {
      return this.ownScopeManager.getOrCreate(binding, () => {
        throw new InternalError("Expected cached value for binding");
      }) as Value;
    }
    return NOT_FOUND;
  }

  private getSingleBindingInHierarchy(
    token: Token<unknown> | Constructor<unknown>,
    hint: ResolveHint | undefined,
  ): Binding<unknown> | undefined {
    const key = token as RegistryKey;
    const own = this.ownRegistry.get(key);
    if (own !== undefined && own.length > 0) {
      return this.ownRegistry.getSingleBinding(key, hint);
    }
    return this.parent?.getSingleBindingInHierarchy(token, hint) ?? undefined;
  }

  /**
   * Marks the dev/test one-shot validation as stale so the next resolve or load triggers it again.
   * Called on every registry mutation (bind, unbind, rebind, load, unload).
   */
  private invalidateDevValidationState(): void {
    this.inheritedConstantCache.clear();
    this.hasDevValidationRun = false;
  }

  /**
   * Runs scope validation at most once per registry epoch when `NODE_ENV` is not `"production"`.
   * Guards against repeated validation on successive resolves without intervening mutations.
   */
  private maybeRunDevValidationOnce(): void {
    if (!this.isDevEnv) {
      return;
    }
    if (this.hasDevValidationRun) {
      return;
    }
    this.hasDevValidationRun = true;
    this.validate();
  }

  /**
   * Constructs a {@link ContainerInspector} wired to this container's full hierarchy.
   */
  private createInspector(): ContainerInspector {
    const context: ContainerInspectorContext = {
      collectAllRegistryKeys: () => this.collectAllRegistryKeysInHierarchy(),
      lookupBindings: (token) => this.lookupBindingsInternal(token),
      isBindingCached: (binding) => this.ownScopeManager.isBindingCached(binding),
      metadataReader: this.metadataReader,
    };
    return new ContainerInspector(context);
  }

  /**
   * Collects the union of all registry keys from this container and every ancestor.
   * Deduplicates by reference equality (tokens are objects).
   */
  private collectAllRegistryKeysInHierarchy(): RegistryKey[] {
    const keys = new Set<RegistryKey>();
    this.accumulateRegistryKeysFromHierarchy(keys, this);
    return [...keys];
  }

  /**
   * Recursive helper: walks the parent chain bottom-up, adding each level's registry keys.
   */
  private accumulateRegistryKeysFromHierarchy(
    keys: Set<RegistryKey>,
    container: DefaultContainer | undefined,
  ): void {
    if (container === undefined) {
      return;
    }
    for (const entry of container.ownRegistry.listEntries()) {
      keys.add(entry.key);
    }
    this.accumulateRegistryKeysFromHierarchy(keys, container.parent);
  }

  /**
   * Lookup helper with parent fallback: own bindings take precedence over parent bindings.
   */
  private lookupBindingsInternal(token: RegistryKey): readonly Binding<unknown>[] | undefined {
    const own = this.ownRegistry.get(token as Token<unknown> | Constructor<unknown>);
    if (own !== undefined && own.length > 0) {
      return own;
    }
    return this.parent?.lookupBindingsForDescendant(token);
  }

  private lookupBindingsForDescendant(token: RegistryKey): readonly Binding<unknown>[] | undefined {
    this.flushPendingBindings();
    return this.lookupBindingsInternal(token);
  }

  /**
   * Returns a `bind` function scoped to a module. Registrations are tracked in
   * {@link loadedModules} for {@link unload}.
   */
  private bindForModule(
    owner: ModuleLike,
  ): <Value>(token: Token<Value> | Constructor<Value>) => BindingBuilder<Value> {
    return <Value>(token: Token<Value> | Constructor<Value>) =>
      new BindingBuilder<Value>(token, owner.name, {
        onPending: (builder) =>
          this.pendingRegistrationBuilders.add(builder as unknown as BindingBuilder<unknown>),
        onCommitted: (builder) =>
          this.pendingRegistrationBuilders.delete(builder as unknown as BindingBuilder<unknown>),
        register: (built) => {
          this.invalidateDevValidationState();
          this.registerOwnedBinding(
            token as Token<unknown> | Constructor<unknown>,
            built as Binding<unknown>,
          );
          this.recordBindingForModule(owner, built.id);
        },
        update: (built) => {
          this.invalidateDevValidationState();
          this.updateOwnedBinding(
            token as Token<unknown> | Constructor<unknown>,
            built as Binding<unknown>,
          );
        },
      });
  }

  /**
   * Appends a binding ID to the tracking list for `owner` so {@link unload} can remove it later.
   */
  private recordBindingForModule(owner: ModuleLike, id: BindingIdentifier): void {
    const list = this.loadedModules.get(owner);
    if (list === undefined) {
      this.loadedModules.set(owner, [id]);
      return;
    }
    list.push(id);
  }

  /**
   * Creates the {@link ModuleBuilder} passed to a sync module's setup callback.
   * The `import` method throws {@link InternalError} if an {@link AsyncModule} is passed.
   */
  private createSyncModuleBuilder(module: Module): ModuleBuilder {
    return {
      import: (...deps: Module[]) => {
        for (const dep of deps) {
          if (dep instanceof AsyncModule) {
            throw new InternalError(
              `Module "${module.name}" cannot synchronously import async module "${dep.name}".`,
            );
          }
          this.ensureSyncModuleLoaded(dep);
        }
      },
      bind: this.bindForModule(module),
    };
  }

  /**
   * Creates the {@link AsyncModuleBuilder} and a companion `awaitImports` thunk.
   * Async sub-imports are collected into `pendingImports` and flushed after the module's
   * own setup returns — this avoids interleaving setup code with dependency loading.
   */
  private createAsyncModuleBuilder(module: AsyncModule): {
    readonly moduleBuilder: AsyncModuleBuilder;
    readonly awaitImports: () => Promise<void>;
  } {
    const pendingImports: Promise<void>[] = [];
    return {
      moduleBuilder: {
        import: (...deps: ModuleLike[]) => {
          for (const dep of deps) {
            if (dep instanceof AsyncModule) {
              pendingImports.push(this.ensureAsyncModuleLoaded(dep));
            } else {
              this.ensureSyncModuleLoaded(dep);
            }
          }
        },
        bind: this.bindForModule(module),
      },
      awaitImports: async () => {
        if (pendingImports.length === 0) {
          return;
        }
        await Promise.all(pendingImports);
      },
    };
  }

  /**
   * Loads a sync module if not already loaded. Detects circular module imports via
   * {@link syncModuleStack} and throws {@link CircularDependencyError} with the full cycle path.
   * The module is marked as loaded *before* its setup runs so that re-entrant imports are deduped.
   */
  private ensureSyncModuleLoaded(module: Module): void {
    if (this.loadedModules.has(module)) {
      return;
    }
    if (this.syncModuleStack.includes(module)) {
      throw new CircularDependencyError([
        ...this.syncModuleStack.map((stackedModule) => stackedModule.name),
        module.name,
      ]);
    }
    this.syncModuleStack.push(module);
    try {
      // Register the module in the tracking table before running setup so nested imports
      // (which may bind before returning) find an entry keyed by this module.
      this.loadedModules.set(module, []);
      const moduleBuilder = this.createSyncModuleBuilder(module);
      module.runSyncSetup(moduleBuilder);
    } finally {
      this.syncModuleStack.pop();
    }
  }

  /**
   * Async counterpart of {@link ensureSyncModuleLoaded}: loads the module's async setup,
   * then flushes any pending async sub-imports collected during setup.
   */
  private async ensureAsyncModuleLoaded(asyncModule: AsyncModule): Promise<void> {
    if (this.loadedModules.has(asyncModule)) {
      return;
    }
    if (this.asyncModuleStack.includes(asyncModule)) {
      throw new CircularDependencyError([
        ...this.asyncModuleStack.map((stackedAsyncModule) => stackedAsyncModule.name),
        asyncModule.name,
      ]);
    }
    this.asyncModuleStack.push(asyncModule);
    try {
      this.loadedModules.set(asyncModule, []);
      const { moduleBuilder, awaitImports } = this.createAsyncModuleBuilder(asyncModule);
      await asyncModule.runAsyncSetup(moduleBuilder);
      await awaitImports();
    } finally {
      this.asyncModuleStack.pop();
    }
  }
}

/**
 * Factory functions for {@link Container} instances (interface + namespace merge).
 */
export namespace Container {
  /**
   * Creates an empty container with no bindings.
   */
  export function create(): Container {
    return DefaultContainer.create();
  }

  /**
   * Creates a container and immediately loads the given sync modules.
   */
  export function fromModules(...modules: Module[]): Container {
    const container = DefaultContainer.create();
    container.load(...modules);
    return container;
  }

  /**
   * Creates a container and awaits loading of sync and/or async modules.
   */
  export async function fromModulesAsync(...modules: (Module | AsyncModule)[]): Promise<Container> {
    const container = DefaultContainer.create();
    await container.loadAsync(...modules);
    return container;
  }
}
