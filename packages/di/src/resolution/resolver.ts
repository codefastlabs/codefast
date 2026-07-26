import type { Binding, BindingSlot } from "#/binding";
import { NO_INSTANCE } from "#/binding";
import type { Container } from "#/container/container";
import type { InjectionDescriptor } from "#/decorators/inject";
import {
  AsyncActivationError,
  AsyncResolutionError,
  CircularDependencyError,
  InternalError,
  MissingMetadataError,
  MissingScopeContextError,
  NoMatchingBindingError,
  TokenNotBoundError,
} from "#/errors";
import type { MetadataReader } from "#/metadata/metadata-types";
import type { BindingRegistry } from "#/registry";
import { ActivationNeedCache } from "#/resolution/activation-need";
import type { DefaultLookupEntry } from "#/resolution/binding-lookup-cache";
import { BindingLookupCache } from "#/resolution/binding-lookup-cache";
import { selectAllBindings, selectBinding } from "#/resolution/binding-select";
import { ClassIntrospector } from "#/resolution/class-introspector";
import type { ResolutionDiagnostics } from "#/resolution/diagnostics";
import type { ResolverCallbacks } from "#/resolution/environment";
import { buildResolutionFrame, DefaultResolutionContext } from "#/resolution/environment";
import { InstantiationPlanCompiler, PLAN_RETRY } from "#/resolution/instantiation-plan";
import type { LifecycleManager } from "#/resolution/lifecycle";
import { enterResolutionPath, exitResolutionPath } from "#/resolution/resolution-path";
import { injectionSlotToResolveOptions } from "#/resolution/resolve-options";
import type { ScopeManager } from "#/resolution/scope";
import type { Token } from "#/token";
import { tokenName } from "#/token";
import type {
  ActivationHandler,
  BindingIdentifier,
  BindingScope,
  BindingTag,
  ConstraintContext,
  Constructor,
  ResolutionFrame,
  ResolveOptions,
} from "#/types";

type BindingWithScope = Binding & { scope: BindingScope };
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
export class DependencyResolver implements ResolverCallbacks {
  readonly #syncResolutionContextPool: Array<DefaultResolutionContext> = [];
  // Pure allocation pool: a chain's own context is threaded through the call, so nothing here
  // identifies a chain.
  readonly #asyncChainContextPool: Array<DefaultResolutionContext> = [];
  // Compiled plans; `null` marks a binding as unplannable under the current cache versions.
  readonly #classPlanByBindingId = new Map<BindingIdentifier, (() => unknown) | null>();
  #classPlanRegistryVersion = -1;
  #classPlanActivationVersion = -1;

  readonly #registry: BindingRegistry;
  readonly #scope: ScopeManager;
  readonly #lifecycle: LifecycleManager;
  readonly #metadataReader: MetadataReader;
  readonly #parent: DependencyResolver | undefined;
  readonly #lookup: BindingLookupCache<DependencyResolver>;
  readonly #classes: ClassIntrospector;
  readonly #activation: ActivationNeedCache;

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
    this.#parent = parent;
    this.#lookup = new BindingLookupCache<DependencyResolver>(
      registry,
      this,
      parent === undefined ? undefined : parent.#lookup,
    );
    this.#classes = new ClassIntrospector(metadataReader, container);
    this.#activation = new ActivationNeedCache(lifecycle, this.#classes);
  }

  /** Structural counts for {@link RESOLUTION_DIAGNOSTICS}; see `resolution/diagnostics.ts`. */
  describeCaches(): Pick<ResolutionDiagnostics, "asyncContextPoolSize" | "compiledPlanCount" | "syncContextPoolSize"> {
    let compiledPlanCount = 0;
    for (const plan of this.#classPlanByBindingId.values()) {
      if (plan !== null) {
        compiledPlanCount += 1;
      }
    }
    return {
      asyncContextPoolSize: this.#asyncChainContextPool.length,
      compiledPlanCount,
      syncContextPoolSize: this.#syncResolutionContextPool.length,
    };
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
    // Hot lane: own-registry fast default. Fall back to the chain-versioned memo
    // (parent-chain walk + alias folding) only on miss or alias.
    const fastBinding = this.#registry.getFastDefault(token);
    if (fastBinding !== undefined && fastBinding.kind !== "alias") {
      return this.#resolveDefaultEntry<Value>(fastBinding, this, resolutionPath, resolutionStack);
    }
    const entry = this.#lookup.defaultEntry(token);
    if (entry === null) {
      return this.resolve(token, undefined, resolutionPath, resolutionStack);
    }
    return this.#resolveDefaultEntry<Value>(entry.binding, entry.owner, resolutionPath, resolutionStack);
  }

  #resolveDefaultEntry<const Value>(
    binding: Binding,
    owner: DependencyResolver,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value {
    if (
      binding.kind === "constant" &&
      binding.onActivation === undefined &&
      (this.#lifecycle.activationVersion === 0 || !this.#lifecycle.hasActivationHandlers(binding.token))
    ) {
      return binding.value as Value;
    }
    const scope = (binding as BindingWithScope).scope ?? "transient";
    if (scope === "transient") {
      if (binding.kind === "dynamic") {
        const containerHooks =
          this.#lifecycle.activationVersion === 0 ? undefined : this.#lifecycle.activationHandlersFor(binding.token);
        if (binding.onActivation === undefined && (containerHooks === undefined || containerHooks.length === 0)) {
          return this.#resolveTransientDynamicSyncFromContext(
            binding as Binding<Value> & { kind: "dynamic" },
            resolutionPath,
            resolutionStack,
          );
        }
        return this.#resolveTransientDynamicActivatedSync(
          binding as Binding<Value> & { kind: "dynamic" },
          containerHooks,
          resolutionPath,
          resolutionStack,
        );
      }
      // Compiled plans only run at the top level — inner levels keep the runtime cycle guard.
      if ((binding.kind === "class" || binding.kind === "resolved") && resolutionPath.length === 0) {
        const plan = this.#getInstantiationPlan(binding);
        if (plan !== null) {
          return plan() as Value;
        }
      }
    } else if (scope === "singleton") {
      const cachedSingleton = binding.instance;
      if (cachedSingleton !== NO_INSTANCE) {
        return cachedSingleton as Value;
      }
      if (owner !== this) {
        return owner.#resolveBinding(binding as Binding<Value>, undefined, resolutionPath, resolutionStack);
      }
    } else {
      if (!this.#scope.isChild) {
        throw new MissingScopeContextError(this.#getTokenName(binding.token));
      }
      if (this.#scope.hasScoped(binding.id)) {
        return this.#scope.getScoped<Value>(binding.id);
      }
    }
    return this.#resolveBinding(binding as Binding<Value>, undefined, resolutionPath, resolutionStack);
  }

  // Lean lane for an activated transient dynamic binding: same observable behavior as the
  // generic #resolveBinding path (guard, frame, ctx, per-binding then container hooks) with
  // the kind/activation dispatch resolved statically.
  #resolveTransientDynamicActivatedSync<const Value>(
    binding: Binding<Value> & { kind: "dynamic" },
    containerHooks: ReadonlyArray<ActivationHandler<unknown>> | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value {
    const frame = this.#getResolutionFrame(binding);
    const tokenDisplayName = frame.tokenName;
    const resolutionSet = enterResolutionPath(resolutionPath, tokenDisplayName, false);
    resolutionStack.push(frame);
    try {
      const resolutionCtx = this.#acquireSyncResolutionContext(resolutionPath, resolutionStack, undefined);
      const factoryResult = binding.factory(resolutionCtx);
      if (factoryResult instanceof Promise) {
        throw new AsyncResolutionError(tokenDisplayName, tokenDisplayName);
      }
      let activated = factoryResult;
      if (binding.onActivation !== undefined) {
        const activationResult = binding.onActivation(resolutionCtx, activated);
        if (activationResult instanceof Promise) {
          throw new AsyncActivationError(tokenDisplayName, "onActivation");
        }
        activated = activationResult;
      }
      if (containerHooks !== undefined) {
        for (let index = 0; index < containerHooks.length; index += 1) {
          const activationResult = containerHooks[index]!(resolutionCtx, activated);
          if (activationResult instanceof Promise) {
            throw new AsyncActivationError(tokenDisplayName, "onActivation");
          }
          activated = activationResult as Value;
        }
      }
      return activated;
    } finally {
      resolutionStack.pop();
      resolutionPath.pop();
      resolutionSet?.delete(tokenDisplayName);
    }
  }

  #getInstantiationPlan(binding: Binding & { kind: "class" | "resolved" }): (() => unknown) | null {
    const registryVersion = this.#lookup.chainVersion();
    const activationVersion = this.#lifecycle.activationVersion;
    if (registryVersion !== this.#classPlanRegistryVersion || activationVersion !== this.#classPlanActivationVersion) {
      this.#classPlanByBindingId.clear();
      this.#classPlanRegistryVersion = registryVersion;
      this.#classPlanActivationVersion = activationVersion;
    }
    const cached = this.#classPlanByBindingId.get(binding.id);
    if (cached !== undefined) {
      return cached;
    }
    const compiled = this.#planCompiler.compile(binding);
    if (compiled === PLAN_RETRY) {
      // Lifecycle metadata not discovered yet — the fallback resolve discovers it; retry then.
      return null;
    }
    this.#classPlanByBindingId.set(binding.id, compiled);
    return compiled;
  }

  // Compiler behind #getClassPlan — cold path, so the host indirection costs nothing hot.
  readonly #planCompiler = new InstantiationPlanCompiler({
    hasActivationHandlers: (token) => this.#lifecycle.hasActivationHandlers(token),
    knownPostConstruct: (target) => this.#classes.knownPostConstruct(target),
    needsActiveContainer: (target) => this.#classes.needsActiveContainer(target),
    getConstructorMetadata: (target) => this.#classes.constructorMetadata(target),
    lookupDependencyEntry: (token) => {
      const entry = this.#lookup.defaultEntry(token);
      return entry === null ? null : { binding: entry.binding };
    },
    getResolutionFrame: (binding) => this.#getResolutionFrame(binding),
    // Dispatches exactly as #resolveClassDeps does, so an escaped dep is indistinguishable
    // from the same dep on a fully interpreted resolve.
    resolveEscaped: (token, options, arity, resolutionPath, resolutionStack) => {
      if (arity === "all") {
        return this.resolveAll(token, options, resolutionPath, resolutionStack);
      }
      if (arity === "optional") {
        return this.resolveOptional(token, options, resolutionPath, resolutionStack);
      }
      if (options === undefined) {
        return this.resolveFromContext(token, resolutionPath, resolutionStack);
      }
      return this.resolve(token, options, resolutionPath, resolutionStack);
    },
  });

  resolve<const Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value {
    // Name-only fast lane: memoized lookup, dispatching just the shapes whose
    // semantics involve no resolution context (constants, cached singletons).
    if (
      options !== undefined &&
      options.name !== undefined &&
      options.tag === undefined &&
      (options.tags === undefined || options.tags.length === 0)
    ) {
      const namedEntry = this.#lookup.namedEntry(token, options.name);
      if (namedEntry !== null) {
        const namedBinding = namedEntry.binding;
        if (
          namedBinding.kind === "constant" &&
          namedBinding.onActivation === undefined &&
          (this.#lifecycle.activationVersion === 0 || !this.#lifecycle.hasActivationHandlers(namedBinding.token))
        ) {
          return namedBinding.value as Value;
        }
        const namedScope = (namedBinding as BindingWithScope).scope ?? "transient";
        if (namedScope === "singleton") {
          if (namedBinding.instance !== NO_INSTANCE) {
            return namedBinding.instance as Value;
          }
        }
        // Everything else keeps the full path (context, activation, guards).
      }
    }

    let currentToken: Token<unknown> | Constructor = token;
    let visitedAliasTokens: Set<Token<unknown> | Constructor> | undefined;
    let found = this.#findBinding(currentToken, options, resolutionPath, resolutionStack);

    // Follow aliases iteratively with exact cycle detection — a revisited alias
    // token throws CircularDependencyError instead of overflowing the call stack.
    while (found !== undefined && found.binding.kind === "alias") {
      const target = found.binding.target;
      visitedAliasTokens ??= new Set([currentToken]);
      if (visitedAliasTokens.has(target)) {
        throw new CircularDependencyError([...visitedAliasTokens, target].map((entry) => tokenName(entry)));
      }
      visitedAliasTokens.add(target);
      currentToken = target;
      found = this.#findBinding(currentToken, options, resolutionPath, resolutionStack);
    }

    if (found === undefined) {
      const ownBindings = this.#registry.getAll(currentToken);
      if (ownBindings.length > 0) {
        throw new NoMatchingBindingError(
          this.#getTokenName(currentToken),
          options ?? {},
          this.#getAvailableSlots(currentToken),
        );
      }
      throw new TokenNotBoundError(this.#getTokenName(currentToken));
    }

    const { binding, owner } = found;

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
      (this.#lifecycle.activationVersion === 0 || !this.#lifecycle.hasActivationHandlers(binding.token))
    ) {
      return binding.value;
    }

    const scope = (binding as BindingWithScope).scope ?? "transient";

    // Singleton cache check
    if (scope === "singleton" && binding.instance !== NO_INSTANCE) {
      return binding.instance as Value;
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
    const resolutionSet = enterResolutionPath(resolutionPath, tokenDisplayName, false);
    resolutionStack.push(frame);
    const needsActivation = this.#activation.needsActivation(binding);
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

      const shouldActivate = this.#activation.refreshAfterFirstInstantiation(binding, needsActivation);
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
        this.#scope.setSingleton(binding, activated);
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
        const instance = this.#classes.instantiate(binding.target, deps);
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
    const meta = this.#classes.constructorMetadata(target);
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
    callerContext?: DefaultResolutionContext,
  ): Promise<Value> {
    // Hot lane: own-registry fast default (async chains resolve sibling dynamic bindings).
    // Fall back to the chain-versioned memo only on miss or alias.
    const fastBinding = this.#registry.getFastDefault(token);
    if (fastBinding !== undefined && fastBinding.kind !== "alias") {
      // Inline the dominant chain shape — transient dynamic factory with no activation.
      if (
        (fastBinding.kind === "dynamic-async" || fastBinding.kind === "dynamic") &&
        fastBinding.scope === "transient" &&
        fastBinding.onActivation === undefined &&
        (this.#lifecycle.activationVersion === 0 || !this.#lifecycle.hasActivationHandlers(fastBinding.token))
      ) {
        return this.#resolveTransientDynamicAsyncFromContext(
          fastBinding as Binding<Value> & { kind: "dynamic" | "dynamic-async" },
          resolutionPath,
          resolutionStack,
          callerContext,
        );
      }
      return this.#resolveAsyncDefaultEntry<Value>(fastBinding, this, resolutionPath, resolutionStack, callerContext);
    }
    const entry = this.#lookup.defaultEntry(token);
    if (entry === null) {
      return this.resolveAsync(token, undefined, resolutionPath, resolutionStack);
    }
    return this.#resolveAsyncDefaultEntry<Value>(
      entry.binding,
      entry.owner,
      resolutionPath,
      resolutionStack,
      callerContext,
    );
  }

  #resolveAsyncDefaultEntry<const Value>(
    binding: Binding,
    owner: DependencyResolver,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    callerContext?: DefaultResolutionContext,
  ): Promise<Value> {
    if (
      binding.kind === "constant" &&
      binding.onActivation === undefined &&
      (this.#lifecycle.activationVersion === 0 || !this.#lifecycle.hasActivationHandlers(binding.token))
    ) {
      return Promise.resolve(binding.value as Value);
    }
    const scope = (binding as BindingWithScope).scope ?? "transient";
    if (scope === "transient") {
      if (
        (binding.kind === "dynamic" || binding.kind === "dynamic-async") &&
        binding.onActivation === undefined &&
        (this.#lifecycle.activationVersion === 0 || !this.#lifecycle.hasActivationHandlers(binding.token))
      ) {
        return this.#resolveTransientDynamicAsyncFromContext(
          binding as Binding<Value> & { kind: "dynamic" | "dynamic-async" },
          resolutionPath,
          resolutionStack,
          callerContext,
        );
      }
    } else if (scope === "singleton") {
      if (binding.instance !== NO_INSTANCE) {
        return Promise.resolve(binding.instance as Value);
      }
      if (owner !== this) {
        return owner.#resolveBindingAsync(binding as Binding<Value>, undefined, resolutionPath, resolutionStack);
      }
    } else {
      if (!this.#scope.isChild) {
        return Promise.reject(new MissingScopeContextError(this.#getTokenName(binding.token)));
      }
      if (this.#scope.hasScoped(binding.id)) {
        return Promise.resolve(this.#scope.getScoped<Value>(binding.id));
      }
    }
    return this.#resolveBindingAsync(binding as Binding<Value>, undefined, resolutionPath, resolutionStack);
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

    let currentToken: Token<unknown> | Constructor = token;
    let visitedAliasTokens: Set<Token<unknown> | Constructor> | undefined;
    let aliasFollowed: DefaultLookupEntry<DependencyResolver> | undefined = found;
    while (aliasFollowed !== undefined && aliasFollowed.binding.kind === "alias") {
      const target = aliasFollowed.binding.target;
      visitedAliasTokens ??= new Set([currentToken]);
      if (visitedAliasTokens.has(target)) {
        throw new CircularDependencyError([...visitedAliasTokens, target].map((entry) => tokenName(entry)));
      }
      visitedAliasTokens.add(target);
      currentToken = target;
      aliasFollowed = this.#findBinding(currentToken, options, resolutionPath, resolutionStack);
    }
    if (aliasFollowed === undefined) {
      const ownBindings = this.#registry.getAll(currentToken);
      if (ownBindings.length > 0) {
        throw new NoMatchingBindingError(
          this.#getTokenName(currentToken),
          options ?? {},
          this.#getAvailableSlots(currentToken),
        );
      }
      throw new TokenNotBoundError(this.#getTokenName(currentToken));
    }
    const { binding, owner } = aliasFollowed;

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
      if (binding.instance !== NO_INSTANCE) {
        return binding.instance as Value;
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
    const resolutionSet = enterResolutionPath(resolutionPath, frameName, false);
    resolutionStack.push(frame);
    const needsActivation = this.#activation.needsActivation(binding);
    if (!needsActivation && scope === "transient" && (binding.kind === "dynamic" || binding.kind === "dynamic-async")) {
      const resolutionCtx = new DefaultResolutionContext(this, resolutionPath, resolutionStack, options);
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
      ? new DefaultResolutionContext(this, resolutionPath, resolutionStack, options)
      : undefined;

    try {
      if (scope === "singleton") {
        const createSingletonPromise = async (): Promise<Value> => {
          const instance = await this.#instantiateAsync(binding, resolutionCtx, resolutionPath, resolutionStack);

          const shouldActivate = this.#activation.refreshAfterFirstInstantiation(binding, needsActivation);
          const activated = shouldActivate
            ? await this.#lifecycle.runActivation(
                resolutionCtx as DefaultResolutionContext,
                binding,
                instance,
                this.#metadataReader,
              )
            : instance;

          this.#scope.setSingleton(binding, activated);
          binding.instance = activated;
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

      const shouldActivate = this.#activation.refreshAfterFirstInstantiation(binding, needsActivation);
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
        const instance = this.#classes.instantiate(binding.target, deps);
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
    const meta = this.#classes.constructorMetadata(target);
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
    // One lane at every depth: `binding.inFlight` is O(1), so there is nothing to escape.
    const frame = this.#getResolutionFrame(binding);
    const tokenDisplayName = frame.tokenName;
    if (binding.inFlight) {
      throw new CircularDependencyError([...resolutionPath, tokenDisplayName]);
    }
    binding.inFlight = true;
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
      binding.inFlight = false;
    }
  }

  // Deliberately not `async`: that would allocate a state machine and a promise per level.
  #resolveTransientDynamicAsyncFromContext<const Value>(
    binding: Binding<Value> & { kind: "dynamic" | "dynamic-async" },
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    callerContext?: DefaultResolutionContext,
  ): Promise<Value> {
    // Path-scoped cycle detection, because async chains interleave — see ARCHITECTURE.md.
    const pool = this.#asyncChainContextPool;
    const frame = this.#getResolutionFrame(binding);
    const tokenDisplayName = frame.tokenName;
    try {
      enterResolutionPath(resolutionPath, tokenDisplayName, false);
    } catch (cycleError) {
      // This method is not `async`; keep failures as rejections rather than sync throws.
      return Promise.reject(cycleError);
    }

    // An inner level reuses the context its caller passed down; only a chain's first level
    // borrows from the pool. Pooling is load-bearing here — see ARCHITECTURE.md.
    const ctx =
      callerContext !== undefined && callerContext.owner === this
        ? callerContext
        : this.#acquireAsyncChainContext(resolutionPath, resolutionStack);
    ctx.chainLevels += 1;

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
    } catch (factoryError) {
      // Synchronous throw from the factory (rare) — clean up immediately.
      exitResolutionPath(resolutionPath);
      ctx.chainLevels -= 1;
      if (ctx.chainLevels === 0) {
        pool.push(ctx);
      }
      return Promise.reject(factoryError);
    }

    // A side listener, not a derived chain: FIFO puts it before the awaiting caller resumes.
    // It marks a rejection as handled, so callers must await or `.catch` the returned promise.
    const settle =
      ctx.chainSettle ??
      (ctx.chainSettle = (): void => {
        exitResolutionPath(resolutionPath);
        ctx.chainLevels -= 1;
        if (ctx.chainLevels === 0) {
          pool.push(ctx);
        }
      });
    factoryPromise.then(settle, settle);
    return factoryPromise;
  }

  #acquireAsyncChainContext(
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): DefaultResolutionContext {
    const pooled = this.#asyncChainContextPool.pop();
    if (pooled === undefined) {
      return new DefaultResolutionContext(this, resolutionPath, resolutionStack, undefined);
    }
    pooled.reset(this, resolutionPath, resolutionStack, undefined);
    return pooled;
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
    if (scope === "singleton" && binding.instance !== NO_INSTANCE) {
      return binding.instance as Value;
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
    if (scope === "singleton" && binding.instance !== NO_INSTANCE) {
      return Promise.resolve(binding.instance as Value);
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
    // Memoized on the binding rather than in a per-resolver Map: the frame derives only from
    // immutable binding fields, so it is identical for every resolver, and a field read beats a
    // Map lookup on every hop of a chain.
    const existing = binding.frame;
    if (existing !== undefined) {
      return existing;
    }
    const scope = (binding as BindingWithScope).scope ?? "transient";
    const frame = buildResolutionFrame(tokenName(binding.token), scope, binding.id, binding.kind, binding.slot);
    binding.frame = frame;
    return frame;
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
      existing.reset(this, resolutionPath, resolutionStack, options);
      return existing;
    }
    const created = new DefaultResolutionContext(this, resolutionPath, resolutionStack, options);
    this.#syncResolutionContextPool[depth] = created;
    return created;
  }
}
