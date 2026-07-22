import type { Binding, BindToBuilder } from "#/binding";
import { BindingEntry } from "#/container/binding-builders";
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
import { LifecycleManager } from "#/resolution/lifecycle";
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
  readonly #inspector: Inspector;
  readonly #parent: DefaultContainer | undefined;

  // Module tracking: module -> ref count
  readonly #moduleRefs = new Map<object, number>();
  // Module bindings: module -> array of binding IDs registered by it
  readonly #moduleBindingIds = new Map<object, Array<BindingIdentifier>>();

  constructor(parent?: DefaultContainer) {
    this.#parent = parent;
    this.#registry = new BindingRegistry();
    this.#scope = new ScopeManager(parent !== undefined);
    this.#lifecycle = new LifecycleManager();
    this.#inspector = new Inspector(this.#registry, this.#scope, parent !== undefined, () => this.#disposed);
    this.#initResolver();
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

  #createBindToBuilder<const Value>(
    token: Token<Value> | Constructor<Value>,
    moduleRef?: object,
  ): BindToBuilder<Value> {
    const registry = this.#registry;

    const commitBinding = <BindingValue>(
      binding: Binding<BindingValue>,
      previousId?: BindingIdentifier,
    ): BindingIdentifier => {
      if (previousId !== undefined) {
        registry.removeById(previousId);
        if (moduleRef !== undefined) {
          const ids = this.#moduleBindingIds.get(moduleRef);
          if (ids !== undefined) {
            const idx = ids.indexOf(previousId);
            if (idx !== -1) {
              ids.splice(idx, 1);
            }
          }
        }
      }
      // The registry stores value-erased bindings — this is the single erasure point for the builder chain.
      registry.add(binding as Binding);
      if (moduleRef !== undefined) {
        let ids = this.#moduleBindingIds.get(moduleRef);
        if (ids === undefined) {
          ids = [];
          this.#moduleBindingIds.set(moduleRef, ids);
        }
        ids.push(binding.id);
      }
      return binding.id;
    };

    return new BindingEntry<Value>(token, commitBinding);
  }

  unbind(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): void {
    this.#assertNotDisposed();
    this.#unbindSync(tokenOrId);
  }

  /** Remove bindings from registry + scope and collect [binding, instance] pairs for deactivation. */
  #collectDeactivationPairs(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): Array<[Binding, unknown]> {
    const pairs: Array<[Binding, unknown]> = [];
    for (const binding of this.#getBindingsForTokenOrId(tokenOrId)) {
      this.#registry.removeById(binding.id);
      if (this.#scope.hasSingleton(binding.id)) {
        pairs.push([binding, this.#scope.getSingleton(binding.id)]);
        this.#scope.deleteSingleton(binding.id);
      }
    }
    return pairs;
  }

  /** Drain singleton scope entries for a set of already-removed bindings. */
  #drainSingletons(bindings: ReadonlyArray<Binding>): Array<[Binding, unknown]> {
    const pairs: Array<[Binding, unknown]> = [];
    for (const binding of bindings) {
      if (this.#scope.hasSingleton(binding.id)) {
        pairs.push([binding, this.#scope.getSingleton(binding.id)]);
        this.#scope.deleteSingleton(binding.id);
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

  #getBindingsForTokenOrId(tokenOrId: Token<unknown> | Constructor | BindingIdentifier): Array<Binding> {
    if (typeof tokenOrId === "string") {
      // It's a BindingIdentifier (string)
      const binding = this.#registry.getById(tokenOrId);
      return binding !== undefined ? [binding] : [];
    }
    return [...this.#registry.getAll(tokenOrId)];
  }

  // ── Module ────────────────────────────────────────────────────────────────

  load(...modules: Array<SyncModule>): void {
    this.#assertNotDisposed();
    this.#loadSyncModules(modules);
  }

  #loadSyncModules(modules: Array<SyncModule>): void {
    // Collect all modules in topological order (dedup by identity)
    const toLoad = this.#collectModuleDeps(modules);
    for (const module of toLoad) {
      if (!isSyncModule(module)) {
        throw new AsyncModuleLoadError(module.name);
      }
      const moduleRef = module as object;
      const existing = this.#moduleRefs.get(moduleRef);
      if (existing !== undefined) {
        this.#moduleRefs.set(moduleRef, existing + 1);
        continue;
      }
      this.#moduleRefs.set(moduleRef, 1);
      const builder = this.#createModuleBuilder(moduleRef);
      module[MODULE_SETUP](builder);
    }
  }

  #collectModuleDeps(modules: Array<SyncModule | AsyncModule>): Array<SyncModule | AsyncModule> {
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
    this.#assertNotDisposed();
    for (const module of modules) {
      await this.#loadOneModuleAsync(module);
    }
  }

  async #loadOneModuleAsync(module: SyncModule | AsyncModule): Promise<void> {
    const moduleRef = module as object;
    const existing = this.#moduleRefs.get(moduleRef);
    if (existing !== undefined) {
      this.#moduleRefs.set(moduleRef, existing + 1);
      return;
    }
    this.#moduleRefs.set(moduleRef, 1);

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
    return {
      bind: <const Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> =>
        this.#createBindToBuilder(token, moduleRef),
      import: (...modules: Array<SyncModule>): void => {
        this.#loadSyncModules(modules);
      },
    };
  }

  #createAsyncModuleBuilder(moduleRef: object, importPromises: Array<Promise<void>>): AsyncModuleBuilder {
    return {
      bind: <const Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value> =>
        this.#createBindToBuilder(token, moduleRef),
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
    this.#moduleRefs.delete(ref);
    const ids = this.#moduleBindingIds.get(ref) ?? [];
    this.#moduleBindingIds.delete(ref);
    const pairs: Array<[Binding, unknown]> = [];
    for (const id of ids) {
      const binding = this.#registry.getById(id);
      if (binding !== undefined) {
        this.#registry.removeById(id);
        if (this.#scope.hasSingleton(id)) {
          pairs.push([binding, this.#scope.getSingleton(id)]);
          this.#scope.deleteSingleton(id);
        }
      }
    }
    return pairs;
  }

  #unloadModuleSync(ref: object): void {
    const count = this.#moduleRefs.get(ref) ?? 0;
    if (count <= 1) {
      const reader = this.#getMetadataReader();
      for (const [binding, instance] of this.#removeModuleBindings(ref)) {
        this.#lifecycle.runDeactivationSync(binding, instance, reader);
      }
    } else {
      this.#moduleRefs.set(ref, count - 1);
    }
  }

  async unloadAsync(...modules: Array<SyncModule | AsyncModule>): Promise<void> {
    this.#assertNotDisposed();
    for (const module of modules) {
      await this.#unloadModuleAsync(module as object);
    }
  }

  async #unloadModuleAsync(ref: object): Promise<void> {
    const count = this.#moduleRefs.get(ref) ?? 0;
    if (count <= 1) {
      const reader = this.#getMetadataReader();
      for (const [binding, instance] of this.#removeModuleBindings(ref)) {
        await this.#lifecycle.runDeactivation(binding, instance, reader);
      }
    } else {
      this.#moduleRefs.set(ref, count - 1);
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
      return this.#resolver.resolveAsyncFromContext(token, [], []);
    }
    return this.#resolver.resolveAsync(token, options, [], []);
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
    return this.#resolver.resolveOptionalAsync(token, options, [], []);
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
    return this.#resolver.resolveAllAsync(token, options, [], []);
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
    for (const [id, instance] of this.#scope.getAllSingletons()) {
      const binding = this.#registry.getById(id);
      if (binding !== undefined) {
        await this.#lifecycle.runDeactivation(binding, instance, reader);
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
      if (scope === "singleton" && !this.#scope.hasSingleton(binding.id)) {
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
   * terminal binding for scope checks (SPEC §6.9). Skips `toDynamic*` subtrees (opaque).
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

  #validationScopeFromTerminal(terminal: Binding): BindingScope | "opaque" {
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

  #collectStaticDependencyEdges(
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
          const candidates = this.#resolver.peekCandidateBindingsForValidate(tokenRef, paramOptions);
          for (const cand of candidates) {
            const term = this.#followAliasChainToTerminal(cand, paramOptions);
            pushTerminal(term, term !== undefined ? tokenName(term.token as Token<unknown>) : "");
          }
          continue;
        }
        const found =
          paramOptions === undefined
            ? this.#resolver.peekBindingForValidate(tokenRef, undefined)
            : this.#resolver.peekBindingForValidate(tokenRef, paramOptions);
        if (found === undefined) {
          continue;
        }
        const term = this.#followAliasChainToTerminal(found.binding, paramOptions);
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
          const candidates = this.#resolver.peekCandidateBindingsForValidate(tokenRef, depOptions);
          for (const cand of candidates) {
            const term = this.#followAliasChainToTerminal(cand, depOptions);
            pushTerminal(term, term !== undefined ? tokenName(term.token as Token<unknown>) : "");
          }
          continue;
        }
        const found =
          depOptions === undefined
            ? this.#resolver.peekBindingForValidate(tokenRef, undefined)
            : this.#resolver.peekBindingForValidate(tokenRef, depOptions);
        if (found === undefined) {
          continue;
        }
        const term = this.#followAliasChainToTerminal(found.binding, depOptions);
        pushTerminal(term, term !== undefined ? tokenName(term.token as Token<unknown>) : "");
      }
    }

    return edges;
  }

  // ── Introspection ─────────────────────────────────────────────────────────

  has(token: Token<unknown> | Constructor, options?: ResolveOptions): boolean {
    this.#assertNotDisposed();
    return this.#inspector.has(token, options, () => this.#parent?.has(token, options) ?? false);
  }

  hasOwn(token: Token<unknown> | Constructor, options?: ResolveOptions): boolean {
    this.#assertNotDisposed();
    return this.#inspector.hasOwn(token, options);
  }

  lookupBindings<const Value>(token: Token<Value> | Constructor<Value>): ReadonlyArray<BindingSnapshot> {
    this.#assertNotDisposed();
    return this.#inspector.lookupBindings(token);
  }

  inspect(): ContainerSnapshot {
    this.#assertNotDisposed();
    return this.#inspector.inspect();
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
