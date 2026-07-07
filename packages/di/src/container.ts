import type {
  AliasBindingBuilder,
  Binding,
  BindingBuilder,
  BindToBuilder,
  ConstantBindingBuilder,
  ScopedBindingBuilder,
  SingletonBindingBuilder,
  SingletonLifecycleBuilder,
  PartialBinding,
  BindingSlot,
  TransientBindingBuilder,
} from "#/binding";
import { DEFAULT_BINDING_SLOT, generateBindingId } from "#/binding";
import { effectiveBindingScope } from "#/binding-scope";
import { normalizeToDescriptor } from "#/decorators/inject";
import type { AutoRegisterRegistry } from "#/decorators/injectable";
import type { ContainerGraphJson, GraphOptions } from "#/dependency-graph";
import { buildDependencyGraph } from "#/dependency-graph";
import {
  AsyncModuleLoadError,
  CircularDependencyError,
  DisposedContainerError,
  InternalError,
  RebindUnboundTokenError,
  ScopeViolationError,
  SyncDisposalNotSupportedError,
} from "#/errors";
import type { BindingSnapshot, ContainerSnapshot } from "#/inspector";
import { Inspector } from "#/inspector";
import { LifecycleManager } from "#/lifecycle";
import { MetadataReaderToken } from "#/metadata/metadata-reader-token";
import type { MetadataReader } from "#/metadata/metadata-types";
import { defaultMetadataReader } from "#/metadata/symbol-metadata-reader";
import type { AsyncModule, ModuleBuilder, SyncModule } from "#/module";
import type { AsyncModuleBuilder } from "#/module";
import { isSyncModule } from "#/module";
import { BindingRegistry } from "#/registry";
import { injectionSlotToResolveOptions, bindingSlotToResolveOptions } from "#/resolve-options";
import { DependencyResolver } from "#/resolver";
import { ScopeManager } from "#/scope";
import type { Token } from "#/token";
import { tokenName } from "#/token";
import type {
  ActivationHandler,
  BindingIdentifier,
  BindingScope,
  ConstraintContext,
  Constructor,
  DeactivationHandler,
  DependencyKey,
  ResolutionContext,
  ResolveOptions,
  TokenValue,
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
  private _disposed = false;
  private readonly _registry: BindingRegistry;
  private readonly _scope: ScopeManager;
  private readonly _lifecycle: LifecycleManager;
  private _resolver!: DependencyResolver;
  private readonly _inspector: Inspector;
  private readonly _parent: DefaultContainer | undefined;

  // Module tracking: module -> ref count
  private readonly _moduleRefs = new Map<object, number>();
  // Module bindings: module -> array of binding IDs registered by it
  private readonly _moduleBindingIds = new Map<object, Array<BindingIdentifier>>();

  constructor(parent?: DefaultContainer) {
    this._parent = parent;
    this._registry = new BindingRegistry();
    this._scope = new ScopeManager(parent !== undefined);
    this._lifecycle = new LifecycleManager();
    this._inspector = new Inspector(this._registry, this._scope, parent !== undefined, () => this._disposed);
    this._initResolver();
  }

  private _initResolver(): void {
    const metadataReader = this._getMetadataReader();
    const parentResolver = this._parent?._resolver;
    this._resolver = new DependencyResolver(
      this._registry,
      this._scope,
      this._lifecycle,
      metadataReader,
      this,
      parentResolver,
    );
  }

  private _getMetadataReader(): MetadataReader {
    // Check if a custom MetadataReader has been bound
    const metaBindings = this._registry.getAll(MetadataReaderToken);
    if (metaBindings.length > 0) {
      try {
        return this._resolver.resolve(MetadataReaderToken, undefined, [], []);
      } catch {
        // fall through to default
      }
    }
    if (this._parent !== undefined) {
      return this._parent._getMetadataReader();
    }
    return defaultMetadataReader;
  }

  get isDisposed(): boolean {
    return this._disposed;
  }

  // ── Binding ──────────────────────────────────────────────────────────────

  bind<const Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> {
    this._assertNotDisposed();
    return this._createBindToBuilder(token);
  }

  private _createBindToBuilder<const Value>(
    token: Token<Value> | Constructor<Value>,
    moduleRef?: object,
  ): BindToBuilder<Value> {
    const registry = this._registry;

    const commitBinding = (binding: Binding, previousId?: BindingIdentifier): BindingIdentifier => {
      if (previousId !== undefined) {
        registry.removeById(previousId);
        if (moduleRef !== undefined) {
          const ids = this._moduleBindingIds.get(moduleRef);
          if (ids !== undefined) {
            const idx = ids.indexOf(previousId);
            if (idx !== -1) {
              ids.splice(idx, 1);
            }
          }
        }
      }
      registry.add(binding);
      if (moduleRef !== undefined) {
        let ids = this._moduleBindingIds.get(moduleRef);
        if (ids === undefined) {
          ids = [];
          this._moduleBindingIds.set(moduleRef, ids);
        }
        ids.push(binding.id);
      }
      return binding.id;
    };

    return new BindingEntry<Value>(token, commitBinding);
  }

  unbind(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): void {
    this._assertNotDisposed();
    this._unbindSync(tokenOrId);
  }

  /** Remove bindings from registry + scope and collect [binding, instance] pairs for deactivation. */
  private _collectDeactivationPairs(
    tokenOrId: Token<unknown> | Constructor | BindingIdentifier,
  ): Array<[Binding, unknown]> {
    const pairs: Array<[Binding, unknown]> = [];
    for (const binding of this._getBindingsForTokenOrId(tokenOrId)) {
      this._registry.removeById(binding.id);
      if (this._scope.hasSingleton(binding.id)) {
        pairs.push([binding, this._scope.getSingleton(binding.id)]);
        this._scope.deleteSingleton(binding.id);
      }
    }
    return pairs;
  }

  /** Drain singleton scope entries for a set of already-removed bindings. */
  private _drainSingletons(bindings: ReadonlyArray<Binding>): Array<[Binding, unknown]> {
    const pairs: Array<[Binding, unknown]> = [];
    for (const binding of bindings) {
      if (this._scope.hasSingleton(binding.id)) {
        pairs.push([binding, this._scope.getSingleton(binding.id)]);
        this._scope.deleteSingleton(binding.id);
      }
    }
    return pairs;
  }

  private _unbindSync(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): void {
    const reader = this._getMetadataReader();
    for (const [binding, instance] of this._collectDeactivationPairs(tokenOrId)) {
      this._lifecycle.runDeactivationSync(binding, instance, reader);
    }
  }

  async unbindAsync(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): Promise<void> {
    this._assertNotDisposed();
    const reader = this._getMetadataReader();
    for (const [binding, instance] of this._collectDeactivationPairs(tokenOrId)) {
      await this._lifecycle.runDeactivation(binding, instance, reader);
    }
  }

  unbindAll(): void {
    this._assertNotDisposed();
    const reader = this._getMetadataReader();
    for (const [binding, instance] of this._drainSingletons(this._registry.clear())) {
      this._lifecycle.runDeactivationSync(binding, instance, reader);
    }
  }

  async unbindAllAsync(): Promise<void> {
    this._assertNotDisposed();
    const reader = this._getMetadataReader();
    for (const [binding, instance] of this._drainSingletons(this._registry.clear())) {
      await this._lifecycle.runDeactivation(binding, instance, reader);
    }
  }

  rebind<const Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> {
    this._assertNotDisposed();
    if (!this._registry.has(token)) {
      throw new RebindUnboundTokenError(tokenName(token));
    }
    // Unbind existing (sync — if async deactivation, will throw AsyncDeactivationError)
    this._unbindSync(token);
    return this._createBindToBuilder(token);
  }

  private _getBindingsForTokenOrId(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): Array<Binding> {
    if (typeof tokenOrId === "string") {
      // It's a BindingIdentifier (string)
      const binding = this._registry.getById(tokenOrId);
      return binding !== undefined ? [binding] : [];
    }
    return [...this._registry.getAll(tokenOrId)];
  }

  // ── Module ────────────────────────────────────────────────────────────────

  load(...modules: Array<SyncModule>): void {
    this._assertNotDisposed();
    this._loadSyncModules(modules);
  }

  private _loadSyncModules(modules: Array<SyncModule>): void {
    // Collect all modules in topological order (dedup by identity)
    const toLoad = this._collectModuleDeps(modules);
    for (const module of toLoad) {
      if (!isSyncModule(module)) {
        throw new AsyncModuleLoadError(module.name);
      }
      const moduleRef = module as object;
      const existing = this._moduleRefs.get(moduleRef);
      if (existing !== undefined) {
        this._moduleRefs.set(moduleRef, existing + 1);
        continue;
      }
      this._moduleRefs.set(moduleRef, 1);
      const builder = this._createModuleBuilder(moduleRef);
      module._setup(builder);
    }
  }

  private _collectModuleDeps(modules: Array<SyncModule | AsyncModule>): Array<SyncModule | AsyncModule> {
    const seen = new Set<object>();
    const result: Array<SyncModule | AsyncModule> = [];

    const visit = (module: SyncModule | AsyncModule): void => {
      const moduleRef = module as object;
      if (seen.has(moduleRef)) {
        return;
      }
      seen.add(moduleRef);
      // We'll collect deps during setup via the builder's import()
      result.push(module);
    };

    for (const module of modules) {
      visit(module);
    }
    return result;
  }

  async loadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void> {
    this._assertNotDisposed();
    for (const module of modules) {
      await this._loadOneModuleAsync(module);
    }
  }

  private async _loadOneModuleAsync(module: SyncModule | AsyncModule): Promise<void> {
    const moduleRef = module as object;
    const existing = this._moduleRefs.get(moduleRef);
    if (existing !== undefined) {
      this._moduleRefs.set(moduleRef, existing + 1);
      return;
    }
    this._moduleRefs.set(moduleRef, 1);

    if (isSyncModule(module)) {
      const builder = this._createModuleBuilder(moduleRef);
      module._setup(builder);
    } else {
      const importPromises: Array<Promise<void>> = [];
      const builder = this._createAsyncModuleBuilder(moduleRef, importPromises);
      await module._setup(builder);
      // Await nested async imports triggered inside _setup
      if (importPromises.length > 0) {
        await Promise.all(importPromises);
      }
    }
  }

  private _createModuleBuilder(moduleRef: object): ModuleBuilder {
    return {
      bind: <const Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> =>
        this._createBindToBuilder(token, moduleRef),
      import: (...modules: Array<SyncModule>): void => {
        this._loadSyncModules(modules);
      },
    };
  }

  private _createAsyncModuleBuilder(moduleRef: object, importPromises: Array<Promise<void>>): AsyncModuleBuilder {
    return {
      bind: <const Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> =>
        this._createBindToBuilder(token, moduleRef),
      import: (...modules: Array<SyncModule | AsyncModule>): void => {
        for (const module of modules) {
          importPromises.push(this._loadOneModuleAsync(module));
        }
      },
    };
  }

  unload(...modules: Array<SyncModule>): void {
    this._assertNotDisposed();
    for (const module of modules) {
      this._unloadModuleSync(module as object);
    }
  }

  /** Unregister module bindings and collect [binding, instance] pairs for deactivation. */
  private _removeModuleBindings(ref: object): Array<[Binding, unknown]> {
    this._moduleRefs.delete(ref);
    const ids = this._moduleBindingIds.get(ref) ?? [];
    this._moduleBindingIds.delete(ref);
    const pairs: Array<[Binding, unknown]> = [];
    for (const id of ids) {
      const binding = this._registry.getById(id);
      if (binding !== undefined) {
        this._registry.removeById(id);
        if (this._scope.hasSingleton(id)) {
          pairs.push([binding, this._scope.getSingleton(id)]);
          this._scope.deleteSingleton(id);
        }
      }
    }
    return pairs;
  }

  private _unloadModuleSync(ref: object): void {
    const count = this._moduleRefs.get(ref) ?? 0;
    if (count <= 1) {
      const reader = this._getMetadataReader();
      for (const [binding, instance] of this._removeModuleBindings(ref)) {
        this._lifecycle.runDeactivationSync(binding, instance, reader);
      }
    } else {
      this._moduleRefs.set(ref, count - 1);
    }
  }

  async unloadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void> {
    this._assertNotDisposed();
    for (const module of modules) {
      await this._unloadModuleAsync(module as object);
    }
  }

  private async _unloadModuleAsync(ref: object): Promise<void> {
    const count = this._moduleRefs.get(ref) ?? 0;
    if (count <= 1) {
      const reader = this._getMetadataReader();
      for (const [binding, instance] of this._removeModuleBindings(ref)) {
        await this._lifecycle.runDeactivation(binding, instance, reader);
      }
    } else {
      this._moduleRefs.set(ref, count - 1);
    }
  }

  loadAutoRegistered(registry: AutoRegisterRegistry): number {
    this._assertNotDisposed();
    const entries = registry.entries();
    for (const { target, scope } of entries) {
      const builder = this._createBindToBuilder(target);
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
    this._assertNotDisposed();
    this._lifecycle.registerActivation(token, handler);
  }

  onDeactivation<const Value>(token: Token<Value> | Constructor<Value>, handler: DeactivationHandler<Value>): void {
    this._assertNotDisposed();
    this._lifecycle.registerDeactivation(token, handler);
  }

  // ── Resolution ────────────────────────────────────────────────────────────

  resolve<const Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value {
    this._assertNotDisposed();
    if (options === undefined) {
      return this._resolver.resolveFromContext(token, [], []);
    }
    return this._resolver.resolve(token, options, [], []);
  }

  resolveAsync<const Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Value> {
    this._assertNotDisposed();
    if (options === undefined) {
      return this._resolver.resolveAsyncFromContext(token, [], []);
    }
    return this._resolver.resolveAsync(token, options, [], []);
  }

  resolveOptional<const Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined {
    this._assertNotDisposed();
    return this._resolver.resolveOptional(token, options, [], []);
  }

  resolveOptionalAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Value | undefined> {
    this._assertNotDisposed();
    return this._resolver.resolveOptionalAsync(token, options, [], []);
  }

  resolveAll<const Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Array<Value> {
    this._assertNotDisposed();
    return this._resolver.resolveAll(token, options, [], []);
  }

  resolveAllAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Array<Value>> {
    this._assertNotDisposed();
    return this._resolver.resolveAllAsync(token, options, [], []);
  }

  // ── Child ─────────────────────────────────────────────────────────────────

  createChild(): Container {
    this._assertNotDisposed();
    return new DefaultContainer(this);
  }

  // ── Dispose ───────────────────────────────────────────────────────────────

  async dispose(): Promise<void> {
    if (this._disposed) {
      return;
    }
    this._disposed = true;

    // Deactivate all singletons in this container (own only)
    const reader = this._getMetadataReader();
    for (const [id, instance] of this._scope.getAllSingletons()) {
      const binding = this._registry.getById(id);
      if (binding !== undefined) {
        await this._lifecycle.runDeactivation(binding, instance, reader);
      }
    }

    this._scope.clearAll();
  }

  [Symbol.asyncDispose](): Promise<void> {
    return this.dispose();
  }

  [Symbol.dispose](): never {
    throw new SyncDisposalNotSupportedError();
  }

  // ── Initialization ────────────────────────────────────────────────────────

  async initializeAsync(): Promise<void> {
    this._assertNotDisposed();
    const allBindings = this._registry.allBindings();
    for (const binding of allBindings) {
      if (binding.kind === "alias") {
        continue;
      }
      const scope = effectiveBindingScope(binding);
      if (scope === "singleton" && !this._scope.hasSingleton(binding.id)) {
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
    this._assertNotDisposed();
    const reader = this._getMetadataReader();
    const allBindings = this._registry.allBindings();

    for (const binding of allBindings) {
      if (!this._isSingletonStaticAnalyzableBinding(binding)) {
        continue;
      }
      this._validateSingletonBindingGraph(binding, reader);
    }
  }

  private _isSingletonStaticAnalyzableBinding(binding: Binding): boolean {
    if (effectiveBindingScope(binding) !== "singleton") {
      return false;
    }
    return binding.kind === "class" || binding.kind === "resolved" || binding.kind === "resolved-async";
  }

  /**
   * DFS over explicit constructor / `toResolved*` dependency edges. Follows `toAlias` chains to the
   * terminal binding for scope checks (SPEC §6.9). Skips `toDynamic*` subtrees (opaque).
   */
  private _validateSingletonBindingGraph(root: Binding, reader: MetadataReader): void {
    const rootName = tokenName(root.token as Token<unknown>);

    const dfs = (current: Binding, pathNames: Array<string>, pathBindingIds: Set<BindingIdentifier>): void => {
      if (pathBindingIds.has(current.id)) {
        return;
      }
      const extendedPathIds = new Set(pathBindingIds);
      extendedPathIds.add(current.id);

      for (const edge of this._collectStaticDependencyEdges(current, reader)) {
        const { terminal, depTokenName } = edge;
        const depScope = this._validationScopeFromTerminal(terminal);
        if (depScope === "opaque") {
          continue;
        }
        if (depScope === "scoped" || depScope === "transient") {
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

  private _validationScopeFromTerminal(terminal: Binding): BindingScope | "opaque" {
    switch (terminal.kind) {
      case "constant":
        return "singleton";
      case "dynamic":
      case "dynamic-async":
        return "opaque";
      case "class":
      case "resolved":
      case "resolved-async":
        return terminal.scope;
      case "alias":
        throw new InternalError("validate: expected terminal binding after alias resolution");
      default: {
        const exhaustive: never = terminal;
        return exhaustive;
      }
    }
  }

  private _followAliasChainToTerminal(binding: Binding, options: ResolveOptions | undefined): Binding | undefined {
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
      const next = this._resolver.peekBindingForValidate(nextToken, options);
      if (next === undefined) {
        return undefined;
      }
      current = next.binding;
    }
    return current;
  }

  private _collectStaticDependencyEdges(
    binding: Binding,
    reader: MetadataReader,
  ): Array<{ terminal: Binding; depTokenName: string }> {
    const edges: Array<{ terminal: Binding; depTokenName: string }> = [];

    const pushTerminal = (terminal: Binding | undefined, displayName: string): void => {
      if (terminal === undefined) {
        return;
      }
      edges.push({ terminal, depTokenName: displayName });
    };

    if (binding.kind === "class") {
      const meta = reader.getConstructorMetadata(binding.target as Constructor);
      if (meta === undefined) {
        return edges;
      }
      for (const param of meta.params) {
        const paramOptions = injectionSlotToResolveOptions(param);
        if (param.optional) {
          continue;
        }
        const tokenRef = param.token;
        if (param.multi) {
          const candidates = this._resolver.peekCandidateBindingsForValidate(tokenRef, paramOptions);
          for (const cand of candidates) {
            const term = this._followAliasChainToTerminal(cand, paramOptions);
            pushTerminal(term, term !== undefined ? tokenName(term.token as Token<unknown>) : "");
          }
          continue;
        }
        const found =
          paramOptions === undefined
            ? this._resolver.peekBindingForValidate(tokenRef, undefined)
            : this._resolver.peekBindingForValidate(tokenRef, paramOptions);
        if (found === undefined) {
          continue;
        }
        const term = this._followAliasChainToTerminal(found.binding, paramOptions);
        pushTerminal(term, term !== undefined ? tokenName(term.token as Token<unknown>) : "");
      }
      return edges;
    }

    if (binding.kind === "resolved" || binding.kind === "resolved-async") {
      for (const dep of binding.deps) {
        const depOptions = injectionSlotToResolveOptions(dep);
        if (dep.optional) {
          continue;
        }
        const tokenRef = dep.token as Token<unknown> | Constructor;
        if (dep.multi) {
          const candidates = this._resolver.peekCandidateBindingsForValidate(tokenRef, depOptions);
          for (const cand of candidates) {
            const term = this._followAliasChainToTerminal(cand, depOptions);
            pushTerminal(term, term !== undefined ? tokenName(term.token as Token<unknown>) : "");
          }
          continue;
        }
        const found =
          depOptions === undefined
            ? this._resolver.peekBindingForValidate(tokenRef, undefined)
            : this._resolver.peekBindingForValidate(tokenRef, depOptions);
        if (found === undefined) {
          continue;
        }
        const term = this._followAliasChainToTerminal(found.binding, depOptions);
        pushTerminal(term, term !== undefined ? tokenName(term.token as Token<unknown>) : "");
      }
    }

    return edges;
  }

  // ── Introspection ─────────────────────────────────────────────────────────

  has(token: Token<unknown> | Constructor, options?: ResolveOptions): boolean {
    this._assertNotDisposed();
    return this._inspector.has(token, options, () => this._parent?.has(token, options) ?? false);
  }

  hasOwn(token: Token<unknown> | Constructor, options?: ResolveOptions): boolean {
    this._assertNotDisposed();
    return this._inspector.hasOwn(token, options);
  }

  lookupBindings<const Value>(token: Token<Value> | Constructor<Value>): ReadonlyArray<BindingSnapshot> {
    this._assertNotDisposed();
    return this._inspector.lookupBindings(token);
  }

  inspect(): ContainerSnapshot {
    this._assertNotDisposed();
    return this._inspector.inspect();
  }

  generateDependencyGraph(options?: GraphOptions): ContainerGraphJson {
    this._assertNotDisposed();
    return buildDependencyGraph(this._registry, this._getMetadataReader(), options, this._parent?._registry);
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private _assertNotDisposed(): void {
    if (this._disposed) {
      throw new DisposedContainerError();
    }
  }
}

// ── Shared builder helpers ────────────────────────────────────────────────────

type CommitFn = (binding: Binding, previousId?: BindingIdentifier) => BindingIdentifier;

function updateSlotTag(slot: BindingSlot, tag: string, value: unknown): BindingSlot {
  const existing = [...slot.tags];
  const idx = existing.findIndex(([k]) => k === tag);
  if (idx !== -1) {
    existing[idx] = [tag, value];
  } else {
    existing.push([tag, value]);
  }
  return { ...slot, tags: existing };
}

// ── SlotBuilder ───────────────────────────────────────────────────────────────

abstract class SlotBuilder {
  protected _slot: BindingSlot = DEFAULT_BINDING_SLOT; // ✓ T3-1: no redundant spread
  protected _predicate: ((ctx: ConstraintContext) => boolean) | undefined;
  protected _committed: BindingIdentifier | undefined;

  protected abstract _doCommit(): void;

  when(predicate: (ctx: ConstraintContext) => boolean): this {
    this._predicate = predicate;
    this._doCommit();
    return this;
  }

  whenNamed(name: string): this {
    this._slot = { ...this._slot, name };
    this._doCommit();
    return this;
  }

  whenTagged(tag: string, value: unknown): this {
    this._slot = updateSlotTag(this._slot, tag, value);
    this._doCommit();
    return this;
  }

  whenDefault(): this {
    return this;
  }

  id(): BindingIdentifier {
    return this._committed!;
  }
}

// ── BindingEntry ──────────────────────────────────────────────────────────────

class BindingEntry<Value> implements BindToBuilder<Value> {
  constructor(
    private readonly _token: Token<Value> | Constructor<Value>,
    private readonly _commit: CommitFn,
  ) {}

  to(type: Constructor<Value>): BindingBuilder<Value> {
    return new ConstraintBuilder<Value>(this._token, { kind: "class", target: type, scope: "transient" }, this._commit);
  }

  toSelf(): BindingBuilder<Value> {
    if (typeof this._token !== "function") {
      throw new Error("toSelf() requires token to be a Constructor");
    }
    return new ConstraintBuilder<Value>(
      this._token,
      { kind: "class", target: this._token, scope: "transient" },
      this._commit,
    );
  }

  toConstantValue(value: Value): ConstantBindingBuilder<Value> {
    return new ConstantBuilder<Value>(this._token, value, this._commit);
  }

  toDynamic(factory: (ctx: ResolutionContext) => Value): BindingBuilder<Value> {
    return new ConstraintBuilder<Value>(this._token, { kind: "dynamic", factory, scope: "transient" }, this._commit);
  }

  toDynamicAsync(factory: (ctx: ResolutionContext) => Promise<Value>): BindingBuilder<Value> {
    return new ConstraintBuilder<Value>(
      this._token,
      { kind: "dynamic-async", factory, scope: "transient" },
      this._commit,
    );
  }

  toResolved<const Deps extends ReadonlyArray<DependencyKey>>(
    factory: (...args: { [K in keyof Deps]: TokenValue<NoInfer<Deps>[K]> }) => Value,
    deps: Deps,
  ): BindingBuilder<Value> {
    const normalizedDeps = deps.map((dependency) => normalizeToDescriptor(dependency));
    return new ConstraintBuilder<Value>(
      this._token,
      {
        kind: "resolved",
        factory: factory as (...args: Array<unknown>) => Value,
        deps: normalizedDeps,
        scope: "transient",
      },
      this._commit,
    );
  }

  toResolvedAsync<const Deps extends ReadonlyArray<DependencyKey>>(
    factory: (...args: { [K in keyof Deps]: TokenValue<NoInfer<Deps>[K]> }) => Promise<Value>,
    deps: Deps,
  ): BindingBuilder<Value> {
    const normalizedDeps = deps.map((dependency) => normalizeToDescriptor(dependency));
    return new ConstraintBuilder<Value>(
      this._token,
      {
        kind: "resolved-async",
        factory: factory as (...args: Array<unknown>) => Promise<Value>,
        deps: normalizedDeps,
        scope: "transient",
      },
      this._commit,
    );
  }

  toAlias(target: Token<Value> | Constructor<Value>): AliasBindingBuilder {
    return new AliasBuilder<Value>(this._token, target, this._commit);
  }
}

// ── ConstraintBuilder ─────────────────────────────────────────────────────────

class ConstraintBuilder<Value> extends SlotBuilder implements BindingBuilder<Value> {
  constructor(
    private readonly _token: Token<Value> | Constructor<Value>,
    private readonly _partial: PartialBinding<Value>,
    private readonly _commit: CommitFn,
  ) {
    super();
    this._doCommit();
  }

  protected _doCommit(): void {
    const previousId = this._committed;
    const binding: Binding<Value> = {
      ...(this._partial as unknown as object),
      id: generateBindingId(),
      token: this._token,
      slot: this._slot,
      predicate: this._predicate,
    } as Binding<Value>;
    this._committed = this._commit(binding as Binding, previousId);
  }

  singleton(): SingletonBindingBuilder<Value> {
    const previousId = this._committed;
    this._committed = undefined;
    return new ScopeBuilder<Value, "singleton">(
      this._token,
      { ...this._partial, scope: "singleton" } as PartialBinding<Value>,
      this._slot,
      this._predicate,
      this._commit,
      "singleton",
      previousId,
    );
  }

  transient(): TransientBindingBuilder<Value> {
    const previousId = this._committed;
    this._committed = undefined;
    return new ScopeBuilder<Value, "transient">(
      this._token,
      { ...this._partial, scope: "transient" } as PartialBinding<Value>,
      this._slot,
      this._predicate,
      this._commit,
      "transient",
      previousId,
    );
  }

  scoped(): ScopedBindingBuilder<Value> {
    const previousId = this._committed;
    this._committed = undefined;
    return new ScopeBuilder<Value, "scoped">(
      this._token,
      { ...this._partial, scope: "scoped" } as PartialBinding<Value>,
      this._slot,
      this._predicate,
      this._commit,
      "scoped",
      previousId,
    );
  }
}

// ── ScopeBuilder ─────────────────────────────────────────────────────────────

class ScopeBuilder<Value, Scope extends BindingScope>
  implements SingletonBindingBuilder<Value>, TransientBindingBuilder<Value>
{
  private _onActivation: ActivationHandler<Value> | undefined;
  private _onDeactivation: DeactivationHandler<Value> | undefined;
  private _committed: BindingIdentifier | undefined;

  constructor(
    private readonly _token: Token<Value> | Constructor<Value>,
    private readonly _partial: PartialBinding<Value>,
    private readonly _slot: BindingSlot,
    private readonly _predicate: ((ctx: ConstraintContext) => boolean) | undefined,
    private readonly _commit: CommitFn,
    private readonly _scope: Scope,
    private readonly _initialPreviousId?: BindingIdentifier,
  ) {
    this._doCommit();
  }

  private _doCommit(): void {
    const previousId = this._committed ?? this._initialPreviousId;
    const binding = {
      ...(this._partial as unknown as object),
      id: generateBindingId(),
      token: this._token,
      slot: this._slot,
      predicate: this._predicate,
      onActivation: this._onActivation,
      onDeactivation: this._onDeactivation,
    } as Binding<Value>;
    this._committed = this._commit(binding as Binding, previousId);
  }

  onActivation(fn: ActivationHandler<Value>): this {
    this._onActivation = fn;
    this._doCommit();
    return this;
  }

  onDeactivation(fn: DeactivationHandler<Value>): this {
    this._onDeactivation = fn;
    this._doCommit();
    return this;
  }

  id(): BindingIdentifier {
    return this._committed!;
  }
}

// ── ConstantBuilder ───────────────────────────────────────────────────────────

class ConstantBuilder<Value>
  extends SlotBuilder
  implements ConstantBindingBuilder<Value>, SingletonLifecycleBuilder<Value>
{
  private _onActivation: ActivationHandler<Value> | undefined;
  private _onDeactivation: DeactivationHandler<Value> | undefined;

  constructor(
    private readonly _token: Token<Value> | Constructor<Value>,
    private readonly _value: Value,
    private readonly _commit: CommitFn,
  ) {
    super();
    this._doCommit();
  }

  protected _doCommit(): void {
    const previousId = this._committed;
    const binding: Binding<Value> = {
      kind: "constant",
      id: generateBindingId(),
      token: this._token,
      slot: this._slot,
      predicate: this._predicate,
      value: this._value,
      scope: "singleton",
      onActivation: this._onActivation,
      onDeactivation: this._onDeactivation,
    } as unknown as Binding<Value>;
    this._committed = this._commit(binding as Binding, previousId);
  }

  onActivation(fn: ActivationHandler<Value>): this {
    this._onActivation = fn;
    this._doCommit();
    return this;
  }

  onDeactivation(fn: DeactivationHandler<Value>): this {
    this._onDeactivation = fn;
    this._doCommit();
    return this;
  }
}

// ── AliasBuilder ──────────────────────────────────────────────────────────────

class AliasBuilder<Value> extends SlotBuilder implements AliasBindingBuilder {
  constructor(
    private readonly _token: Token<Value> | Constructor<Value>,
    private readonly _target: Token<Value> | Constructor<Value>,
    private readonly _commit: CommitFn,
  ) {
    super();
    this._doCommit();
  }

  protected _doCommit(): void {
    const previousId = this._committed;
    const binding: Binding<Value> = {
      kind: "alias",
      id: generateBindingId(),
      token: this._token,
      slot: this._slot,
      predicate: this._predicate,
      target: this._target,
    } as unknown as Binding<Value>;
    this._committed = this._commit(binding as Binding, previousId);
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
