import type { Binding, BindingIdentifier, Constructor, ResolveHint } from "#/binding";
import { BindingBuilder } from "#/binding";
import type { MetadataReader } from "#/decorators/metadata";
import { SymbolMetadataReader } from "#/decorators/reader";
import { AsyncModuleLoadError, CircularDependencyError, DiError } from "#/errors";
import {
  ContainerInspector,
  type ContainerInspectorContext,
  type ContainerSnapshot,
  type DotGraphOptions,
} from "#/inspector";
import { AsyncModule, Module, type AsyncModuleBuilder, type ModuleBuilder } from "#/module";
import { BindingRegistry, type RegistryKey } from "#/registry";
import { DependencyResolver } from "#/resolver";
import { validateScopeRules } from "#/scope-validation";
import { ScopeManager } from "#/scope";
import type { Token } from "#/token";
import { isDevelopmentOrTestEnvironment } from "#/environment";

type ContainerRef = { current: DefaultContainer | undefined };

function resolveHintForBinding(binding: Binding<unknown>): ResolveHint | undefined {
  if (binding.bindingName !== undefined) {
    return { name: binding.bindingName };
  }
  for (const [tagKey, tagValue] of binding.tags) {
    return { tag: [tagKey, tagValue] as const };
  }
  return undefined;
}

/**
 * Public contract for an IoC container (registry, modules, resolution, lifecycle).
 * Construct instances with {@link Container.create} or {@link Container.fromModules}.
 */
export interface Container {
  bind<Value>(key: Token<Value> | Constructor<Value>): BindingBuilder<Value>;
  rebind<Value>(key: Token<Value> | Constructor<Value>): BindingBuilder<Value>;
  unbind(keyOrId: RegistryKey | BindingIdentifier): void;
  unbindAsync(keyOrId: RegistryKey | BindingIdentifier): Promise<void>;
  has(key: RegistryKey, hint?: ResolveHint): boolean;
  resolve<T>(key: Token<T> | Constructor<T>, hint?: ResolveHint): T;
  resolveAsync<T>(key: Token<T> | Constructor<T>, hint?: ResolveHint): Promise<T>;
  resolveAll<T>(key: Token<T> | Constructor<T>, hint?: ResolveHint): T[];
  resolveOptional<T>(key: Token<T> | Constructor<T>, hint?: ResolveHint): T | undefined;
  load(...modules: Module[]): void;
  loadAsync(...modules: (Module | AsyncModule)[]): Promise<void>;
  unload(...modules: (Module | AsyncModule)[]): void;
  unloadAsync(...modules: (Module | AsyncModule)[]): Promise<void>;
  initialize(): void;
  initializeAsync(): Promise<void>;
  validate(): void;
  inspect(): ContainerSnapshot;
  generateDependencyGraphDot(options?: DotGraphOptions): string;
  generateDependencyGraphJson(options?: DotGraphOptions): string;
  createChild(): Container;
  lookupBindings(key: RegistryKey): readonly Binding<unknown>[] | undefined;
  dispose(): Promise<void>;
  disposeAsync(): Promise<void>;
}

/**
 * Default IoC container: registry + scoped caches + synchronous / asynchronous resolution.
 * @internal Implementation of {@link Container}; not part of the public package contract.
 */
class DefaultContainer implements Container {
  private readonly syncModuleStack: Module[] = [];
  private readonly asyncModuleStack: AsyncModule[] = [];
  private devValidationRan = false;

  private constructor(
    private readonly registryOwned: BindingRegistry,
    private readonly scopeManagerOwned: ScopeManager,
    private readonly parent: DefaultContainer | undefined,
    private readonly resolver: DependencyResolver,
    private readonly metadataReader: MetadataReader,
  ) {}

  static create(): Container {
    const registryOwned = new BindingRegistry();
    const scopeManagerOwned = ScopeManager.createRoot();
    const metadataReader = new SymbolMetadataReader();
    const holder: ContainerRef = { current: undefined };
    const resolver = new DependencyResolver({
      lookup: (key) => {
        const current = holder.current;
        if (current === undefined) {
          throw new DiError("container is not initialized");
        }
        return current.lookupBindings(key);
      },
      scopeManager: scopeManagerOwned,
      metadataReader,
    });
    const container = new DefaultContainer(
      registryOwned,
      scopeManagerOwned,
      undefined,
      resolver,
      metadataReader,
    );
    holder.current = container;
    return container;
  }

  /**
   * Starts a fluent binding registered on this container when {@link BindingBuilder.build} runs.
   */
  bind<Value>(key: Token<Value> | Constructor<Value>): BindingBuilder<Value> {
    return new BindingBuilder<Value>(key, undefined, {
      register: (built) => {
        this.invalidateDevValidationState();
        this.registryOwned.add(key, built);
      },
      update: (built) => {
        this.invalidateDevValidationState();
        this.registryOwned.replaceById(built.id, built as Binding<unknown>);
      },
    });
  }

  has(key: RegistryKey, hint?: ResolveHint): boolean {
    const list = this.lookupBindings(key);
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

  unbind(keyOrId: RegistryKey | BindingIdentifier): void {
    this.invalidateDevValidationState();
    if (typeof keyOrId === "string") {
      this.scopeManagerOwned.releaseByBindingId(keyOrId);
      this.registryOwned.removeById(keyOrId);
      return;
    }
    const owned = this.registryOwned.get(keyOrId as Token<unknown> | Constructor<unknown>);
    if (owned !== undefined) {
      for (const binding of owned) {
        this.scopeManagerOwned.releaseBinding(binding);
      }
    }
    this.registryOwned.remove(keyOrId);
  }

  async unbindAsync(keyOrId: RegistryKey | BindingIdentifier): Promise<void> {
    this.invalidateDevValidationState();
    if (typeof keyOrId === "string") {
      await this.scopeManagerOwned.releaseByBindingIdAsync(keyOrId);
      this.registryOwned.removeById(keyOrId);
      return;
    }
    const owned = this.registryOwned.get(keyOrId as Token<unknown> | Constructor<unknown>);
    if (owned !== undefined) {
      for (const binding of owned) {
        await this.scopeManagerOwned.releaseBindingAsync(binding);
      }
    }
    this.registryOwned.remove(keyOrId);
  }

  rebind<Value>(key: Token<Value> | Constructor<Value>): BindingBuilder<Value> {
    this.invalidateDevValidationState();
    const owned = this.registryOwned.get(key as Token<unknown> | Constructor<unknown>);
    if (owned !== undefined) {
      for (const binding of owned) {
        this.scopeManagerOwned.releaseBinding(binding);
      }
    }
    this.registryOwned.remove(key as RegistryKey);
    return this.bind(key);
  }

  /**
   * Registers bindings from synchronous modules. When {@link isDevelopmentOrTestEnvironment} is true,
   * runs {@link validate} at most once after the registry changes so static singleton→scoped/transient
   * edges fail fast. Runtime resolution still enforces the same rules via the resolver (including inside
   * dynamic factories). Production skips this static pass; call {@link validate} yourself if needed.
   */
  load(...modules: Module[]): void {
    this.invalidateDevValidationState();
    for (const syncModule of modules) {
      if (syncModule instanceof AsyncModule) {
        throw new AsyncModuleLoadError(syncModule.name);
      }
      this.ensureSyncModuleLoaded(syncModule);
    }
    this.maybeRunDevValidationOnce();
  }

  /**
   * Like {@link load} but allows async modules. Dev/test automatic {@link validate} behavior is the same.
   */
  async loadAsync(...modules: (Module | AsyncModule)[]): Promise<void> {
    this.invalidateDevValidationState();
    for (const moduleOrAsync of modules) {
      if (moduleOrAsync instanceof AsyncModule) {
        await this.ensureAsyncModuleLoaded(moduleOrAsync);
      } else {
        this.ensureSyncModuleLoaded(moduleOrAsync);
      }
    }
    this.maybeRunDevValidationOnce();
  }

  unload(...modules: (Module | AsyncModule)[]): void {
    this.invalidateDevValidationState();
    for (const module of modules) {
      if (!module.isLoadedOn(this)) {
        throw new DiError(`Module "${module.name}" is not loaded on this container.`);
      }
      for (const bindingId of [...module.getOwnedBindingIds()].reverse()) {
        this.scopeManagerOwned.releaseByBindingId(bindingId);
        this.registryOwned.removeById(bindingId);
      }
      module.clearAfterUnload();
    }
  }

  async unloadAsync(...modules: (Module | AsyncModule)[]): Promise<void> {
    this.invalidateDevValidationState();
    for (const module of modules) {
      if (!module.isLoadedOn(this)) {
        throw new DiError(`Module "${module.name}" is not loaded on this container.`);
      }
      for (const bindingId of [...module.getOwnedBindingIds()].reverse()) {
        await this.scopeManagerOwned.releaseByBindingIdAsync(bindingId);
        this.registryOwned.removeById(bindingId);
      }
      module.clearAfterUnload();
    }
  }

  /**
   * Resolves synchronously. Captive dependency (singleton holding scoped/transient) throws
   * {@link ScopeViolationError} with binding ids and full resolution path. In dev/test, the first
   * successful resolution also triggers a one-time static {@link validate} when not in production.
   */
  resolve<T>(key: Token<T> | Constructor<T>, hint?: ResolveHint): T {
    try {
      return this.resolver.resolveRoot(key, hint);
    } finally {
      this.maybeRunDevValidationOnce();
    }
  }

  /** Async variant of {@link resolve}; same dev/test validation and runtime scope enforcement. */
  resolveAsync<T>(key: Token<T> | Constructor<T>, hint?: ResolveHint): Promise<T> {
    return this.resolver.resolveAsyncRoot(key, hint).finally(() => {
      this.maybeRunDevValidationOnce();
    });
  }

  resolveOptional<T>(key: Token<T> | Constructor<T>, hint?: ResolveHint): T | undefined {
    try {
      return this.resolver.resolveOptionalRoot(key, hint);
    } finally {
      this.maybeRunDevValidationOnce();
    }
  }

  resolveAll<T>(key: Token<T> | Constructor<T>, hint?: ResolveHint): T[] {
    try {
      return this.resolver.resolveAllRoot(key, hint);
    } finally {
      this.maybeRunDevValidationOnce();
    }
  }

  /**
   * Eagerly resolves every registered `singleton` binding (sync-capable only in this overload).
   * Skips `async-dynamic` singletons; use {@link initializeAsync} for those.
   * Order follows registry iteration; dependency order is not topologically sorted.
   */
  initialize(): void {
    for (const registryKey of this.collectAllRegistryKeysInHierarchy()) {
      const list = this.lookupBindings(registryKey);
      if (list === undefined) {
        continue;
      }
      for (const binding of list) {
        if (binding.scope !== "singleton") {
          continue;
        }
        if (binding.kind === "async-dynamic") {
          continue;
        }
        const hint = resolveHintForBinding(binding);
        this.resolve(registryKey as Token<unknown> | Constructor<unknown>, hint);
      }
    }
  }

  /**
   * Eagerly resolves every registered `singleton` binding, including `async-dynamic` factories.
   */
  async initializeAsync(): Promise<void> {
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

  private invalidateDevValidationState(): void {
    this.devValidationRan = false;
  }

  private maybeRunDevValidationOnce(): void {
    if (!isDevelopmentOrTestEnvironment()) {
      return;
    }
    if (this.devValidationRan) {
      return;
    }
    this.devValidationRan = true;
    this.validate();
  }

  /**
   * Validates static dependency scope rules: a singleton must not depend on scoped/transient
   * class/factory/alias targets. Constant dependencies are always allowed.
   */
  validate(): void {
    validateScopeRules({
      collectAllRegistryKeys: () => this.collectAllRegistryKeysInHierarchy(),
      lookupBindings: (registryKey) => this.lookupBindings(registryKey),
      getMetadataReader: () => this.metadataReader,
    });
  }

  /**
   * Dev/debug snapshot of registered bindings and activation status (design spec §5.5).
   */
  inspect(): ContainerSnapshot {
    return this.createInspector().getSnapshot();
  }

  /**
   * Graphviz `digraph` for the static binding graph (not part of the public package exports).
   */
  generateDependencyGraphDot(options?: DotGraphOptions): string {
    return this.createInspector().generateDotGraph(options);
  }

  generateDependencyGraphJson(options?: DotGraphOptions): string {
    return this.createInspector().generateDependencyGraphJson(options);
  }

  private createInspector(): ContainerInspector {
    const context: ContainerInspectorContext = {
      collectAllRegistryKeys: () => this.collectAllRegistryKeysInHierarchy(),
      lookupBindings: (registryKey) => this.lookupBindings(registryKey),
      isBindingCached: (binding) => this.scopeManagerOwned.isBindingCached(binding),
      metadataReader: this.metadataReader,
    };
    return new ContainerInspector(context);
  }

  private collectAllRegistryKeysInHierarchy(): RegistryKey[] {
    const keys = new Set<RegistryKey>();
    this.accumulateRegistryKeysFromHierarchy(keys, this);
    return [...keys];
  }

  private accumulateRegistryKeysFromHierarchy(
    keys: Set<RegistryKey>,
    container: DefaultContainer | undefined,
  ): void {
    if (container === undefined) {
      return;
    }
    for (const entry of container.registryOwned.listEntries()) {
      keys.add(entry.key);
    }
    this.accumulateRegistryKeysFromHierarchy(keys, container.parent);
  }

  /**
   * Child inherits parent bindings via lookup fallback and shares singleton instances,
   * but receives an isolated scoped cache.
   */
  createChild(): Container {
    const childRegistry = new BindingRegistry();
    const childScope = this.scopeManagerOwned.createChildScope();
    const holder: ContainerRef = { current: undefined };
    const resolver = new DependencyResolver({
      lookup: (registryKey) => {
        const current = holder.current;
        if (current === undefined) {
          throw new DiError("child container is not initialized");
        }
        return current.lookupBindings(registryKey);
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

  lookupBindings(key: RegistryKey): readonly Binding<unknown>[] | undefined {
    const own = this.registryOwned.get(key as Token<unknown> | Constructor<unknown>);
    if (own !== undefined && own.length > 0) {
      return own;
    }
    return this.parent?.lookupBindings(key);
  }

  async dispose(): Promise<void> {
    await this.scopeManagerOwned.disposeAsync();
  }

  disposeAsync(): Promise<void> {
    return this.dispose();
  }

  private bindForModule(
    owner: Module | AsyncModule,
  ): <Value>(key: Token<Value> | Constructor<Value>) => BindingBuilder<Value> {
    return <Value>(key: Token<Value> | Constructor<Value>) =>
      new BindingBuilder<Value>(key, owner.name, {
        register: (built) => {
          this.invalidateDevValidationState();
          this.registryOwned.replaceKeyLastWins(key, built, (removed) => {
            this.scopeManagerOwned.releaseBinding(removed);
          });
          owner.recordOwnedBinding(built.id);
        },
        update: (built) => {
          this.invalidateDevValidationState();
          this.registryOwned.replaceById(built.id, built as Binding<unknown>);
        },
      });
  }

  private createSyncModuleApi(module: Module): ModuleBuilder {
    return {
      import: (...deps: Module[]) => {
        for (const dep of deps) {
          if (dep instanceof AsyncModule) {
            throw new DiError(
              `Module "${module.name}" cannot synchronously import async module "${dep.name}".`,
            );
          }
          this.ensureSyncModuleLoaded(dep);
        }
      },
      bind: this.bindForModule(module),
    };
  }

  private createAsyncModuleApi(module: AsyncModule): {
    readonly api: AsyncModuleBuilder;
    readonly awaitImports: () => Promise<void>;
  } {
    const pendingImports: Promise<void>[] = [];
    return {
      api: {
        import: (...deps: (Module | AsyncModule)[]) => {
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

  private ensureSyncModuleLoaded(module: Module): void {
    if (module.isLoadedOn(this)) {
      return;
    }
    module.assertNotLoadedOnOtherContainer(this);
    if (this.syncModuleStack.includes(module)) {
      throw new CircularDependencyError([
        ...this.syncModuleStack.map((stackedModule) => stackedModule.name),
        module.name,
      ]);
    }
    this.syncModuleStack.push(module);
    try {
      const api = this.createSyncModuleApi(module);
      module.runSyncSetup(api);
      module.markLoaded(this);
    } finally {
      this.syncModuleStack.pop();
    }
  }

  private async ensureAsyncModuleLoaded(asyncModule: AsyncModule): Promise<void> {
    if (asyncModule.isLoadedOn(this)) {
      return;
    }
    asyncModule.assertNotLoadedOnOtherContainer(this);
    if (this.asyncModuleStack.includes(asyncModule)) {
      throw new CircularDependencyError([
        ...this.asyncModuleStack.map((stackedAsyncModule) => stackedAsyncModule.name),
        asyncModule.name,
      ]);
    }
    this.asyncModuleStack.push(asyncModule);
    try {
      const { api, awaitImports } = this.createAsyncModuleApi(asyncModule);
      await asyncModule.runAsyncSetup(api);
      await awaitImports();
      asyncModule.markLoaded(this);
    } finally {
      this.asyncModuleStack.pop();
    }
  }
}

/**
 * Factory functions for {@link Container} instances (interface + namespace merge).
 */
export namespace Container {
  export function create(): Container {
    return DefaultContainer.create();
  }

  export function fromModules(...modules: Module[]): Container {
    const container = DefaultContainer.create();
    container.load(...modules);
    return container;
  }

  export async function fromModulesAsync(...modules: (Module | AsyncModule)[]): Promise<Container> {
    const container = DefaultContainer.create();
    await container.loadAsync(...modules);
    return container;
  }
}

export type { BindingIdentifier, ResolveOptions } from "#/binding";
export type { ContainerSnapshot } from "#/inspector";
