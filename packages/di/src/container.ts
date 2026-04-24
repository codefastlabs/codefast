import type { Binding, BindingIdentifier, Constructor, ResolveHint } from "#/binding";
import { BindingBuilder } from "#/binding";
import { registryKeyLabel } from "#/binding-select";
import { getAutoRegistered } from "#/decorators/injectable";
import { listResolvedDependencies } from "#/dependency-graph";
import type { MetadataReader } from "#/metadata/metadata-types";
import { SymbolMetadataReader } from "#/metadata/symbol-metadata-reader";
import {
  AsyncModuleLoadError,
  CircularDependencyError,
  InternalError,
  ScopeViolationError,
} from "#/errors";
import type {
  ContainerGraphJson,
  GraphOptions,
  ContainerInspectorContext,
  ContainerSnapshot,
} from "#/inspector";
import { ContainerInspector } from "#/inspector";
import type { AsyncModuleBuilder, ModuleBuilder } from "#/module";
import { AsyncModule, Module } from "#/module";
import type { RegistryKey } from "#/registry";
import { BindingRegistry } from "#/registry";
import { DependencyResolver } from "#/resolver";
import { ScopeManager } from "#/scope";
import type { Token } from "#/token";
import { isDevelopmentOrTestEnvironment } from "#/environment";
type ContainerRef = {
  current: DefaultContainer | undefined;
};
type ModuleLike = Module | AsyncModule;
const NOT_FOUND = Symbol("container-fast-path-not-found");
const lastWinsTagObjectIds = new WeakMap<object, number>();
let lastWinsTagObjectIdSequence = 1;
function allocateLastWinsTagObjectId(value: object): number {
  let objectId = lastWinsTagObjectIds.get(value);
  if (objectId === undefined) {
    objectId = lastWinsTagObjectIdSequence++;
    lastWinsTagObjectIds.set(value, objectId);
  }
  return objectId;
}
function resolveHintForBinding(binding: Binding<unknown>): ResolveHint | undefined {
  if (binding.bindingName !== undefined) {
    return { name: binding.bindingName };
  }
  for (const [tagKey, tagValue] of binding.tags) {
    return { tag: [tagKey, tagValue] as const };
  }
  return undefined;
}
function buildLastWinsSlotKey(binding: Binding<unknown>): string | undefined {
  if (binding.constraint !== undefined) {
    return undefined;
  }
  if (binding.bindingName === undefined && binding.tags.size === 0) {
    return "default";
  }
  if (binding.tags.size === 0) {
    return `name=${binding.bindingName}`;
  }
  const toStableTagValue = (value: unknown): string => {
    if (typeof value === "bigint") {
      return `bigint:${value.toString()}n`;
    }
    try {
      const serializedValue = JSON.stringify(value);
      return serializedValue ?? String(value);
    } catch {
      if (typeof value === "object" && value !== null) {
        return `non-json:object#${String(allocateLastWinsTagObjectId(value))}`;
      }
      return String(value);
    }
  };
  const normalizedTagEntries = [...binding.tags.entries()]
    .sort(([leftTag], [rightTag]) => leftTag.localeCompare(rightTag))
    .map(([tagKey, tagValue]) => [tagKey, toStableTagValue(tagValue)] as const);
  const tagsKey = normalizedTagEntries
    .map(([tagKey, tagValue]) => `${tagKey}:${tagValue}`)
    .join("|");
  const nameKey = binding.bindingName ?? "";
  return `name=${nameKey};tags=${tagsKey}`;
}
export interface Container extends AsyncDisposable {
  bind<Value>(token: Token<Value> | Constructor<Value>): BindingBuilder<Value>;
  rebind<Value>(token: Token<Value> | Constructor<Value>): BindingBuilder<Value>;
  unbind(tokenOrId: RegistryKey | BindingIdentifier): void;
  unbindAsync(tokenOrId: RegistryKey | BindingIdentifier): Promise<void>;
  has(token: RegistryKey, hint?: ResolveHint): boolean;
  resolve<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveHint): Value;
  resolveAsync<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveHint): Promise<Value>;
  resolveAll<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveHint): Value[];
  resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveHint,
  ): Promise<Value[]>;
  resolveOptional<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveHint,
  ): Value | undefined;
  load(...modules: Module[]): void;
  loadAsync(...modules: ModuleLike[]): Promise<void>;
  unload(...modules: ModuleLike[]): void;
  unloadAsync(...modules: ModuleLike[]): Promise<void>;
  initializeAsync(): Promise<void>;
  loadAutoRegistered(): number;
  validate(): void;
  inspect(): ContainerSnapshot;
  generateDependencyGraph(options?: GraphOptions): ContainerGraphJson;
  createChild(): Container;
  [Symbol.dispose](): never;
  lookupBindings(token: RegistryKey): readonly Binding<unknown>[] | undefined;
  dispose(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
}
class DefaultContainer implements Container {
  private readonly syncModuleStack: Module[] = [];
  private readonly asyncModuleStack: AsyncModule[] = [];
  private readonly loadedModules = new Map<ModuleLike, BindingIdentifier[]>();
  private hasDevValidationRun = false;
  private readonly pendingRegistrationBuilders = new Set<BindingBuilder<unknown>>();
  private readonly slotIndexByToken = new Map<RegistryKey, Map<string, BindingIdentifier>>();
  private readonly tokenByBindingId = new Map<BindingIdentifier, RegistryKey>();
  private readonly slotKeyByBindingId = new Map<BindingIdentifier, string>();
  private readonly inheritedConstantCache = new Map<RegistryKey, unknown>();
  private readonly isDevEnv: boolean = isDevelopmentOrTestEnvironment();
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
          throw new InternalError("container is not initialized");
        }
        return current.lookupBindingsInternal(token);
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
  bind<Value>(token: Token<Value> | Constructor<Value>): BindingBuilder<Value> {
    return new BindingBuilder<Value>(token, undefined, {
      onPending: (builder) =>
        this.pendingRegistrationBuilders.add(builder as unknown as BindingBuilder<unknown>),
      onCommitted: (builder) =>
        this.pendingRegistrationBuilders.delete(builder as unknown as BindingBuilder<unknown>),
      register: (built) => {
        this.invalidateDevValidationState();
        this.registerOwnedBinding(
          token as Token<unknown> | Constructor<unknown>,
          built as Binding<unknown>,
        );
      },
      update: (built) => {
        this.invalidateDevValidationState();
        this.updateOwnedBinding(
          token as Token<unknown> | Constructor<unknown>,
          built as Binding<unknown>,
        );
      },
    });
  }
  has(token: RegistryKey, hint?: ResolveHint): boolean {
    this.flushPendingBindings();
    const list = this.lookupBindingsInternal(token);
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
    this.prepareRegistryMutation();
    if (typeof tokenOrId === "string") {
      this.removeOwnedBindingById(tokenOrId);
      return;
    }
    this.releaseOwnedBindingsByToken(tokenOrId);
    this.ownRegistry.remove(tokenOrId);
    this.slotIndexByToken.delete(tokenOrId);
  }
  async unbindAsync(tokenOrId: RegistryKey | BindingIdentifier): Promise<void> {
    this.prepareRegistryMutation();
    if (typeof tokenOrId === "string") {
      await this.removeOwnedBindingByIdAsync(tokenOrId);
      return;
    }
    await this.releaseOwnedBindingsByTokenAsync(tokenOrId);
    this.ownRegistry.remove(tokenOrId);
    this.slotIndexByToken.delete(tokenOrId);
  }
  rebind<Value>(token: Token<Value> | Constructor<Value>): BindingBuilder<Value> {
    this.prepareRegistryMutation();
    this.releaseOwnedBindingsByToken(token as RegistryKey);
    this.ownRegistry.remove(token as RegistryKey);
    this.slotIndexByToken.delete(token as RegistryKey);
    return this.bind(token);
  }
  load(...modules: Module[]): void {
    this.prepareRegistryMutation();
    for (const syncModule of modules) {
      if (syncModule instanceof AsyncModule) {
        throw new AsyncModuleLoadError(syncModule.name);
      }
      this.ensureSyncModuleLoaded(syncModule);
    }
    this.completeLoadMutation();
  }
  async loadAsync(...modules: ModuleLike[]): Promise<void> {
    this.prepareRegistryMutation();
    for (const moduleOrAsync of modules) {
      if (moduleOrAsync instanceof AsyncModule) {
        await this.ensureAsyncModuleLoaded(moduleOrAsync);
      } else {
        this.ensureSyncModuleLoaded(moduleOrAsync);
      }
    }
    this.completeLoadMutation();
  }
  unload(...modules: ModuleLike[]): void {
    this.prepareRegistryMutation();
    for (const module of modules) {
      this.unloadLoadedModuleSync(module);
    }
  }
  async unloadAsync(...modules: ModuleLike[]): Promise<void> {
    this.prepareRegistryMutation();
    for (const module of modules) {
      await this.unloadLoadedModuleAsync(module);
    }
  }
  resolve<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveHint): Value {
    this.flushPendingBindings();
    try {
      const fastResult = this.tryFastResolve<Value>(token, hint);
      if (fastResult !== NOT_FOUND) {
        return fastResult;
      }
      return this.resolver.resolveRoot(token, hint);
    } finally {
      this.maybeRunDevValidationOnce();
    }
  }
  async resolveAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveHint,
  ): Promise<Value> {
    this.flushPendingBindings();
    try {
      return await this.resolver.resolveAsyncRoot(token, hint);
    } finally {
      this.maybeRunDevValidationOnce();
    }
  }
  resolveOptional<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveHint,
  ): Value | undefined {
    this.flushPendingBindings();
    try {
      return this.resolver.resolveOptionalRoot(token, hint);
    } finally {
      this.maybeRunDevValidationOnce();
    }
  }
  resolveAll<Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveHint): Value[] {
    this.flushPendingBindings();
    try {
      return this.resolver.resolveAllRoot(token, hint);
    } finally {
      this.maybeRunDevValidationOnce();
    }
  }
  async resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveHint,
  ): Promise<Value[]> {
    this.flushPendingBindings();
    try {
      return await this.resolver.resolveAllAsyncRoot<Value>(token, hint);
    } finally {
      this.maybeRunDevValidationOnce();
    }
  }
  async initializeAsync(): Promise<void> {
    this.flushPendingBindings();
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
  validate(): void {
    this.flushPendingBindings();
    this.validateScopeRules();
  }
  inspect(): ContainerSnapshot {
    this.flushPendingBindings();
    return this.createInspector().getSnapshot();
  }
  generateDependencyGraph(options?: GraphOptions): ContainerGraphJson {
    this.flushPendingBindings();
    return this.createInspector().generateDependencyGraph(options);
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
    throw new InternalError(
      "Container disposal is async. Use `await using container = Container.create()` or call `await container.dispose()` instead of `using`.",
    );
  }
  createChild(): Container {
    const childRegistry = new BindingRegistry();
    const childScope = this.ownScopeManager.createChildScope();
    const holder: ContainerRef = { current: undefined };
    const resolver = new DependencyResolver({
      lookup: (token) => {
        const current = holder.current;
        if (current === undefined) {
          throw new InternalError("child container is not initialized");
        }
        return current.lookupBindingsInternal(token);
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
    this.flushPendingBindings();
    return this.lookupBindingsInternal(token);
  }
  async dispose(): Promise<void> {
    this.flushPendingBindings();
    await this.ownScopeManager.disposeAsync();
  }
  [Symbol.asyncDispose](): Promise<void> {
    return this.dispose();
  }
  private flushPendingBindings(): void {
    if (this.pendingRegistrationBuilders.size === 0) {
      return;
    }
    while (this.pendingRegistrationBuilders.size > 0) {
      const nextPendingBuilder = this.pendingRegistrationBuilders.values().next().value as
        | BindingBuilder<unknown>
        | undefined;
      if (nextPendingBuilder === undefined) {
        return;
      }
      nextPendingBuilder.flushPendingRegistration();
    }
  }
  private getOrCreateSlotIndexForToken(token: RegistryKey): Map<string, BindingIdentifier> {
    const existing = this.slotIndexByToken.get(token);
    if (existing !== undefined) {
      return existing;
    }
    const created = new Map<string, BindingIdentifier>();
    this.slotIndexByToken.set(token, created);
    return created;
  }
  private reserveLastWinsSlot(
    token: Token<unknown> | Constructor<unknown>,
    nextBinding: Binding<unknown>,
  ): string | undefined {
    const slotKey = buildLastWinsSlotKey(nextBinding);
    if (slotKey === undefined) {
      return undefined;
    }
    const slotIndex = this.getOrCreateSlotIndexForToken(token);
    const existingBindingId = slotIndex.get(slotKey);
    if (existingBindingId !== undefined && existingBindingId !== nextBinding.id) {
      this.removeOwnedBindingById(existingBindingId);
    }
    slotIndex.set(slotKey, nextBinding.id);
    return slotKey;
  }
  private clearReservedLastWinsSlot(
    token: Token<unknown> | Constructor<unknown>,
    bindingId: BindingIdentifier,
  ): void {
    const previousSlotKey = this.slotKeyByBindingId.get(bindingId);
    if (previousSlotKey === undefined) {
      return;
    }
    const previousSlotIndex = this.slotIndexByToken.get(token);
    if (previousSlotIndex?.get(previousSlotKey) === bindingId) {
      previousSlotIndex.delete(previousSlotKey);
    }
    if (previousSlotIndex !== undefined && previousSlotIndex.size === 0) {
      this.slotIndexByToken.delete(token);
    }
  }
  private untrackBinding(bindingId: BindingIdentifier): void {
    const token = this.tokenByBindingId.get(bindingId);
    const slotKey = this.slotKeyByBindingId.get(bindingId);
    if (token !== undefined && slotKey !== undefined) {
      const slotIndex = this.slotIndexByToken.get(token);
      if (slotIndex?.get(slotKey) === bindingId) {
        slotIndex.delete(slotKey);
      }
      if (slotIndex !== undefined && slotIndex.size === 0) {
        this.slotIndexByToken.delete(token);
      }
    }
    this.tokenByBindingId.delete(bindingId);
    this.slotKeyByBindingId.delete(bindingId);
  }
  private removeOwnedBindingById(bindingId: BindingIdentifier): void {
    this.ownScopeManager.releaseByBindingId(bindingId);
    this.ownRegistry.removeById(bindingId);
    this.untrackBinding(bindingId);
  }
  private async removeOwnedBindingByIdAsync(bindingId: BindingIdentifier): Promise<void> {
    await this.ownScopeManager.releaseByBindingIdAsync(bindingId);
    this.ownRegistry.removeById(bindingId);
    this.untrackBinding(bindingId);
  }
  private releaseOwnedBindingsByToken(token: RegistryKey): void {
    const ownedBindings = this.ownRegistry.get(token as Token<unknown> | Constructor<unknown>);
    if (ownedBindings === undefined) {
      return;
    }
    for (const binding of ownedBindings) {
      this.ownScopeManager.releaseBinding(binding);
      this.untrackBinding(binding.id);
    }
  }
  private async releaseOwnedBindingsByTokenAsync(token: RegistryKey): Promise<void> {
    const ownedBindings = this.ownRegistry.get(token as Token<unknown> | Constructor<unknown>);
    if (ownedBindings === undefined) {
      return;
    }
    for (const binding of ownedBindings) {
      await this.ownScopeManager.releaseBindingAsync(binding);
      this.untrackBinding(binding.id);
    }
  }
  private prepareRegistryMutation(): void {
    this.flushPendingBindings();
    this.invalidateDevValidationState();
  }
  private completeLoadMutation(): void {
    this.flushPendingBindings();
    this.maybeRunDevValidationOnce();
  }
  private getLoadedBindingIdsOrThrow(module: ModuleLike): readonly BindingIdentifier[] {
    const ownedBindingIds = this.loadedModules.get(module);
    if (ownedBindingIds === undefined) {
      throw new InternalError(`Module "${module.name}" is not loaded on this container.`);
    }
    return ownedBindingIds;
  }
  private unloadLoadedModuleSync(module: ModuleLike): void {
    const ownedBindingIds = this.getLoadedBindingIdsOrThrow(module);
    for (const bindingId of [...ownedBindingIds].reverse()) {
      this.removeOwnedBindingById(bindingId);
    }
    this.loadedModules.delete(module);
  }
  private async unloadLoadedModuleAsync(module: ModuleLike): Promise<void> {
    const ownedBindingIds = this.getLoadedBindingIdsOrThrow(module);
    for (const bindingId of [...ownedBindingIds].reverse()) {
      await this.removeOwnedBindingByIdAsync(bindingId);
    }
    this.loadedModules.delete(module);
  }
  private registerOwnedBinding(
    token: Token<unknown> | Constructor<unknown>,
    nextBinding: Binding<unknown>,
  ): void {
    const slotKey = this.reserveLastWinsSlot(token, nextBinding);
    const trackedToken = this.tokenByBindingId.get(nextBinding.id);
    if (trackedToken !== undefined) {
      this.removeOwnedBindingById(nextBinding.id);
    }
    this.ownRegistry.add(token, nextBinding);
    this.tokenByBindingId.set(nextBinding.id, token);
    if (slotKey !== undefined) {
      this.slotKeyByBindingId.set(nextBinding.id, slotKey);
    } else {
      this.slotKeyByBindingId.delete(nextBinding.id);
    }
  }
  private updateOwnedBinding(
    token: Token<unknown> | Constructor<unknown>,
    nextBinding: Binding<unknown>,
  ): void {
    this.clearReservedLastWinsSlot(token, nextBinding.id);
    this.ownRegistry.replaceById(nextBinding.id, nextBinding);
    const slotKey = this.reserveLastWinsSlot(token, nextBinding);
    if (slotKey !== undefined) {
      this.slotKeyByBindingId.set(nextBinding.id, slotKey);
    } else {
      this.slotKeyByBindingId.delete(nextBinding.id);
    }
    this.tokenByBindingId.set(nextBinding.id, token);
  }
  private tryFastResolve<Value>(
    token: Token<Value> | Constructor<Value>,
    hint: ResolveHint | undefined,
  ): Value | typeof NOT_FOUND {
    const registryKey = token as RegistryKey;
    if (
      this.parent !== undefined &&
      hint === undefined &&
      this.inheritedConstantCache.has(registryKey)
    ) {
      return this.inheritedConstantCache.get(registryKey) as Value;
    }
    const binding = this.getSingleBindingInHierarchy(token, hint);
    if (binding === undefined) {
      return NOT_FOUND;
    }
    if (binding.constraint !== undefined) {
      return NOT_FOUND;
    }
    if (binding.onActivation !== undefined) {
      return NOT_FOUND;
    }
    if (binding.onDeactivation !== undefined) {
      return NOT_FOUND;
    }
    if (binding.kind === "async-dynamic") {
      return NOT_FOUND;
    }
    if (binding.kind === "constant") {
      if (this.parent !== undefined && hint === undefined) {
        const own = this.ownRegistry.get(registryKey as Token<unknown> | Constructor<unknown>);
        if (own === undefined || own.length === 0) {
          this.inheritedConstantCache.set(registryKey, binding.value);
        }
      }
      return binding.value as Value;
    }
    if (this.ownScopeManager.isBindingCached(binding)) {
      return this.ownScopeManager.getOrCreate(binding, () => {
        throw new InternalError("Expected cached value for binding");
      }) as Value;
    }
    return NOT_FOUND;
  }
  private getSingleBindingInHierarchy(
    token: Token<unknown> | Constructor<unknown>,
    hint: ResolveHint | undefined,
  ): Binding<unknown> | undefined {
    const key = token as RegistryKey;
    const own = this.ownRegistry.get(key);
    if (own !== undefined && own.length > 0) {
      return this.ownRegistry.getSingleBinding(key, hint);
    }
    return this.parent?.getSingleBindingInHierarchy(token, hint) ?? undefined;
  }
  private invalidateDevValidationState(): void {
    this.inheritedConstantCache.clear();
    this.hasDevValidationRun = false;
  }
  private maybeRunDevValidationOnce(): void {
    if (!this.isDevEnv) {
      return;
    }
    if (this.hasDevValidationRun) {
      return;
    }
    this.hasDevValidationRun = true;
    this.validate();
  }
  private validateScopeRules(): void {
    const metadataReader = this.metadataReader;
    const lookupBindings = (registryKey: RegistryKey) => this.lookupBindingsInternal(registryKey);
    for (const registryKey of this.collectAllRegistryKeysInHierarchy()) {
      const bindings = lookupBindings(registryKey);
      if (bindings === undefined || bindings.length === 0) {
        continue;
      }
      for (const consumer of bindings) {
        const pathStart = [registryKeyLabel(registryKey)];
        const dependencies = listResolvedDependencies(
          consumer,
          lookupBindings,
          metadataReader,
          pathStart,
        );
        for (const dependency of dependencies) {
          if (
            consumer.scope === "singleton" &&
            dependency.binding.kind !== "constant" &&
            (dependency.binding.scope === "transient" || dependency.binding.scope === "scoped")
          ) {
            throw new ScopeViolationError({
              consumerBindingId: consumer.id,
              consumerKind: consumer.kind,
              consumerScope: consumer.scope,
              dependencyBindingId: dependency.binding.id,
              dependencyKind: dependency.binding.kind,
              dependencyScope: dependency.binding.scope,
              resolutionPath: dependency.path,
            });
          }
        }
      }
    }
  }
  private createInspector(): ContainerInspector {
    const context: ContainerInspectorContext = {
      collectAllRegistryKeys: () => this.collectAllRegistryKeysInHierarchy(),
      lookupBindings: (token) => this.lookupBindingsInternal(token),
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
  private lookupBindingsInternal(token: RegistryKey): readonly Binding<unknown>[] | undefined {
    const own = this.ownRegistry.get(token as Token<unknown> | Constructor<unknown>);
    if (own !== undefined && own.length > 0) {
      return own;
    }
    return this.parent?.lookupBindingsForDescendant(token);
  }
  private lookupBindingsForDescendant(token: RegistryKey): readonly Binding<unknown>[] | undefined {
    this.flushPendingBindings();
    return this.lookupBindingsInternal(token);
  }
  private bindForModule(
    owner: ModuleLike,
  ): <Value>(token: Token<Value> | Constructor<Value>) => BindingBuilder<Value> {
    return <Value>(token: Token<Value> | Constructor<Value>) =>
      new BindingBuilder<Value>(token, owner.name, {
        onPending: (builder) =>
          this.pendingRegistrationBuilders.add(builder as unknown as BindingBuilder<unknown>),
        onCommitted: (builder) =>
          this.pendingRegistrationBuilders.delete(builder as unknown as BindingBuilder<unknown>),
        register: (built) => {
          this.invalidateDevValidationState();
          this.registerOwnedBinding(
            token as Token<unknown> | Constructor<unknown>,
            built as Binding<unknown>,
          );
          this.recordBindingForModule(owner, built.id);
        },
        update: (built) => {
          this.invalidateDevValidationState();
          this.updateOwnedBinding(
            token as Token<unknown> | Constructor<unknown>,
            built as Binding<unknown>,
          );
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
            throw new InternalError(
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
