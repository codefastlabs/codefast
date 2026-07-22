import type { Binding, BindingSlot } from "#/binding";
import { selectAllBindings, selectBinding } from "#/binding-select";
import type { ConstructorInvocation } from "#/constructor-type";
import type { Container } from "#/container";
import type { InjectionDescriptor } from "#/decorators/inject";
import type { ResolverCallbacks } from "#/environment";
import { buildResolutionFrame, DefaultResolutionContext, runWithContainer } from "#/environment";
import {
  AsyncResolutionError,
  CircularDependencyError,
  InternalError,
  MissingMetadataError,
  MissingScopeContextError,
  NoMatchingBindingError,
  TokenNotBoundError,
} from "#/errors";
import type { LifecycleManager } from "#/lifecycle";
import type { ConstructorMetadata, MetadataReader } from "#/metadata/metadata-types";
import type { BindingRegistry } from "#/registry";
import { injectionSlotToResolveOptions } from "#/resolve-options";
import type { ScopeManager } from "#/scope";
import type { Token } from "#/token";
import { tokenName } from "#/token";
import type {
  BindingIdentifier,
  BindingScope,
  BindingTag,
  ConstraintContext,
  Constructor,
  ResolutionFrame,
  ResolveOptions,
} from "#/types";

type BindingWithScope = Binding & { scope: BindingScope };
const RESOLUTION_SET_KEY: unique symbol = Symbol("di:resolution-set");
const RESOLUTION_SET_THRESHOLD = 32;
type ResolutionPathWithSet = Array<string> & { [RESOLUTION_SET_KEY]?: Set<string> };
const EMPTY_STRING_LIST: ReadonlyArray<string> = [];
const EMPTY_FRAME_LIST: ReadonlyArray<ResolutionFrame> = [];
const ROOT_CONSTRAINT_CONTEXT = {
  resolutionPath: EMPTY_STRING_LIST,
  resolutionStack: EMPTY_FRAME_LIST,
  parent: undefined,
  ancestors: EMPTY_FRAME_LIST,
  currentResolveOptions: undefined,
};

/**
 * @since 0.3.16-canary.0
 */
export class DependencyResolver {
  readonly #frameByBindingId = new Map<BindingIdentifier, ResolutionFrame>();
  readonly #syncResolutionContextPool: Array<DefaultResolutionContext> = [];
  // Deep-path state for _resolveTransientDynamicSyncFromContext (depth ≥ RESOLUTION_SET_THRESHOLD):
  //
  // Cycle detection — generation-based marking (replaces Set<BindingIdentifier>):
  //   _deepCycleMarks: Map<BindingIdentifier, generation> records which bindings are "in flight"
  //     during the current deep chain.  A binding is considered "active" when its recorded
  //     generation matches _deepCycleGen.
  //   _deepCycleGen: monotonically incremented at the start of each new deep chain.  This acts
  //     as an implicit bulk-clear: old marks from a previous chain have a stale generation number
  //     and are treated as absent — no explicit Map.delete or Map.clear is needed at all.
  //     Eliminating the per-level Map.delete call (was ~10 ns × 480 levels) is the primary
  //     motivation for this design.
  //
  // _deepActiveLevels: tracks how many deep levels are currently on the call stack so we know
  //   when the deep portion has fully unwound and can reset _deepSyncCtxPath.
  //
  // _deepSyncCtx / _deepSyncCtxPath: single shared context for the deep chain; avoids one
  //   per-depth pool reset (5 property writes) for every level beyond the threshold.
  //   resolutionStack is NOT pushed in the deep path — no GC write-barriers for object arrays.
  //   Trade-off: ctx.graph.resolutionStack only reflects the first RESOLUTION_SET_THRESHOLD
  //   frames; code relying on ctx.graph.parent inside a deep transient-dynamic factory will see
  //   the frame at the threshold boundary, not the current depth.
  readonly #deepCycleMarks = new Map<BindingIdentifier, number>();
  #deepCycleGen = 0;
  #deepActiveLevels = 0;
  #deepSyncCtx: DefaultResolutionContext | undefined;
  #deepSyncCtxPath: Array<string> | undefined;
  // Async shared-context state for _resolveTransientDynamicAsyncFromContext (shallow path):
  //
  // For a SEQUENTIAL async chain (depth < RESOLUTION_SET_THRESHOLD), all levels share the same
  // resolutionPath and resolutionStack arrays (passed by reference through ctx.resolveAsync).
  // Because the context stores references rather than snapshots, a single DefaultResolutionContext
  // can serve the entire chain without any per-level allocation or reset — the arrays reflect the
  // current chain state automatically as we push/pop.
  //
  // _deepAsyncCtx: the shared context, lazily created on the first chain entry and reset
  //   (5 property writes) at the start of each new root call.  Levels 2-N of the same chain
  //   reuse it with ZERO setup cost.
  //
  // _deepAsyncCtxPath: identity pointer of the resolutionPath array that "owns" the shared
  //   context.  Used to distinguish two cases:
  //     • same reference → inner level of the owning chain → reuse ctx with no setup
  //     • different reference → concurrent chain (e.g. Promise.all) → fall back to a fresh
  //       DefaultResolutionContext allocation for that call
  //
  // _deepAsyncActiveLevels: counts active levels of the OWNING chain so we know when to
  //   release the path pointer (set _deepAsyncCtxPath = undefined).
  //   Concurrent fallback calls are NOT counted — they don't interfere with the owner.
  //
  // resolutionStack is NOT pushed in this path (same trade-off as the deep sync path):
  //   ctx.graph.resolutionStack will always be empty for async transient-dynamic chains.
  //   Factories that inspect ctx.graph.parent should use the conventional sync binding approach.
  //
  // The function is NOT declared async so that V8 does not create an AsyncGeneratorObject and
  // an implicit Promise on every invocation; instead each level calls factoryPromise.then(cleanup)
  // which chains natively without the extra async state-machine overhead.
  #deepAsyncCtx: DefaultResolutionContext | undefined;
  #deepAsyncCtxPath: Array<string> | undefined;
  #deepAsyncActiveLevels = 0;
  readonly #classHasPostConstruct = new WeakMap<Constructor, boolean>();
  readonly #classNeedsActiveContainer = new WeakMap<Constructor, boolean>();
  readonly #classConstructorMetadata = new WeakMap<Constructor, ConstructorMetadata | null>();
  readonly #activationNeedByBindingId = new Map<BindingIdentifier, boolean>();
  #activationCacheVersion = -1;

  readonly #registry: BindingRegistry;
  readonly #scope: ScopeManager;
  readonly #lifecycle: LifecycleManager;
  readonly #metadataReader: MetadataReader;
  readonly #container: Container;
  readonly #parent: DependencyResolver | undefined;

  constructor(
    registry: BindingRegistry,
    scope: ScopeManager,
    lifecycle: LifecycleManager,
    metadataReader: MetadataReader,
    container: Container,
    parent: DependencyResolver | undefined,
  ) {
    this.#registry = registry;
    this.#scope = scope;
    this.#lifecycle = lifecycle;
    this.#metadataReader = metadataReader;
    this.#container = container;
    this.#parent = parent;
  }

  // ── Binding lookup ─────────────────────────────────────────────────────────

  #findBinding(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): { binding: Binding; owner: DependencyResolver } | undefined {
    if (options === undefined) {
      const fastDefaultBinding = this.#registry.getFastDefault(token);
      if (fastDefaultBinding !== undefined) {
        return { binding: fastDefaultBinding, owner: this };
      }
    }

    if (options?.name !== undefined && options.tag === undefined && (options.tags?.length ?? 0) === 0) {
      const namedBinding = this.#registry.getSimpleNamed(token, options.name);
      if (
        namedBinding !== undefined &&
        this.#matchesBindingFast(namedBinding, options, resolutionPath, resolutionStack)
      ) {
        return { binding: namedBinding, owner: this };
      }
    }

    if (
      options !== undefined &&
      options.name === undefined &&
      options.tag === undefined &&
      (options.tags?.length ?? 0) === 1
    ) {
      const [tagKey, tagValue] = options.tags![0]!;
      const tagged = this.#registry.getSimpleTagged(token, tagKey, tagValue);
      if (tagged !== undefined) {
        return { binding: tagged, owner: this };
      }
    }

    const bindings = this.#registry.getAll(token);
    if (bindings.length > 0) {
      if (bindings.length === 1) {
        const onlyBinding = bindings[0]!;
        const isDefaultSlot = onlyBinding.slot.name === undefined && onlyBinding.slot.tags.length === 0;
        if (options === undefined && isDefaultSlot && onlyBinding.predicate === undefined) {
          return { binding: onlyBinding, owner: this };
        }
        if (this.#matchesBindingFast(onlyBinding, options, resolutionPath, resolutionStack)) {
          return { binding: onlyBinding, owner: this };
        }
      }
      const ctx = this.#makeConstraintContext(resolutionPath, resolutionStack, options);
      const binding = selectBinding(bindings, options, ctx, this.#getTokenName(token));
      if (binding !== undefined) {
        return { binding, owner: this };
      }
    }
    if (this.#parent !== undefined) {
      return this.#parent.#findBinding(token, options, resolutionPath, resolutionStack);
    }
    return undefined;
  }

  /**
   * Binding lookup aligned with `resolve` — used by `Container.validate` without instantiating.
   */
  peekBindingForValidate(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
  ): { binding: Binding; owner: DependencyResolver } | undefined {
    return this.#findBinding(token, options, [], []);
  }

  /**
   * Mirrors {@link DependencyResolver.resolveAll} candidate selection only (no instantiation).
   */
  peekCandidateBindingsForValidate(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
  ): Array<Binding> {
    if (options?.name !== undefined && options.tag === undefined && (options.tags?.length ?? 0) === 0) {
      return this.#getSimpleNamedBindingsFromChain(token, options.name);
    }
    const allBindings = this.#getAllBindingsFromChain(token);
    if (allBindings.length === 0) {
      return [];
    }
    const ctx = this.#makeConstraintContext([], [], options);
    return selectAllBindings(allBindings, options, ctx);
  }

  // ── Sync resolve ───────────────────────────────────────────────────────────

  resolveFromContext<const Value>(
    token: Token<Value> | Constructor<Value>,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value {
    const fastBinding = this.#registry.getFastDefault(token);
    if (fastBinding !== undefined) {
      if (fastBinding.kind === "alias") {
        return this.resolveFromContext(
          fastBinding.target as Token<Value> | Constructor<Value>,
          resolutionPath,
          resolutionStack,
        );
      }
      const scope = (fastBinding as BindingWithScope).scope ?? "transient";
      if (
        scope === "transient" &&
        fastBinding.kind === "dynamic" &&
        fastBinding.onActivation === undefined &&
        (this.#lifecycle.activationVersion === 0 || !this.#lifecycle.hasActivationHandlers(fastBinding.token))
      ) {
        return this.#resolveTransientDynamicSyncFromContext(
          fastBinding as Binding<Value> & { kind: "dynamic" },
          resolutionPath,
          resolutionStack,
        );
      }
      if (scope === "singleton" && this.#scope.hasSingleton(fastBinding.id)) {
        return this.#scope.getSingleton<Value>(fastBinding.id);
      }
      if (scope === "scoped") {
        if (!this.#scope.isChild) {
          throw new MissingScopeContextError(this.#getTokenName(fastBinding.token));
        }
        if (this.#scope.hasScoped(fastBinding.id)) {
          return this.#scope.getScoped<Value>(fastBinding.id);
        }
      }
      return this.#resolveBinding(fastBinding as Binding<Value>, undefined, resolutionPath, resolutionStack);
    }

    return this.resolve(token, undefined, resolutionPath, resolutionStack);
  }

  resolve<const Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value {
    const found = this.#findBinding(token, options, resolutionPath, resolutionStack);

    if (found === undefined) {
      const ownBindings = this.#registry.getAll(token);
      if (ownBindings.length > 0) {
        throw new NoMatchingBindingError(this.#getTokenName(token), options ?? {}, this.#getAvailableSlots(token));
      }
      throw new TokenNotBoundError(this.#getTokenName(token));
    }

    const { binding, owner } = found;

    // Follow alias
    if (binding.kind === "alias") {
      return this.resolve(
        binding.target as Token<Value> | Constructor<Value>,
        options,
        resolutionPath,
        resolutionStack,
      );
    }

    const scope = (binding as BindingWithScope).scope ?? "transient";

    // Singleton from a parent resolver: delegate so the parent caches it correctly
    if (scope === "singleton" && owner !== this) {
      return owner.#resolveBinding(binding as Binding<Value>, options, resolutionPath, resolutionStack);
    }

    // Scoped/transient (or own singleton): resolve with this resolver's container/scope
    return this.#resolveBinding(binding as Binding<Value>, options, resolutionPath, resolutionStack);
  }

  #resolveBinding<const Value>(
    binding: Binding<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value {
    if (
      binding.kind === "constant" &&
      binding.onActivation === undefined &&
      !this.#lifecycle.hasActivationHandlers(binding.token)
    ) {
      return binding.value;
    }

    const scope = (binding as BindingWithScope).scope ?? "transient";

    // Singleton cache check
    if (scope === "singleton") {
      if (this.#scope.hasSingleton(binding.id)) {
        return this.#scope.getSingleton<Value>(binding.id);
      }
    }

    // Scoped cache check
    if (scope === "scoped") {
      if (!this.#scope.isChild) {
        throw new MissingScopeContextError(this.#getTokenName(binding.token));
      }
      if (this.#scope.hasScoped(binding.id)) {
        return this.#scope.getScoped<Value>(binding.id);
      }
    }

    const frame = this.#getResolutionFrame(binding);
    const tokenDisplayName = frame.tokenName;
    const pathWithSet = resolutionPath as ResolutionPathWithSet;
    let resolutionSet = pathWithSet[RESOLUTION_SET_KEY];
    if (resolutionSet === undefined && resolutionPath.length >= RESOLUTION_SET_THRESHOLD) {
      resolutionSet = new Set<string>(resolutionPath);
      pathWithSet[RESOLUTION_SET_KEY] = resolutionSet;
    }

    // Circular dependency detection
    if (resolutionSet !== undefined ? resolutionSet.has(tokenDisplayName) : resolutionPath.includes(tokenDisplayName)) {
      const cycle = [...resolutionPath, tokenDisplayName];
      throw new CircularDependencyError(cycle);
    }

    resolutionPath.push(tokenDisplayName);
    resolutionSet?.add(tokenDisplayName);
    resolutionStack.push(frame);
    const needsActivation = this.#needsActivation(binding);
    if (!needsActivation && scope === "transient" && binding.kind === "dynamic") {
      const resolutionCtx = this.#acquireSyncResolutionContext(resolutionPath, resolutionStack, options);
      try {
        const dynamicResult = binding.factory(resolutionCtx);
        if (dynamicResult instanceof Promise) {
          throw new AsyncResolutionError(tokenName(binding.token), tokenName(binding.token));
        }
        resolutionStack.pop();
        resolutionPath.pop();
        resolutionSet?.delete(tokenDisplayName);
        return dynamicResult;
      } catch (error) {
        resolutionStack.pop();
        resolutionPath.pop();
        resolutionSet?.delete(tokenDisplayName);
        throw error;
      }
    }

    try {
      const needsResolutionContext = needsActivation || this.#requiresResolutionContext(binding);
      const resolutionCtx = needsResolutionContext
        ? this.#acquireSyncResolutionContext(resolutionPath, resolutionStack, options)
        : undefined;

      const instance = this.#instantiateSync(binding, resolutionCtx, resolutionPath, resolutionStack);

      const shouldActivate = this.#refreshActivationCacheIfNeeded(binding, needsActivation);
      const activated = shouldActivate
        ? this.#lifecycle.runActivationSync(
            resolutionCtx as DefaultResolutionContext,
            binding,
            instance,
            this.#metadataReader,
          )
        : instance;

      // Cache by scope
      if (scope === "singleton") {
        this.#scope.setSingleton(binding.id, activated);
      } else if (scope === "scoped") {
        this.#scope.setScoped(binding.id, activated);
      }

      return activated;
    } finally {
      resolutionStack.pop();
      resolutionPath.pop();
      resolutionSet?.delete(tokenDisplayName);
    }
  }

  #instantiateSync<const Value>(
    binding: Binding<Value>,
    ctx: DefaultResolutionContext | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value {
    switch (binding.kind) {
      case "constant":
        return binding.value;

      case "dynamic": {
        if (ctx === undefined) {
          throw new InternalError("dynamic binding requires resolution context");
        }
        const factoryResult = binding.factory(ctx);
        if (factoryResult instanceof Promise) {
          throw new AsyncResolutionError(tokenName(binding.token), tokenName(binding.token));
        }
        return factoryResult;
      }

      case "dynamic-async":
        throw new AsyncResolutionError(tokenName(binding.token), tokenName(binding.token));

      case "class": {
        const deps = this.#resolveClassDeps(binding.target, resolutionPath, resolutionStack);
        const instance = this.#instantiateClass(binding.target, deps);
        return instance as Value;
      }

      case "resolved": {
        const deps = this.#resolveDescriptorDeps(binding.deps, resolutionPath, resolutionStack);
        const factoryResult = binding.factory(...deps);
        if (factoryResult instanceof Promise) {
          throw new AsyncResolutionError(tokenName(binding.token), tokenName(binding.token));
        }
        return factoryResult;
      }

      case "resolved-async":
        throw new AsyncResolutionError(tokenName(binding.token), tokenName(binding.token));

      case "alias":
        throw new InternalError("alias should have been followed before instantiation");
    }
  }

  #resolveClassDeps(
    target: Constructor,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Array<unknown> {
    const meta = this.#getConstructorMetadata(target);
    if (meta === undefined) {
      if (target.length === 0) {
        return [];
      }
      throw new MissingMetadataError(target.name);
    }
    if (meta.params.length === 0) {
      return [];
    }
    if (meta.params.length === 1) {
      const param = meta.params[0]!;
      const paramOptions = injectionSlotToResolveOptions(param);
      if (param.multi) {
        return [this.resolveAll(param.token, paramOptions, resolutionPath, resolutionStack)];
      }
      if (param.optional) {
        return [this.resolveOptional(param.token, paramOptions, resolutionPath, resolutionStack)];
      }
      if (paramOptions === undefined) {
        return [this.resolveFromContext(param.token, resolutionPath, resolutionStack)];
      }
      return [this.resolve(param.token, paramOptions, resolutionPath, resolutionStack)];
    }
    const deps = new Array<unknown>(meta.params.length);
    for (let index = 0; index < meta.params.length; index += 1) {
      const param = meta.params[index]!;
      const paramOptions = injectionSlotToResolveOptions(param);
      if (param.multi) {
        deps[index] = this.resolveAll(param.token, paramOptions, resolutionPath, resolutionStack);
        continue;
      }
      if (param.optional) {
        deps[index] = this.resolveOptional(param.token, paramOptions, resolutionPath, resolutionStack);
        continue;
      }
      deps[index] =
        paramOptions === undefined
          ? this.resolveFromContext(param.token, resolutionPath, resolutionStack)
          : this.resolve(param.token, paramOptions, resolutionPath, resolutionStack);
    }
    return deps;
  }

  #resolveDescriptorDeps(
    deps: ReadonlyArray<InjectionDescriptor>,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Array<unknown> {
    const resolved = new Array<unknown>(deps.length);
    for (let index = 0; index < deps.length; index += 1) {
      const dep = deps[index]!;
      const depOptions = injectionSlotToResolveOptions(dep);
      if (dep.multi) {
        resolved[index] = this.resolveAll(
          dep.token as Token<unknown> | Constructor,
          depOptions,
          resolutionPath,
          resolutionStack,
        );
        continue;
      }
      if (dep.optional) {
        resolved[index] = this.resolveOptional(
          dep.token as Token<unknown> | Constructor,
          depOptions,
          resolutionPath,
          resolutionStack,
        );
        continue;
      }
      resolved[index] =
        depOptions === undefined
          ? this.resolveFromContext(dep.token as Token<unknown> | Constructor, resolutionPath, resolutionStack)
          : this.resolve(dep.token as Token<unknown> | Constructor, depOptions, resolutionPath, resolutionStack);
    }
    return resolved;
  }

  resolveOptional<const Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value | undefined {
    if (this.#findBinding(token, options, resolutionPath, resolutionStack) === undefined) {
      return undefined;
    }
    return this.resolve(token, options, resolutionPath, resolutionStack);
  }

  resolveAll<const Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Array<Value> {
    if (options?.name !== undefined && options.tag === undefined && (options.tags?.length ?? 0) === 0) {
      const namedCandidates = this.#getSimpleNamedBindingsFromChain(token, options.name);
      if (namedCandidates.length === 0) {
        return [];
      }
      const resolved = new Array<Value>(namedCandidates.length);
      for (let index = 0; index < namedCandidates.length; index += 1) {
        resolved[index] = this.#resolveCandidateSync(
          namedCandidates[index] as Binding<Value>,
          options,
          resolutionPath,
          resolutionStack,
        );
      }
      return resolved;
    }

    const allBindings = this.#getAllBindingsFromChain(token);
    if (allBindings.length === 0) {
      return [];
    }

    const ctx = this.#makeConstraintContext(resolutionPath, resolutionStack, options);
    const candidates = selectAllBindings(allBindings, options, ctx);

    const resolved = new Array<Value>(candidates.length);
    for (let index = 0; index < candidates.length; index += 1) {
      resolved[index] = this.#resolveCandidateSync(
        candidates[index] as Binding<Value>,
        options,
        resolutionPath,
        resolutionStack,
      );
    }
    return resolved;
  }

  // ── Async resolve ──────────────────────────────────────────────────────────

  resolveAsyncFromContext<const Value>(
    token: Token<Value> | Constructor<Value>,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value> {
    const fastBinding = this.#registry.getFastDefault(token);
    if (fastBinding !== undefined) {
      if (fastBinding.kind === "alias") {
        return this.resolveAsyncFromContext(
          fastBinding.target as Token<Value> | Constructor<Value>,
          resolutionPath,
          resolutionStack,
        );
      }
      const scope = (fastBinding as BindingWithScope).scope ?? "transient";
      if (
        scope === "transient" &&
        (fastBinding.kind === "dynamic" || fastBinding.kind === "dynamic-async") &&
        fastBinding.onActivation === undefined &&
        (this.#lifecycle.activationVersion === 0 || !this.#lifecycle.hasActivationHandlers(fastBinding.token))
      ) {
        return this.#resolveTransientDynamicAsyncFromContext(
          fastBinding as Binding<Value> & { kind: "dynamic" | "dynamic-async" },
          resolutionPath,
          resolutionStack,
        );
      }
      if (scope === "singleton" && this.#scope.hasSingleton(fastBinding.id)) {
        return Promise.resolve(this.#scope.getSingleton<Value>(fastBinding.id));
      }
      if (scope === "scoped") {
        if (!this.#scope.isChild) {
          return Promise.reject(new MissingScopeContextError(this.#getTokenName(fastBinding.token)));
        }
        if (this.#scope.hasScoped(fastBinding.id)) {
          return Promise.resolve(this.#scope.getScoped<Value>(fastBinding.id));
        }
      }
      return this.#resolveBindingAsync(fastBinding as Binding<Value>, undefined, resolutionPath, resolutionStack);
    }

    return this.resolveAsync(token, undefined, resolutionPath, resolutionStack);
  }

  async resolveAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value> {
    const found = this.#findBinding(token, options, resolutionPath, resolutionStack);

    if (found === undefined) {
      const ownBindings = this.#registry.getAll(token);
      if (ownBindings.length > 0) {
        throw new NoMatchingBindingError(this.#getTokenName(token), options ?? {}, this.#getAvailableSlots(token));
      }
      throw new TokenNotBoundError(this.#getTokenName(token));
    }

    const { binding, owner } = found;

    if (binding.kind === "alias") {
      return this.resolveAsync(
        binding.target as Token<Value> | Constructor<Value>,
        options,
        resolutionPath,
        resolutionStack,
      );
    }

    const scope = (binding as BindingWithScope).scope ?? "transient";

    if (scope === "singleton" && owner !== this) {
      return owner.#resolveBindingAsync(binding as Binding<Value>, options, resolutionPath, resolutionStack);
    }

    return this.#resolveBindingAsync(binding as Binding<Value>, options, resolutionPath, resolutionStack);
  }

  async #resolveBindingAsync<const Value>(
    binding: Binding<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value> {
    if (
      binding.kind === "constant" &&
      binding.onActivation === undefined &&
      !this.#lifecycle.hasActivationHandlers(binding.token)
    ) {
      return binding.value;
    }

    const scope = (binding as BindingWithScope).scope ?? "transient";

    // Singleton cache
    if (scope === "singleton") {
      if (this.#scope.hasSingleton(binding.id)) {
        return this.#scope.getSingleton<Value>(binding.id);
      }
      // In-flight dedup
      const inflight = this.#scope.getInflight(binding.id);
      if (inflight !== undefined) {
        return inflight as Promise<Value>;
      }
    }

    // Scoped cache
    if (scope === "scoped") {
      if (!this.#scope.isChild) {
        throw new MissingScopeContextError(this.#getTokenName(binding.token));
      }
      if (this.#scope.hasScoped(binding.id)) {
        return this.#scope.getScoped<Value>(binding.id);
      }
    }

    const frame = this.#getResolutionFrame(binding);
    const frameName = frame.tokenName;
    const pathWithSet = resolutionPath as ResolutionPathWithSet;
    let resolutionSet = pathWithSet[RESOLUTION_SET_KEY];
    if (resolutionSet === undefined && resolutionPath.length >= RESOLUTION_SET_THRESHOLD) {
      resolutionSet = new Set<string>(resolutionPath);
      pathWithSet[RESOLUTION_SET_KEY] = resolutionSet;
    }

    if (resolutionSet !== undefined ? resolutionSet.has(frameName) : resolutionPath.includes(frameName)) {
      throw new CircularDependencyError([...resolutionPath, frameName]);
    }

    resolutionPath.push(frameName);
    resolutionSet?.add(frameName);
    resolutionStack.push(frame);
    const needsActivation = this.#needsActivation(binding);
    if (!needsActivation && scope === "transient" && (binding.kind === "dynamic" || binding.kind === "dynamic-async")) {
      const resolutionCtx = new DefaultResolutionContext(
        this as unknown as ResolverCallbacks,
        resolutionPath,
        resolutionStack,
        options,
      );
      try {
        if (binding.kind === "dynamic-async") {
          return await binding.factory(resolutionCtx);
        }
        const dynamicResult = binding.factory(resolutionCtx);
        return dynamicResult instanceof Promise ? await dynamicResult : dynamicResult;
      } finally {
        resolutionStack.pop();
        resolutionPath.pop();
        resolutionSet?.delete(frameName);
      }
    }

    const needsResolutionContext = needsActivation || this.#requiresResolutionContext(binding);
    const resolutionCtx = needsResolutionContext
      ? new DefaultResolutionContext(this as unknown as ResolverCallbacks, resolutionPath, resolutionStack, options)
      : undefined;

    try {
      if (scope === "singleton") {
        const createSingletonPromise = async (): Promise<Value> => {
          const instance = await this.#instantiateAsync(binding, resolutionCtx, resolutionPath, resolutionStack);

          const shouldActivate = this.#refreshActivationCacheIfNeeded(binding, needsActivation);
          const activated = shouldActivate
            ? await this.#lifecycle.runActivation(
                resolutionCtx as DefaultResolutionContext,
                binding,
                instance,
                this.#metadataReader,
              )
            : instance;

          this.#scope.setSingleton(binding.id, activated);
          this.#scope.clearInflight(binding.id);
          return activated;
        };

        const singletonPromise = createSingletonPromise().catch((err: unknown) => {
          this.#scope.clearInflight(binding.id);
          throw err;
        });
        this.#scope.setInflight(binding.id, singletonPromise as Promise<unknown>);
        return await singletonPromise;
      }

      const instance = await this.#instantiateAsync(binding, resolutionCtx, resolutionPath, resolutionStack);

      const shouldActivate = this.#refreshActivationCacheIfNeeded(binding, needsActivation);
      const activated = shouldActivate
        ? await this.#lifecycle.runActivation(
            resolutionCtx as DefaultResolutionContext,
            binding,
            instance,
            this.#metadataReader,
          )
        : instance;

      if (scope === "scoped") {
        this.#scope.setScoped(binding.id, activated);
      }

      return activated;
    } finally {
      resolutionStack.pop();
      resolutionPath.pop();
      resolutionSet?.delete(frameName);
    }
  }

  async #instantiateAsync<const Value>(
    binding: Binding<Value>,
    ctx: DefaultResolutionContext | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value> {
    switch (binding.kind) {
      case "constant":
        return binding.value;

      case "dynamic": {
        if (ctx === undefined) {
          throw new InternalError("dynamic binding requires resolution context");
        }
        const factoryResult = binding.factory(ctx);
        return factoryResult instanceof Promise ? factoryResult : Promise.resolve(factoryResult);
      }

      case "dynamic-async":
        if (ctx === undefined) {
          throw new InternalError("dynamic-async binding requires resolution context");
        }
        return binding.factory(ctx);

      case "class": {
        const deps = await this.#resolveClassDepsAsync(binding.target, resolutionPath, resolutionStack);
        const instance = this.#instantiateClass(binding.target, deps);
        return instance as Value;
      }

      case "resolved": {
        if (ctx === undefined) {
          throw new InternalError("resolved binding requires resolution context");
        }
        const deps = await this.#resolveDescriptorDepsAsync(binding.deps, resolutionPath, resolutionStack);
        const factoryResult = binding.factory(...deps);
        return factoryResult instanceof Promise ? factoryResult : Promise.resolve(factoryResult);
      }

      case "resolved-async": {
        const deps = await this.#resolveDescriptorDepsAsync(binding.deps, resolutionPath, resolutionStack);
        return binding.factory(...deps);
      }

      case "alias":
        throw new InternalError("alias should have been followed before instantiation");
    }
  }

  async #resolveClassDepsAsync(
    target: Constructor,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Array<unknown>> {
    const meta = this.#getConstructorMetadata(target);
    if (meta === undefined) {
      if (target.length === 0) {
        return [];
      }
      throw new MissingMetadataError(target.name);
    }
    if (meta.params.length === 0) {
      return [];
    }
    if (meta.params.length === 1) {
      const param = meta.params[0]!;
      const paramOptions = injectionSlotToResolveOptions(param);
      if (param.multi) {
        return [await this.resolveAllAsync(param.token, paramOptions, resolutionPath, resolutionStack)];
      }
      if (param.optional) {
        return [await this.resolveOptionalAsync(param.token, paramOptions, resolutionPath, resolutionStack)];
      }
      if (paramOptions === undefined) {
        return [await this.resolveAsyncFromContext(param.token, resolutionPath, resolutionStack)];
      }
      return [await this.resolveAsync(param.token, paramOptions, resolutionPath, resolutionStack)];
    }
    const pending = new Array<Promise<unknown>>(meta.params.length);
    const shouldCloneContext = meta.params.length > 1;
    for (let index = 0; index < meta.params.length; index += 1) {
      const param = meta.params[index]!;
      const paramOptions = injectionSlotToResolveOptions(param);
      if (param.multi) {
        pending[index] = this.resolveAllAsync(
          param.token,
          paramOptions,
          shouldCloneContext ? [...resolutionPath] : resolutionPath,
          shouldCloneContext ? [...resolutionStack] : resolutionStack,
        );
      } else if (param.optional) {
        pending[index] = this.resolveOptionalAsync(
          param.token,
          paramOptions,
          shouldCloneContext ? [...resolutionPath] : resolutionPath,
          shouldCloneContext ? [...resolutionStack] : resolutionStack,
        );
      } else {
        pending[index] =
          paramOptions === undefined
            ? this.resolveAsyncFromContext(
                param.token,
                shouldCloneContext ? [...resolutionPath] : resolutionPath,
                shouldCloneContext ? [...resolutionStack] : resolutionStack,
              )
            : this.resolveAsync(
                param.token,
                paramOptions,
                shouldCloneContext ? [...resolutionPath] : resolutionPath,
                shouldCloneContext ? [...resolutionStack] : resolutionStack,
              );
      }
    }
    return Promise.all(pending);
  }

  async #resolveDescriptorDepsAsync(
    deps: ReadonlyArray<InjectionDescriptor>,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Array<unknown>> {
    const pending = new Array<Promise<unknown>>(deps.length);
    const shouldCloneContext = deps.length > 1;
    for (let index = 0; index < deps.length; index += 1) {
      const dep = deps[index]!;
      const depOptions = injectionSlotToResolveOptions(dep);
      if (dep.multi) {
        pending[index] = this.resolveAllAsync(
          dep.token as Token<unknown> | Constructor,
          depOptions,
          shouldCloneContext ? [...resolutionPath] : resolutionPath,
          shouldCloneContext ? [...resolutionStack] : resolutionStack,
        );
      } else if (dep.optional) {
        pending[index] = this.resolveOptionalAsync(
          dep.token as Token<unknown> | Constructor,
          depOptions,
          shouldCloneContext ? [...resolutionPath] : resolutionPath,
          shouldCloneContext ? [...resolutionStack] : resolutionStack,
        );
      } else {
        pending[index] =
          depOptions === undefined
            ? this.resolveAsyncFromContext(
                dep.token as Token<unknown> | Constructor,
                shouldCloneContext ? [...resolutionPath] : resolutionPath,
                shouldCloneContext ? [...resolutionStack] : resolutionStack,
              )
            : this.resolveAsync(
                dep.token as Token<unknown> | Constructor,
                depOptions,
                shouldCloneContext ? [...resolutionPath] : resolutionPath,
                shouldCloneContext ? [...resolutionStack] : resolutionStack,
              );
      }
    }
    return Promise.all(pending);
  }

  async resolveOptionalAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value | undefined> {
    if (this.#findBinding(token, options, resolutionPath, resolutionStack) === undefined) {
      return undefined;
    }
    return this.resolveAsync(token, options, resolutionPath, resolutionStack);
  }

  async resolveAllAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Array<Value>> {
    if (options?.name !== undefined && options.tag === undefined && (options.tags?.length ?? 0) === 0) {
      const namedCandidates = this.#getSimpleNamedBindingsFromChain(token, options.name);
      if (namedCandidates.length === 0) {
        return [];
      }
      const pending = new Array<Promise<Value>>(namedCandidates.length);
      for (let index = 0; index < namedCandidates.length; index += 1) {
        pending[index] = this.#resolveCandidateAsync(
          namedCandidates[index] as Binding<Value>,
          options,
          resolutionPath,
          resolutionStack,
        );
      }
      return Promise.all(pending);
    }

    const allBindings = this.#getAllBindingsFromChain(token);
    if (allBindings.length === 0) {
      return [];
    }

    const ctx = this.#makeConstraintContext(resolutionPath, resolutionStack, options);
    const candidates = selectAllBindings(allBindings, options, ctx);

    const pending = new Array<Promise<Value>>(candidates.length);
    for (let index = 0; index < candidates.length; index += 1) {
      pending[index] = this.#resolveCandidateAsync(
        candidates[index] as Binding<Value>,
        options,
        resolutionPath,
        resolutionStack,
      );
    }
    return Promise.all(pending);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  #getAllBindingsFromChain(token: Token<unknown> | Constructor): ReadonlyArray<Binding> {
    const ownBindings = this.#registry.getAll(token);
    if (this.#parent === undefined) {
      return ownBindings;
    }
    const result: Array<Binding> = [...ownBindings];
    let current: DependencyResolver | undefined = this.#parent;
    while (current !== undefined) {
      const own = current.#registry.getAll(token);
      if (own.length > 0) {
        result.push(...own);
      }
      current = current.#parent;
    }
    return result;
  }

  #getSimpleNamedBindingsFromChain(token: Token<unknown> | Constructor, name: string): Array<Binding> {
    const ownBinding = this.#registry.getSimpleNamed(token, name);
    if (this.#parent === undefined) {
      return ownBinding !== undefined ? [ownBinding] : [];
    }
    const result: Array<Binding> = [];
    if (ownBinding !== undefined) {
      result.push(ownBinding);
    }
    let current: DependencyResolver | undefined = this.#parent;
    while (current !== undefined) {
      const binding = current.#registry.getSimpleNamed(token, name);
      if (binding !== undefined) {
        result.push(binding);
      }
      current = current.#parent;
    }
    return result;
  }

  #getAvailableSlots(token: Token<unknown> | Constructor): Array<string> {
    return this.#registry.availableSlotStrings(token);
  }

  #makeConstraintContext(
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    options: ResolveOptions | undefined,
  ): ConstraintContext {
    if (options === undefined && resolutionPath.length === 0 && resolutionStack.length === 0) {
      return ROOT_CONSTRAINT_CONTEXT;
    }
    const parent = resolutionStack.at(-1);
    const ancestors = resolutionStack.length > 1 ? resolutionStack.slice(0, -1) : [];
    return {
      resolutionPath,
      resolutionStack,
      parent,
      ancestors,
      currentResolveOptions: options,
    };
  }

  #matchesBindingFast(
    binding: Binding,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): boolean {
    if (!this.#matchesSlotFast(binding.slot, options)) {
      return false;
    }
    if (binding.predicate === undefined) {
      return true;
    }
    const ctx = this.#makeConstraintContext(resolutionPath, resolutionStack, options);
    return binding.predicate(ctx);
  }

  #matchesSlotFast(slot: BindingSlot, options: ResolveOptions | undefined): boolean {
    const requestedName = options?.name;
    const requestedTags = options?.tags;
    const singleRequestedTag = options?.tag;
    const hasRequestedTags = (requestedTags?.length ?? 0) > 0 || singleRequestedTag !== undefined;

    if (slot.name !== undefined) {
      if (requestedName === undefined || slot.name !== requestedName) {
        return false;
      }
    } else if (requestedName !== undefined) {
      return false;
    }

    if (slot.tags.length > 0) {
      if (!hasRequestedTags) {
        return false;
      }
      for (const [tagKey, tagValue] of slot.tags) {
        if (!this.#matchesRequestedTag(tagKey, tagValue, requestedTags, singleRequestedTag)) {
          return false;
        }
      }
    } else if (hasRequestedTags) {
      return false;
    }

    return true;
  }

  #getTokenName(token: Token<unknown> | Constructor): string {
    return tokenName(token);
  }

  #getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
    const cached = this.#classConstructorMetadata.get(target);
    if (cached !== undefined) {
      return cached === null ? undefined : cached;
    }
    const metadata = this.#metadataReader.getConstructorMetadata(target);
    this.#classConstructorMetadata.set(target, metadata ?? null);
    return metadata;
  }

  #instantiateClass(target: Constructor, deps: Array<unknown>): unknown {
    let needsActiveContainer = this.#classNeedsActiveContainer.get(target);
    if (needsActiveContainer === undefined) {
      const accessorMetadata = this.#metadataReader.getAccessorMetadata?.(target);
      needsActiveContainer = (accessorMetadata?.length ?? 0) > 0;
      this.#classNeedsActiveContainer.set(target, needsActiveContainer);
    }
    const invokable = target as ConstructorInvocation;
    if (!needsActiveContainer) {
      return new invokable(...deps);
    }
    return runWithContainer(this.#container, () => new invokable(...deps));
  }

  #matchesRequestedTag(
    tagKey: string,
    tagValue: unknown,
    requestedTags: ReadonlyArray<BindingTag> | undefined,
    singleRequestedTag: BindingTag | undefined,
  ): boolean {
    if (
      singleRequestedTag !== undefined &&
      singleRequestedTag[0] === tagKey &&
      Object.is(singleRequestedTag[1], tagValue)
    ) {
      return true;
    }
    if (requestedTags === undefined || requestedTags.length === 0) {
      return false;
    }
    for (let index = 0; index < requestedTags.length; index += 1) {
      const requestedTag = requestedTags[index]!;
      if (requestedTag[0] === tagKey && Object.is(requestedTag[1], tagValue)) {
        return true;
      }
    }
    return false;
  }

  #resolveTransientDynamicSyncFromContext<const Value>(
    binding: Binding<Value> & { kind: "dynamic" },
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value {
    // ── Shallow path (depth < RESOLUTION_SET_THRESHOLD) ──────────────────────────────────
    // Use resolutionPath.includes for cycle detection: for tiny arrays (depth 0–31) this is
    // faster than a Set lookup. Keep resolutionStack push/pop and the per-depth pool so
    // ctx.graph reflects correct state for shallow-chain factories.
    if (resolutionPath.length < RESOLUTION_SET_THRESHOLD) {
      const frame = this.#getResolutionFrame(binding);
      const tokenDisplayName = frame.tokenName;
      if (resolutionPath.includes(tokenDisplayName)) {
        throw new CircularDependencyError([...resolutionPath, tokenDisplayName]);
      }
      resolutionPath.push(tokenDisplayName);
      resolutionStack.push(frame);
      const resolutionCtx = this.#acquireSyncResolutionContext(resolutionPath, resolutionStack, undefined);
      try {
        const dynamicResult = binding.factory(resolutionCtx);
        if (dynamicResult instanceof Promise) {
          throw new AsyncResolutionError(tokenDisplayName, tokenDisplayName);
        }
        return dynamicResult;
      } finally {
        resolutionStack.pop();
        resolutionPath.pop();
      }
    }

    // ── Deep path (depth >= RESOLUTION_SET_THRESHOLD) ────────────────────────────────────
    // At this depth the O(N) array scan becomes expensive.  Switch to a class-level
    // Set<BindingIdentifier> for O(1) cycle detection.
    //
    // Performance decisions vs. shallow path:
    //  1. _getResolutionFrame is NOT called: frameName is only needed for resolutionPath.push
    //     and error messages.  Both are handled below without the frame Map lookup.
    //  2. resolutionPath.push / pop is SKIPPED: cycle detection uses _deepCycleIds (binding IDs),
    //     so path membership tracking through the string array is unnecessary.  Eliminating
    //     ~480 array writes per 512-chain avoids GC write-barriers on every level.
    //     Trade-off: CircularDependencyError thrown for a deep cycle (depth > 32) will only
    //     include the first 32 path elements in its message; levels 32+ are omitted.
    //  3. The shared context is set up ONCE (when _deepActiveLevels === 0) rather than
    //     re-checked on every level — saves two property reads + a reference comparison
    //     for each of the ~480 subsequent deep-chain levels.
    //
    // Reentrancy: if a *different* deep chain is currently active (factory called
    // container.resolve() internally and that inner chain also reached the threshold),
    // fall back to the slow path to avoid cross-chain Set pollution.
    if (this.#deepActiveLevels > 0 && this.#deepSyncCtxPath !== resolutionPath) {
      return this.#resolveTransientDynamicSyncSlow(binding, resolutionPath, resolutionStack);
    }

    // First deep level: bump the generation (implicitly clearing all stale cycle marks from
    // previous chains), seed the marks with the shallow-path frames already on the
    // resolution stack, then initialise (or reset) the shared context once for the
    // whole deep chain.
    if (this.#deepActiveLevels === 0) {
      const gen = ++this.#deepCycleGen;
      for (const stackFrame of resolutionStack) {
        this.#deepCycleMarks.set(stackFrame.bindingId, gen);
      }
      let ctx = this.#deepSyncCtx;
      if (ctx === undefined) {
        ctx = new DefaultResolutionContext(
          this as unknown as ResolverCallbacks,
          resolutionPath,
          resolutionStack,
          undefined,
        );
        this.#deepSyncCtx = ctx;
      } else {
        ctx.reset(this as unknown as ResolverCallbacks, resolutionPath, resolutionStack, undefined);
      }
      this.#deepSyncCtxPath = resolutionPath;
    }

    if (this.#deepCycleMarks.get(binding.id) === this.#deepCycleGen) {
      throw new CircularDependencyError([...resolutionPath, tokenName(binding.token)]);
    }

    this.#deepCycleMarks.set(binding.id, this.#deepCycleGen);
    this.#deepActiveLevels++;

    try {
      // Use the pre-initialised context directly — no local variable needed.
      const dynamicResult = binding.factory(this.#deepSyncCtx!);
      if (dynamicResult instanceof Promise) {
        throw new AsyncResolutionError(tokenName(binding.token), tokenName(binding.token));
      }
      return dynamicResult;
    } finally {
      // No Map.delete needed: the generation counter makes old marks invisible.
      // Only reset the path pointer when the last deep level unwinds.
      if (--this.#deepActiveLevels === 0) {
        this.#deepSyncCtxPath = undefined;
      }
    }
  }

  #resolveTransientDynamicSyncSlow<const Value>(
    binding: Binding<Value> & { kind: "dynamic" },
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value {
    // Rare fallback used when deep-chain reentrancy is detected (a factory called
    // container.resolve() directly and the resulting chain also reached the threshold).
    const frame = this.#getResolutionFrame(binding);
    const tokenDisplayName = frame.tokenName;
    const pathWithSet = resolutionPath as ResolutionPathWithSet;
    let resolutionSet = pathWithSet[RESOLUTION_SET_KEY];
    if (resolutionSet === undefined) {
      resolutionSet = new Set<string>(resolutionPath);
      pathWithSet[RESOLUTION_SET_KEY] = resolutionSet;
    }
    if (resolutionSet.has(tokenDisplayName)) {
      throw new CircularDependencyError([...resolutionPath, tokenDisplayName]);
    }
    resolutionPath.push(tokenDisplayName);
    resolutionSet.add(tokenDisplayName);
    resolutionStack.push(frame);
    const resolutionCtx = this.#acquireSyncResolutionContext(resolutionPath, resolutionStack, undefined);
    try {
      const dynamicResult = binding.factory(resolutionCtx);
      if (dynamicResult instanceof Promise) {
        throw new AsyncResolutionError(tokenDisplayName, tokenDisplayName);
      }
      return dynamicResult;
    } finally {
      resolutionStack.pop();
      resolutionPath.pop();
      resolutionSet.delete(tokenDisplayName);
    }
  }

  // NOT declared `async` — avoids creating a JSAsyncGeneratorObject + implicit Promise wrapper on
  // every invocation.  Cleanup is handled via .then(onFulfilled, onRejected) so the behaviour is
  // identical to a try/finally but without the async machinery overhead.
  #resolveTransientDynamicAsyncFromContext<const Value>(
    binding: Binding<Value> & { kind: "dynamic" | "dynamic-async" },
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value> {
    // ── Shallow async path (depth < RESOLUTION_SET_THRESHOLD) ─────────────────────────────
    // For the common case of a sequential async chain (each factory awaits one dependency at a
    // time), all levels share the same resolutionPath/resolutionStack arrays.  A single
    // DefaultResolutionContext can therefore serve the entire chain:
    //   • levels 2-N of the owning chain: zero allocation, zero reset writes
    //   • concurrent chains (Promise.all roots): detected by path-identity mismatch → fallback
    //     to a fresh DefaultResolutionContext for that level only
    // resolutionStack is NOT pushed here — see class-level comment for the trade-off.
    if (resolutionPath.length < RESOLUTION_SET_THRESHOLD) {
      const tokenDisplayName = tokenName(binding.token);
      if (resolutionPath.includes(tokenDisplayName)) {
        return Promise.reject(new CircularDependencyError([...resolutionPath, tokenDisplayName]));
      }

      resolutionPath.push(tokenDisplayName);

      // Determine which context to use and whether this level owns the shared context.
      let ctx: DefaultResolutionContext;
      let isOwnerLevel: boolean;
      if (this.#deepAsyncCtxPath === resolutionPath) {
        // Inner level of the owning chain — reuse the shared context with NO setup overhead.
        ctx = this.#deepAsyncCtx!;
        isOwnerLevel = true;
      } else if (this.#deepAsyncCtxPath === undefined) {
        // Root of a new chain — take ownership and initialise (or reset) the shared context.
        const existing = this.#deepAsyncCtx;
        if (existing === undefined) {
          ctx = new DefaultResolutionContext(
            this as unknown as ResolverCallbacks,
            resolutionPath,
            resolutionStack,
            undefined,
          );
          this.#deepAsyncCtx = ctx;
        } else {
          existing.reset(this as unknown as ResolverCallbacks, resolutionPath, resolutionStack, undefined);
          ctx = existing;
        }
        this.#deepAsyncCtxPath = resolutionPath;
        isOwnerLevel = true;
      } else {
        // Concurrent chain (e.g. Promise.all) — allocate a dedicated context and do NOT
        // interfere with the owning chain's state.
        ctx = new DefaultResolutionContext(
          this as unknown as ResolverCallbacks,
          resolutionPath,
          resolutionStack,
          undefined,
        );
        isOwnerLevel = false;
      }

      if (isOwnerLevel) {
        this.#deepAsyncActiveLevels++;
      }

      // Invoke the factory synchronously to get its Promise (or a resolved value for "dynamic").
      let factoryPromise: Promise<Value>;
      try {
        if (binding.kind === "dynamic-async") {
          factoryPromise = binding.factory(ctx);
        } else {
          const factoryResult = binding.factory(ctx);
          factoryPromise =
            factoryResult instanceof Promise ? (factoryResult as Promise<Value>) : Promise.resolve(factoryResult);
        }
      } catch (err) {
        // Synchronous throw from the factory (rare) — clean up immediately.
        resolutionPath.pop();
        if (isOwnerLevel && --this.#deepAsyncActiveLevels === 0) {
          this.#deepAsyncCtxPath = undefined;
        }
        return Promise.reject(err);
      }

      // Chain cleanup onto the Promise so it runs whether the factory resolves or rejects.
      return factoryPromise.then(
        (value) => {
          resolutionPath.pop();
          if (isOwnerLevel && --this.#deepAsyncActiveLevels === 0) {
            this.#deepAsyncCtxPath = undefined;
          }
          return value;
        },
        (err: unknown) => {
          resolutionPath.pop();
          if (isOwnerLevel && --this.#deepAsyncActiveLevels === 0) {
            this.#deepAsyncCtxPath = undefined;
          }
          // Re-throw as the rejected value; the `never` cast suppresses the TS return-type
          // mismatch that arises because `throw` has type `never` in an expression context.
          throw err as never;
        },
      );
    }

    // ── Deep async path (depth ≥ RESOLUTION_SET_THRESHOLD) ────────────────────────────────
    // Fall back to the fully-correct slow implementation.
    return this.#resolveTransientDynamicAsyncSlow(binding, resolutionPath, resolutionStack);
  }

  async #resolveTransientDynamicAsyncSlow<const Value>(
    binding: Binding<Value> & { kind: "dynamic" | "dynamic-async" },
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value> {
    const frame = this.#getResolutionFrame(binding);
    const tokenDisplayName = frame.tokenName;
    const pathWithSet = resolutionPath as ResolutionPathWithSet;
    let resolutionSet = pathWithSet[RESOLUTION_SET_KEY];
    if (resolutionSet === undefined) {
      resolutionSet = new Set<string>(resolutionPath);
      pathWithSet[RESOLUTION_SET_KEY] = resolutionSet;
    }
    if (resolutionSet.has(tokenDisplayName)) {
      throw new CircularDependencyError([...resolutionPath, tokenDisplayName]);
    }
    resolutionPath.push(tokenDisplayName);
    resolutionSet.add(tokenDisplayName);
    resolutionStack.push(frame);
    const resolutionCtx = new DefaultResolutionContext(
      this as unknown as ResolverCallbacks,
      resolutionPath,
      resolutionStack,
      undefined,
    );
    try {
      if (binding.kind === "dynamic-async") {
        return await binding.factory(resolutionCtx);
      }
      const dynamicResult = binding.factory(resolutionCtx);
      return dynamicResult instanceof Promise ? await dynamicResult : dynamicResult;
    } finally {
      resolutionStack.pop();
      resolutionPath.pop();
      resolutionSet.delete(tokenDisplayName);
    }
  }

  #resolveCandidateSync<const Value>(
    binding: Binding<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value {
    if (
      binding.kind === "constant" &&
      binding.onActivation === undefined &&
      !this.#lifecycle.hasActivationHandlers(binding.token)
    ) {
      return binding.value;
    }
    if (binding.kind === "alias") {
      return this.resolve(binding.target, options, resolutionPath, resolutionStack);
    }
    const scope = (binding as BindingWithScope).scope ?? "transient";
    if (scope === "singleton" && this.#scope.hasSingleton(binding.id)) {
      return this.#scope.getSingleton<Value>(binding.id);
    }
    if (scope === "scoped") {
      if (!this.#scope.isChild) {
        throw new MissingScopeContextError(this.#getTokenName(binding.token));
      }
      if (this.#scope.hasScoped(binding.id)) {
        return this.#scope.getScoped<Value>(binding.id);
      }
    }
    return this.#resolveBinding(binding, options, resolutionPath, resolutionStack);
  }

  #resolveCandidateAsync<const Value>(
    binding: Binding<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value> {
    if (
      binding.kind === "constant" &&
      binding.onActivation === undefined &&
      !this.#lifecycle.hasActivationHandlers(binding.token)
    ) {
      return Promise.resolve(binding.value);
    }
    const isolatedPath = [...resolutionPath];
    const isolatedStack = [...resolutionStack];
    if (binding.kind === "alias") {
      return this.resolveAsync(binding.target, options, isolatedPath, isolatedStack);
    }
    const scope = (binding as BindingWithScope).scope ?? "transient";
    if (scope === "singleton" && this.#scope.hasSingleton(binding.id)) {
      return Promise.resolve(this.#scope.getSingleton<Value>(binding.id));
    }
    if (scope === "scoped") {
      if (!this.#scope.isChild) {
        return Promise.reject(new MissingScopeContextError(this.#getTokenName(binding.token)));
      }
      if (this.#scope.hasScoped(binding.id)) {
        return Promise.resolve(this.#scope.getScoped<Value>(binding.id));
      }
    }
    return this.#resolveBindingAsync(binding, options, isolatedPath, isolatedStack);
  }

  #getResolutionFrame<const Value>(binding: Binding<Value>): ResolutionFrame {
    const existing = this.#frameByBindingId.get(binding.id);
    if (existing !== undefined) {
      return existing;
    }
    const scope = (binding as BindingWithScope).scope ?? "transient";
    const frame = buildResolutionFrame(tokenName(binding.token), scope, binding.id, binding.kind, binding.slot);
    this.#frameByBindingId.set(binding.id, frame);
    return frame;
  }

  #needsActivation<const Value>(binding: Binding<Value>): boolean {
    const lifecycleVersion = this.#lifecycle.activationVersion;
    if (
      lifecycleVersion === 0 &&
      binding.kind !== "class" &&
      binding.kind !== "alias" &&
      binding.onActivation === undefined
    ) {
      return false;
    }
    if (this.#activationCacheVersion !== lifecycleVersion) {
      this.#activationNeedByBindingId.clear();
      this.#activationCacheVersion = lifecycleVersion;
    }

    const cached = this.#activationNeedByBindingId.get(binding.id);
    if (cached !== undefined) {
      return cached;
    }

    if (binding.kind === "class") {
      let hasActivation = this.#lifecycle.hasActivationHandlers(binding.token) || binding.onActivation !== undefined;
      const cachedPostConstruct = this.#classHasPostConstruct.get(binding.target);
      // Unknown class lifecycle metadata: activate once, then cache after first instantiation.
      if (cachedPostConstruct === undefined) {
        hasActivation = true;
      } else if (cachedPostConstruct) {
        hasActivation = true;
      }
      this.#activationNeedByBindingId.set(binding.id, hasActivation);
      return hasActivation;
    }

    let hasActivation = false;
    if (binding.kind !== "alias" && binding.onActivation !== undefined) {
      hasActivation = true;
    } else if (this.#lifecycle.hasActivationHandlers(binding.token)) {
      hasActivation = true;
    }

    this.#activationNeedByBindingId.set(binding.id, hasActivation);
    return hasActivation;
  }

  #refreshClassPostConstructCache(target: Constructor): void {
    const lifecycle = this.#metadataReader.getLifecycleMetadata(target);
    const hasPostConstruct =
      lifecycle !== undefined && lifecycle.postConstruct !== undefined && lifecycle.postConstruct.length > 0;
    this.#classHasPostConstruct.set(target, hasPostConstruct);
  }

  /**
   * Refreshes the post-construct cache for class bindings on first instantiation and
   * returns the (possibly updated) shouldActivate flag.
   */
  #refreshActivationCacheIfNeeded<Value>(binding: Binding<Value>, needsActivation: boolean): boolean {
    if (binding.kind === "class" && this.#classHasPostConstruct.get(binding.target) === undefined) {
      this.#refreshClassPostConstructCache(binding.target);
      this.#activationNeedByBindingId.delete(binding.id);
      return this.#needsActivation(binding);
    }
    return needsActivation;
  }

  #requiresResolutionContext<const Value>(binding: Binding<Value>): boolean {
    return binding.kind === "dynamic" || binding.kind === "dynamic-async";
  }

  #acquireSyncResolutionContext(
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    options: ResolveOptions | undefined,
  ): DefaultResolutionContext {
    const depth = resolutionStack.length;
    const existing = this.#syncResolutionContextPool[depth];
    if (existing !== undefined) {
      existing.reset(this as unknown as ResolverCallbacks, resolutionPath, resolutionStack, options);
      return existing;
    }
    const created = new DefaultResolutionContext(
      this as unknown as ResolverCallbacks,
      resolutionPath,
      resolutionStack,
      options,
    );
    this.#syncResolutionContextPool[depth] = created;
    return created;
  }
}
