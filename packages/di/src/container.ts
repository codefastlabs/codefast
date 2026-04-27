import type {
  ActivationHandler,
  BindingScope,
  Constructor,
  DeactivationHandler,
  ResolveOptions,
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
import type { BindingIdentifier } from "#/types";
import type { Token } from "#/token";
import type { AsyncModule, ModuleBuilder, SyncModule } from "#/module";
import type { BindingSnapshot, ContainerSnapshot } from "#/inspector";
import type { ContainerGraphJson, GraphOptions } from "#/dependency-graph";
import type { MetadataReader } from "#/metadata/metadata-types";
import type { AutoRegisterRegistry } from "#/decorators/injectable";
import type { AsyncModuleBuilder } from "#/module";
import {
  DisposedContainerError,
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

// ── Container interface ────────────────────────────────────────────────────────

export interface Container {
  readonly isDisposed: boolean;

  bind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  unbind(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): void;
  unbindAsync(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): Promise<void>;
  unbindAll(): void;
  unbindAllAsync(): Promise<void>;
  rebind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;

  load(...modules: SyncModule[]): void;
  loadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void>;
  unload(...modules: SyncModule[]): void;
  unloadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void>;
  loadAutoRegistered(registry: AutoRegisterRegistry): number;

  onActivation<Value>(
    token: Token<Value> | Constructor<Value>,
    handler: ActivationHandler<Value>,
  ): void;
  onDeactivation<Value>(
    token: Token<Value> | Constructor<Value>,
    handler: DeactivationHandler<Value>,
  ): void;

  resolve<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveOptions): Value;
  resolveAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value>;
  resolveOptional<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Value | undefined;
  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value | undefined>;
  resolveAll<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveOptions): Value[];
  resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value[]>;

  createChild(): Container;

  dispose(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
  [Symbol.dispose](): never;

  initializeAsync(): Promise<void>;
  validate(): void;

  has(token: Token<unknown> | Constructor, hint?: ResolveOptions): boolean;
  hasOwn(token: Token<unknown> | Constructor, hint?: ResolveOptions): boolean;
  lookupBindings<Value>(token: Token<Value> | Constructor<Value>): readonly BindingSnapshot[];
  inspect(): ContainerSnapshot;
  generateDependencyGraph(options?: GraphOptions): ContainerGraphJson;
}

export interface ContainerStatic {
  create(): Container;
  fromModules(...modules: SyncModule[]): Container;
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
  private readonly _moduleBindingIds = new Map<object, BindingIdentifier[]>();

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

  bind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> {
    this._assertNotDisposed();
    return this._createBindToBuilder(token);
  }

  private _createBindToBuilder<Value>(
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

    return new BindToBuilderImpl<Value>(token, commitBinding);
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

  rebind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> {
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
  ): Binding[] {
    if (typeof tokenOrId === "string") {
      // It's a BindingIdentifier (string)
      const b = this._registry.getById(tokenOrId as BindingIdentifier);
      return b !== undefined ? [b] : [];
    }
    return [...this._registry.getAll(tokenOrId as Token<unknown> | Constructor)];
  }

  // ── Module ────────────────────────────────────────────────────────────────

  load(...modules: SyncModule[]): void {
    this._assertNotDisposed();
    this._loadSyncModules(modules);
  }

  private _loadSyncModules(modules: SyncModule[]): void {
    // Collect all modules in topological order (dedup by identity)
    const toLoad = this._collectModuleDeps(modules);
    for (const mod of toLoad) {
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
      bind: <Value>(t: Token<Value> | Constructor<Value>): BindToBuilder<Value> =>
        this._createBindToBuilder(t, moduleRef),
      import: (...mods: SyncModule[]): void => {
        this._loadSyncModules(mods);
      },
    };
  }

  private _createAsyncModuleBuilder(
    moduleRef: object,
    importPromises: Array<Promise<void>>,
  ): AsyncModuleBuilder {
    return {
      bind: <Value>(t: Token<Value> | Constructor<Value>): BindToBuilder<Value> =>
        this._createBindToBuilder(t, moduleRef),
      import: (...mods: Array<SyncModule | AsyncModule>): void => {
        for (const mod of mods) {
          importPromises.push(this._loadOneModuleAsync(mod));
        }
      },
    };
  }

  unload(...modules: SyncModule[]): void {
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

  onActivation<Value>(
    token: Token<Value> | Constructor<Value>,
    handler: ActivationHandler<Value>,
  ): void {
    this._assertNotDisposed();
    this._lifecycle.registerActivation(token, handler);
  }

  onDeactivation<Value>(
    token: Token<Value> | Constructor<Value>,
    handler: DeactivationHandler<Value>,
  ): void {
    this._assertNotDisposed();
    this._lifecycle.registerDeactivation(token, handler);
  }

  // ── Resolution ────────────────────────────────────────────────────────────

  resolve<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveOptions): Value {
    this._assertNotDisposed();
    return this._resolver.resolve(token, hint, [], []);
  }

  resolveAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value> {
    this._assertNotDisposed();
    return this._resolver.resolveAsync(token, hint, [], []);
  }

  resolveOptional<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Value | undefined {
    this._assertNotDisposed();
    return this._resolver.resolveOptional(token, hint, [], []);
  }

  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value | undefined> {
    this._assertNotDisposed();
    return this._resolver.resolveOptionalAsync(token, hint, [], []);
  }

  resolveAll<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveOptions): Value[] {
    this._assertNotDisposed();
    return this._resolver.resolveAll(token, hint, [], []);
  }

  resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value[]> {
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
      const scope = (binding as { scope: BindingScope }).scope;
      if (scope === "singleton" && !this._scope.hasSingleton(binding.id)) {
        if (binding.predicate !== undefined) {
          continue;
        }
        // Has activation — need to resolve
        if (binding.kind === "constant" && binding.onActivation === undefined) {
          continue;
        }
        const slotHint =
          binding.slot.name !== undefined || binding.slot.tags.length > 0
            ? { name: binding.slot.name, tags: binding.slot.tags }
            : undefined;
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
      if (
        binding.kind === "alias" ||
        binding.kind === "constant" ||
        binding.kind === "dynamic" ||
        binding.kind === "dynamic-async"
      ) {
        continue;
      }

      const scope = (binding as { scope: BindingScope }).scope ?? "transient";
      if (scope !== "singleton") {
        continue;
      }

      // Check deps of singleton
      const deps = this._getDepsForBinding(binding, reader);
      for (const dep of deps) {
        this._validateDep(
          tokenName(binding.token as Token<unknown>),
          scope,
          dep,
          [tokenName(binding.token as Token<unknown>)],
          reader,
        );
      }
    }
  }

  private _getDepsForBinding(
    binding: Binding,
    reader: MetadataReader,
  ): Array<{ token: Token<unknown> | Constructor; scope: BindingScope }> {
    const result: Array<{ token: Token<unknown> | Constructor; scope: BindingScope }> = [];

    if (binding.kind === "class") {
      const meta = reader.getConstructorMetadata(binding.target as Constructor);
      if (meta !== undefined) {
        for (const param of meta.params) {
          const depBindings = this._registry.getAll(param.token as Token<unknown>);
          for (const db of depBindings) {
            if (db.kind !== "alias") {
              result.push({
                token: param.token as Token<unknown>,
                scope: (db as { scope: BindingScope }).scope ?? "transient",
              });
            }
          }
        }
      }
    } else if (binding.kind === "resolved" || binding.kind === "resolved-async") {
      for (const dep of binding.deps) {
        const depBindings = this._registry.getAll(dep.token as Token<unknown>);
        for (const db of depBindings) {
          if (db.kind !== "alias") {
            result.push({
              token: dep.token as Token<unknown>,
              scope: (db as { scope: BindingScope }).scope ?? "transient",
            });
          }
        }
      }
    }

    return result;
  }

  private _validateDep(
    consumerToken: string,
    consumerScope: BindingScope,
    dep: { token: Token<unknown> | Constructor; scope: BindingScope },
    path: string[],
    _reader: MetadataReader,
  ): void {
    if (consumerScope === "singleton") {
      if (dep.scope === "scoped" || dep.scope === "transient") {
        throw new ScopeViolationError({
          consumerToken,
          consumerScope,
          dependencyToken: tokenName(dep.token),
          dependencyScope: dep.scope,
          path,
        });
      }
    }
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

  lookupBindings<Value>(token: Token<Value> | Constructor<Value>): readonly BindingSnapshot[] {
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

// ── BindToBuilderImpl ─────────────────────────────────────────────────────────

class BindToBuilderImpl<Value> implements BindToBuilder<Value> {
  private _pendingSlot: SlotKey = { ...DEFAULT_SLOT, tags: [] };
  private _pendingPredicate: ((ctx: import("#/types").ConstraintContext) => boolean) | undefined;

  constructor(
    private readonly _token: Token<Value> | Constructor<Value>,
    private readonly _commit: (b: Binding, previousId?: BindingIdentifier) => BindingIdentifier,
  ) {}

  when(predicate: (ctx: import("#/types").ConstraintContext) => boolean): BindToBuilder<Value> {
    this._pendingPredicate = predicate;
    return this;
  }

  whenNamed(name: string): BindToBuilder<Value> {
    this._pendingSlot = { ...this._pendingSlot, name };
    return this;
  }

  whenTagged(tag: string, value: unknown): BindToBuilder<Value> {
    const existing = [...this._pendingSlot.tags];
    const idx = existing.findIndex(([k]) => k === tag);
    if (idx !== -1) {
      existing[idx] = [tag, value];
    } else {
      existing.push([tag, value]);
    }
    this._pendingSlot = { ...this._pendingSlot, tags: existing };
    return this;
  }

  whenDefault(): BindToBuilder<Value> {
    return this;
  }

  to(type: Constructor<Value>): BindingBuilder<Value> {
    return new BindingBuilderImpl<Value>(
      this._token,
      { kind: "class", target: type, scope: "transient" },
      this._commit,
      this._pendingSlot,
      this._pendingPredicate,
    );
  }

  toSelf(): BindingBuilder<Value> {
    if (typeof this._token !== "function") {
      throw new Error("toSelf() requires token to be a Constructor");
    }
    return new BindingBuilderImpl<Value>(
      this._token,
      { kind: "class", target: this._token as Constructor<Value>, scope: "transient" },
      this._commit,
      this._pendingSlot,
      this._pendingPredicate,
    );
  }

  toConstantValue(value: Value): ConstantBindingBuilder<Value> {
    return new ConstantBindingBuilderImpl<Value>(
      this._token,
      value,
      this._commit,
      this._pendingSlot,
      this._pendingPredicate,
    );
  }

  toDynamic(factory: (ctx: import("#/types").ResolutionContext) => Value): BindingBuilder<Value> {
    return new BindingBuilderImpl<Value>(
      this._token,
      { kind: "dynamic", factory, scope: "transient" },
      this._commit,
      this._pendingSlot,
      this._pendingPredicate,
    );
  }

  toDynamicAsync(
    factory: (ctx: import("#/types").ResolutionContext) => Promise<Value>,
  ): BindingBuilder<Value> {
    return new BindingBuilderImpl<Value>(
      this._token,
      { kind: "dynamic-async", factory, scope: "transient" },
      this._commit,
      this._pendingSlot,
      this._pendingPredicate,
    );
  }

  toResolved<Deps extends readonly (Token<unknown> | Constructor)[]>(
    factory: (...args: { [K in keyof Deps]: import("#/types").TokenValue<Deps[K]> }) => Value,
    deps: Deps,
  ): BindingBuilder<Value> {
    const normalizedDeps = deps.map((d) => normalizeToDescriptor(d));
    return new BindingBuilderImpl<Value>(
      this._token,
      {
        kind: "resolved",
        factory: factory as (...args: unknown[]) => Value,
        deps: normalizedDeps,
        scope: "transient",
      },
      this._commit,
      this._pendingSlot,
      this._pendingPredicate,
    );
  }

  toResolvedAsync<Deps extends readonly (Token<unknown> | Constructor)[]>(
    factory: (
      ...args: { [K in keyof Deps]: import("#/types").TokenValue<Deps[K]> }
    ) => Promise<Value>,
    deps: Deps,
  ): BindingBuilder<Value> {
    const normalizedDeps = deps.map((d) => normalizeToDescriptor(d));
    return new BindingBuilderImpl<Value>(
      this._token,
      {
        kind: "resolved-async",
        factory: factory as (...args: unknown[]) => Promise<Value>,
        deps: normalizedDeps,
        scope: "transient",
      },
      this._commit,
      this._pendingSlot,
      this._pendingPredicate,
    );
  }

  toAlias(target: Token<Value> | Constructor<Value>): AliasBindingBuilder {
    return new AliasBindingBuilderImpl<Value>(
      this._token,
      target,
      this._commit,
      this._pendingSlot,
      this._pendingPredicate,
    );
  }
}

// ── BindingBuilderImpl ─────────────────────────────────────────────────────────

class BindingBuilderImpl<Value> implements BindingBuilder<Value> {
  private _slot: SlotKey;
  private _predicate: ((ctx: import("#/types").ConstraintContext) => boolean) | undefined;
  private _committed: BindingIdentifier | undefined;

  constructor(
    private readonly _token: Token<Value> | Constructor<Value>,
    private readonly _partial: PartialBinding<Value>,
    private readonly _commit: (b: Binding, previousId?: BindingIdentifier) => BindingIdentifier,
    initialSlot?: SlotKey,
    initialPredicate?: (ctx: import("#/types").ConstraintContext) => boolean,
  ) {
    this._slot = initialSlot ?? { ...DEFAULT_SLOT, tags: [] };
    this._predicate = initialPredicate;
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

  when(predicate: (ctx: import("#/types").ConstraintContext) => boolean): this {
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
    const existing = [...this._slot.tags];
    const idx = existing.findIndex(([k]) => k === tag);
    if (idx !== -1) {
      existing[idx] = [tag, value];
    } else {
      existing.push([tag, value]);
    }
    this._slot = { ...this._slot, tags: existing };
    this._doCommit();
    return this;
  }

  whenDefault(): this {
    return this;
  }

  singleton(): SingletonBindingBuilder<Value> {
    const previousId = this._committed;
    this._committed = undefined;
    return new ScopeBuilderImpl<Value, "singleton">(
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
    return new ScopeBuilderImpl<Value, "transient">(
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
    return new ScopeBuilderImpl<Value, "scoped">(
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

// ── ScopeBuilderImpl ──────────────────────────────────────────────────────────

class ScopeBuilderImpl<Value, Scope extends BindingScope>
  implements SingletonBindingBuilder<Value>, TransientBindingBuilder<Value>
{
  private _onActivation: import("#/types").ActivationHandler<Value> | undefined;
  private _onDeactivation: import("#/types").DeactivationHandler<Value> | undefined;
  private _committed: BindingIdentifier | undefined;

  constructor(
    private readonly _token: Token<Value> | Constructor<Value>,
    private readonly _partial: PartialBinding<Value>,
    private readonly _slot: SlotKey,
    private readonly _predicate:
      | ((ctx: import("#/types").ConstraintContext) => boolean)
      | undefined,
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

  onActivation(fn: import("#/types").ActivationHandler<Value>): this {
    this._onActivation = fn;
    this._doCommit();
    return this;
  }

  onDeactivation(fn: import("#/types").DeactivationHandler<Value>): this {
    this._onDeactivation = fn;
    this._doCommit();
    return this;
  }

  id(): BindingIdentifier {
    return this._committed!;
  }
}

// ── ConstantBindingBuilderImpl ────────────────────────────────────────────────

class ConstantBindingBuilderImpl<Value> implements ConstantBindingBuilder<Value> {
  private _slot: SlotKey;
  private _predicate: ((ctx: import("#/types").ConstraintContext) => boolean) | undefined;
  private _onActivation: import("#/types").ActivationHandler<Value> | undefined;
  private _onDeactivation: import("#/types").DeactivationHandler<Value> | undefined;
  private _committed: BindingIdentifier | undefined;

  constructor(
    private readonly _token: Token<Value> | Constructor<Value>,
    private readonly _value: Value,
    private readonly _commit: (b: Binding, previousId?: BindingIdentifier) => BindingIdentifier,
    initialSlot?: SlotKey,
    initialPredicate?: (ctx: import("#/types").ConstraintContext) => boolean,
  ) {
    this._slot = initialSlot ?? { ...DEFAULT_SLOT, tags: [] };
    this._predicate = initialPredicate;
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

  when(predicate: (ctx: import("#/types").ConstraintContext) => boolean): this {
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
    const existing = [...this._slot.tags];
    const idx = existing.findIndex(([k]) => k === tag);
    if (idx !== -1) {
      existing[idx] = [tag, value];
    } else {
      existing.push([tag, value]);
    }
    this._slot = { ...this._slot, tags: existing };
    this._doCommit();
    return this;
  }

  whenDefault(): this {
    return this;
  }

  onActivation(fn: import("#/types").ActivationHandler<Value>): SingletonLifecycleBuilder<Value> {
    this._onActivation = fn;
    this._doCommit();
    return this as unknown as SingletonLifecycleBuilder<Value>;
  }

  onDeactivation(
    fn: import("#/types").DeactivationHandler<Value>,
  ): SingletonLifecycleBuilder<Value> {
    this._onDeactivation = fn;
    this._doCommit();
    return this as unknown as SingletonLifecycleBuilder<Value>;
  }

  id(): BindingIdentifier {
    return this._committed!;
  }
}

// ── AliasBindingBuilderImpl ───────────────────────────────────────────────────

class AliasBindingBuilderImpl<Value> implements AliasBindingBuilder {
  private _slot: SlotKey;
  private _predicate: ((ctx: import("#/types").ConstraintContext) => boolean) | undefined;
  private _committed: BindingIdentifier | undefined;

  constructor(
    private readonly _token: Token<Value> | Constructor<Value>,
    private readonly _target: Token<Value> | Constructor<Value>,
    private readonly _commit: (b: Binding, previousId?: BindingIdentifier) => BindingIdentifier,
    initialSlot?: SlotKey,
    initialPredicate?: (ctx: import("#/types").ConstraintContext) => boolean,
  ) {
    this._slot = initialSlot ?? { ...DEFAULT_SLOT, tags: [] };
    this._predicate = initialPredicate;
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

  when(predicate: (ctx: import("#/types").ConstraintContext) => boolean): this {
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
    const existing = [...this._slot.tags];
    const idx = existing.findIndex(([k]) => k === tag);
    if (idx !== -1) {
      existing[idx] = [tag, value];
    } else {
      existing.push([tag, value]);
    }
    this._slot = { ...this._slot, tags: existing };
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

export const Container: ContainerStatic & { create(): Container } = {
  create(): Container {
    return new DefaultContainer();
  },

  fromModules(...modules: SyncModule[]): Container {
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
