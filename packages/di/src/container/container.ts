import type { BindingRegistration } from "#container/binding-chain";
import { BindingChain } from "#container/binding-chain";
import type { Binding, ConstantBinding } from "#core/binding";
import { effectiveBindingScope, NO_INSTANCE } from "#core/binding";
import type { BindToBuilder } from "#core/binding-builders";
import { getOrInsert } from "#core/map-upsert";
import type { AsyncModule, AsyncModuleBuilder, ModuleBuilder, SyncModule } from "#core/module";
import { isSyncModule, MODULE_SETUP } from "#core/module";
import { BindingRegistry } from "#core/registry";
import { advanceDisposeEpoch, disposeEpochRef } from "#core/state-epoch";
import type { Token } from "#core/token";
import { tokenName } from "#core/token";
import type {
  ActivationHandler,
  BindingIdentifier,
  Constructor,
  DeactivationHandler,
  Resolver,
  ResolveOptions,
} from "#core/types";
import { AsyncModuleLoadError, DisposedContainerError, RebindUnboundTokenError } from "#errors";
import { bindingSlotToResolveOptions } from "#injection/dependency-slot";
import type { ResolutionDiagnostics } from "#introspection/diagnostics";
import { RESOLUTION_DIAGNOSTICS } from "#introspection/diagnostics";
import { Inspector } from "#introspection/inspector";
import { LifecycleManager } from "#lifecycle/hooks";
import { SCOPED_MISS, ScopeManager } from "#lifecycle/scopes";
import { MetadataReaderToken } from "#metadata/reader-token";
import { defaultMetadataReader } from "#metadata/symbol-reader";
import type { MetadataReader } from "#metadata/types";
import { verifyingMetadataReader } from "#metadata/verifying-reader";
import { ROOT_BRANCH } from "#resolution/path";
import { DependencyResolver } from "#resolution/resolver";

// ── Container interface ──────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The public surface: binding, resolving, modules, lifecycle hooks, child scopes, and disposal.
 *
 * @since 0.3.16-canary.0
 */
export interface Container extends Resolver {
  readonly isDisposed: boolean;

  bind<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
  ): BindToBuilder<Value, Names>;
  unbind(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): void;
  unbindAsync(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): Promise<void>;
  unbindAll(): void;
  unbindAllAsync(): Promise<void>;
  rebind<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
  ): BindToBuilder<Value, Names>;

  load(...modules: Array<SyncModule>): void;
  loadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void>;
  unload(...modules: Array<SyncModule>): void;
  unloadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void>;

  onActivation<Value>(token: Token<Value> | Constructor<Value>, handler: ActivationHandler<Value>): void;
  onDeactivation<Value>(token: Token<Value> | Constructor<Value>, handler: DeactivationHandler<Value>): void;

  createChild(): Container;

  disposeAsync(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;

  initializeAsync(): Promise<void>;

  has<Names extends string = string>(
    token: Token<unknown, Names> | Constructor,
    options?: NoInfer<ResolveOptions<Names>>,
  ): boolean;
  hasOwn<Names extends string = string>(
    token: Token<unknown, Names> | Constructor,
    options?: NoInfer<ResolveOptions<Names>>,
  ): boolean;
}

/**
 * What a container has to be told before it exists, as opposed to what it can be bound later.
 *
 * @since 0.6.0
 */
export interface ContainerOptions {
  /**
   * Reader the resolver consults for class metadata, replacing the decorator reader.
   *
   * @remarks Takes precedence over a {@link MetadataReaderToken} binding, and children inherit it.
   * A resolver is handed its reader when it is built, so this is the only way to give the container
   * you are creating a reader of your own.
   */
  readonly metadataReader?: MetadataReader | undefined;
}

/**
 * The factory surface the `Container` companion object exposes.
 *
 * @since 0.3.16-canary.0
 */
export interface ContainerStatic {
  create(options?: ContainerOptions): Container;
  fromModules(...modules: Array<SyncModule>): Container;
  fromModulesAsync(...modules: Array<SyncModule | AsyncModule>): Promise<Container>;
}

/**
 * The state the container functions read off a container, kept off its public surface.
 *
 * @remarks `ancestorRegistries` lists each ancestor's registry nearest first — the order every chain walk reads them in.
 *
 * @since 0.14.0
 */
export interface ContainerInternals {
  readonly registry: BindingRegistry;
  readonly ancestorRegistries: ReadonlyArray<BindingRegistry>;
  readonly resolver: DependencyResolver;
  readonly metadataReader: MetadataReader;
  readonly lifecycle: LifecycleManager;
}

/**
 * Reads the internals of a live container `Container` created.
 *
 * @throws `TypeError` for an object `Container` did not create, `DisposedContainerError` for a disposed chain.
 *
 * @since 0.14.0
 */
export function containerInternals(container: Container): ContainerInternals {
  return DefaultContainer.internalsOf(container);
}

/**
 * Reads the inspector of a live container `Container` created, built on first use.
 *
 * @throws `TypeError` for an object `Container` did not create, `DisposedContainerError` for a disposed chain.
 *
 * @since 0.14.0
 */
export function containerInspector(container: Container): Inspector {
  return DefaultContainer.inspectorOf(container);
}

/** Bindings owing a deactivation, each followed by the instance it is owed for. */
type DeactivationPairs = ReadonlyArray<unknown>;
const NO_DEACTIVATION_PAIRS: DeactivationPairs = Object.freeze([]);

// ── DefaultContainer ─────────────────────────────────────────────────────────────────────────────────────────────────

class DefaultContainer implements Container {
  #disposed = false;
  // The dispose epoch at which this child's chain was last confirmed live. Every dispose anywhere
  // bumps the epoch, so an unchanged epoch means no ancestor closed since — the chain needs no walk.
  #liveGeneration = -1;
  // The one teardown run — every disposeAsync() call returns it once it exists.
  #disposePromise: Promise<void> | undefined;
  readonly #registry: BindingRegistry;
  readonly #scope: ScopeManager;
  readonly #lifecycle: LifecycleManager;
  #resolver!: DependencyResolver;
  // Whether the reader came from `ContainerOptions` here or on an ancestor, which no token binding may override.
  #hasConfiguredReader = false;
  // Built on the first introspecting call — a container that only binds and resolves never needs it.
  #inspector: Inspector | undefined;
  readonly #parent: DefaultContainer | undefined;

  // Module tracking: module -> ref count. Both tables stay unallocated until a module is loaded.
  #moduleRefs: Map<object, number> | undefined;
  // Module bindings: module -> array of binding IDs registered by it
  #moduleBindingIds: Map<object, Array<BindingIdentifier>> | undefined;
  // Module imports: module -> the modules it imported, so unload decrements their ref-count too.
  #moduleImports: Map<object, Array<object>> | undefined;
  // One shared registration for every chain this container's own `bind()` creates.
  #registration: BindingRegistration | undefined;
  // Bindings a plain last-wins bind displaced with a teardown still owed, by id: an unbind of that id or an
  // unload of its module drains it, and dispose runs a constant's hook, which neither the registry nor the cache holds.
  #orphanedBindings: Map<BindingIdentifier, Binding> | undefined;

  constructor(parent?: DefaultContainer, options?: ContainerOptions) {
    // oxlint-disable-next-line typescript/unbound-method -- installed as this instance's own method, so `this` is it
    this.resolve = parent === undefined ? DefaultContainer.#rootResolve : DefaultContainer.#childResolve;
    this.#parent = parent;
    this.#registry = new BindingRegistry();
    this.#scope = new ScopeManager(parent !== undefined);
    this.#lifecycle = new LifecycleManager();
    this.#initResolver(options?.metadataReader);
  }

  #getInspector(): Inspector {
    return (this.#inspector ??= new Inspector(
      this.#registry,
      this.#scope,
      this.#parent !== undefined,
      () => this.#disposed,
    ));
  }

  [RESOLUTION_DIAGNOSTICS](): ResolutionDiagnostics {
    const resolverCaches = this.#resolver.describeCaches();
    const builtSubsystems: Array<string> = [];
    if (this.#inspector !== undefined) {
      builtSubsystems.push("container.inspector");
    }
    if (this.#moduleRefs !== undefined || this.#moduleBindingIds !== undefined || this.#moduleImports !== undefined) {
      builtSubsystems.push("container.moduleTables");
    }
    if (this.#registry.isRecordMapBuilt) {
      builtSubsystems.push("registry.records");
    }
    if (this.#registry.isIdIndexBuilt) {
      builtSubsystems.push("registry.idIndex");
    }
    if (this.#registry.isTaggedIndexBuilt) {
      builtSubsystems.push("registry.taggedIndex");
    }
    if (this.#scope.isScopedCacheBuilt) {
      builtSubsystems.push("scope.scoped");
    }
    if (this.#lifecycle.isActivationTableBuilt) {
      builtSubsystems.push("lifecycle.activationHooks");
    }
    builtSubsystems.push(...resolverCaches.builtSubsystems);
    return { ...resolverCaches, scopedInstanceCount: this.#scope.scopedCount, builtSubsystems };
  }

  #initResolver(configuredReader: MetadataReader | undefined): void {
    const parent = this.#parent;
    this.#hasConfiguredReader = configuredReader !== undefined || (parent !== undefined && parent.#hasConfiguredReader);
    const metadataReader = verifyingMetadataReader(
      configuredReader ?? (parent === undefined ? defaultMetadataReader : parent.#readerForChild()),
    );
    const parentResolver = parent === undefined ? undefined : parent.#resolver;
    this.#resolver = new DependencyResolver(
      this.#registry,
      this.#scope,
      this.#lifecycle,
      metadataReader,
      this,
      parentResolver,
    );
  }

  /** What a container being constructed under this one inherits: a configured reader, else one bound here, else this one's. */
  #readerForChild(): MetadataReader {
    if (!this.#hasConfiguredReader && this.#registry.has(MetadataReaderToken)) {
      try {
        return this.#resolver.resolve(MetadataReaderToken, undefined, []);
      } catch {
        // An unresolvable reader binding is not worth failing a child over.
      }
    }
    return this.#resolver.metadataReader;
  }

  /** One reader per container, fixed when its resolver was built — so every path agrees on it. */
  #getMetadataReader(): MetadataReader {
    return this.#resolver.metadataReader;
  }

  get isDisposed(): boolean {
    return this.#isChainDisposed();
  }

  // ── Binding ────────────────────────────────────────────────────────────────────────────────────────────────────────

  bind<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
  ): BindToBuilder<Value, Names> {
    this.#assertNotDisposed();
    return this.#createBindToBuilder(token);
  }

  /** The registration every non-module chain shares, so `bind()` allocates only the builder. */
  #ownRegistration(): BindingRegistration {
    return (this.#registration ??= {
      registry: this.#registry,
      scope: this.#scope,
      moduleBindingIds: undefined,
      onDisplaced: (binding) => {
        this.#recordDisplaced(binding);
      },
    });
  }

  // A displaced binding holding a cached instance or owing a constant's deactivation is remembered until
  // dispose, an unbind of its id or its module's unload; every other displaced binding is dropped.
  #recordDisplaced(binding: Binding): void {
    if (binding.instance !== NO_INSTANCE || this.#owesConstantDeactivation(binding)) {
      (this.#orphanedBindings ??= new Map()).set(binding.identifier, binding);
    }
  }

  /**
   * One registration per module load, holding that module's id list directly.
   *
   * @remarks It borrows the container's own displacement callback, so a constant a module's bind
   * displaces is kept for dispose exactly as one displaced by `bind()` is.
   */
  #moduleRegistration(moduleRef: object): BindingRegistration {
    this.#moduleBindingIds ??= new Map();
    const { onDisplaced } = this.#ownRegistration();
    return {
      registry: this.#registry,
      scope: this.#scope,
      moduleBindingIds: getOrInsert(this.#moduleBindingIds, moduleRef, []),
      onDisplaced,
    };
  }

  #createBindToBuilder<Value>(
    token: Token<Value> | Constructor<Value>,
    registration: BindingRegistration = this.#ownRegistration(),
  ): BindToBuilder<Value> {
    return new BindingChain<Value>(token, registration);
  }

  unbind(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): void {
    this.#assertNotDisposed();
    this.#unbindSync(tokenOrId);
  }

  /** Remove bindings from registry + scope and collect [binding, instance] pairs for deactivation. */
  #collectDeactivationPairs(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): DeactivationPairs {
    if (typeof tokenOrId === "number") {
      const binding = this.#registry.removeById(tokenOrId) ?? this.#retireNotLive(tokenOrId);
      return binding === undefined ? NO_DEACTIVATION_PAIRS : this.#drainSingletons([binding]);
    }
    // Dropping the whole token in one pass: removing each binding by id instead would re-scan and
    // re-index the token's binding list once per binding.
    return this.#drainSingletons(this.#registry.removeByToken(tokenOrId));
  }

  /** Retires an id the registry no longer holds, returning the displaced binding still owed a teardown. */
  #retireNotLive(id: BindingIdentifier): Binding | undefined {
    const orphaned = this.#orphanedBindings?.get(id);
    if (orphaned !== undefined) {
      this.#orphanedBindings!.delete(id);
    }
    return orphaned;
  }

  /** Drain scope entries for already-removed bindings, and pair each one that still owes a deactivation. */
  #drainSingletons(bindings: ReadonlyArray<Binding>): DeactivationPairs {
    // One flat list, allocated by the first pair owed: an unbind or rebind of a binding nothing
    // ever cached — the hot-swap shape — owes no deactivation and hands the shared empty list back.
    let pairs: Array<unknown> | undefined;
    for (let index = 0; index < bindings.length; index += 1) {
      pairs = this.#drainSingleton(bindings[index]!, pairs);
    }
    return pairs ?? NO_DEACTIVATION_PAIRS;
  }

  /** One binding's share of {@link DefaultContainer.#drainSingletons}, allocating `pairs` on the first pair owed. */
  #drainSingleton(binding: Binding, pairs: Array<unknown> | undefined): Array<unknown> | undefined {
    if (binding.instance !== NO_INSTANCE) {
      (pairs ??= []).push(binding, binding.instance);
      this.#scope.deleteSingleton(binding);
    } else if (this.#owesConstantDeactivation(binding)) {
      (pairs ??= []).push(binding, binding.value);
    }
    const scopedInstance = this.#scope.takeScoped(binding.scopedCacheKey);
    if (scopedInstance !== SCOPED_MISS) {
      (pairs ??= []).push(binding, scopedInstance);
    }
    return pairs;
  }

  /**
   * Whether a constant still owes its deactivation.
   *
   * @remarks A constant's value is handed in at bind time rather than built on demand, so its hook is
   * owed whether or not anything ever resolved it. Callers check `instance` first: a constant that
   * carries one was cached through activation and is deactivated with that value instead.
   */
  #owesConstantDeactivation(binding: Binding): binding is ConstantBinding<unknown> {
    return (
      binding.kind === "constant" &&
      (binding.deactivationHook !== undefined || this.#lifecycle.hasDeactivationHandlers(binding.token))
    );
  }

  /** Runs every pair's deactivation even when one throws, then reports what threw. */
  #deactivatePairsSync(pairs: DeactivationPairs): void {
    if (pairs.length === 0) {
      return;
    }
    const reader = this.#getMetadataReader();
    const lifecycle = this.#lifecycle;
    let errors: Array<unknown> | undefined;
    for (let index = 0; index < pairs.length; index += 2) {
      try {
        lifecycle.runDeactivationSync(pairs[index] as Binding, pairs[index + 1], reader);
      } catch (error) {
        (errors ??= []).push(error);
      }
    }
    if (errors !== undefined) {
      throwCollected(errors, "unbind completed, but deactivation hooks threw");
    }
  }

  async #deactivatePairs(pairs: DeactivationPairs): Promise<void> {
    if (pairs.length === 0) {
      return;
    }
    const reader = this.#getMetadataReader();
    const lifecycle = this.#lifecycle;
    let errors: Array<unknown> | undefined;
    for (let index = 0; index < pairs.length; index += 2) {
      try {
        await lifecycle.runDeactivation(pairs[index] as Binding, pairs[index + 1], reader);
      } catch (error) {
        (errors ??= []).push(error);
      }
    }
    if (errors !== undefined) {
      throwCollected(errors, "unbind completed, but deactivation hooks threw");
    }
  }

  #unbindSync(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): void {
    this.#deactivatePairsSync(this.#collectDeactivationPairs(tokenOrId));
  }

  async unbindAsync(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): Promise<void> {
    this.#assertNotDisposed();
    await this.#deactivatePairs(this.#collectDeactivationPairs(tokenOrId));
  }

  unbindAll(): void {
    this.#assertNotDisposed();
    this.#deactivatePairsSync(this.#drainSingletons(this.#registry.clear()));
    this.#resetModuleTables();
  }

  async unbindAllAsync(): Promise<void> {
    this.#assertNotDisposed();
    await this.#deactivatePairs(this.#drainSingletons(this.#registry.clear()));
    this.#resetModuleTables();
  }

  // Clearing the registry also clears module bookkeeping, so a later `load()` of the same module is
  // not silently skipped as already-loaded. Run after deactivation so the module's hooks still fire.
  #resetModuleTables(): void {
    this.#moduleRefs = undefined;
    this.#moduleBindingIds = undefined;
    this.#moduleImports = undefined;
  }

  rebind<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
  ): BindToBuilder<Value, Names> {
    this.#assertNotDisposed();
    // A lone default binding that owes no deactivation is replaced by the new chain's own
    // registration, so the swap unbinds nothing up front. Anything else is unbound first, so an
    // async deactivation throws here — before a replacement exists — exactly as `unbind()` does.
    const lone = this.#registry.getFastDefault(token);
    if (lone === undefined || lone.instance !== NO_INSTANCE || this.#owesConstantDeactivation(lone)) {
      if (!this.#registry.has(token)) {
        throw new RebindUnboundTokenError(tokenName(token));
      }
      this.#unbindSync(token);
      return this.#createBindToBuilder(token);
    }
    return new BindingChain<Value>(token, this.#rebindRegistration());
  }

  #displacingRegistration: BindingRegistration | undefined;

  /** A registration whose displaced binding is deactivated on the spot instead of kept for dispose, for `rebind`. */
  #rebindRegistration(): BindingRegistration {
    return (this.#displacingRegistration ??= {
      registry: this.#registry,
      scope: this.#scope,
      moduleBindingIds: undefined,
      // One binding at a time, so the hot-swap rebind that owes nothing allocates nothing.
      deactivateDisplaced: (binding) => {
        const pairs = this.#drainSingleton(binding, undefined);
        if (pairs !== undefined) {
          this.#deactivatePairsSync(pairs);
        }
      },
    });
  }

  // ── Module ─────────────────────────────────────────────────────────────────────────────────────────────────────────

  load(...modules: Array<SyncModule>): void {
    this.#assertNotDisposed();
    this.#loadSyncModules(modules);
  }

  // Imports nested inside a module's setup re-enter here through the builder, so a module listed
  // twice in one call is deduped by identity and the rest is ref-counting.
  #loadSyncModules(modules: ReadonlyArray<SyncModule | AsyncModule>): void {
    for (const module of new Set(modules)) {
      if (!isSyncModule(module)) {
        throw new AsyncModuleLoadError(module.name);
      }
      const moduleRef = module as object;
      const moduleRefs = (this.#moduleRefs ??= new Map<object, number>());
      const existing = moduleRefs.get(moduleRef);
      if (existing !== undefined) {
        moduleRefs.set(moduleRef, existing + 1);
        continue;
      }
      moduleRefs.set(moduleRef, 1);
      this.#applySyncModule(module, moduleRef);
    }
  }

  /** Runs a sync module's setup, or files its declarations, rolling the load back if either throws. */
  #applySyncModule(module: SyncModule, moduleRef: object): void {
    const setup = module[MODULE_SETUP];
    try {
      if (typeof setup === "function") {
        setup(this.#createModuleBuilder(moduleRef));
      } else {
        BindingChain.registerDeclared(setup, this.#moduleRegistration(moduleRef));
      }
    } catch (error) {
      throw this.#rollbackFailedLoadSync(moduleRef, error);
    }
  }

  async loadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void> {
    this.#assertNotDisposed();
    // Deduped by identity like the sync lane, so `loadAsync(m, m)` ref-counts once.
    for (const module of new Set(modules)) {
      await this.#loadOneModuleAsync(module);
    }
  }

  /** Undo a failed load — bindings registered before the throw and the ref-count both roll back. */
  #rollbackFailedLoadSync(moduleRef: object, cause: unknown): unknown {
    const pairs = this.#removeModuleBindings(moduleRef);
    try {
      this.#deactivatePairsSync(pairs);
    } catch (rollbackError) {
      return new AggregateError([cause, rollbackError], "module load failed, and rolling it back threw too");
    }
    return cause;
  }

  async #rollbackFailedLoad(moduleRef: object, cause: unknown): Promise<unknown> {
    const pairs = this.#removeModuleBindings(moduleRef);
    try {
      await this.#deactivatePairs(pairs);
    } catch (rollbackError) {
      return new AggregateError([cause, rollbackError], "module load failed, and rolling it back threw too");
    }
    return cause;
  }

  async #loadOneModuleAsync(module: SyncModule | AsyncModule): Promise<void> {
    const moduleRef = module as object;
    const moduleRefs = (this.#moduleRefs ??= new Map<object, number>());
    const existing = moduleRefs.get(moduleRef);
    if (existing !== undefined) {
      moduleRefs.set(moduleRef, existing + 1);
      return;
    }
    moduleRefs.set(moduleRef, 1);

    if (isSyncModule(module)) {
      this.#applySyncModule(module, moduleRef);
    } else {
      const importPromises: Array<Promise<void>> = [];
      const builder = this.#createAsyncModuleBuilder(moduleRef, importPromises);
      try {
        await module[MODULE_SETUP](builder);
        // Await nested async imports triggered inside the setup callback
        if (importPromises.length > 0) {
          await Promise.all(importPromises);
        }
      } catch (error) {
        // Nested imports may still be registering — let them settle before rolling back, so no
        // registration lands after the rejection and none becomes an unhandled rejection.
        await Promise.allSettled(importPromises);
        throw await this.#rollbackFailedLoad(moduleRef, error);
      }
    }
  }

  #createModuleBuilder(moduleRef: object): ModuleBuilder {
    const registration = this.#moduleRegistration(moduleRef);
    return {
      bind: <Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> =>
        this.#createBindToBuilder(token, registration),
      import: (...modules: Array<SyncModule>): void => {
        this.#recordModuleImports(moduleRef, modules);
        this.#loadSyncModules(modules);
      },
    };
  }

  #createAsyncModuleBuilder(moduleRef: object, importPromises: Array<Promise<void>>): AsyncModuleBuilder {
    const registration = this.#moduleRegistration(moduleRef);
    return {
      bind: <Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> =>
        this.#createBindToBuilder(token, registration),
      import: (...modules: Array<SyncModule | AsyncModule>): void => {
        this.#recordModuleImports(moduleRef, modules);
        for (const module of modules) {
          importPromises.push(this.#loadOneModuleAsync(module));
        }
      },
    };
  }

  // Records that `moduleRef` imported each module, so unloading it later releases the reference the
  // import took — otherwise an imported module's ref-count only ever climbs.
  #recordModuleImports(moduleRef: object, modules: ReadonlyArray<SyncModule | AsyncModule>): void {
    const list = getOrInsert((this.#moduleImports ??= new Map<object, Array<object>>()), moduleRef, []);
    for (const module of modules) {
      list.push(module);
    }
  }

  unload(...modules: Array<SyncModule>): void {
    this.#assertNotDisposed();
    for (const module of modules) {
      this.#unloadModuleSync(module);
    }
  }

  /** Unregister module bindings and collect [binding, instance] pairs for deactivation. */
  #removeModuleBindings(ref: object): DeactivationPairs {
    this.#moduleRefs?.delete(ref);
    this.#moduleImports?.delete(ref);
    const ids = this.#moduleBindingIds?.get(ref) ?? [];
    this.#moduleBindingIds?.delete(ref);
    const removed: Array<Binding> = [];
    for (const id of ids) {
      const binding = this.#registry.removeById(id) ?? this.#retireNotLive(id);
      if (binding !== undefined) {
        removed.push(binding);
      }
    }
    return this.#drainSingletons(removed);
  }

  #unloadModuleSync(ref: object): void {
    const count = this.#moduleRefs?.get(ref) ?? 0;
    if (count <= 1) {
      // Read the imports before removal clears them, then release each — a child only unbinds once
      // its own ref-count reaches zero, mirroring the increment `import` took on load.
      const imported = this.#moduleImports?.get(ref);
      this.#deactivatePairsSync(this.#removeModuleBindings(ref));
      if (imported !== undefined) {
        for (const child of imported) {
          this.#unloadModuleSync(child);
        }
      }
    } else {
      this.#moduleRefs!.set(ref, count - 1);
    }
  }

  async unloadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void> {
    this.#assertNotDisposed();
    for (const module of modules) {
      await this.#unloadModuleAsync(module);
    }
  }

  async #unloadModuleAsync(ref: object): Promise<void> {
    const count = this.#moduleRefs?.get(ref) ?? 0;
    if (count <= 1) {
      const imported = this.#moduleImports?.get(ref);
      await this.#deactivatePairs(this.#removeModuleBindings(ref));
      if (imported !== undefined) {
        for (const child of imported) {
          await this.#unloadModuleAsync(child);
        }
      }
    } else {
      this.#moduleRefs!.set(ref, count - 1);
    }
  }

  // ── Lifecycle hooks ────────────────────────────────────────────────────────────────────────────────────────────────

  onActivation<Value>(token: Token<Value> | Constructor<Value>, handler: ActivationHandler<Value>): void {
    this.#assertNotDisposed();
    this.#lifecycle.registerActivation(token, handler);
  }

  onDeactivation<Value>(token: Token<Value> | Constructor<Value>, handler: DeactivationHandler<Value>): void {
    this.#assertNotDisposed();
    this.#lifecycle.registerDeactivation(token, handler);
  }

  // ── Resolution ─────────────────────────────────────────────────────────────────────────────────────────────────────

  // Installed per role at construction, so a root's compiled resolve never carries the child's chain check.
  declare resolve: <Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ) => Value;

  static #rootResolve<Value, Names extends string = string>(
    this: DefaultContainer,
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ): Value {
    if (this.#disposed) {
      throw new DisposedContainerError();
    }
    const rootStack = this.#resolver.rootStack;
    // A resolve already holding the shared stack means this one is nested; it mints its own.
    if (rootStack.length !== 0) {
      return options === undefined
        ? this.#resolver.resolveFromContext(token, [])
        : this.#resolver.resolve(token, options, []);
    }
    if (options === undefined) {
      return this.#resolver.resolveFromContext(token, rootStack);
    }
    return this.#resolver.resolve(token, options, rootStack);
  }

  // The root's body again behind the child's check, so neither role's compiled resolve carries the other's path.
  static #childResolve<Value, Names extends string = string>(
    this: DefaultContainer,
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ): Value {
    this.#assertChainLive();
    const rootStack = this.#resolver.rootStack;
    if (rootStack.length !== 0) {
      return options === undefined
        ? this.#resolver.resolveFromContext(token, [])
        : this.#resolver.resolve(token, options, []);
    }
    if (options === undefined) {
      return this.#resolver.resolveFromContext(token, rootStack);
    }
    return this.#resolver.resolve(token, options, rootStack);
  }

  resolveAsync<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ): Promise<Value> {
    // Not `async`: the guard's throw becomes the rejection this method promises.
    try {
      this.#assertNotDisposed();
    } catch (disposedError) {
      return Promise.reject(disposedError);
    }
    if (options === undefined) {
      return this.#resolver.resolveAsyncFromRoot(token) as Promise<Value>;
    }
    return this.#resolver.resolveAsync(token, options, [], ROOT_BRANCH);
  }

  resolveOptional<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ): Value | undefined {
    this.#assertNotDisposed();
    const rootStack = this.#resolver.rootStack;
    return rootStack.length === 0
      ? this.#resolver.resolveOptional(token, options, rootStack)
      : this.#resolver.resolveOptional(token, options, []);
  }

  resolveOptionalAsync<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ): Promise<Value | undefined> {
    try {
      this.#assertNotDisposed();
    } catch (disposedError) {
      return Promise.reject(disposedError);
    }
    return this.#resolver.resolveOptionalAsync(token, options, [], ROOT_BRANCH);
  }

  resolveAll<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ): ReadonlyArray<Value> {
    this.#assertNotDisposed();
    const rootStack = this.#resolver.rootStack;
    if (options === undefined && rootStack.length === 0) {
      return this.#resolver.resolveRootCollection(token);
    }
    return rootStack.length === 0
      ? this.#resolver.resolveAll(token, options, rootStack)
      : this.#resolver.resolveAll(token, options, []);
  }

  resolveAllAsync<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ): Promise<ReadonlyArray<Value>> {
    try {
      this.#assertNotDisposed();
    } catch (disposedError) {
      return Promise.reject(disposedError);
    }
    if (options === undefined) {
      return this.#resolver.resolveRootCollectionAsync(token);
    }
    return this.#resolver.resolveAllAsync(token, options, [], ROOT_BRANCH);
  }

  // ── Child ──────────────────────────────────────────────────────────────────────────────────────────────────────────

  createChild(): Container {
    this.#assertNotDisposed();
    const child = new DefaultContainer(this);
    // Born confirmed live: the parent's chain was checked just above, so the child's first read skips the walk.
    child.#liveGeneration = disposeEpochRef.value;
    return child;
  }

  // ── Dispose ────────────────────────────────────────────────────────────────────────────────────────────────────────

  disposeAsync(): Promise<void> {
    // One teardown, shared: a second caller awaits the same run instead of returning early while
    // hooks from the first are still executing.
    return (this.#disposePromise ??= this.#runDispose());
  }

  async #runDispose(): Promise<void> {
    this.#disposed = true;
    // Refuses new materializations immediately; in-flight ones are drained just below.
    this.#scope.markClosed();
    // Descendants read this to learn their chain closed — a resolve through a disposed ancestor is refused.
    advanceDisposeEpoch();
    await this.#scope.settleInflight();

    const reader = this.#getMetadataReader();
    const errors: Array<unknown> = [];
    // A scoped instance may hold this container's singletons and never the reverse, so it goes first, latest first.
    const scopedTeardown = this.#scope.deactivateScoped(errors);
    if (scopedTeardown !== undefined) {
      await scopedTeardown;
    }
    // Iterate a copy: a deactivation handler is user code, and the live list is what
    // materializing or dropping a singleton mutates. Reverse materialization order, so a
    // dependent tears down before the dependencies it may still reach through.
    const cached = this.#scope.cachedSingletons().slice();
    for (let index = cached.length - 1; index >= 0; index -= 1) {
      const binding = cached[index]!;
      try {
        await this.#lifecycle.runDeactivation(binding, binding.instance, reader);
      } catch (error) {
        errors.push(error);
      }
    }
    // A constant never reaches the singleton cache unless activation put it there, so its hook is
    // owed from the registry instead — and only a container that has held one pays for looking.
    if (this.#registry.hasHeldConstantBinding) {
      for (const binding of this.#registry.allBindings()) {
        if (binding.instance === NO_INSTANCE && this.#owesConstantDeactivation(binding)) {
          try {
            await this.#lifecycle.runDeactivation(binding, binding.value, reader);
          } catch (error) {
            errors.push(error);
          }
        }
      }
    }

    // Constants a plain last-wins bind() displaced left the registry with their hook still owed; one
    // whose activation cached an instance was drained above, so only the untouched ones remain.
    if (this.#orphanedBindings !== undefined) {
      for (const binding of this.#orphanedBindings.values()) {
        if (binding.instance === NO_INSTANCE && this.#owesConstantDeactivation(binding)) {
          try {
            await this.#lifecycle.runDeactivation(binding, binding.value, reader);
          } catch (error) {
            errors.push(error);
          }
        }
      }
    }

    this.#scope.clearAll();
    throwCollected(errors, "disposeAsync() completed, but deactivation hooks threw");
  }

  [Symbol.asyncDispose](): Promise<void> {
    return this.disposeAsync();
  }

  // ── Initialization ─────────────────────────────────────────────────────────────────────────────────────────────────

  async initializeAsync(): Promise<void> {
    this.#assertNotDisposed();
    const allBindings = this.#registry.allBindings();
    for (const binding of allBindings) {
      if (binding.kind === "alias") {
        continue;
      }
      const scope = effectiveBindingScope(binding);
      if (scope === "singleton" && binding.instance === NO_INSTANCE) {
        if (binding.predicate !== undefined) {
          continue;
        }
        // A constant is already its own instance, so only an activation hook gives the warm-up
        // something to run — and a container-level hook counts as one just as a per-binding hook does.
        if (
          binding.kind === "constant" &&
          binding.activationHook === undefined &&
          !this.#lifecycle.hasActivationHandlers(binding.token)
        ) {
          continue;
        }
        // Warm the binding itself — re-selecting by its own criteria could pick a different
        // candidate whose criteria are a subset of them.
        const slotOptions = bindingSlotToResolveOptions(binding.slot);
        await this.#resolver.warmBindingAsync(binding, slotOptions);
      }
    }
  }

  // ── Introspection ──────────────────────────────────────────────────────────────────────────────────────────────────

  has<Names extends string = string>(
    token: Token<unknown, Names> | Constructor,
    options?: NoInfer<ResolveOptions<Names>>,
  ): boolean {
    this.#assertNotDisposed();
    return this.#hasInChain(token, options);
  }

  // Recurses through the parent's registry, not its public `has`, so a live child answers even when
  // an ancestor is disposed — the disposed-guard belongs on the entry point, not every chain hop.
  #hasInChain<Names extends string = string>(
    token: Token<unknown, Names> | Constructor,
    options: NoInfer<ResolveOptions<Names>> | undefined,
  ): boolean {
    if (this.#getInspector().hasOwn(token, options)) {
      return true;
    }
    const parent = this.#parent;
    return parent !== undefined && parent.#hasInChain(token, options);
  }

  hasOwn<Names extends string = string>(
    token: Token<unknown, Names> | Constructor,
    options?: NoInfer<ResolveOptions<Names>>,
  ): boolean {
    this.#assertNotDisposed();
    return this.#getInspector().hasOwn(token, options);
  }

  // Public statics of an unexported class: only this module's container functions can call them.
  static internalsOf(container: Container): ContainerInternals {
    const live = DefaultContainer.#live(container);
    return {
      registry: live.#registry,
      ancestorRegistries: live.#ancestorRegistries(),
      resolver: live.#resolver,
      metadataReader: live.#getMetadataReader(),
      lifecycle: live.#lifecycle,
    };
  }

  static inspectorOf(container: Container): Inspector {
    return DefaultContainer.#live(container).#getInspector();
  }

  static #live(container: Container): DefaultContainer {
    if (!(#registry in container)) {
      throw new TypeError("Expected a container created by Container.create().");
    }
    container.#assertNotDisposed();
    return container;
  }

  /** The registries above this container, nearest first — the order every chain walk reads them in. */
  #ancestorRegistries(): Array<BindingRegistry> {
    const registries: Array<BindingRegistry> = [];
    for (let ancestor = this.#parent; ancestor !== undefined; ancestor = ancestor.#parent) {
      registries.push(ancestor.#registry);
    }
    return registries;
  }

  // ── Internal ───────────────────────────────────────────────────────────────────────────────────────────────────────

  // Two field reads and no epoch on a live root. This and `#assertChainLive` each stay under V8's small-function
  // size, so every entry point inlines both outright; the walk and the throw sit in `#confirmChainLive`.
  #assertNotDisposed(): void {
    if (this.#disposed || this.#parent !== undefined) {
      this.#assertChainLive();
    }
  }

  // An unchanged dispose epoch means no container anywhere closed since this chain was last confirmed live;
  // every dispose advances it, this container's own included, so a disposed container always reaches the walk.
  #assertChainLive(): void {
    if (disposeEpochRef.value !== this.#liveGeneration) {
      this.#confirmChainLive();
    }
  }

  #confirmChainLive(): void {
    if (this.#isChainDisposed()) {
      throw new DisposedContainerError();
    }
    this.#liveGeneration = disposeEpochRef.value;
  }

  // Whether this container or any ancestor is disposed — the plain walk, taken only on the cold refresh
  // and by the `isDisposed` getter, so it needs no memo of its own.
  #isChainDisposed(): boolean {
    if (this.#disposed) {
      return true;
    }
    const parent = this.#parent;
    return parent !== undefined && parent.#isChainDisposed();
  }
}

/** Reports collected hook failures once teardown finished: the one error as itself, several aggregated. */
function throwCollected(errors: ReadonlyArray<unknown>, message: string): void {
  if (errors.length === 0) {
    return;
  }
  if (errors.length === 1) {
    throw errors[0];
  }
  throw new AggregateError(errors, message);
}

// ── Container static ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The companion factory that creates containers, empty or preloaded from modules.
 *
 * @since 0.3.16-canary.0
 */
export const Container: ContainerStatic = {
  create(options?: ContainerOptions): Container {
    return new DefaultContainer(undefined, options);
  },

  // Variadic modules leave no room for an options argument. A container that needs both is
  // `Container.create(options)` followed by `load(...)`, which is what these two do anyway.
  fromModules(...modules: Array<SyncModule>): Container {
    const container = new DefaultContainer();
    container.load(...modules);
    return container;
  },

  async fromModulesAsync(...modules: Array<SyncModule | AsyncModule>): Promise<Container> {
    const container = new DefaultContainer();
    await container.loadAsync(...modules);
    return container;
  },
};
