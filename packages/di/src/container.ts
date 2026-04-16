import type { Binding, BindingIdentifier, Constructor, ResolveHint } from "#lib/binding";
import { BindingBuilder } from "#lib/binding";
import type { MetadataReader } from "#lib/decorators/metadata";
import { SymbolMetadataReader } from "#lib/decorators/reader";
import { AsyncModuleLoadError, CircularDependencyError, DiError } from "#lib/errors";
import {
  ContainerInspector,
  type ContainerInspectorContext,
  type ContainerSnapshot,
  type DotGraphOptions,
} from "#lib/inspector";
import { AsyncModule, Module, type AsyncModuleBuilder, type ModuleBuilder } from "#lib/module";
import { BindingRegistry, type RegistryKey } from "#lib/registry";
import { DependencyResolver } from "#lib/resolver";
import { validateScopeRules } from "#lib/scope-validation";
import { ScopeManager } from "#lib/scope";
import type { Token } from "#lib/token";
import { isDevelopmentOrTestEnvironment } from "#lib/environment";

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
 * Default IoC container: registry + scoped caches + synchronous / asynchronous resolution.
 */
export class DefaultContainer {
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

  static create(): DefaultContainer {
    const registryOwned = new BindingRegistry();
    const scopeManagerOwned = ScopeManager.createRoot();
    const metadataReader = new SymbolMetadataReader();
    const holder: ContainerRef = { current: undefined };
    const resolver = new DependencyResolver({
      lookup: (key) => holder.current!.lookupBindings(key),
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
        this.registryOwned.add(key, built);
      },
      update: (built) => {
        this.registryOwned.replaceById(built.id, built as Binding<unknown>);
      },
    });
  }

  has(key: RegistryKey): boolean {
    const list = this.lookupBindings(key);
    return list !== undefined && list.length > 0;
  }

  unbind(keyOrId: RegistryKey | BindingIdentifier): void {
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
  createChild(): DefaultContainer {
    const childRegistry = new BindingRegistry();
    const childScope = this.scopeManagerOwned.createChildScope();
    const holder: ContainerRef = { current: undefined };
    const resolver = new DependencyResolver({
      lookup: (registryKey) => holder.current!.lookupBindings(registryKey),
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

  private bindForModule(
    owner: Module | AsyncModule,
  ): <Value>(key: Token<Value> | Constructor<Value>) => BindingBuilder<Value> {
    return <Value>(key: Token<Value> | Constructor<Value>) =>
      new BindingBuilder<Value>(key, owner.name, {
        register: (built) => {
          this.registryOwned.replaceKeyLastWins(key, built, (removed) => {
            this.scopeManagerOwned.releaseBinding(removed);
          });
          owner.recordOwnedBinding(built.id);
        },
        update: (built) => {
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
 * Static factory entry point matching the design spec naming.
 */
export class Container {
  private constructor() {}

  static create(): DefaultContainer {
    return DefaultContainer.create();
  }

  static fromModules(...modules: Module[]): DefaultContainer {
    const container = DefaultContainer.create();
    container.load(...modules);
    return container;
  }

  static async fromModulesAsync(...modules: (Module | AsyncModule)[]): Promise<DefaultContainer> {
    const container = DefaultContainer.create();
    await container.loadAsync(...modules);
    return container;
  }
}

export type { BindingIdentifier, ResolveOptions } from "#lib/binding";
export type { ContainerSnapshot } from "#lib/inspector";
