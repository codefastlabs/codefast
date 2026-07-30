import type { Binding, BindToBuilder } from "#/binding";
import { NO_INSTANCE } from "#/binding";
import type { BindingRegistration } from "#/container/binding-builders";
import { BindingChain } from "#/container/binding-builders";
import type { AutoRegisterRegistry } from "#/decorators/injectable";
import {
  AsyncModuleLoadError,
  CircularDependencyError,
  DisposedContainerError,
  InternalError,
  RebindUnboundTokenError,
  ScopeViolationError,
  SyncDisposalNotSupportedError,
} from "#/errors";
import type { ContainerGraphJson, GraphOptions } from "#/introspection/dependency-graph";
import { buildDependencyGraph } from "#/introspection/dependency-graph";
import type { BindingSnapshot, ContainerSnapshot } from "#/introspection/inspector";
import { Inspector } from "#/introspection/inspector";
import { MetadataReaderToken } from "#/metadata/metadata-reader-token";
import type { MetadataReader } from "#/metadata/metadata-types";
import { defaultMetadataReader } from "#/metadata/symbol-metadata-reader";
import type { AsyncModule, ModuleBuilder, SyncModule } from "#/module";
import type { AsyncModuleBuilder } from "#/module";
import { isSyncModule, MODULE_SETUP } from "#/module";
import { BindingRegistry } from "#/registry";
import { effectiveBindingScope } from "#/resolution/binding-scope";
import type { ResolutionDiagnostics } from "#/resolution/diagnostics";
import { RESOLUTION_DIAGNOSTICS } from "#/resolution/diagnostics";
import { LifecycleManager } from "#/resolution/lifecycle";
import { ROOT_BRANCH } from "#/resolution/resolution-path";
import type { DependencySlot } from "#/resolution/resolve-options";
import { injectionSlotToResolveOptions, bindingSlotToResolveOptions } from "#/resolution/resolve-options";
import { DependencyResolver } from "#/resolution/resolver";
import { ScopeManager } from "#/resolution/scope";
import type { Token } from "#/token";
import { tokenName } from "#/token";
import type {
  ActivationHandler,
  BindingIdentifier,
  BindingScope,
  Constructor,
  DeactivationHandler,
  ResolveOptions,
} from "#/types";

// ── Container interface ────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface Container {
  readonly isDisposed: boolean;

  bind<const Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  unbind(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): void;
  unbindAsync(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): Promise<void>;
  unbindAll(): void;
  unbindAllAsync(): Promise<void>;
  rebind<const Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;

  load(...modules: Array<SyncModule>): void;
  loadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void>;
  unload(...modules: Array<SyncModule>): void;
  unloadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void>;
  loadAutoRegistered(registry: AutoRegisterRegistry): number;

  onActivation<const Value>(token: Token<Value> | Constructor<Value>, handler: ActivationHandler<Value>): void;
  onDeactivation<const Value>(token: Token<Value> | Constructor<Value>, handler: DeactivationHandler<Value>): void;

  resolve<const Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value;
  resolveAsync<const Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Value>;
  resolveOptional<const Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined;
  resolveOptionalAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Value | undefined>;
  resolveAll<const Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Array<Value>;
  resolveAllAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Array<Value>>;

  createChild(): Container;

  dispose(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
  [Symbol.dispose](): never;

  initializeAsync(): Promise<void>;
  validate(): void;

  has(token: Token<unknown> | Constructor, options?: ResolveOptions): boolean;
  hasOwn(token: Token<unknown> | Constructor, options?: ResolveOptions): boolean;
  lookupBindings<const Value>(token: Token<Value> | Constructor<Value>): ReadonlyArray<BindingSnapshot>;
  inspect(): ContainerSnapshot;
  generateDependencyGraph(options?: GraphOptions): ContainerGraphJson;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ContainerStatic {
  create(): Container;
  fromModules(...modules: Array<SyncModule>): Container;
  fromModulesAsync(...modules: Array<SyncModule | AsyncModule>): Promise<Container>;
}

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

  constructor(parent?: DefaultContainer) {
    this.#parent = parent;
    this.#registry = new BindingRegistry();
    this.#scope = new ScopeManager(parent !== undefined);
    this.#lifecycle = new LifecycleManager();
    this.#initResolver();
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
    return { ...this.#resolver.describeCaches(), builtSubsystems };
  }

  #initResolver(): void {
    const metadataReader = this.#getMetadataReader();
    const parentResolver = this.#parent === undefined ? undefined : this.#parent.#resolver;
    this.#resolver = new DependencyResolver(
      this.#registry,
      this.#scope,
      this.#lifecycle,
      metadataReader,
      this,
      parentResolver,
    );
  }

  #getMetadataReader(): MetadataReader {
    // Check if a custom MetadataReader has been bound
    const metaBindings = this.#registry.getAll(MetadataReaderToken);
    if (metaBindings.length > 0) {
      try {
        return this.#resolver.resolve(MetadataReaderToken, undefined, [], []);
      } catch {
        // fall through to default
      }
    }
    if (this.#parent !== undefined) {
      return this.#parent.#getMetadataReader();
    }
    return defaultMetadataReader;
  }

  get isDisposed(): boolean {
    return this.#disposed;
  }

  // ── Binding ──────────────────────────────────────────────────────────────

  bind<const Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> {
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

  #createBindToBuilder<const Value>(
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

  /** Drain singleton scope entries for a set of already-removed bindings. */
  #drainSingletons(bindings: ReadonlyArray<Binding>): Array<[Binding, unknown]> {
    const pairs: Array<[Binding, unknown]> = [];
    for (const binding of bindings) {
      if (binding.instance !== NO_INSTANCE) {
        pairs.push([binding, binding.instance]);
        this.#scope.deleteSingleton(binding);
      }
    }
    return pairs;
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

  rebind<const Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> {
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
      bind: <const Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> =>
        this.#createBindToBuilder(token, registration),
      import: (...modules: Array<SyncModule>): void => {
        this.#loadSyncModules(modules);
      },
    };
  }

  #createAsyncModuleBuilder(moduleRef: object, importPromises: Array<Promise<void>>): AsyncModuleBuilder {
    const registration = this.#moduleRegistration(moduleRef);
    return {
      bind: <const Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> =>
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
        }
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
      const builder = this.#createBindToBuilder(target);
      const bindingBuilder = builder.toSelf();
      if (scope === "singleton") {
        bindingBuilder.singleton();
      } else if (scope === "scoped") {
        bindingBuilder.scoped();
      } else {
        bindingBuilder.transient();
      }
    }
    return entries.length;
  }

  // ── Lifecycle hooks ────────────────────────────────────────────────────────

  onActivation<const Value>(token: Token<Value> | Constructor<Value>, handler: ActivationHandler<Value>): void {
    this.#assertNotDisposed();
    this.#lifecycle.registerActivation(token, handler);
  }

  onDeactivation<const Value>(token: Token<Value> | Constructor<Value>, handler: DeactivationHandler<Value>): void {
    this.#assertNotDisposed();
    this.#lifecycle.registerDeactivation(token, handler);
  }

  // ── Resolution ────────────────────────────────────────────────────────────

  resolve<const Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value {
    this.#assertNotDisposed();
    if (options === undefined) {
      return this.#resolver.resolveFromContext(token, [], []);
    }
    return this.#resolver.resolve(token, options, [], []);
  }

  resolveAsync<const Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Value> {
    this.#assertNotDisposed();
    if (options === undefined) {
      return this.#resolver.resolveAsyncFromRoot(token) as Promise<Value>;
    }
    return this.#resolver.resolveAsync(token, options, [], [], ROOT_BRANCH);
  }

  resolveOptional<const Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined {
    this.#assertNotDisposed();
    return this.#resolver.resolveOptional(token, options, [], []);
  }

  resolveOptionalAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Value | undefined> {
    this.#assertNotDisposed();
    return this.#resolver.resolveOptionalAsync(token, options, [], [], ROOT_BRANCH);
  }

  resolveAll<const Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Array<Value> {
    this.#assertNotDisposed();
    return this.#resolver.resolveAll(token, options, [], []);
  }

  resolveAllAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Array<Value>> {
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
        await this.resolveAsync(binding.token as Token<unknown>, slotOptions);
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
  }

  #isSingletonStaticAnalyzableBinding(binding: Binding): boolean {
    if (effectiveBindingScope(binding) !== "singleton") {
      return false;
    }
    return binding.kind === "class" || binding.kind === "resolved" || binding.kind === "resolved-async";
  }

  /**
   * DFS over explicit constructor / `toResolved*` dependency edges. Follows `toAlias` chains to the
   * terminal binding for scope checks (SPEC §6.9).
   *
   * @remarks A `toDynamic*` dependency is scope-checked like any other — its declared scope is what
   * makes it captive — but the DFS does not descend into the factory, whose body is opaque.
   */
  #validateSingletonBindingGraph(root: Binding, reader: MetadataReader): void {
    const rootName = tokenName(root.token as Token<unknown>);

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
      cyclePath.push(tokenName(current.token as Token<unknown>));
      const nextToken = current.target as Token<unknown> | Constructor;
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
      return reader.getConstructorMetadata(binding.target as Constructor)?.params ?? [];
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
          edges.push({ terminal, depTokenName: tokenName(terminal.token as Token<unknown>) });
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

  lookupBindings<const Value>(token: Token<Value> | Constructor<Value>): ReadonlyArray<BindingSnapshot> {
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
export const Container: ContainerStatic & { create(): Container } = {
  create(): Container {
    return new DefaultContainer();
  },

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
