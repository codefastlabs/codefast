import type { ConstructorInvocation } from "#/constructor-type";
import type {
  BindingIdentifier,
  BindingScope,
  Constructor,
  MaterializationFrame,
  ResolveOptions,
} from "#/types";
import type { Token } from "#/token";
import type { Binding, SlotKey } from "#/binding";
import type { BindingRegistry } from "#/registry";
import type { ScopeManager } from "#/scope";
import type { LifecycleManager } from "#/lifecycle";
import type { MetadataReader } from "#/metadata/metadata-types";
import type { ConstructorMetadata } from "#/metadata/metadata-types";
import type { InjectionDescriptor } from "#/decorators/inject";
import type { Container } from "#/container";
import {
  AsyncResolutionError,
  CircularDependencyError,
  InternalError,
  MissingMetadataError,
  MissingScopeContextError,
  NoMatchingBindingError,
  TokenNotBoundError,
} from "#/errors";
import { tokenName } from "#/token";
import type { ResolverCallbacks } from "#/environment";
import {
  buildMaterializationFrame,
  DefaultResolutionContext,
  runWithContainer,
} from "#/environment";
import { injectableSlotToResolveOptions } from "#/resolve-options";
import { selectAllBindings, selectBinding } from "#/binding-select";

type BindingWithScope = Binding & { scope: BindingScope };
const RESOLUTION_SET_KEY: unique symbol = Symbol("di:resolution-set");
const RESOLUTION_SET_THRESHOLD = 32;
type ResolutionPathWithSet = string[] & { [RESOLUTION_SET_KEY]?: Set<string> };
const EMPTY_STRING_LIST: readonly string[] = [];
const EMPTY_FRAME_LIST: readonly MaterializationFrame[] = [];
const ROOT_CONSTRAINT_CONTEXT = {
  resolutionPath: EMPTY_STRING_LIST,
  materializationStack: EMPTY_FRAME_LIST,
  parent: undefined,
  ancestors: EMPTY_FRAME_LIST,
  currentResolveHint: undefined,
};

export class DependencyResolver {
  private readonly _frameByBindingId = new Map<BindingIdentifier, MaterializationFrame>();
  private readonly _syncResolutionContextPool: DefaultResolutionContext[] = [];
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
  //   materializationStack is NOT pushed in the deep path — no GC write-barriers for object arrays.
  //   Trade-off: ctx.graph.materializationStack only reflects the first RESOLUTION_SET_THRESHOLD
  //   frames; code relying on ctx.graph.parent inside a deep transient-dynamic factory will see
  //   the frame at the threshold boundary, not the current depth.
  private readonly _deepCycleMarks = new Map<BindingIdentifier, number>();
  private _deepCycleGen = 0;
  private _deepActiveLevels = 0;
  private _deepSyncCtx: DefaultResolutionContext | undefined;
  private _deepSyncCtxPath: string[] | undefined;
  // Async shared-context state for _resolveTransientDynamicAsyncFromContext (shallow path):
  //
  // For a SEQUENTIAL async chain (depth < RESOLUTION_SET_THRESHOLD), all levels share the same
  // resolutionPath and materializationStack arrays (passed by reference through ctx.resolveAsync).
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
  // materializationStack is NOT pushed in this path (same trade-off as the deep sync path):
  //   ctx.graph.materializationStack will always be empty for async transient-dynamic chains.
  //   Factories that inspect ctx.graph.parent should use the conventional sync binding approach.
  //
  // The function is NOT declared async so that V8 does not create an AsyncGeneratorObject and
  // an implicit Promise on every invocation; instead each level calls factoryPromise.then(cleanup)
  // which chains natively without the extra async state-machine overhead.
  private _deepAsyncCtx: DefaultResolutionContext | undefined;
  private _deepAsyncCtxPath: string[] | undefined;
  private _deepAsyncActiveLevels = 0;
  private readonly _classHasPostConstruct = new WeakMap<Constructor, boolean>();
  private readonly _classNeedsActiveContainer = new WeakMap<Constructor, boolean>();
  private readonly _classConstructorMetadata = new WeakMap<
    Constructor,
    ConstructorMetadata | null
  >();
  private readonly _activationNeedByBindingId = new Map<BindingIdentifier, boolean>();
  private _activationCacheVersion = -1;

  constructor(
    private readonly _registry: BindingRegistry,
    private readonly _scope: ScopeManager,
    private readonly _lifecycle: LifecycleManager,
    private readonly _metadataReader: MetadataReader,
    private readonly _container: Container,
    private readonly _parent: DependencyResolver | undefined,
  ) {}

  // ── Binding lookup ─────────────────────────────────────────────────────────

  private _findBinding(
    token: Token<unknown> | Constructor,
    hint: ResolveOptions | undefined,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): { binding: Binding; owner: DependencyResolver } | undefined {
    if (hint === undefined) {
      const fastDefaultBinding = this._registry.getFastDefault(token);
      if (fastDefaultBinding !== undefined) {
        return { binding: fastDefaultBinding, owner: this };
      }
    }

    if (hint?.name !== undefined && hint.tag === undefined && (hint.tags?.length ?? 0) === 0) {
      const namedBinding = this._registry.getSimpleNamed(token, hint.name);
      if (
        namedBinding !== undefined &&
        this._matchesBindingFast(namedBinding, hint, resolutionPath, materializationStack)
      ) {
        return { binding: namedBinding, owner: this };
      }
    }

    const bindings = this._registry.getAll(token);
    if (bindings.length > 0) {
      if (bindings.length === 1) {
        const onlyBinding = bindings[0]!;
        const isDefaultSlot =
          onlyBinding.slot.name === undefined && onlyBinding.slot.tags.length === 0;
        if (hint === undefined && isDefaultSlot && onlyBinding.predicate === undefined) {
          return { binding: onlyBinding, owner: this };
        }
        if (this._matchesBindingFast(onlyBinding, hint, resolutionPath, materializationStack)) {
          return { binding: onlyBinding, owner: this };
        }
      }
      const ctx = this._makeConstraintContext(resolutionPath, materializationStack, hint);
      const binding = selectBinding(bindings, hint, ctx, this._getTokenName(token));
      if (binding !== undefined) {
        return { binding, owner: this };
      }
    }
    if (this._parent !== undefined) {
      return this._parent._findBinding(token, hint, resolutionPath, materializationStack);
    }
    return undefined;
  }

  // ── Sync resolve ───────────────────────────────────────────────────────────

  resolveFromContext<const Value>(
    token: Token<Value> | Constructor<Value>,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Value {
    const fastBinding = this._registry.getFastDefault(token);
    if (fastBinding !== undefined) {
      if (fastBinding.kind === "alias") {
        return this.resolveFromContext(
          fastBinding.target as Token<Value> | Constructor<Value>,
          resolutionPath,
          materializationStack,
        );
      }
      const scope = (fastBinding as BindingWithScope).scope ?? "transient";
      if (
        scope === "transient" &&
        fastBinding.kind === "dynamic" &&
        fastBinding.onActivation === undefined &&
        (this._lifecycle.activationVersion === 0 ||
          !this._lifecycle.hasActivationHandlers(fastBinding.token))
      ) {
        return this._resolveTransientDynamicSyncFromContext(
          fastBinding as Binding<Value> & { kind: "dynamic" },
          resolutionPath,
          materializationStack,
        );
      }
      if (scope === "singleton" && this._scope.hasSingleton(fastBinding.id)) {
        return this._scope.getSingleton<Value>(fastBinding.id);
      }
      if (scope === "scoped") {
        if (!this._scope.isChild) {
          throw new MissingScopeContextError(this._getTokenName(fastBinding.token));
        }
        if (this._scope.hasScoped(fastBinding.id)) {
          return this._scope.getScoped<Value>(fastBinding.id);
        }
      }
      return this._resolveBinding(
        fastBinding as Binding<Value>,
        undefined,
        resolutionPath,
        materializationStack,
      );
    }

    return this.resolve(token, undefined, resolutionPath, materializationStack);
  }

  resolve<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint: ResolveOptions | undefined,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Value {
    const found = this._findBinding(token, hint, resolutionPath, materializationStack);

    if (found === undefined) {
      const ownBindings = this._registry.getAll(token);
      if (ownBindings.length > 0) {
        throw new NoMatchingBindingError(
          this._getTokenName(token),
          hint ?? {},
          this._getAvailableSlots(token),
        );
      }
      throw new TokenNotBoundError(this._getTokenName(token));
    }

    const { binding, owner } = found;

    // Follow alias
    if (binding.kind === "alias") {
      return this.resolve(
        binding.target as Token<Value> | Constructor<Value>,
        hint,
        resolutionPath,
        materializationStack,
      );
    }

    const scope = (binding as BindingWithScope).scope ?? "transient";

    // Singleton from a parent resolver: delegate so the parent caches it correctly
    if (scope === "singleton" && owner !== this) {
      return owner._resolveBinding(
        binding as Binding<Value>,
        hint,
        resolutionPath,
        materializationStack,
      );
    }

    // Scoped/transient (or own singleton): resolve with this resolver's container/scope
    return this._resolveBinding(
      binding as Binding<Value>,
      hint,
      resolutionPath,
      materializationStack,
    );
  }

  private _resolveBinding<const Value>(
    binding: Binding<Value>,
    hint: ResolveOptions | undefined,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Value {
    if (
      binding.kind === "constant" &&
      binding.onActivation === undefined &&
      !this._lifecycle.hasActivationHandlers(binding.token)
    ) {
      return binding.value;
    }

    const scope = (binding as BindingWithScope).scope ?? "transient";

    // Singleton cache check
    if (scope === "singleton") {
      if (this._scope.hasSingleton(binding.id)) {
        return this._scope.getSingleton<Value>(binding.id);
      }
    }

    // Scoped cache check
    if (scope === "scoped") {
      if (!this._scope.isChild) {
        throw new MissingScopeContextError(this._getTokenName(binding.token));
      }
      if (this._scope.hasScoped(binding.id)) {
        return this._scope.getScoped<Value>(binding.id);
      }
    }

    const frame = this._getMaterializationFrame(binding);
    const tName = frame.tokenName;
    const pathWithSet = resolutionPath as ResolutionPathWithSet;
    let resolutionSet = pathWithSet[RESOLUTION_SET_KEY];
    if (resolutionSet === undefined && resolutionPath.length >= RESOLUTION_SET_THRESHOLD) {
      resolutionSet = new Set<string>(resolutionPath);
      pathWithSet[RESOLUTION_SET_KEY] = resolutionSet;
    }

    // Circular dependency detection
    if (resolutionSet !== undefined ? resolutionSet.has(tName) : resolutionPath.includes(tName)) {
      const cycle = [...resolutionPath, tName];
      throw new CircularDependencyError(cycle);
    }

    resolutionPath.push(tName);
    resolutionSet?.add(tName);
    materializationStack.push(frame);
    const needsActivation = this._needsActivation(binding);
    if (!needsActivation && scope === "transient" && binding.kind === "dynamic") {
      const resolutionCtx = this._acquireSyncResolutionContext(
        resolutionPath,
        materializationStack,
        hint,
      );
      try {
        const dynamicResult = binding.factory(resolutionCtx);
        if (dynamicResult instanceof Promise) {
          throw new AsyncResolutionError(tokenName(binding.token), tokenName(binding.token));
        }
        materializationStack.pop();
        resolutionPath.pop();
        resolutionSet?.delete(tName);
        return dynamicResult;
      } catch (error) {
        materializationStack.pop();
        resolutionPath.pop();
        resolutionSet?.delete(tName);
        throw error;
      }
    }

    try {
      const needsResolutionContext = needsActivation || this._requiresResolutionContext(binding);
      const resolutionCtx = needsResolutionContext
        ? this._acquireSyncResolutionContext(resolutionPath, materializationStack, hint)
        : undefined;

      const instance = this._instantiateSync(
        binding,
        resolutionCtx,
        resolutionPath,
        materializationStack,
        hint,
      );

      let shouldActivate = needsActivation;
      if (
        binding.kind === "class" &&
        this._classHasPostConstruct.get(binding.target) === undefined
      ) {
        this._refreshClassPostConstructCache(binding.target);
        this._activationNeedByBindingId.delete(binding.id);
        shouldActivate = this._needsActivation(binding);
      }

      const activated = shouldActivate
        ? this._lifecycle.runActivationSync(
            resolutionCtx as DefaultResolutionContext,
            binding,
            instance,
            this._metadataReader,
          )
        : instance;

      // Cache by scope
      if (scope === "singleton") {
        this._scope.setSingleton(binding.id, activated);
      } else if (scope === "scoped") {
        this._scope.setScoped(binding.id, activated);
      }

      return activated;
    } finally {
      materializationStack.pop();
      resolutionPath.pop();
      resolutionSet?.delete(tName);
    }
  }

  private _instantiateSync<const Value>(
    binding: Binding<Value>,
    ctx: DefaultResolutionContext | undefined,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
    hint: ResolveOptions | undefined,
  ): Value {
    switch (binding.kind) {
      case "constant":
        return binding.value;

      case "dynamic": {
        if (ctx === undefined) {
          throw new InternalError("dynamic binding requires resolution context");
        }
        const r = binding.factory(ctx);
        if (r instanceof Promise) {
          throw new AsyncResolutionError(tokenName(binding.token), tokenName(binding.token));
        }
        return r;
      }

      case "dynamic-async":
        throw new AsyncResolutionError(tokenName(binding.token), tokenName(binding.token));

      case "class": {
        const deps = this._resolveClassDeps(binding.target, resolutionPath, materializationStack);
        const instance = this._instantiateClass(binding.target, deps);
        return instance as Value;
      }

      case "resolved": {
        const deps = this._resolveDescriptorDeps(
          binding.deps,
          resolutionPath,
          materializationStack,
          hint,
        );
        const r = binding.factory(...deps);
        if (r instanceof Promise) {
          throw new AsyncResolutionError(tokenName(binding.token), tokenName(binding.token));
        }
        return r;
      }

      case "resolved-async":
        throw new AsyncResolutionError(tokenName(binding.token), tokenName(binding.token));

      case "alias":
        throw new InternalError("alias should have been followed before instantiation");
    }
  }

  private _resolveClassDeps(
    target: Constructor,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): unknown[] {
    const meta = this._getConstructorMetadata(target);
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
      const paramHint = injectableSlotToResolveOptions(param);
      if (param.multi) {
        return [
          this.resolveAll(
            param.token as Token<unknown> | Constructor,
            paramHint,
            resolutionPath,
            materializationStack,
          ),
        ];
      }
      if (param.optional) {
        return [
          this.resolveOptional(
            param.token as Token<unknown> | Constructor,
            paramHint,
            resolutionPath,
            materializationStack,
          ),
        ];
      }
      if (paramHint === undefined) {
        return [
          this.resolveFromContext(
            param.token as Token<unknown> | Constructor,
            resolutionPath,
            materializationStack,
          ),
        ];
      }
      return [
        this.resolve(
          param.token as Token<unknown> | Constructor,
          paramHint,
          resolutionPath,
          materializationStack,
        ),
      ];
    }
    const deps = new Array<unknown>(meta.params.length);
    for (let index = 0; index < meta.params.length; index += 1) {
      const param = meta.params[index]!;
      const paramHint = injectableSlotToResolveOptions(param);
      if (param.multi) {
        deps[index] = this.resolveAll(
          param.token as Token<unknown> | Constructor,
          paramHint,
          resolutionPath,
          materializationStack,
        );
        continue;
      }
      if (param.optional) {
        deps[index] = this.resolveOptional(
          param.token as Token<unknown> | Constructor,
          paramHint,
          resolutionPath,
          materializationStack,
        );
        continue;
      }
      deps[index] =
        paramHint === undefined
          ? this.resolveFromContext(
              param.token as Token<unknown> | Constructor,
              resolutionPath,
              materializationStack,
            )
          : this.resolve(
              param.token as Token<unknown> | Constructor,
              paramHint,
              resolutionPath,
              materializationStack,
            );
    }
    return deps;
  }

  private _resolveDescriptorDeps(
    deps: readonly InjectionDescriptor[],
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
    _hint: ResolveOptions | undefined,
  ): unknown[] {
    const resolved = new Array<unknown>(deps.length);
    for (let index = 0; index < deps.length; index += 1) {
      const dep = deps[index]!;
      const depHint = injectableSlotToResolveOptions(dep);
      if (dep.multi) {
        resolved[index] = this.resolveAll(
          dep.token as Token<unknown> | Constructor,
          depHint,
          resolutionPath,
          materializationStack,
        );
        continue;
      }
      if (dep.optional) {
        resolved[index] = this.resolveOptional(
          dep.token as Token<unknown> | Constructor,
          depHint,
          resolutionPath,
          materializationStack,
        );
        continue;
      }
      resolved[index] =
        depHint === undefined
          ? this.resolveFromContext(
              dep.token as Token<unknown> | Constructor,
              resolutionPath,
              materializationStack,
            )
          : this.resolve(
              dep.token as Token<unknown> | Constructor,
              depHint,
              resolutionPath,
              materializationStack,
            );
    }
    return resolved;
  }

  resolveOptional<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint: ResolveOptions | undefined,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Value | undefined {
    try {
      return this.resolve(token, hint, resolutionPath, materializationStack);
    } catch (e) {
      if (e instanceof TokenNotBoundError || e instanceof NoMatchingBindingError) {
        return undefined;
      }
      throw e;
    }
  }

  resolveAll<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint: ResolveOptions | undefined,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Value[] {
    if (hint?.name !== undefined && hint.tag === undefined && (hint.tags?.length ?? 0) === 0) {
      const namedCandidates = this._getSimpleNamedBindingsFromChain(token, hint.name);
      if (namedCandidates.length === 0) {
        return [];
      }
      const resolved = new Array<Value>(namedCandidates.length);
      for (let index = 0; index < namedCandidates.length; index += 1) {
        resolved[index] = this._resolveCandidateSync(
          namedCandidates[index] as Binding<Value>,
          hint,
          resolutionPath,
          materializationStack,
        );
      }
      return resolved;
    }

    const allBindings = this._getAllBindingsFromChain(token);
    if (allBindings.length === 0) {
      return [];
    }

    const ctx = this._makeConstraintContext(resolutionPath, materializationStack, hint);
    const candidates = selectAllBindings(allBindings, hint, ctx);

    const resolved = new Array<Value>(candidates.length);
    for (let index = 0; index < candidates.length; index += 1) {
      resolved[index] = this._resolveCandidateSync(
        candidates[index] as Binding<Value>,
        hint,
        resolutionPath,
        materializationStack,
      );
    }
    return resolved;
  }

  // ── Async resolve ──────────────────────────────────────────────────────────

  resolveAsyncFromContext<const Value>(
    token: Token<Value> | Constructor<Value>,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Promise<Value> {
    const fastBinding = this._registry.getFastDefault(token);
    if (fastBinding !== undefined) {
      if (fastBinding.kind === "alias") {
        return this.resolveAsyncFromContext(
          fastBinding.target as Token<Value> | Constructor<Value>,
          resolutionPath,
          materializationStack,
        );
      }
      const scope = (fastBinding as BindingWithScope).scope ?? "transient";
      if (
        scope === "transient" &&
        (fastBinding.kind === "dynamic" || fastBinding.kind === "dynamic-async") &&
        fastBinding.onActivation === undefined &&
        (this._lifecycle.activationVersion === 0 ||
          !this._lifecycle.hasActivationHandlers(fastBinding.token))
      ) {
        return this._resolveTransientDynamicAsyncFromContext(
          fastBinding as Binding<Value> & { kind: "dynamic" | "dynamic-async" },
          resolutionPath,
          materializationStack,
        );
      }
      if (scope === "singleton" && this._scope.hasSingleton(fastBinding.id)) {
        return Promise.resolve(this._scope.getSingleton<Value>(fastBinding.id));
      }
      if (scope === "scoped") {
        if (!this._scope.isChild) {
          return Promise.reject(
            new MissingScopeContextError(this._getTokenName(fastBinding.token)),
          );
        }
        if (this._scope.hasScoped(fastBinding.id)) {
          return Promise.resolve(this._scope.getScoped<Value>(fastBinding.id));
        }
      }
      return this._resolveBindingAsync(
        fastBinding as Binding<Value>,
        undefined,
        resolutionPath,
        materializationStack,
      );
    }

    return this.resolveAsync(token, undefined, resolutionPath, materializationStack);
  }

  async resolveAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint: ResolveOptions | undefined,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Promise<Value> {
    const found = this._findBinding(token, hint, resolutionPath, materializationStack);

    if (found === undefined) {
      const ownBindings = this._registry.getAll(token);
      if (ownBindings.length > 0) {
        throw new NoMatchingBindingError(
          this._getTokenName(token),
          hint ?? {},
          this._getAvailableSlots(token),
        );
      }
      throw new TokenNotBoundError(this._getTokenName(token));
    }

    const { binding, owner } = found;

    if (binding.kind === "alias") {
      return this.resolveAsync(
        binding.target as Token<Value> | Constructor<Value>,
        hint,
        resolutionPath,
        materializationStack,
      );
    }

    const scope = (binding as BindingWithScope).scope ?? "transient";

    if (scope === "singleton" && owner !== this) {
      return owner._resolveBindingAsync(
        binding as Binding<Value>,
        hint,
        resolutionPath,
        materializationStack,
      );
    }

    return this._resolveBindingAsync(
      binding as Binding<Value>,
      hint,
      resolutionPath,
      materializationStack,
    );
  }

  private async _resolveBindingAsync<const Value>(
    binding: Binding<Value>,
    hint: ResolveOptions | undefined,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Promise<Value> {
    if (
      binding.kind === "constant" &&
      binding.onActivation === undefined &&
      !this._lifecycle.hasActivationHandlers(binding.token)
    ) {
      return binding.value;
    }

    const scope = (binding as BindingWithScope).scope ?? "transient";

    // Singleton cache
    if (scope === "singleton") {
      if (this._scope.hasSingleton(binding.id)) {
        return this._scope.getSingleton<Value>(binding.id);
      }
      // In-flight dedup
      const inflight = this._scope.getInflight(binding.id);
      if (inflight !== undefined) {
        return inflight as Promise<Value>;
      }
    }

    // Scoped cache
    if (scope === "scoped") {
      if (!this._scope.isChild) {
        throw new MissingScopeContextError(this._getTokenName(binding.token));
      }
      if (this._scope.hasScoped(binding.id)) {
        return this._scope.getScoped<Value>(binding.id);
      }
    }

    const frame = this._getMaterializationFrame(binding);
    const tName = frame.tokenName;
    const pathWithSet = resolutionPath as ResolutionPathWithSet;
    let resolutionSet = pathWithSet[RESOLUTION_SET_KEY];
    if (resolutionSet === undefined && resolutionPath.length >= RESOLUTION_SET_THRESHOLD) {
      resolutionSet = new Set<string>(resolutionPath);
      pathWithSet[RESOLUTION_SET_KEY] = resolutionSet;
    }

    if (resolutionSet !== undefined ? resolutionSet.has(tName) : resolutionPath.includes(tName)) {
      throw new CircularDependencyError([...resolutionPath, tName]);
    }

    resolutionPath.push(tName);
    resolutionSet?.add(tName);
    materializationStack.push(frame);
    const needsActivation = this._needsActivation(binding);
    if (
      !needsActivation &&
      scope === "transient" &&
      (binding.kind === "dynamic" || binding.kind === "dynamic-async")
    ) {
      const resolutionCtx = new DefaultResolutionContext(
        this as unknown as ResolverCallbacks,
        resolutionPath,
        materializationStack,
        hint,
      );
      try {
        if (binding.kind === "dynamic-async") {
          return await binding.factory(resolutionCtx);
        }
        const dynamicResult = binding.factory(resolutionCtx);
        return dynamicResult instanceof Promise ? await dynamicResult : dynamicResult;
      } finally {
        materializationStack.pop();
        resolutionPath.pop();
        resolutionSet?.delete(tName);
      }
    }

    const needsResolutionContext = needsActivation || this._requiresResolutionContext(binding);
    const resolutionCtx = needsResolutionContext
      ? new DefaultResolutionContext(
          this as unknown as ResolverCallbacks,
          resolutionPath,
          materializationStack,
          hint,
        )
      : undefined;

    try {
      if (scope === "singleton") {
        const createSingletonPromise = async (): Promise<Value> => {
          const instance = await this._instantiateAsync(
            binding,
            resolutionCtx,
            resolutionPath,
            materializationStack,
            hint,
          );

          let shouldActivate = needsActivation;
          if (
            binding.kind === "class" &&
            this._classHasPostConstruct.get(binding.target) === undefined
          ) {
            this._refreshClassPostConstructCache(binding.target);
            this._activationNeedByBindingId.delete(binding.id);
            shouldActivate = this._needsActivation(binding);
          }

          const activated = shouldActivate
            ? await this._lifecycle.runActivation(
                resolutionCtx as DefaultResolutionContext,
                binding,
                instance,
                this._metadataReader,
              )
            : instance;

          this._scope.setSingleton(binding.id, activated);
          this._scope.clearInflight(binding.id);
          return activated;
        };

        const p = createSingletonPromise().catch((err: unknown) => {
          this._scope.clearInflight(binding.id);
          throw err;
        });
        this._scope.setInflight(binding.id, p as Promise<unknown>);
        return await p;
      }

      const instance = await this._instantiateAsync(
        binding,
        resolutionCtx,
        resolutionPath,
        materializationStack,
        hint,
      );

      let shouldActivate = needsActivation;
      if (
        binding.kind === "class" &&
        this._classHasPostConstruct.get(binding.target) === undefined
      ) {
        this._refreshClassPostConstructCache(binding.target);
        this._activationNeedByBindingId.delete(binding.id);
        shouldActivate = this._needsActivation(binding);
      }

      const activated = shouldActivate
        ? await this._lifecycle.runActivation(
            resolutionCtx as DefaultResolutionContext,
            binding,
            instance,
            this._metadataReader,
          )
        : instance;

      if (scope === "scoped") {
        this._scope.setScoped(binding.id, activated);
      }

      return activated;
    } finally {
      materializationStack.pop();
      resolutionPath.pop();
      resolutionSet?.delete(tName);
    }
  }

  private async _instantiateAsync<const Value>(
    binding: Binding<Value>,
    ctx: DefaultResolutionContext | undefined,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
    hint: ResolveOptions | undefined,
  ): Promise<Value> {
    switch (binding.kind) {
      case "constant":
        return binding.value;

      case "dynamic": {
        if (ctx === undefined) {
          throw new InternalError("dynamic binding requires resolution context");
        }
        const r = binding.factory(ctx);
        return r instanceof Promise ? r : Promise.resolve(r);
      }

      case "dynamic-async":
        if (ctx === undefined) {
          throw new InternalError("dynamic-async binding requires resolution context");
        }
        return binding.factory(ctx);

      case "class": {
        const deps = await this._resolveClassDepsAsync(
          binding.target,
          resolutionPath,
          materializationStack,
        );
        const instance = this._instantiateClass(binding.target, deps);
        return instance as Value;
      }

      case "resolved": {
        if (ctx === undefined) {
          throw new InternalError("resolved binding requires resolution context");
        }
        const deps = await this._resolveDescriptorDepsAsync(
          binding.deps,
          resolutionPath,
          materializationStack,
          hint,
        );
        const r = binding.factory(...deps);
        return r instanceof Promise ? r : Promise.resolve(r);
      }

      case "resolved-async": {
        const deps = await this._resolveDescriptorDepsAsync(
          binding.deps,
          resolutionPath,
          materializationStack,
          hint,
        );
        return binding.factory(...deps);
      }

      case "alias":
        throw new InternalError("alias should have been followed before instantiation");
    }
  }

  private async _resolveClassDepsAsync(
    target: Constructor,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Promise<unknown[]> {
    const meta = this._getConstructorMetadata(target);
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
      const paramHint = injectableSlotToResolveOptions(param);
      if (param.multi) {
        return [
          await this.resolveAllAsync(
            param.token as Token<unknown> | Constructor,
            paramHint,
            resolutionPath,
            materializationStack,
          ),
        ];
      }
      if (param.optional) {
        return [
          await this.resolveOptionalAsync(
            param.token as Token<unknown> | Constructor,
            paramHint,
            resolutionPath,
            materializationStack,
          ),
        ];
      }
      if (paramHint === undefined) {
        return [
          await this.resolveAsyncFromContext(
            param.token as Token<unknown> | Constructor,
            resolutionPath,
            materializationStack,
          ),
        ];
      }
      return [
        await this.resolveAsync(
          param.token as Token<unknown> | Constructor,
          paramHint,
          resolutionPath,
          materializationStack,
        ),
      ];
    }
    const pending = new Array<Promise<unknown>>(meta.params.length);
    const shouldCloneContext = meta.params.length > 1;
    for (let index = 0; index < meta.params.length; index += 1) {
      const param = meta.params[index]!;
      const paramHint = injectableSlotToResolveOptions(param);
      if (param.multi) {
        pending[index] = this.resolveAllAsync(
          param.token as Token<unknown> | Constructor,
          paramHint,
          shouldCloneContext ? [...resolutionPath] : resolutionPath,
          shouldCloneContext ? [...materializationStack] : materializationStack,
        );
      } else if (param.optional) {
        pending[index] = this.resolveOptionalAsync(
          param.token as Token<unknown> | Constructor,
          paramHint,
          shouldCloneContext ? [...resolutionPath] : resolutionPath,
          shouldCloneContext ? [...materializationStack] : materializationStack,
        );
      } else {
        pending[index] =
          paramHint === undefined
            ? this.resolveAsyncFromContext(
                param.token as Token<unknown> | Constructor,
                shouldCloneContext ? [...resolutionPath] : resolutionPath,
                shouldCloneContext ? [...materializationStack] : materializationStack,
              )
            : this.resolveAsync(
                param.token as Token<unknown> | Constructor,
                paramHint,
                shouldCloneContext ? [...resolutionPath] : resolutionPath,
                shouldCloneContext ? [...materializationStack] : materializationStack,
              );
      }
    }
    return Promise.all(pending);
  }

  private async _resolveDescriptorDepsAsync(
    deps: readonly InjectionDescriptor[],
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
    _hint: ResolveOptions | undefined,
  ): Promise<unknown[]> {
    const pending = new Array<Promise<unknown>>(deps.length);
    const shouldCloneContext = deps.length > 1;
    for (let index = 0; index < deps.length; index += 1) {
      const dep = deps[index]!;
      const depHint = injectableSlotToResolveOptions(dep);
      if (dep.multi) {
        pending[index] = this.resolveAllAsync(
          dep.token as Token<unknown> | Constructor,
          depHint,
          shouldCloneContext ? [...resolutionPath] : resolutionPath,
          shouldCloneContext ? [...materializationStack] : materializationStack,
        );
      } else if (dep.optional) {
        pending[index] = this.resolveOptionalAsync(
          dep.token as Token<unknown> | Constructor,
          depHint,
          shouldCloneContext ? [...resolutionPath] : resolutionPath,
          shouldCloneContext ? [...materializationStack] : materializationStack,
        );
      } else {
        pending[index] =
          depHint === undefined
            ? this.resolveAsyncFromContext(
                dep.token as Token<unknown> | Constructor,
                shouldCloneContext ? [...resolutionPath] : resolutionPath,
                shouldCloneContext ? [...materializationStack] : materializationStack,
              )
            : this.resolveAsync(
                dep.token as Token<unknown> | Constructor,
                depHint,
                shouldCloneContext ? [...resolutionPath] : resolutionPath,
                shouldCloneContext ? [...materializationStack] : materializationStack,
              );
      }
    }
    return Promise.all(pending);
  }

  async resolveOptionalAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint: ResolveOptions | undefined,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Promise<Value | undefined> {
    try {
      return await this.resolveAsync(token, hint, resolutionPath, materializationStack);
    } catch (e) {
      if (e instanceof TokenNotBoundError || e instanceof NoMatchingBindingError) {
        return undefined;
      }
      throw e;
    }
  }

  async resolveAllAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint: ResolveOptions | undefined,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Promise<Value[]> {
    if (hint?.name !== undefined && hint.tag === undefined && (hint.tags?.length ?? 0) === 0) {
      const namedCandidates = this._getSimpleNamedBindingsFromChain(token, hint.name);
      if (namedCandidates.length === 0) {
        return [];
      }
      const pending = new Array<Promise<Value>>(namedCandidates.length);
      for (let index = 0; index < namedCandidates.length; index += 1) {
        pending[index] = this._resolveCandidateAsync(
          namedCandidates[index] as Binding<Value>,
          hint,
          resolutionPath,
          materializationStack,
        );
      }
      return Promise.all(pending);
    }

    const allBindings = this._getAllBindingsFromChain(token);
    if (allBindings.length === 0) {
      return [];
    }

    const ctx = this._makeConstraintContext(resolutionPath, materializationStack, hint);
    const candidates = selectAllBindings(allBindings, hint, ctx);

    const pending = new Array<Promise<Value>>(candidates.length);
    for (let index = 0; index < candidates.length; index += 1) {
      pending[index] = this._resolveCandidateAsync(
        candidates[index] as Binding<Value>,
        hint,
        resolutionPath,
        materializationStack,
      );
    }
    return Promise.all(pending);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private _getAllBindingsFromChain(token: Token<unknown> | Constructor): readonly Binding[] {
    const ownBindings = this._registry.getAll(token);
    if (this._parent === undefined) {
      return ownBindings;
    }
    const result: Binding[] = [...ownBindings];
    let current: DependencyResolver | undefined = this._parent;
    while (current !== undefined) {
      const own = current._registry.getAll(token);
      if (own.length > 0) {
        result.push(...own);
      }
      current = current._parent;
    }
    return result;
  }

  private _getSimpleNamedBindingsFromChain(
    token: Token<unknown> | Constructor,
    name: string,
  ): Binding[] {
    const ownBinding = this._registry.getSimpleNamed(token, name);
    if (this._parent === undefined) {
      return ownBinding !== undefined ? [ownBinding] : [];
    }
    const result: Binding[] = [];
    if (ownBinding !== undefined) {
      result.push(ownBinding);
    }
    let current: DependencyResolver | undefined = this._parent;
    while (current !== undefined) {
      const binding = current._registry.getSimpleNamed(token, name);
      if (binding !== undefined) {
        result.push(binding);
      }
      current = current._parent;
    }
    return result;
  }

  private _getAvailableSlots(token: Token<unknown> | Constructor): string[] {
    return this._registry.availableSlotStrings(token);
  }

  private _makeConstraintContext(
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
    hint: ResolveOptions | undefined,
  ) {
    if (hint === undefined && resolutionPath.length === 0 && materializationStack.length === 0) {
      return ROOT_CONSTRAINT_CONTEXT;
    }
    const parent = materializationStack.at(-1);
    const ancestors =
      materializationStack.length > 1
        ? materializationStack.slice(0, -1)
        : ([] as MaterializationFrame[]);
    return {
      resolutionPath,
      materializationStack,
      parent,
      ancestors,
      currentResolveHint: hint,
    };
  }

  private _matchesBindingFast(
    binding: Binding,
    hint: ResolveOptions | undefined,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): boolean {
    if (!this._matchesSlotFast(binding.slot, hint)) {
      return false;
    }
    if (binding.predicate === undefined) {
      return true;
    }
    const ctx = this._makeConstraintContext(resolutionPath, materializationStack, hint);
    return binding.predicate(ctx);
  }

  private _matchesSlotFast(slot: SlotKey, hint: ResolveOptions | undefined): boolean {
    const hintName = hint?.name;
    const hintTags = hint?.tags;
    const singleHintTag = hint?.tag;
    const hasHintTags = (hintTags?.length ?? 0) > 0 || singleHintTag !== undefined;

    if (slot.name !== undefined) {
      if (hintName === undefined || slot.name !== hintName) {
        return false;
      }
    } else if (hintName !== undefined) {
      return false;
    }

    if (slot.tags.length > 0) {
      if (!hasHintTags) {
        return false;
      }
      for (const [tagKey, tagValue] of slot.tags) {
        if (!this._matchesHintTag(tagKey, tagValue, hintTags, singleHintTag)) {
          return false;
        }
      }
    } else if (hasHintTags) {
      return false;
    }

    return true;
  }

  private _getTokenName(token: Token<unknown> | Constructor): string {
    return tokenName(token);
  }

  private _getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
    const cached = this._classConstructorMetadata.get(target);
    if (cached !== undefined) {
      return cached === null ? undefined : cached;
    }
    const metadata = this._metadataReader.getConstructorMetadata(target);
    this._classConstructorMetadata.set(target, metadata ?? null);
    return metadata;
  }

  private _instantiateClass(target: Constructor, deps: unknown[]): unknown {
    let needsActiveContainer = this._classNeedsActiveContainer.get(target);
    if (needsActiveContainer === undefined) {
      const accessorMetadata = (
        this._metadataReader as {
          getAccessorMetadata?: (
            targetConstructor: Constructor,
          ) => ReadonlyArray<{ key: string | symbol; descriptor: InjectionDescriptor }> | undefined;
        }
      ).getAccessorMetadata?.(target);
      needsActiveContainer = (accessorMetadata?.length ?? 0) > 0;
      this._classNeedsActiveContainer.set(target, needsActiveContainer);
    }
    const invokable = target as ConstructorInvocation;
    if (!needsActiveContainer) {
      return new invokable(...deps);
    }
    return runWithContainer(this._container, () => new invokable(...deps));
  }

  private _matchesHintTag(
    tagKey: string,
    tagValue: unknown,
    hintTags: ReadonlyArray<readonly [string, unknown]> | undefined,
    singleHintTag: readonly [string, unknown] | undefined,
  ): boolean {
    if (
      singleHintTag !== undefined &&
      singleHintTag[0] === tagKey &&
      Object.is(singleHintTag[1], tagValue)
    ) {
      return true;
    }
    if (hintTags === undefined || hintTags.length === 0) {
      return false;
    }
    for (let index = 0; index < hintTags.length; index += 1) {
      const hintTag = hintTags[index]!;
      if (hintTag[0] === tagKey && Object.is(hintTag[1], tagValue)) {
        return true;
      }
    }
    return false;
  }

  private _resolveTransientDynamicSyncFromContext<const Value>(
    binding: Binding<Value> & { kind: "dynamic" },
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Value {
    // ── Shallow path (depth < RESOLUTION_SET_THRESHOLD) ──────────────────────────────────
    // Use resolutionPath.includes for cycle detection: for tiny arrays (depth 0–31) this is
    // faster than a Set lookup. Keep materializationStack push/pop and the per-depth pool so
    // ctx.graph reflects correct state for shallow-chain factories.
    if (resolutionPath.length < RESOLUTION_SET_THRESHOLD) {
      const frame = this._getMaterializationFrame(binding);
      const tName = frame.tokenName;
      if (resolutionPath.includes(tName)) {
        throw new CircularDependencyError([...resolutionPath, tName]);
      }
      resolutionPath.push(tName);
      materializationStack.push(frame);
      const resolutionCtx = this._acquireSyncResolutionContext(
        resolutionPath,
        materializationStack,
        undefined,
      );
      try {
        const dynamicResult = binding.factory(resolutionCtx);
        if (dynamicResult instanceof Promise) {
          throw new AsyncResolutionError(tName, tName);
        }
        return dynamicResult;
      } finally {
        materializationStack.pop();
        resolutionPath.pop();
      }
    }

    // ── Deep path (depth >= RESOLUTION_SET_THRESHOLD) ────────────────────────────────────
    // At this depth the O(N) array scan becomes expensive.  Switch to a class-level
    // Set<BindingIdentifier> for O(1) cycle detection.
    //
    // Performance decisions vs. shallow path:
    //  1. _getMaterializationFrame is NOT called: tName is only needed for resolutionPath.push
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
    if (this._deepActiveLevels > 0 && this._deepSyncCtxPath !== resolutionPath) {
      return this._resolveTransientDynamicSyncSlow(binding, resolutionPath, materializationStack);
    }

    // First deep level: bump the generation (implicitly clearing all stale cycle marks from
    // previous chains), seed the marks with the shallow-path frames already on the
    // materialization stack, then initialise (or reset) the shared context once for the
    // whole deep chain.
    if (this._deepActiveLevels === 0) {
      const gen = ++this._deepCycleGen;
      for (const stackFrame of materializationStack) {
        this._deepCycleMarks.set(stackFrame.bindingId, gen);
      }
      let ctx = this._deepSyncCtx;
      if (ctx === undefined) {
        ctx = new DefaultResolutionContext(
          this as unknown as ResolverCallbacks,
          resolutionPath,
          materializationStack,
          undefined,
        );
        this._deepSyncCtx = ctx;
      } else {
        ctx.reset(
          this as unknown as ResolverCallbacks,
          resolutionPath,
          materializationStack,
          undefined,
        );
      }
      this._deepSyncCtxPath = resolutionPath;
    }

    if (this._deepCycleMarks.get(binding.id) === this._deepCycleGen) {
      throw new CircularDependencyError([...resolutionPath, tokenName(binding.token)]);
    }

    this._deepCycleMarks.set(binding.id, this._deepCycleGen);
    this._deepActiveLevels++;

    try {
      // Use the pre-initialised context directly — no local variable needed.
      const dynamicResult = binding.factory(this._deepSyncCtx!);
      if (dynamicResult instanceof Promise) {
        throw new AsyncResolutionError(tokenName(binding.token), tokenName(binding.token));
      }
      return dynamicResult;
    } finally {
      // No Map.delete needed: the generation counter makes old marks invisible.
      // Only reset the path pointer when the last deep level unwinds.
      if (--this._deepActiveLevels === 0) {
        this._deepSyncCtxPath = undefined;
      }
    }
  }

  private _resolveTransientDynamicSyncSlow<const Value>(
    binding: Binding<Value> & { kind: "dynamic" },
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Value {
    // Rare fallback used when deep-chain reentrancy is detected (a factory called
    // container.resolve() directly and the resulting chain also reached the threshold).
    const frame = this._getMaterializationFrame(binding);
    const tName = frame.tokenName;
    const pathWithSet = resolutionPath as ResolutionPathWithSet;
    let resolutionSet = pathWithSet[RESOLUTION_SET_KEY];
    if (resolutionSet === undefined) {
      resolutionSet = new Set<string>(resolutionPath);
      pathWithSet[RESOLUTION_SET_KEY] = resolutionSet;
    }
    if (resolutionSet.has(tName)) {
      throw new CircularDependencyError([...resolutionPath, tName]);
    }
    resolutionPath.push(tName);
    resolutionSet.add(tName);
    materializationStack.push(frame);
    const resolutionCtx = this._acquireSyncResolutionContext(
      resolutionPath,
      materializationStack,
      undefined,
    );
    try {
      const dynamicResult = binding.factory(resolutionCtx);
      if (dynamicResult instanceof Promise) {
        throw new AsyncResolutionError(tName, tName);
      }
      return dynamicResult;
    } finally {
      materializationStack.pop();
      resolutionPath.pop();
      resolutionSet.delete(tName);
    }
  }

  // NOT declared `async` — avoids creating a JSAsyncGeneratorObject + implicit Promise wrapper on
  // every invocation.  Cleanup is handled via .then(onFulfilled, onRejected) so the behaviour is
  // identical to a try/finally but without the async machinery overhead.
  private _resolveTransientDynamicAsyncFromContext<const Value>(
    binding: Binding<Value> & { kind: "dynamic" | "dynamic-async" },
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Promise<Value> {
    // ── Shallow async path (depth < RESOLUTION_SET_THRESHOLD) ─────────────────────────────
    // For the common case of a sequential async chain (each factory awaits one dependency at a
    // time), all levels share the same resolutionPath/materializationStack arrays.  A single
    // DefaultResolutionContext can therefore serve the entire chain:
    //   • levels 2-N of the owning chain: zero allocation, zero reset writes
    //   • concurrent chains (Promise.all roots): detected by path-identity mismatch → fallback
    //     to a fresh DefaultResolutionContext for that level only
    // materializationStack is NOT pushed here — see class-level comment for the trade-off.
    if (resolutionPath.length < RESOLUTION_SET_THRESHOLD) {
      const tName = tokenName(binding.token);
      if (resolutionPath.includes(tName)) {
        return Promise.reject(new CircularDependencyError([...resolutionPath, tName]));
      }

      resolutionPath.push(tName);

      // Determine which context to use and whether this level owns the shared context.
      let ctx: DefaultResolutionContext;
      let isOwnerLevel: boolean;
      if (this._deepAsyncCtxPath === resolutionPath) {
        // Inner level of the owning chain — reuse the shared context with NO setup overhead.
        ctx = this._deepAsyncCtx!;
        isOwnerLevel = true;
      } else if (this._deepAsyncCtxPath === undefined) {
        // Root of a new chain — take ownership and initialise (or reset) the shared context.
        const existing = this._deepAsyncCtx;
        if (existing === undefined) {
          ctx = new DefaultResolutionContext(
            this as unknown as ResolverCallbacks,
            resolutionPath,
            materializationStack,
            undefined,
          );
          this._deepAsyncCtx = ctx;
        } else {
          existing.reset(
            this as unknown as ResolverCallbacks,
            resolutionPath,
            materializationStack,
            undefined,
          );
          ctx = existing;
        }
        this._deepAsyncCtxPath = resolutionPath;
        isOwnerLevel = true;
      } else {
        // Concurrent chain (e.g. Promise.all) — allocate a dedicated context and do NOT
        // interfere with the owning chain's state.
        ctx = new DefaultResolutionContext(
          this as unknown as ResolverCallbacks,
          resolutionPath,
          materializationStack,
          undefined,
        );
        isOwnerLevel = false;
      }

      if (isOwnerLevel) {
        this._deepAsyncActiveLevels++;
      }

      // Invoke the factory synchronously to get its Promise (or a resolved value for "dynamic").
      let factoryPromise: Promise<Value>;
      try {
        if (binding.kind === "dynamic-async") {
          factoryPromise = binding.factory(ctx);
        } else {
          const r = binding.factory(ctx);
          factoryPromise = r instanceof Promise ? (r as Promise<Value>) : Promise.resolve(r);
        }
      } catch (err) {
        // Synchronous throw from the factory (rare) — clean up immediately.
        resolutionPath.pop();
        if (isOwnerLevel && --this._deepAsyncActiveLevels === 0) {
          this._deepAsyncCtxPath = undefined;
        }
        return Promise.reject(err);
      }

      // Chain cleanup onto the Promise so it runs whether the factory resolves or rejects.
      return factoryPromise.then(
        (value) => {
          resolutionPath.pop();
          if (isOwnerLevel && --this._deepAsyncActiveLevels === 0) {
            this._deepAsyncCtxPath = undefined;
          }
          return value;
        },
        (err: unknown) => {
          resolutionPath.pop();
          if (isOwnerLevel && --this._deepAsyncActiveLevels === 0) {
            this._deepAsyncCtxPath = undefined;
          }
          // Re-throw as the rejected value; the `never` cast suppresses the TS return-type
          // mismatch that arises because `throw` has type `never` in an expression context.
          throw err as never;
        },
      );
    }

    // ── Deep async path (depth ≥ RESOLUTION_SET_THRESHOLD) ────────────────────────────────
    // Fall back to the fully-correct slow implementation.
    return this._resolveTransientDynamicAsyncSlow(binding, resolutionPath, materializationStack);
  }

  private async _resolveTransientDynamicAsyncSlow<const Value>(
    binding: Binding<Value> & { kind: "dynamic" | "dynamic-async" },
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Promise<Value> {
    const frame = this._getMaterializationFrame(binding);
    const tName = frame.tokenName;
    const pathWithSet = resolutionPath as ResolutionPathWithSet;
    let resolutionSet = pathWithSet[RESOLUTION_SET_KEY];
    if (resolutionSet === undefined) {
      resolutionSet = new Set<string>(resolutionPath);
      pathWithSet[RESOLUTION_SET_KEY] = resolutionSet;
    }
    if (resolutionSet.has(tName)) {
      throw new CircularDependencyError([...resolutionPath, tName]);
    }
    resolutionPath.push(tName);
    resolutionSet.add(tName);
    materializationStack.push(frame);
    const resolutionCtx = new DefaultResolutionContext(
      this as unknown as ResolverCallbacks,
      resolutionPath,
      materializationStack,
      undefined,
    );
    try {
      if (binding.kind === "dynamic-async") {
        return await binding.factory(resolutionCtx);
      }
      const dynamicResult = binding.factory(resolutionCtx);
      return dynamicResult instanceof Promise ? await dynamicResult : dynamicResult;
    } finally {
      materializationStack.pop();
      resolutionPath.pop();
      resolutionSet.delete(tName);
    }
  }

  private _resolveCandidateSync<const Value>(
    binding: Binding<Value>,
    hint: ResolveOptions | undefined,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Value {
    if (
      binding.kind === "constant" &&
      binding.onActivation === undefined &&
      !this._lifecycle.hasActivationHandlers(binding.token)
    ) {
      return binding.value;
    }
    if (binding.kind === "alias") {
      return this.resolve(
        binding.target as Token<Value> | Constructor<Value>,
        hint,
        resolutionPath,
        materializationStack,
      );
    }
    const scope = (binding as BindingWithScope).scope ?? "transient";
    if (scope === "singleton" && this._scope.hasSingleton(binding.id)) {
      return this._scope.getSingleton<Value>(binding.id);
    }
    if (scope === "scoped") {
      if (!this._scope.isChild) {
        throw new MissingScopeContextError(this._getTokenName(binding.token));
      }
      if (this._scope.hasScoped(binding.id)) {
        return this._scope.getScoped<Value>(binding.id);
      }
    }
    return this._resolveBinding(binding, hint, resolutionPath, materializationStack);
  }

  private _resolveCandidateAsync<const Value>(
    binding: Binding<Value>,
    hint: ResolveOptions | undefined,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
  ): Promise<Value> {
    if (
      binding.kind === "constant" &&
      binding.onActivation === undefined &&
      !this._lifecycle.hasActivationHandlers(binding.token)
    ) {
      return Promise.resolve(binding.value);
    }
    const isolatedPath = [...resolutionPath];
    const isolatedStack = [...materializationStack];
    if (binding.kind === "alias") {
      return this.resolveAsync(
        binding.target as Token<Value> | Constructor<Value>,
        hint,
        isolatedPath,
        isolatedStack,
      );
    }
    const scope = (binding as BindingWithScope).scope ?? "transient";
    if (scope === "singleton" && this._scope.hasSingleton(binding.id)) {
      return Promise.resolve(this._scope.getSingleton<Value>(binding.id));
    }
    if (scope === "scoped") {
      if (!this._scope.isChild) {
        return Promise.reject(new MissingScopeContextError(this._getTokenName(binding.token)));
      }
      if (this._scope.hasScoped(binding.id)) {
        return Promise.resolve(this._scope.getScoped<Value>(binding.id));
      }
    }
    return this._resolveBindingAsync(binding, hint, isolatedPath, isolatedStack);
  }

  private _getMaterializationFrame<const Value>(binding: Binding<Value>): MaterializationFrame {
    const existing = this._frameByBindingId.get(binding.id);
    if (existing !== undefined) {
      return existing;
    }
    const scope = (binding as BindingWithScope).scope ?? "transient";
    const frame = buildMaterializationFrame(
      tokenName(binding.token),
      scope,
      binding.id,
      binding.kind,
      binding.slot,
    );
    this._frameByBindingId.set(binding.id, frame);
    return frame;
  }

  private _needsActivation<const Value>(binding: Binding<Value>): boolean {
    const lifecycleVersion = this._lifecycle.activationVersion;
    if (
      lifecycleVersion === 0 &&
      binding.kind !== "class" &&
      binding.kind !== "alias" &&
      binding.onActivation === undefined
    ) {
      return false;
    }
    if (this._activationCacheVersion !== lifecycleVersion) {
      this._activationNeedByBindingId.clear();
      this._activationCacheVersion = lifecycleVersion;
    }

    const cached = this._activationNeedByBindingId.get(binding.id);
    if (cached !== undefined) {
      return cached;
    }

    if (binding.kind === "class") {
      let hasActivation =
        this._lifecycle.hasActivationHandlers(binding.token) || binding.onActivation !== undefined;
      const cachedPostConstruct = this._classHasPostConstruct.get(binding.target);
      // Unknown class lifecycle metadata: activate once, then cache after first instantiation.
      if (cachedPostConstruct === undefined) {
        hasActivation = true;
      } else if (cachedPostConstruct) {
        hasActivation = true;
      }
      this._activationNeedByBindingId.set(binding.id, hasActivation);
      return hasActivation;
    }

    let hasActivation = false;
    if (binding.kind !== "alias" && binding.onActivation !== undefined) {
      hasActivation = true;
    } else if (this._lifecycle.hasActivationHandlers(binding.token)) {
      hasActivation = true;
    }

    this._activationNeedByBindingId.set(binding.id, hasActivation);
    return hasActivation;
  }

  private _refreshClassPostConstructCache(target: Constructor): void {
    const lifecycle = this._metadataReader.getLifecycleMetadata(target);
    const hasPostConstruct =
      lifecycle !== undefined &&
      lifecycle.postConstruct !== undefined &&
      lifecycle.postConstruct.length > 0;
    this._classHasPostConstruct.set(target, hasPostConstruct);
  }

  private _requiresResolutionContext<const Value>(binding: Binding<Value>): boolean {
    return binding.kind === "dynamic" || binding.kind === "dynamic-async";
  }

  private _acquireSyncResolutionContext(
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
    hint: ResolveOptions | undefined,
  ): DefaultResolutionContext {
    const depth = materializationStack.length;
    const existing = this._syncResolutionContextPool[depth];
    if (existing !== undefined) {
      existing.reset(
        this as unknown as ResolverCallbacks,
        resolutionPath,
        materializationStack,
        hint,
      );
      return existing;
    }
    const created = new DefaultResolutionContext(
      this as unknown as ResolverCallbacks,
      resolutionPath,
      materializationStack,
      hint,
    );
    this._syncResolutionContextPool[depth] = created;
    return created;
  }
}
