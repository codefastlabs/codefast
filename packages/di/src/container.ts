import type { Binding, BindingIdentifier, Constructor, ResolveHint } from "#/binding";
import { BindingBuilder } from "#/binding";
import { getAutoRegistered } from "#/decorators/injectable";
import type { MetadataReader } from "#/metadata/metadata-types";
import { SymbolMetadataReader } from "#/metadata/symbol-metadata-reader";
import { AsyncModuleLoadError, CircularDependencyError, DiError } from "#/errors";
import type {
  ContainerGraphJson,
  ContainerInspectorContext,
  ContainerSnapshot,
  DotGraphOptions,
} from "#/inspector";
import { ContainerInspector } from "#/inspector";
import type { AsyncModuleBuilder, ModuleBuilder } from "#/module";
import { AsyncModule, Module } from "#/module";
import type { RegistryKey } from "#/registry";
import { BindingRegistry } from "#/registry";
import { DependencyResolver } from "#/resolver";
import { validateScopeRules } from "#/scope-validation";
import { ScopeManager } from "#/scope";
import type { Token } from "#/token";
import { isDevelopmentOrTestEnvironment } from "#/environment";

type ContainerRef = { current: DefaultContainer | undefined };
type ModuleLike = Module | AsyncModule;

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
 *
 * Implements {@link AsyncDisposable} so `await using container = Container.create()` runs
 * {@link Container.dispose} automatically at scope exit (TC39 Explicit Resource Management).
 */
export interface Container extends AsyncDisposable {
  bind<Value>(token: Token<Value> | Constructor<Value>): BindingBuilder<Value>;
  rebind<Value>(token: Token<Value> | Constructor<Value>): BindingBuilder<Value>;
  unbind(tokenOrId: RegistryKey | BindingIdentifier): void;
  unbindAsync(tokenOrId: RegistryKey | BindingIdentifier): Promise<void>;
  has(token: RegistryKey, hint?: ResolveHint): boolean;
  resolve<T>(token: Token<T> | Constructor<T>, hint?: ResolveHint): T;
  resolveAsync<T>(token: Token<T> | Constructor<T>, hint?: ResolveHint): Promise<T>;
  resolveAll<T>(token: Token<T> | Constructor<T>, hint?: ResolveHint): T[];
  resolveAllAsync<T>(token: Token<T> | Constructor<T>, hint?: ResolveHint): Promise<T[]>;
  resolveOptional<T>(token: Token<T> | Constructor<T>, hint?: ResolveHint): T | undefined;
  load(...modules: Module[]): void;
  loadAsync(...modules: ModuleLike[]): Promise<void>;
  unload(...modules: ModuleLike[]): void;
  unloadAsync(...modules: ModuleLike[]): Promise<void>;
  initializeAsync(): Promise<void>;
  loadAutoRegistered(): number;
  validate(): void;
  inspect(): ContainerSnapshot;
  generateDependencyGraph(options?: DotGraphOptions & { format?: "dot" }): string;
  generateDependencyGraph(options: DotGraphOptions & { format: "json" }): ContainerGraphJson;
  createChild(): Container;
  [Symbol.dispose](): never;
  lookupBindings(token: RegistryKey): readonly Binding<unknown>[] | undefined;
  dispose(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
}

/**
 * Default IoC container: registry + scoped caches + synchronous / asynchronous resolution.
 * @internal Implementation of {@link Container}; not part of the public package contract.
 */
class DefaultContainer implements Container {
  private readonly syncModuleStack: Module[] = [];
  private readonly asyncModuleStack: AsyncModule[] = [];
  private readonly loadedModules = new Map<ModuleLike, BindingIdentifier[]>();
  private devValidationRan = false;

  private constructor(
    private readonly ownRegistry: BindingRegistry,
    private readonly ownScopeManager: ScopeManager,
    private readonly parent: DefaultContainer | undefined,
    private readonly resolver: DependencyResolver,
    private readonly metadataReader: MetadataReader,
  ) {}

  static create(): Container {
    const ownRegistry = new BindingRegistry();
    const ownScopeManager = ScopeManager.createRoot();
    const metadataReader = new SymbolMetadataReader();
    const holder: ContainerRef = { current: undefined };
    const resolver = new DependencyResolver({
      lookup: (token) => {
        const current = holder.current;
        if (current === undefined) {
          throw new DiError("container is not initialized");
        }
        return current.lookupBindings(token);
      },
      scopeManager: ownScopeManager,
      metadataReader,
    });
    const container = new DefaultContainer(
      ownRegistry,
      ownScopeManager,
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
  bind<Value>(token: Token<Value> | Constructor<Value>): BindingBuilder<Value> {
    return new BindingBuilder<Value>(token, undefined, {
      register: (built) => {
        this.invalidateDevValidationState();
        this.ownRegistry.add(token, built);
      },
      update: (built) => {
        this.invalidateDevValidationState();
        this.ownRegistry.replaceById(built.id, built as Binding<unknown>);
      },
    });
  }

  has(token: RegistryKey, hint?: ResolveHint): boolean {
    const list = this.lookupBindings(token);
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

  unbind(tokenOrId: RegistryKey | BindingIdentifier): void {
    this.invalidateDevValidationState();
    if (typeof tokenOrId === "string") {
      this.ownScopeManager.releaseByBindingId(tokenOrId);
      this.ownRegistry.removeById(tokenOrId);
      return;
    }
    const owned = this.ownRegistry.get(tokenOrId as Token<unknown> | Constructor<unknown>);
    if (owned !== undefined) {
      for (const binding of owned) {
        this.ownScopeManager.releaseBinding(binding);
      }
    }
    this.ownRegistry.remove(tokenOrId);
  }

  async unbindAsync(tokenOrId: RegistryKey | BindingIdentifier): Promise<void> {
    this.invalidateDevValidationState();
    if (typeof tokenOrId === "string") {
      await this.ownScopeManager.releaseByBindingIdAsync(tokenOrId);
      this.ownRegistry.removeById(tokenOrId);
      return;
    }
    const owned = this.ownRegistry.get(tokenOrId as Token<unknown> | Constructor<unknown>);
    if (owned !== undefined) {
      for (const binding of owned) {
        await this.ownScopeManager.releaseBindingAsync(binding);
      }
    }
    this.ownRegistry.remove(tokenOrId);
  }

  rebind<Value>(token: Token<Value> | Constructor<Value>): BindingBuilder<Value> {
    this.invalidateDevValidationState();
    const owned = this.ownRegistry.get(token as Token<unknown> | Constructor<unknown>);
    if (owned !== undefined) {
      for (const binding of owned) {
        this.ownScopeManager.releaseBinding(binding);
      }
    }
    this.ownRegistry.remove(token as RegistryKey);
    return this.bind(token);
  }

  /**
   * Registers bindings from synchronous modules. Re-loading a module already present on this
   * container is a no-op (deduplication, spec §7.3 Phase 3). When {@link isDevelopmentOrTestEnvironment}
   * is true, runs {@link validate} at most once after the registry changes.
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
   * Like {@link load} but allows async modules. Re-loading is deduplicated the same way.
   */
  async loadAsync(...modules: ModuleLike[]): Promise<void> {
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

  unload(...modules: ModuleLike[]): void {
    this.invalidateDevValidationState();
    for (const module of modules) {
      const ownedBindingIds = this.loadedModules.get(module);
      if (ownedBindingIds === undefined) {
        throw new DiError(`Module "${module.name}" is not loaded on this container.`);
      }
      for (const bindingId of [...ownedBindingIds].reverse()) {
        this.ownScopeManager.releaseByBindingId(bindingId);
        this.ownRegistry.removeById(bindingId);
      }
      this.loadedModules.delete(module);
    }
  }

  async unloadAsync(...modules: ModuleLike[]): Promise<void> {
    this.invalidateDevValidationState();
    for (const module of modules) {
      const ownedBindingIds = this.loadedModules.get(module);
      if (ownedBindingIds === undefined) {
        throw new DiError(`Module "${module.name}" is not loaded on this container.`);
      }
      for (const bindingId of [...ownedBindingIds].reverse()) {
        await this.ownScopeManager.releaseByBindingIdAsync(bindingId);
        this.ownRegistry.removeById(bindingId);
      }
      this.loadedModules.delete(module);
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
   * Async variant of {@link resolveAll}: safe for multi-bindings that mix sync and async factories
   * (spec §5.2).
   */
  resolveAllAsync<T>(key: Token<T> | Constructor<T>, hint?: ResolveHint): Promise<T[]> {
    return this.resolver.resolveAllAsyncRoot<T>(key, hint).finally(() => {
      this.maybeRunDevValidationOnce();
    });
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

  generateDependencyGraph(options?: DotGraphOptions & { format?: "dot" }): string;
  generateDependencyGraph(options: DotGraphOptions & { format: "json" }): ContainerGraphJson;
  generateDependencyGraph(
    options?: DotGraphOptions & { format?: "dot" | "json" },
  ): string | ContainerGraphJson {
    const inspector = this.createInspector();
    if (options?.format === "json") {
      return inspector.generateDependencyGraph(options as DotGraphOptions & { format: "json" });
    }
    return inspector.generateDotGraph(options);
  }

  loadAutoRegistered(): number {
    const entries = getAutoRegistered();
    let count = 0;
    for (const { implementationClass, scope } of entries) {
      const builder = this.bind(implementationClass as Constructor<unknown>).toSelf();
      switch (scope) {
        case "singleton":
          (builder as BindingBuilder<unknown>).singleton();
          break;
        case "scoped":
          (builder as BindingBuilder<unknown>).scoped();
          break;
        default:
          (builder as BindingBuilder<unknown>).transient();
      }
      count++;
    }
    return count;
  }

  [Symbol.dispose](): never {
    throw new DiError(
      "Container disposal is async. Use `await using container = Container.create()` or call `await container.dispose()` instead of `using`.",
    );
  }

  private createInspector(): ContainerInspector {
    const context: ContainerInspectorContext = {
      collectAllRegistryKeys: () => this.collectAllRegistryKeysInHierarchy(),
      lookupBindings: (token) => this.lookupBindings(token),
      isBindingCached: (binding) => this.ownScopeManager.isBindingCached(binding),
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
    for (const entry of container.ownRegistry.listEntries()) {
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
    const childScope = this.ownScopeManager.createChildScope();
    const holder: ContainerRef = { current: undefined };
    const resolver = new DependencyResolver({
      lookup: (token) => {
        const current = holder.current;
        if (current === undefined) {
          throw new DiError("child container is not initialized");
        }
        return current.lookupBindings(token);
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

  lookupBindings(token: RegistryKey): readonly Binding<unknown>[] | undefined {
    const own = this.ownRegistry.get(token as Token<unknown> | Constructor<unknown>);
    if (own !== undefined && own.length > 0) {
      return own;
    }
    return this.parent?.lookupBindings(token);
  }

  async dispose(): Promise<void> {
    await this.ownScopeManager.disposeAsync();
  }

  [Symbol.asyncDispose](): Promise<void> {
    return this.dispose();
  }

  private bindForModule(
    owner: ModuleLike,
  ): <Value>(token: Token<Value> | Constructor<Value>) => BindingBuilder<Value> {
    return <Value>(token: Token<Value> | Constructor<Value>) =>
      new BindingBuilder<Value>(token, owner.name, {
        register: (built) => {
          this.invalidateDevValidationState();
          this.ownRegistry.replaceKeyLastWins(token, built, (removed) => {
            this.ownScopeManager.releaseBinding(removed);
          });
          this.recordBindingForModule(owner, built.id);
        },
        update: (built) => {
          this.invalidateDevValidationState();
          this.ownRegistry.replaceById(built.id, built as Binding<unknown>);
        },
      });
  }

  private recordBindingForModule(owner: ModuleLike, id: BindingIdentifier): void {
    const list = this.loadedModules.get(owner);
    if (list === undefined) {
      this.loadedModules.set(owner, [id]);
      return;
    }
    list.push(id);
  }

  private createSyncModuleBuilder(module: Module): ModuleBuilder {
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

  private createAsyncModuleBuilder(module: AsyncModule): {
    readonly moduleBuilder: AsyncModuleBuilder;
    readonly awaitImports: () => Promise<void>;
  } {
    const pendingImports: Promise<void>[] = [];
    return {
      moduleBuilder: {
        import: (...deps: ModuleLike[]) => {
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
    if (this.loadedModules.has(module)) {
      return;
    }
    if (this.syncModuleStack.includes(module)) {
      throw new CircularDependencyError([
        ...this.syncModuleStack.map((stackedModule) => stackedModule.name),
        module.name,
      ]);
    }
    this.syncModuleStack.push(module);
    try {
      // Register the module in the tracking table before running setup so nested imports
      // (which may bind before returning) find an entry keyed by this module.
      this.loadedModules.set(module, []);
      const moduleBuilder = this.createSyncModuleBuilder(module);
      module.runSyncSetup(moduleBuilder);
    } finally {
      this.syncModuleStack.pop();
    }
  }

  private async ensureAsyncModuleLoaded(asyncModule: AsyncModule): Promise<void> {
    if (this.loadedModules.has(asyncModule)) {
      return;
    }
    if (this.asyncModuleStack.includes(asyncModule)) {
      throw new CircularDependencyError([
        ...this.asyncModuleStack.map((stackedAsyncModule) => stackedAsyncModule.name),
        asyncModule.name,
      ]);
    }
    this.asyncModuleStack.push(asyncModule);
    try {
      this.loadedModules.set(asyncModule, []);
      const { moduleBuilder, awaitImports } = this.createAsyncModuleBuilder(asyncModule);
      await asyncModule.runAsyncSetup(moduleBuilder);
      await awaitImports();
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
export type { ContainerGraphJson, ContainerSnapshot } from "#/inspector";
