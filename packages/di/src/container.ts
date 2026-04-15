import type { Binding, Constructor, ResolveHint } from "#lib/binding";
import { BindingBuilder } from "#lib/binding";
import type { MetadataReader } from "#lib/decorators/metadata";
import { SymbolMetadataReader } from "#lib/decorators/reader";
import { AsyncModuleLoadError, InvalidBindingError, ModuleCycleError } from "#lib/errors";
import { ContainerInspector, type ContainerInspectorContext } from "#lib/inspector";
import { AsyncModule, Module, type AsyncModuleSetupApi, type ModuleSetupApi } from "#lib/module";
import { BindingRegistry, type RegistryKey } from "#lib/registry";
import { DependencyResolver } from "#lib/resolver";
import { validateScopeRules } from "#lib/scope-validation";
import { ScopeManager } from "#lib/scope";
import type { Token } from "#lib/token";
import { isProductionEnvironment } from "#lib/environment";

type ContainerRef = { current: DefaultContainer | undefined };

function resolveHintForBinding(binding: Binding<unknown>): ResolveHint | undefined {
  if (binding.bindingName !== undefined) {
    return { name: binding.bindingName };
  }
  for (const [tagKey, tagValue] of binding.tags) {
    return { tag: tagKey, tagValue };
  }
  return undefined;
}

class ContainerBindingBuilder<Value> extends BindingBuilder<Value> {
  constructor(
    bindingKey: Token<Value> | Constructor<Value>,
    private readonly registerBuilt: (built: Binding<Value>) => void,
  ) {
    super(bindingKey);
  }

  override build(): Binding<Value> {
    const built = super.build();
    this.registerBuilt(built);
    return built;
  }
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
    return new ContainerBindingBuilder<Value>(key, (built) => {
      this.registryOwned.add(key, built);
    });
  }

  unbind(key: RegistryKey): void {
    this.registryOwned.remove(key);
  }

  rebind<Value>(key: Token<Value> | Constructor<Value>): BindingBuilder<Value> {
    this.registryOwned.remove(key as RegistryKey);
    return this.bind(key);
  }

  load(...modules: Module[]): void {
    for (const syncModule of modules) {
      if (syncModule instanceof AsyncModule) {
        throw new AsyncModuleLoadError(syncModule.name);
      }
      this.ensureSyncModuleLoaded(syncModule);
    }
    this.maybeRunDevValidationOnce();
  }

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

  unload(module: Module | AsyncModule): void {
    if (!module.isLoadedOn(this)) {
      throw new InvalidBindingError(`Module "${module.name}" is not loaded on this container.`);
    }
    for (const bindingId of [...module.getOwnedBindingIds()].reverse()) {
      this.scopeManagerOwned.releaseByBindingIdSync(bindingId);
      this.registryOwned.removeById(bindingId);
    }
    module.clearAfterUnload();
  }

  async unloadAsync(module: Module | AsyncModule): Promise<void> {
    if (!module.isLoadedOn(this)) {
      throw new InvalidBindingError(`Module "${module.name}" is not loaded on this container.`);
    }
    for (const bindingId of [...module.getOwnedBindingIds()].reverse()) {
      await this.scopeManagerOwned.releaseByBindingIdAsync(bindingId);
      this.registryOwned.removeById(bindingId);
    }
    module.clearAfterUnload();
  }

  resolve<T>(key: Token<T> | Constructor<T>, hint?: ResolveHint): T {
    try {
      return this.resolver.resolveRoot(key, hint);
    } finally {
      this.maybeRunDevValidationOnce();
    }
  }

  resolveAsync<T>(key: Token<T> | Constructor<T>, hint?: ResolveHint): Promise<T> {
    return this.resolver.resolveAsyncRoot(key, hint).finally(() => {
      this.maybeRunDevValidationOnce();
    });
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
    if (isProductionEnvironment()) {
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
   * Returns a read-only inspector for bindings, activation state, and Graphviz export.
   */
  inspect(): ContainerInspector {
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

  dispose(): void {
    this.scopeManagerOwned.dispose();
  }

  disposeSync(): void {
    this.scopeManagerOwned.disposeSync();
  }

  async disposeAsync(): Promise<void> {
    await this.scopeManagerOwned.disposeAsync();
  }

  private bindForModule(
    owner: Module | AsyncModule,
  ): <Value>(key: Token<Value> | Constructor<Value>) => BindingBuilder<Value> {
    return <Value>(key: Token<Value> | Constructor<Value>) =>
      new ContainerBindingBuilder<Value>(key, (built) => {
        this.registryOwned.replaceKeyLastWins(key, built, (removed) => {
          this.scopeManagerOwned.releaseBindingSync(removed);
        });
        owner.recordOwnedBinding(built.id);
      });
  }

  private createSyncModuleApi(module: Module): ModuleSetupApi {
    return {
      import: (dep: Module) => {
        if (dep instanceof AsyncModule) {
          throw new InvalidBindingError(
            `Module "${module.name}" cannot synchronously import async module "${dep.name}".`,
          );
        }
        this.ensureSyncModuleLoaded(dep);
      },
      bind: this.bindForModule(module),
    };
  }

  private createAsyncModuleApi(module: AsyncModule): AsyncModuleSetupApi {
    return {
      import: (dep: Module) => {
        this.ensureSyncModuleLoaded(dep);
      },
      importAsync: async (dep: Module | AsyncModule) => {
        if (dep instanceof AsyncModule) {
          await this.ensureAsyncModuleLoaded(dep);
        } else {
          this.ensureSyncModuleLoaded(dep);
        }
      },
      bind: this.bindForModule(module),
    };
  }

  private ensureSyncModuleLoaded(module: Module): void {
    if (module.isLoadedOn(this)) {
      return;
    }
    module.assertNotLoadedOnOtherContainer(this);
    if (this.syncModuleStack.includes(module)) {
      throw new ModuleCycleError([
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
      throw new ModuleCycleError([
        ...this.asyncModuleStack.map((stackedAsyncModule) => stackedAsyncModule.name),
        asyncModule.name,
      ]);
    }
    this.asyncModuleStack.push(asyncModule);
    try {
      const api = this.createAsyncModuleApi(asyncModule);
      await asyncModule.runAsyncSetup(api);
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
