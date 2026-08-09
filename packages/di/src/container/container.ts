import type { BindingRegistration } from "#/container/binding-builders";
import { BindingChain } from "#/container/binding-builders";
import type { Binding, BindingBuilder, BindToBuilder, ConstantBinding } from "#/core/binding";
import { NO_INSTANCE } from "#/core/binding";
import { effectiveBindingScope } from "#/core/binding-scope";
import { constraintRequirementOf } from "#/core/constraint-requirement";
import type { AsyncModule, AsyncModuleBuilder, ModuleBuilder, SyncModule } from "#/core/module";
import { isSyncModule, MODULE_SETUP } from "#/core/module";
import { BindingRegistry } from "#/core/registry";
import type { Token } from "#/core/token";
import { tokenName } from "#/core/token";
import type {
  ActivationHandler,
  BindingIdentifier,
  BindingScope,
  Constructor,
  DeactivationHandler,
  ResolveOptions,
} from "#/core/types";
import type { AutoRegisterRegistry } from "#/decorators/injectable";
import type { ResolutionDiagnostics } from "#/errors/diagnostics";
import { RESOLUTION_DIAGNOSTICS } from "#/errors/diagnostics";
import {
  AsyncModuleLoadError,
  CircularDependencyError,
  DisposedContainerError,
  InternalError,
  RebindUnboundTokenError,
  ScopeViolationError,
  SyncDisposalNotSupportedError,
  UnreachableConstraintError,
  UnreachableLifecycleHookError,
} from "#/errors/errors";
import type { DependencySlot } from "#/injection/resolve-options";
import { injectionSlotToResolveOptions, bindingSlotToResolveOptions } from "#/injection/resolve-options";
import type { ContainerGraphJson, GraphOptions } from "#/introspection/dependency-graph";
import { buildDependencyGraph } from "#/introspection/dependency-graph";
import type { BindingSnapshot, ContainerSnapshot } from "#/introspection/inspector";
import { Inspector } from "#/introspection/inspector";
import { LifecycleManager } from "#/lifecycle/lifecycle-manager";
import { ScopeManager } from "#/lifecycle/scope-manager";
import { MetadataReaderToken } from "#/metadata/metadata-reader-token";
import type { MetadataReader } from "#/metadata/metadata-types";
import { defaultMetadataReader } from "#/metadata/symbol-metadata-reader";
import { verifyingMetadataReader } from "#/metadata/verifying-metadata-reader";
import { ROOT_BRANCH } from "#/resolution/path/resolution-path";
import { DependencyResolver } from "#/resolution/resolver";

// ── Container interface ────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface Container {
  readonly isDisposed: boolean;

  bind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  unbind(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): void;
  unbindAsync(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): Promise<void>;
  unbindAll(): void;
  unbindAllAsync(): Promise<void>;
  rebind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;

  load(...modules: Array<SyncModule>): void;
  loadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void>;
  unload(...modules: Array<SyncModule>): void;
  unloadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void>;
  loadAutoRegistered(registry: AutoRegisterRegistry): number;

  onActivation<Value>(token: Token<Value> | Constructor<Value>, handler: ActivationHandler<Value>): void;
  onDeactivation<Value>(token: Token<Value> | Constructor<Value>, handler: DeactivationHandler<Value>): void;

  resolve<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value;
  resolveAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Value>;
  resolveOptional<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined;
  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Value | undefined>;
  resolveAll<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Array<Value>;
  resolveAllAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Array<Value>>;

  createChild(): Container;

  dispose(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
  [Symbol.dispose](): never;

  initializeAsync(): Promise<void>;
  validate(): void;

  has(token: Token<unknown> | Constructor, options?: ResolveOptions): boolean;
  hasOwn(token: Token<unknown> | Constructor, options?: ResolveOptions): boolean;
  lookupBindings<Value>(token: Token<Value> | Constructor<Value>): ReadonlyArray<BindingSnapshot>;
  inspect(): ContainerSnapshot;
  generateDependencyGraph(options?: GraphOptions): ContainerGraphJson;
}

/**
 * What a container has to be told before it exists, as opposed to what it can be bound later.
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
 * @since 0.3.16-canary.0
 */
export interface ContainerStatic {
  create(options?: ContainerOptions): Container;
  fromModules(...modules: Array<SyncModule>): Container;
  fromModulesAsync(...modules: Array<SyncModule | AsyncModule>): Promise<Container>;
}

// A Record rather than an if-chain, so a new `BindingScope` is a compile error here instead of
// silently landing in whichever branch happened to be last.
const APPLY_BINDING_SCOPE: Record<BindingScope, (builder: BindingBuilder<unknown>) => void> = {
  singleton: (builder) => {
    builder.singleton();
  },
  scoped: (builder) => {
    builder.scoped();
  },
  transient: (builder) => {
    builder.transient();
  },
};

// ── DefaultContainer ──────────────────────────────────────────────────────────

class DefaultContainer implements Container {
  #disposed = false;
  readonly #registry: BindingRegistry;
  readonly #scope: ScopeManager;
  readonly #lifecycle: LifecycleManager;
  #resolver!: DependencyResolver;
  // Built on the first introspecting call — a container that only binds and resolves never needs it.
  #inspector: Inspector | undefined;
  readonly #parent: DefaultContainer | undefined;

  // Module tracking: module -> ref count. Both tables stay unallocated until a module is loaded.
  #moduleRefs: Map<object, number> | undefined;
  // Module bindings: module -> array of binding IDs registered by it
  #moduleBindingIds: Map<object, Array<BindingIdentifier>> | undefined;
  // One shared registration for every chain this container's own `bind()` creates.
  #registration: BindingRegistration | undefined;

  constructor(parent?: DefaultContainer, options?: ContainerOptions) {
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
    const builtSubsystems: Array<string> = [];
    if (this.#inspector !== undefined) {
      builtSubsystems.push("container.inspector");
    }
    if (this.#moduleRefs !== undefined || this.#moduleBindingIds !== undefined) {
      builtSubsystems.push("container.moduleTables");
    }
    if (this.#registry.isBuilt) {
      builtSubsystems.push("registry.namedIndex");
    }
    if (this.#scope.isBuilt) {
      builtSubsystems.push("scope.scoped");
    }
    if (this.#lifecycle.isBuilt) {
      builtSubsystems.push("lifecycle.activationHooks");
    }
    return { ...this.#resolver.describeCaches(), scopedInstanceCount: this.#scope.scopedCount, builtSubsystems };
  }

  #initResolver(configuredReader: MetadataReader | undefined): void {
    const parent = this.#parent;
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

  /** What a container being constructed under this one inherits: a reader bound here, else this one's. */
  #readerForChild(): MetadataReader {
    if (this.#registry.getAll(MetadataReaderToken).length > 0) {
      try {
        return this.#resolver.resolve(MetadataReaderToken, undefined, [], []);
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
    return this.#disposed;
  }

  // ── Binding ──────────────────────────────────────────────────────────────

  bind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> {
    this.#assertNotDisposed();
    return this.#createBindToBuilder(token);
  }

  /** The registration every non-module chain shares, so `bind()` allocates only the builder. */
  #ownRegistration(): BindingRegistration {
    return (this.#registration ??= { registry: this.#registry, moduleBindingIds: undefined });
  }

  /** One registration per module load, holding that module's id list directly. */
  #moduleRegistration(moduleRef: object): BindingRegistration {
    return {
      registry: this.#registry,
      moduleBindingIds: (this.#moduleBindingIds ??= new Map()).getOrInsert(moduleRef, []),
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
  #collectDeactivationPairs(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): Array<[Binding, unknown]> {
    if (typeof tokenOrId === "string") {
      const binding = this.#registry.removeById(tokenOrId);
      return binding === undefined ? [] : this.#drainSingletons([binding]);
    }
    // Dropping the whole token in one pass: removing each binding by id instead would re-scan and
    // re-index the token's binding list once per binding.
    return this.#drainSingletons(this.#registry.removeByToken(tokenOrId));
  }

  /** Drain scope entries for already-removed bindings, and pair each one that still owes a deactivation. */
  #drainSingletons(bindings: ReadonlyArray<Binding>): Array<[Binding, unknown]> {
    const pairs: Array<[Binding, unknown]> = [];
    for (const binding of bindings) {
      if (binding.instance !== NO_INSTANCE) {
        pairs.push([binding, binding.instance]);
        this.#scope.deleteSingleton(binding);
      } else if (this.#owesConstantDeactivation(binding)) {
        pairs.push([binding, binding.value]);
      }
      this.#scope.deleteScoped(binding.id);
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
      (binding.onDeactivation !== undefined || this.#lifecycle.hasDeactivationHandlers(binding.token))
    );
  }

  #unbindSync(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): void {
    const reader = this.#getMetadataReader();
    for (const [binding, instance] of this.#collectDeactivationPairs(tokenOrId)) {
      this.#lifecycle.runDeactivationSync(binding, instance, reader);
    }
  }

  async unbindAsync(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): Promise<void> {
    this.#assertNotDisposed();
    const reader = this.#getMetadataReader();
    for (const [binding, instance] of this.#collectDeactivationPairs(tokenOrId)) {
      await this.#lifecycle.runDeactivation(binding, instance, reader);
    }
  }

  unbindAll(): void {
    this.#assertNotDisposed();
    const reader = this.#getMetadataReader();
    for (const [binding, instance] of this.#drainSingletons(this.#registry.clear())) {
      this.#lifecycle.runDeactivationSync(binding, instance, reader);
    }
  }

  async unbindAllAsync(): Promise<void> {
    this.#assertNotDisposed();
    const reader = this.#getMetadataReader();
    for (const [binding, instance] of this.#drainSingletons(this.#registry.clear())) {
      await this.#lifecycle.runDeactivation(binding, instance, reader);
    }
  }

  rebind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> {
    this.#assertNotDisposed();
    if (!this.#registry.has(token)) {
      throw new RebindUnboundTokenError(tokenName(token));
    }
    // Unbind existing (sync — if async deactivation, will throw AsyncDeactivationError)
    this.#unbindSync(token);
    return this.#createBindToBuilder(token);
  }

  // ── Module ────────────────────────────────────────────────────────────────

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
      const moduleRefs = (this.#moduleRefs ??= new Map());
      const existing = moduleRefs.get(moduleRef);
      if (existing !== undefined) {
        moduleRefs.set(moduleRef, existing + 1);
        continue;
      }
      moduleRefs.set(moduleRef, 1);
      const builder = this.#createModuleBuilder(moduleRef);
      module[MODULE_SETUP](builder);
    }
  }

  async loadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void> {
    this.#assertNotDisposed();
    for (const module of modules) {
      await this.#loadOneModuleAsync(module);
    }
  }

  async #loadOneModuleAsync(module: SyncModule | AsyncModule): Promise<void> {
    const moduleRef = module as object;
    const moduleRefs = (this.#moduleRefs ??= new Map());
    const existing = moduleRefs.get(moduleRef);
    if (existing !== undefined) {
      moduleRefs.set(moduleRef, existing + 1);
      return;
    }
    moduleRefs.set(moduleRef, 1);

    if (isSyncModule(module)) {
      const builder = this.#createModuleBuilder(moduleRef);
      module[MODULE_SETUP](builder);
    } else {
      const importPromises: Array<Promise<void>> = [];
      const builder = this.#createAsyncModuleBuilder(moduleRef, importPromises);
      await module[MODULE_SETUP](builder);
      // Await nested async imports triggered inside the setup callback
      if (importPromises.length > 0) {
        await Promise.all(importPromises);
      }
    }
  }

  #createModuleBuilder(moduleRef: object): ModuleBuilder {
    const registration = this.#moduleRegistration(moduleRef);
    return {
      bind: <Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> =>
        this.#createBindToBuilder(token, registration),
      import: (...modules: Array<SyncModule>): void => {
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
        for (const module of modules) {
          importPromises.push(this.#loadOneModuleAsync(module));
        }
      },
    };
  }

  unload(...modules: Array<SyncModule>): void {
    this.#assertNotDisposed();
    for (const module of modules) {
      this.#unloadModuleSync(module as object);
    }
  }

  /** Unregister module bindings and collect [binding, instance] pairs for deactivation. */
  #removeModuleBindings(ref: object): Array<[Binding, unknown]> {
    this.#moduleRefs?.delete(ref);
    const ids = this.#moduleBindingIds?.get(ref) ?? [];
    this.#moduleBindingIds?.delete(ref);
    const pairs: Array<[Binding, unknown]> = [];
    for (const id of ids) {
      const binding = this.#registry.getById(id);
      if (binding !== undefined) {
        this.#registry.removeById(id);
        if (binding.instance !== NO_INSTANCE) {
          pairs.push([binding, binding.instance]);
          this.#scope.deleteSingleton(binding);
        } else if (this.#owesConstantDeactivation(binding)) {
          pairs.push([binding, binding.value]);
        }
        this.#scope.deleteScoped(binding.id);
      }
    }
    return pairs;
  }

  #unloadModuleSync(ref: object): void {
    const count = this.#moduleRefs?.get(ref) ?? 0;
    if (count <= 1) {
      const reader = this.#getMetadataReader();
      for (const [binding, instance] of this.#removeModuleBindings(ref)) {
        this.#lifecycle.runDeactivationSync(binding, instance, reader);
      }
    } else {
      this.#moduleRefs!.set(ref, count - 1);
    }
  }

  async unloadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void> {
    this.#assertNotDisposed();
    for (const module of modules) {
      await this.#unloadModuleAsync(module as object);
    }
  }

  async #unloadModuleAsync(ref: object): Promise<void> {
    const count = this.#moduleRefs?.get(ref) ?? 0;
    if (count <= 1) {
      const reader = this.#getMetadataReader();
      for (const [binding, instance] of this.#removeModuleBindings(ref)) {
        await this.#lifecycle.runDeactivation(binding, instance, reader);
      }
    } else {
      this.#moduleRefs!.set(ref, count - 1);
    }
  }

  loadAutoRegistered(registry: AutoRegisterRegistry): number {
    this.#assertNotDisposed();
    const entries = registry.entries();
    for (const { target, scope } of entries) {
      APPLY_BINDING_SCOPE[scope](this.#createBindToBuilder(target).toSelf());
    }
    return entries.length;
  }

  // ── Lifecycle hooks ────────────────────────────────────────────────────────

  onActivation<Value>(token: Token<Value> | Constructor<Value>, handler: ActivationHandler<Value>): void {
    this.#assertNotDisposed();
    this.#lifecycle.registerActivation(token, handler);
  }

  onDeactivation<Value>(token: Token<Value> | Constructor<Value>, handler: DeactivationHandler<Value>): void {
    this.#assertNotDisposed();
    this.#lifecycle.registerDeactivation(token, handler);
  }

  // ── Resolution ────────────────────────────────────────────────────────────

  resolve<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value {
    this.#assertNotDisposed();
    const rootStack = this.#resolver.rootStack;
    // A resolve already holding the shared pair means this one is nested; it mints its own.
    if (rootStack.length !== 0) {
      return options === undefined
        ? this.#resolver.resolveFromContext(token, [], [])
        : this.#resolver.resolve(token, options, [], []);
    }
    if (options === undefined) {
      return this.#resolver.resolveFromContext(token, this.#resolver.rootPath, rootStack);
    }
    return this.#resolver.resolve(token, options, this.#resolver.rootPath, rootStack);
  }

  resolveAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Value> {
    this.#assertNotDisposed();
    if (options === undefined) {
      return this.#resolver.resolveAsyncFromRoot(token) as Promise<Value>;
    }
    return this.#resolver.resolveAsync(token, options, [], [], ROOT_BRANCH);
  }

  resolveOptional<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined {
    this.#assertNotDisposed();
    const rootStack = this.#resolver.rootStack;
    return rootStack.length === 0
      ? this.#resolver.resolveOptional(token, options, this.#resolver.rootPath, rootStack)
      : this.#resolver.resolveOptional(token, options, [], []);
  }

  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Value | undefined> {
    this.#assertNotDisposed();
    return this.#resolver.resolveOptionalAsync(token, options, [], [], ROOT_BRANCH);
  }

  resolveAll<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Array<Value> {
    this.#assertNotDisposed();
    const rootStack = this.#resolver.rootStack;
    return rootStack.length === 0
      ? this.#resolver.resolveAll(token, options, this.#resolver.rootPath, rootStack)
      : this.#resolver.resolveAll(token, options, [], []);
  }

  resolveAllAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Array<Value>> {
    this.#assertNotDisposed();
    return this.#resolver.resolveAllAsync(token, options, [], [], ROOT_BRANCH);
  }

  // ── Child ─────────────────────────────────────────────────────────────────

  createChild(): Container {
    this.#assertNotDisposed();
    return new DefaultContainer(this);
  }

  // ── Dispose ───────────────────────────────────────────────────────────────

  async dispose(): Promise<void> {
    if (this.#disposed) {
      return;
    }
    this.#disposed = true;

    // Deactivate all singletons in this container (own only)
    const reader = this.#getMetadataReader();
    // Iterate a copy: a deactivation handler is user code, and the live list is what
    // materializing or dropping a singleton mutates.
    for (const binding of this.#scope.cachedSingletons().slice()) {
      await this.#lifecycle.runDeactivation(binding, binding.instance, reader);
    }
    // A constant never reaches the singleton cache unless activation put it there, so its hook is
    // owed from the registry instead — and only a container that has held one pays for looking.
    if (this.#registry.hasHeldConstantBinding) {
      for (const binding of this.#registry.allBindings()) {
        if (binding.instance === NO_INSTANCE && this.#owesConstantDeactivation(binding)) {
          await this.#lifecycle.runDeactivation(binding, binding.value, reader);
        }
      }
    }

    this.#scope.clearAll();
  }

  [Symbol.asyncDispose](): Promise<void> {
    return this.dispose();
  }

  [Symbol.dispose](): never {
    throw new SyncDisposalNotSupportedError();
  }

  // ── Initialization ────────────────────────────────────────────────────────

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
        // Has activation — need to resolve
        if (binding.kind === "constant" && binding.onActivation === undefined) {
          continue;
        }
        const slotOptions = bindingSlotToResolveOptions(binding.slot);
        await this.resolveAsync(binding.token, slotOptions);
      }
    }
  }

  // ── Validate ──────────────────────────────────────────────────────────────

  validate(): void {
    this.#assertNotDisposed();
    const reader = this.#getMetadataReader();
    const allBindings = this.#registry.allBindings();

    for (const binding of allBindings) {
      if (!this.#isSingletonStaticAnalyzableBinding(binding)) {
        continue;
      }
      this.#validateSingletonBindingGraph(binding, reader);
    }

    for (const [hookToken, phase] of this.#lifecycle.hookedTokens()) {
      if (!this.#isBoundInChain(hookToken)) {
        throw new UnreachableLifecycleHookError(tokenName(hookToken), phase);
      }
    }

    this.#validateConstraintRequirements(allBindings);
  }

  /** A constraint waiting on a slot name no binding declares can never hold. */
  #validateConstraintRequirements(allBindings: ReadonlyArray<Binding>): void {
    let declaredSlotNames: Set<string> | undefined;

    for (const binding of allBindings) {
      const { predicate } = binding;
      if (predicate === undefined) {
        continue;
      }
      const requirement = constraintRequirementOf(predicate);
      if (requirement === undefined) {
        continue;
      }
      declaredSlotNames ??= this.#slotNamesInChain();
      if (!declaredSlotNames.has(requirement.name)) {
        throw new UnreachableConstraintError(tokenName(binding.token), requirement.name, requirement.helperName);
      }
    }
  }

  /** Every slot name declared anywhere a resolve through this container could reach. */
  #slotNamesInChain(): Set<string> {
    const names = this.#parent === undefined ? new Set<string>() : this.#parent.#slotNamesInChain();
    for (const binding of this.#registry.allBindings()) {
      if (binding.slot.name !== undefined) {
        names.add(binding.slot.name);
      }
    }
    return names;
  }

  // Ancestors count: a parent-owned binding is one this container can still resolve through.
  #isBoundInChain(token: Token<unknown> | Constructor): boolean {
    if (this.#registry.has(token)) {
      return true;
    }
    const parent = this.#parent;
    return parent !== undefined && parent.#isBoundInChain(token);
  }

  #isSingletonStaticAnalyzableBinding(binding: Binding): boolean {
    if (effectiveBindingScope(binding) !== "singleton") {
      return false;
    }
    return binding.kind === "class" || binding.kind === "resolved" || binding.kind === "resolved-async";
  }

  /**
   * DFS over explicit constructor / `toResolved*` dependency edges. Follows `toAlias` chains to the
   * terminal binding for scope checks.
   *
   * @remarks A `toDynamic*` dependency is scope-checked like any other — its declared scope is what
   * makes it captive — but the DFS does not descend into the factory, whose body is opaque.
   */
  #validateSingletonBindingGraph(root: Binding, reader: MetadataReader): void {
    const rootName = tokenName(root.token);

    const dfs = (current: Binding, pathNames: Array<string>, pathBindingIds: Set<BindingIdentifier>): void => {
      if (pathBindingIds.has(current.id)) {
        return;
      }
      const extendedPathIds = new Set(pathBindingIds);
      extendedPathIds.add(current.id);

      for (const edge of this.#collectStaticDependencyEdges(current, reader)) {
        const { terminal, depTokenName } = edge;
        const depScope = this.#validationScopeFromTerminal(terminal);
        if (depScope !== "singleton") {
          throw new ScopeViolationError({
            consumerToken: rootName,
            consumerScope: "singleton",
            dependencyToken: depTokenName,
            dependencyScope: depScope,
            path: [...pathNames, depTokenName],
          });
        }
        if (terminal.kind === "class" || terminal.kind === "resolved" || terminal.kind === "resolved-async") {
          dfs(terminal, [...pathNames, depTokenName], extendedPathIds);
        }
      }
    };

    dfs(root, [rootName], new Set());
  }

  /**
   * The scope this edge is judged against.
   *
   * @remarks A factory's *body* is not statically analyzable, but the scope it was bound with is
   * declared like any other — so the captive-dependency check applies to it too. The DFS still
   * refuses to descend into a factory; only the edge is judged.
   */
  #validationScopeFromTerminal(terminal: Binding): BindingScope {
    if (terminal.kind === "alias") {
      throw new InternalError("validate: expected terminal binding after alias resolution");
    }
    return terminal.scope;
  }

  #followAliasChainToTerminal(binding: Binding, options: ResolveOptions | undefined): Binding | undefined {
    const cyclePath: Array<string> = [];
    const seenAliasIds = new Set<BindingIdentifier>();
    let current: Binding | undefined = binding;

    while (current !== undefined && current.kind === "alias") {
      if (seenAliasIds.has(current.id)) {
        throw new CircularDependencyError(cyclePath);
      }
      seenAliasIds.add(current.id);
      cyclePath.push(tokenName(current.token));
      const nextToken = current.target;
      const next = this.#resolver.peekBindingForValidate(nextToken, options);
      if (next === undefined) {
        return undefined;
      }
      current = next.binding;
    }
    return current;
  }

  /** What one dependency could resolve to: every candidate for `injectAll`, else at most one. */
  #peekDependencyCandidates(dep: DependencySlot, options: ResolveOptions | undefined): ReadonlyArray<Binding> {
    if (dep.multi) {
      return this.#resolver.peekCandidateBindingsForValidate(dep.token, options);
    }
    const found = this.#resolver.peekBindingForValidate(dep.token, options);
    return found === undefined ? [] : [found.binding];
  }

  /** What a binding declares up front — a class's params, a factory's descriptors, else nothing. */
  #staticDependencies(binding: Binding, reader: MetadataReader): ReadonlyArray<DependencySlot> {
    if (binding.kind === "class") {
      return reader.getConstructorMetadata(binding.target)?.params ?? [];
    }
    if (binding.kind === "resolved" || binding.kind === "resolved-async") {
      return binding.deps;
    }
    return [];
  }

  #collectStaticDependencyEdges(
    binding: Binding,
    reader: MetadataReader,
  ): Array<{ terminal: Binding; depTokenName: string }> {
    const edges: Array<{ terminal: Binding; depTokenName: string }> = [];

    for (const dep of this.#staticDependencies(binding, reader)) {
      // An optional dependency imposes no scope constraint: it may legitimately be absent.
      if (dep.optional) {
        continue;
      }
      const depOptions = injectionSlotToResolveOptions(dep);
      for (const candidate of this.#peekDependencyCandidates(dep, depOptions)) {
        const terminal = this.#followAliasChainToTerminal(candidate, depOptions);
        if (terminal !== undefined) {
          edges.push({ terminal, depTokenName: tokenName(terminal.token) });
        }
      }
    }

    return edges;
  }

  // ── Introspection ─────────────────────────────────────────────────────────

  has(token: Token<unknown> | Constructor, options?: ResolveOptions): boolean {
    this.#assertNotDisposed();
    return this.#getInspector().has(token, options, () => this.#parent?.has(token, options) ?? false);
  }

  hasOwn(token: Token<unknown> | Constructor, options?: ResolveOptions): boolean {
    this.#assertNotDisposed();
    return this.#getInspector().hasOwn(token, options);
  }

  lookupBindings<Value>(token: Token<Value> | Constructor<Value>): ReadonlyArray<BindingSnapshot> {
    this.#assertNotDisposed();
    return this.#getInspector().lookupBindings(token);
  }

  inspect(): ContainerSnapshot {
    this.#assertNotDisposed();
    return this.#getInspector().inspect();
  }

  generateDependencyGraph(options?: GraphOptions): ContainerGraphJson {
    this.#assertNotDisposed();
    return buildDependencyGraph(
      this.#registry,
      this.#getMetadataReader(),
      options,
      this.#parent === undefined ? undefined : this.#parent.#registry,
    );
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  #assertNotDisposed(): void {
    if (this.#disposed) {
      throw new DisposedContainerError();
    }
  }
}

// ── Container static ──────────────────────────────────────────────────────────

/**
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
