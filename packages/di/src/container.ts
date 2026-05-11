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
  SlotKey,
  TransientBindingBuilder,
} from "#/binding";
import type { Token } from "#/token";
import type { AsyncModule, ModuleBuilder, SyncModule } from "#/module";
import type { BindingSnapshot, ContainerSnapshot } from "#/inspector";
import type { ContainerGraphJson, GraphOptions } from "#/dependency-graph";
import type { MetadataReader } from "#/metadata/metadata-types";
import type { AutoRegisterRegistry } from "#/decorators/injectable";
import type { AsyncModuleBuilder } from "#/module";
import {
  AsyncModuleLoadError,
  CircularDependencyError,
  DisposedContainerError,
  InternalError,
  RebindUnboundTokenError,
  ScopeViolationError,
  SyncDisposalNotSupportedError,
} from "#/errors";
import { DEFAULT_SLOT, generateBindingId } from "#/binding";
import { BindingRegistry } from "#/registry";
import { ScopeManager } from "#/scope";
import { LifecycleManager } from "#/lifecycle";
import { DependencyResolver } from "#/resolver";
import { Inspector } from "#/inspector";
import { buildDependencyGraph } from "#/dependency-graph";
import { defaultMetadataReader } from "#/metadata/symbol-metadata-reader";
import { MetadataReaderToken } from "#/metadata/metadata-reader-token";
import { tokenName } from "#/token";
import { normalizeToDescriptor } from "#/decorators/inject";
import { isSyncModule } from "#/module";
import { effectiveBindingScope } from "#/binding-scope";
import { injectableSlotToResolveOptions, slotKeyToResolveOptions } from "#/resolve-options";

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

  onActivation<const Value>(
    token: Token<Value> | Constructor<Value>,
    handler: ActivationHandler<Value>,
  ): void;
  onDeactivation<const Value>(
    token: Token<Value> | Constructor<Value>,
    handler: DeactivationHandler<Value>,
  ): void;

  resolve<const Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveOptions): Value;
  resolveAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value>;
  resolveOptional<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Value | undefined;
  resolveOptionalAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value | undefined>;
  resolveAll<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Array<Value>;
  resolveAllAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Array<Value>>;

  createChild(): Container;

  dispose(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
  [Symbol.dispose](): never;

  initializeAsync(): Promise<void>;
  validate(): void;

  has(token: Token<unknown> | Constructor, hint?: ResolveOptions): boolean;
  hasOwn(token: Token<unknown> | Constructor, hint?: ResolveOptions): boolean;
  lookupBindings<const Value>(
    token: Token<Value> | Constructor<Value>,
  ): ReadonlyArray<BindingSnapshot>;
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
    this._inspector = new Inspector(
      this._registry,
      this._scope,
      parent !== undefined,
      () => this._disposed,
    );
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
        return this._resolver.resolve(MetadataReaderToken, undefined, [], []) as MetadataReader;
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

    const commitBinding = (b: Binding, previousId?: BindingIdentifier): BindingIdentifier => {
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
      registry.add(b);
      if (moduleRef !== undefined) {
        let ids = this._moduleBindingIds.get(moduleRef);
        if (ids === undefined) {
          ids = [];
          this._moduleBindingIds.set(moduleRef, ids);
        }
        ids.push(b.id);
      }
      return b.id;
    };

    return new BindingEntry<Value>(token, commitBinding);
  }

  unbind(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): void {
    this._assertNotDisposed();
    this._unbindSync(tokenOrId);
  }

  private _unbindSync(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): void {
    const bindings = this._getBindingsForTokenOrId(tokenOrId);
    for (const binding of bindings) {
      this._registry.removeById(binding.id);
      if (this._scope.hasSingleton(binding.id)) {
        const instance = this._scope.getSingleton(binding.id);
        this._scope.deleteSingleton(binding.id);
        this._lifecycle.runDeactivationSync(binding, instance, this._getMetadataReader());
      }
    }
  }

  async unbindAsync(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): Promise<void> {
    this._assertNotDisposed();
    const bindings = this._getBindingsForTokenOrId(tokenOrId);
    for (const binding of bindings) {
      this._registry.removeById(binding.id);
      if (this._scope.hasSingleton(binding.id)) {
        const instance = this._scope.getSingleton(binding.id);
        this._scope.deleteSingleton(binding.id);
        await this._lifecycle.runDeactivation(binding, instance, this._getMetadataReader());
      }
    }
  }

  unbindAll(): void {
    this._assertNotDisposed();
    const all = this._registry.clear();
    for (const binding of all) {
      if (this._scope.hasSingleton(binding.id)) {
        const instance = this._scope.getSingleton(binding.id);
        this._scope.deleteSingleton(binding.id);
        this._lifecycle.runDeactivationSync(binding, instance, this._getMetadataReader());
      }
    }
  }

  async unbindAllAsync(): Promise<void> {
    this._assertNotDisposed();
    const all = this._registry.clear();
    for (const binding of all) {
      if (this._scope.hasSingleton(binding.id)) {
        const instance = this._scope.getSingleton(binding.id);
        this._scope.deleteSingleton(binding.id);
        await this._lifecycle.runDeactivation(binding, instance, this._getMetadataReader());
      }
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

  private _getBindingsForTokenOrId(
    tokenOrId: Token<unknown> | Constructor | BindingIdentifier,
  ): Array<Binding> {
    if (typeof tokenOrId === "string") {
      // It's a BindingIdentifier (string)
      const b = this._registry.getById(tokenOrId as BindingIdentifier);
      return b !== undefined ? [b] : [];
    }
    return [...this._registry.getAll(tokenOrId as Token<unknown> | Constructor)];
  }

  // ── Module ────────────────────────────────────────────────────────────────

  load(...modules: Array<SyncModule>): void {
    this._assertNotDisposed();
    this._loadSyncModules(modules);
  }

  private _loadSyncModules(modules: Array<SyncModule>): void {
    // Collect all modules in topological order (dedup by identity)
    const toLoad = this._collectModuleDeps(modules);
    for (const mod of toLoad) {
      if (!isSyncModule(mod)) {
        throw new AsyncModuleLoadError((mod as AsyncModule).name);
      }
      const ref = mod as object;
      const existing = this._moduleRefs.get(ref);
      if (existing !== undefined) {
        this._moduleRefs.set(ref, existing + 1);
        continue;
      }
      this._moduleRefs.set(ref, 1);
      const builder = this._createModuleBuilder(ref);
      (mod as SyncModule)._setup(builder);
    }
  }

  private _collectModuleDeps(
    modules: Array<SyncModule | AsyncModule>,
  ): Array<SyncModule | AsyncModule> {
    const seen = new Set<object>();
    const result: Array<SyncModule | AsyncModule> = [];

    const visit = (mod: SyncModule | AsyncModule): void => {
      const ref = mod as object;
      if (seen.has(ref)) {
        return;
      }
      seen.add(ref);
      // We'll collect deps during setup via the builder's import()
      result.push(mod);
    };

    for (const m of modules) {
      visit(m);
    }
    return result;
  }

  async loadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void> {
    this._assertNotDisposed();
    for (const mod of modules) {
      await this._loadOneModuleAsync(mod);
    }
  }

  private async _loadOneModuleAsync(mod: SyncModule | AsyncModule): Promise<void> {
    const ref = mod as object;
    const existing = this._moduleRefs.get(ref);
    if (existing !== undefined) {
      this._moduleRefs.set(ref, existing + 1);
      return;
    }
    this._moduleRefs.set(ref, 1);

    if (isSyncModule(mod)) {
      const builder = this._createModuleBuilder(ref);
      mod._setup(builder);
    } else {
      const importPromises: Array<Promise<void>> = [];
      const builder = this._createAsyncModuleBuilder(ref, importPromises);
      await (mod as AsyncModule)._setup(builder);
      // Await nested async imports triggered inside _setup
      if (importPromises.length > 0) {
        await Promise.all(importPromises);
      }
    }
  }

  private _createModuleBuilder(moduleRef: object): ModuleBuilder {
    return {
      bind: <const Value>(t: Token<Value> | Constructor<Value>): BindToBuilder<Value> =>
        this._createBindToBuilder(t, moduleRef),
      import: (...mods: Array<SyncModule>): void => {
        this._loadSyncModules(mods);
      },
    };
  }

  private _createAsyncModuleBuilder(
    moduleRef: object,
    importPromises: Array<Promise<void>>,
  ): AsyncModuleBuilder {
    return {
      bind: <const Value>(t: Token<Value> | Constructor<Value>): BindToBuilder<Value> =>
        this._createBindToBuilder(t, moduleRef),
      import: (...mods: Array<SyncModule | AsyncModule>): void => {
        for (const mod of mods) {
          importPromises.push(this._loadOneModuleAsync(mod));
        }
      },
    };
  }

  unload(...modules: Array<SyncModule>): void {
    this._assertNotDisposed();
    for (const mod of modules) {
      this._unloadModuleSync(mod as object);
    }
  }

  private _unloadModuleSync(ref: object): void {
    const count = this._moduleRefs.get(ref) ?? 0;
    if (count <= 1) {
      this._moduleRefs.delete(ref);
      const ids = this._moduleBindingIds.get(ref) ?? [];
      this._moduleBindingIds.delete(ref);
      for (const id of ids) {
        const binding = this._registry.getById(id);
        if (binding !== undefined) {
          this._registry.removeById(id);
          if (this._scope.hasSingleton(id)) {
            const instance = this._scope.getSingleton(id);
            this._scope.deleteSingleton(id);
            this._lifecycle.runDeactivationSync(binding, instance, this._getMetadataReader());
          }
        }
      }
    } else {
      this._moduleRefs.set(ref, count - 1);
    }
  }

  async unloadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void> {
    this._assertNotDisposed();
    for (const mod of modules) {
      await this._unloadModuleAsync(mod as object);
    }
  }

  private async _unloadModuleAsync(ref: object): Promise<void> {
    const count = this._moduleRefs.get(ref) ?? 0;
    if (count <= 1) {
      this._moduleRefs.delete(ref);
      const ids = this._moduleBindingIds.get(ref) ?? [];
      this._moduleBindingIds.delete(ref);
      for (const id of ids) {
        const binding = this._registry.getById(id);
        if (binding !== undefined) {
          this._registry.removeById(id);
          if (this._scope.hasSingleton(id)) {
            const instance = this._scope.getSingleton(id);
            this._scope.deleteSingleton(id);
            await this._lifecycle.runDeactivation(binding, instance, this._getMetadataReader());
          }
        }
      }
    } else {
      this._moduleRefs.set(ref, count - 1);
    }
  }

  loadAutoRegistered(registry: AutoRegisterRegistry): number {
    this._assertNotDisposed();
    const entries = registry.entries();
    for (const { target, scope } of entries) {
      const builder = this._createBindToBuilder(target as Constructor);
      const bb = builder.toSelf();
      if (scope === "singleton") {
        bb.singleton();
      } else if (scope === "scoped") {
        bb.scoped();
      } else {
        bb.transient();
      }
    }
    return entries.length;
  }

  // ── Lifecycle hooks ────────────────────────────────────────────────────────

  onActivation<const Value>(
    token: Token<Value> | Constructor<Value>,
    handler: ActivationHandler<Value>,
  ): void {
    this._assertNotDisposed();
    this._lifecycle.registerActivation(token, handler);
  }

  onDeactivation<const Value>(
    token: Token<Value> | Constructor<Value>,
    handler: DeactivationHandler<Value>,
  ): void {
    this._assertNotDisposed();
    this._lifecycle.registerDeactivation(token, handler);
  }

  // ── Resolution ────────────────────────────────────────────────────────────

  resolve<const Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveOptions): Value {
    this._assertNotDisposed();
    if (hint === undefined) {
      return this._resolver.resolveFromContext(token, [], []);
    }
    return this._resolver.resolve(token, hint, [], []);
  }

  resolveAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value> {
    this._assertNotDisposed();
    if (hint === undefined) {
      return this._resolver.resolveAsyncFromContext(token, [], []);
    }
    return this._resolver.resolveAsync(token, hint, [], []);
  }

  resolveOptional<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Value | undefined {
    this._assertNotDisposed();
    return this._resolver.resolveOptional(token, hint, [], []);
  }

  resolveOptionalAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value | undefined> {
    this._assertNotDisposed();
    return this._resolver.resolveOptionalAsync(token, hint, [], []);
  }

  resolveAll<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Array<Value> {
    this._assertNotDisposed();
    return this._resolver.resolveAll(token, hint, [], []);
  }

  resolveAllAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Array<Value>> {
    this._assertNotDisposed();
    return this._resolver.resolveAllAsync(token, hint, [], []);
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
        const slotHint = slotKeyToResolveOptions(binding.slot);
        await this.resolveAsync(binding.token as Token<unknown>, slotHint);
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
    return (
      binding.kind === "class" || binding.kind === "resolved" || binding.kind === "resolved-async"
    );
  }

  /**
   * DFS over explicit constructor / `toResolved*` dependency edges. Follows `toAlias` chains to the
   * terminal binding for scope checks (SPEC §6.9). Skips `toDynamic*` subtrees (opaque).
   */
  private _validateSingletonBindingGraph(root: Binding, reader: MetadataReader): void {
    const rootName = tokenName(root.token as Token<unknown>);

    const dfs = (
      current: Binding,
      pathNames: Array<string>,
      pathBindingIds: Set<BindingIdentifier>,
    ): void => {
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
        if (
          terminal.kind === "class" ||
          terminal.kind === "resolved" ||
          terminal.kind === "resolved-async"
        ) {
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

  private _followAliasChainToTerminal(
    binding: Binding,
    hint: ResolveOptions | undefined,
  ): Binding | undefined {
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
      const next = this._resolver.peekBindingForValidate(nextToken, hint);
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
        const paramHint = injectableSlotToResolveOptions(param);
        if (param.optional) {
          continue;
        }
        const tokenRef = param.token as Token<unknown> | Constructor;
        if (param.multi) {
          const candidates = this._resolver.peekCandidateBindingsForValidate(tokenRef, paramHint);
          for (const cand of candidates) {
            const term = this._followAliasChainToTerminal(cand, paramHint);
            pushTerminal(term, term !== undefined ? tokenName(term.token as Token<unknown>) : "");
          }
          continue;
        }
        const found =
          paramHint === undefined
            ? this._resolver.peekBindingForValidate(tokenRef, undefined)
            : this._resolver.peekBindingForValidate(tokenRef, paramHint);
        if (found === undefined) {
          continue;
        }
        const term = this._followAliasChainToTerminal(found.binding, paramHint);
        pushTerminal(term, term !== undefined ? tokenName(term.token as Token<unknown>) : "");
      }
      return edges;
    }

    if (binding.kind === "resolved" || binding.kind === "resolved-async") {
      for (const dep of binding.deps) {
        const depHint = injectableSlotToResolveOptions(dep);
        if (dep.optional) {
          continue;
        }
        const tokenRef = dep.token as Token<unknown> | Constructor;
        if (dep.multi) {
          const candidates = this._resolver.peekCandidateBindingsForValidate(tokenRef, depHint);
          for (const cand of candidates) {
            const term = this._followAliasChainToTerminal(cand, depHint);
            pushTerminal(term, term !== undefined ? tokenName(term.token as Token<unknown>) : "");
          }
          continue;
        }
        const found =
          depHint === undefined
            ? this._resolver.peekBindingForValidate(tokenRef, undefined)
            : this._resolver.peekBindingForValidate(tokenRef, depHint);
        if (found === undefined) {
          continue;
        }
        const term = this._followAliasChainToTerminal(found.binding, depHint);
        pushTerminal(term, term !== undefined ? tokenName(term.token as Token<unknown>) : "");
      }
    }

    return edges;
  }

  // ── Introspection ─────────────────────────────────────────────────────────

  has(token: Token<unknown> | Constructor, hint?: ResolveOptions): boolean {
    this._assertNotDisposed();
    return this._inspector.has(token, hint, () => this._parent?.has(token, hint) ?? false);
  }

  hasOwn(token: Token<unknown> | Constructor, hint?: ResolveOptions): boolean {
    this._assertNotDisposed();
    return this._inspector.hasOwn(token, hint);
  }

  lookupBindings<const Value>(
    token: Token<Value> | Constructor<Value>,
  ): ReadonlyArray<BindingSnapshot> {
    this._assertNotDisposed();
    return this._inspector.lookupBindings(token);
  }

  inspect(): ContainerSnapshot {
    this._assertNotDisposed();
    return this._inspector.inspect();
  }

  generateDependencyGraph(options?: GraphOptions): ContainerGraphJson {
    this._assertNotDisposed();
    return buildDependencyGraph(
      this._registry,
      this._getMetadataReader(),
      options,
      this._parent?._registry,
    );
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private _assertNotDisposed(): void {
    if (this._disposed) {
      throw new DisposedContainerError();
    }
  }
}

// ── Shared builder helpers ────────────────────────────────────────────────────

function updateSlotTag(slot: SlotKey, tag: string, value: unknown): SlotKey {
  const existing = [...slot.tags];
  const idx = existing.findIndex(([k]) => k === tag);
  if (idx !== -1) {
    existing[idx] = [tag, value];
  } else {
    existing.push([tag, value]);
  }
  return { ...slot, tags: existing };
}

// ── BindingEntry ──────────────────────────────────────────────────────────────

class BindingEntry<Value> implements BindToBuilder<Value> {
  constructor(
    private readonly _token: Token<Value> | Constructor<Value>,
    private readonly _commit: (b: Binding, previousId?: BindingIdentifier) => BindingIdentifier,
  ) {}

  to(type: Constructor<Value>): BindingBuilder<Value> {
    return new ConstraintBuilder<Value>(
      this._token,
      { kind: "class", target: type, scope: "transient" },
      this._commit,
    );
  }

  toSelf(): BindingBuilder<Value> {
    if (typeof this._token !== "function") {
      throw new Error("toSelf() requires token to be a Constructor");
    }
    return new ConstraintBuilder<Value>(
      this._token,
      { kind: "class", target: this._token as Constructor<Value>, scope: "transient" },
      this._commit,
    );
  }

  toConstantValue(value: Value): ConstantBindingBuilder<Value> {
    return new ConstantBuilder<Value>(this._token, value, this._commit);
  }

  toDynamic(factory: (ctx: ResolutionContext) => Value): BindingBuilder<Value> {
    return new ConstraintBuilder<Value>(
      this._token,
      { kind: "dynamic", factory, scope: "transient" },
      this._commit,
    );
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
    const normalizedDeps = deps.map((d) => normalizeToDescriptor(d));
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
    const normalizedDeps = deps.map((d) => normalizeToDescriptor(d));
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

class ConstraintBuilder<Value> implements BindingBuilder<Value> {
  private _slot: SlotKey;
  private _predicate: ((ctx: ConstraintContext) => boolean) | undefined;
  private _committed: BindingIdentifier | undefined;

  constructor(
    private readonly _token: Token<Value> | Constructor<Value>,
    private readonly _partial: PartialBinding<Value>,
    private readonly _commit: (b: Binding, previousId?: BindingIdentifier) => BindingIdentifier,
  ) {
    this._slot = { ...DEFAULT_SLOT, tags: [] };
    this._doCommit();
  }

  private _doCommit(): void {
    const previousId = this._committed;
    const binding: Binding<Value> = {
      ...(this._partial as unknown as object),
      id: generateBindingId(),
      token: this._token,
      slot: this._slot,
      predicate: this._predicate,
    } as Binding<Value>;
    this._committed = this._commit(binding as Binding<unknown>, previousId);
  }

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

  id(): BindingIdentifier {
    return this._committed!;
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
    private readonly _slot: SlotKey,
    private readonly _predicate: ((ctx: ConstraintContext) => boolean) | undefined,
    private readonly _commit: (b: Binding, previousId?: BindingIdentifier) => BindingIdentifier,
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
    this._committed = this._commit(binding as Binding<unknown>, previousId);
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

class ConstantBuilder<Value> implements ConstantBindingBuilder<Value> {
  private _slot: SlotKey;
  private _predicate: ((ctx: ConstraintContext) => boolean) | undefined;
  private _onActivation: ActivationHandler<Value> | undefined;
  private _onDeactivation: DeactivationHandler<Value> | undefined;
  private _committed: BindingIdentifier | undefined;

  constructor(
    private readonly _token: Token<Value> | Constructor<Value>,
    private readonly _value: Value,
    private readonly _commit: (b: Binding, previousId?: BindingIdentifier) => BindingIdentifier,
  ) {
    this._slot = { ...DEFAULT_SLOT, tags: [] };
    this._doCommit();
  }

  private _doCommit(): void {
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
    this._committed = this._commit(binding as Binding<unknown>, previousId);
  }

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

  onActivation(fn: ActivationHandler<Value>): SingletonLifecycleBuilder<Value> {
    this._onActivation = fn;
    this._doCommit();
    return this as unknown as SingletonLifecycleBuilder<Value>;
  }

  onDeactivation(fn: DeactivationHandler<Value>): SingletonLifecycleBuilder<Value> {
    this._onDeactivation = fn;
    this._doCommit();
    return this as unknown as SingletonLifecycleBuilder<Value>;
  }

  id(): BindingIdentifier {
    return this._committed!;
  }
}

// ── AliasBuilder ──────────────────────────────────────────────────────────────

class AliasBuilder<Value> implements AliasBindingBuilder {
  private _slot: SlotKey;
  private _predicate: ((ctx: ConstraintContext) => boolean) | undefined;
  private _committed: BindingIdentifier | undefined;

  constructor(
    private readonly _token: Token<Value> | Constructor<Value>,
    private readonly _target: Token<Value> | Constructor<Value>,
    private readonly _commit: (b: Binding, previousId?: BindingIdentifier) => BindingIdentifier,
  ) {
    this._slot = { ...DEFAULT_SLOT, tags: [] };
    this._doCommit();
  }

  private _doCommit(): void {
    const previousId = this._committed;
    const binding: Binding<Value> = {
      kind: "alias",
      id: generateBindingId(),
      token: this._token,
      slot: this._slot,
      predicate: this._predicate,
      target: this._target,
    } as unknown as Binding<Value>;
    this._committed = this._commit(binding as Binding<unknown>, previousId);
  }

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
