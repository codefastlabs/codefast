import type { Binding, ConstantBinding, DynamicAsyncBinding, DynamicBinding } from "#/binding";
import { NO_INSTANCE } from "#/binding";
import type { Container } from "#/container/container";
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
import type { MetadataReader, ParamMetadata } from "#/metadata/metadata-types";
import type { BindingRegistry } from "#/registry";
import { ActivationNeedCache } from "#/resolution/activation-need";
import type { DefaultLookupEntry } from "#/resolution/binding-lookup-cache";
import { BindingLookupCache } from "#/resolution/binding-lookup-cache";
import { matchesSlot, selectAllBindings, selectBinding } from "#/resolution/binding-select";
import { ClassIntrospector } from "#/resolution/class-introspector";
import type { ResolutionDiagnostics } from "#/resolution/diagnostics";
import type { ResolverCallbacks } from "#/resolution/environment";
import { buildResolutionFrame, DefaultResolutionContext } from "#/resolution/environment";
import { InstantiationPlanCompiler, PLAN_RETRY } from "#/resolution/instantiation-plan";
import type { LifecycleManager } from "#/resolution/lifecycle";
import { enterResolutionPath, exitResolutionPath } from "#/resolution/resolution-path";
import type { DependencySlot } from "#/resolution/resolve-options";
import { injectionSlotToResolveOptions, isNameOnlyOptions, singleTagOnlyOf } from "#/resolution/resolve-options";
import type { ScopeManager } from "#/resolution/scope";
import type { Token } from "#/token";
import { tokenName } from "#/token";
import type {
  ActivationHandler,
  BindingIdentifier,
  ConstraintContext,
  Constructor,
  ResolutionFrame,
  ResolveOptions,
} from "#/types";

const EMPTY_STRING_LIST: ReadonlyArray<string> = [];
const EMPTY_FRAME_LIST: ReadonlyArray<ResolutionFrame> = [];
const EMPTY_PARAM_LIST: ReadonlyArray<ParamMetadata> = [];
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
  ): DefaultLookupEntry<DependencyResolver> | undefined {
    if (options === undefined) {
      const fastDefaultBinding = this.#registry.getFastDefault(token);
      if (fastDefaultBinding !== undefined) {
        return { binding: fastDefaultBinding, owner: this };
      }
    } else if (isNameOnlyOptions(options)) {
      const namedBinding = this.#registry.getSimpleNamed(token, options.name);
      if (
        namedBinding !== undefined &&
        this.#matchesBindingFast(namedBinding, options, resolutionPath, resolutionStack)
      ) {
        return { binding: namedBinding, owner: this };
      }
    } else {
      const singleTag = singleTagOnlyOf(options);
      if (singleTag !== undefined) {
        const tagged = this.#registry.getSimpleTagged(token, singleTag[0], singleTag[1]);
        if (tagged !== undefined && matchesIndexedTagValue(tagged, singleTag[1])) {
          return { binding: tagged, owner: this };
        }
      }
    }

    const bindings = this.#registry.getAll(token);
    if (bindings.length > 0) {
      // A lone candidate is its own selection: matching it is the whole decision, with no
      // specificity to weigh and no ambiguity to report.
      const selected =
        bindings.length === 1
          ? this.#matchesBindingFast(bindings[0]!, options, resolutionPath, resolutionStack)
            ? bindings[0]
            : undefined
          : selectBinding(
              bindings,
              options,
              this.#makeConstraintContext(resolutionPath, resolutionStack, options),
              tokenName(token),
            );
      if (selected !== undefined) {
        return { binding: selected, owner: this };
      }
    }
    if (this.#parent !== undefined) {
      return this.#parent.#findBinding(token, options, resolutionPath, resolutionStack);
    }
    return undefined;
  }

  /**
   * The binding a token resolves to with alias hops followed, or a diagnostic throw.
   *
   * @remarks Alias hops are followed iteratively with exact cycle detection — a revisited alias
   * token raises {@link CircularDependencyError} instead of overflowing the call stack.
   */
  #requireBinding(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): DefaultLookupEntry<DependencyResolver> {
    let currentToken = token;
    let visitedAliasTokens: Set<Token<unknown> | Constructor> | undefined;
    let found = this.#findBinding(currentToken, options, resolutionPath, resolutionStack);

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
      // Thrown here rather than from a helper: the error captures this stack, and an error path is
      // dominated by that capture. Bindings under the token mean the request matched none of them.
      if (this.#registry.getAll(currentToken).length > 0) {
        throw new NoMatchingBindingError(
          tokenName(currentToken),
          options ?? {},
          this.#registry.availableSlotStrings(currentToken),
        );
      }
      throw new TokenNotBoundError(tokenName(currentToken));
    }
    return found;
  }

  /**
   * Binding lookup aligned with `resolve` — used by `Container.validate` without instantiating.
   */
  peekBindingForValidate(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
  ): DefaultLookupEntry<DependencyResolver> | undefined {
    return this.#findBinding(token, options, [], []);
  }

  /**
   * Mirrors {@link DependencyResolver.resolveAll} candidate selection only (no instantiation).
   */
  peekCandidateBindingsForValidate(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
  ): ReadonlyArray<Binding> {
    return this.#candidateBindings(token, options, [], []);
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
      return this.#resolveDefaultEntry(fastBinding, this, resolutionPath, resolutionStack) as Value;
    }
    const entry = this.#lookup.defaultEntry(token);
    if (entry === null) {
      return this.resolve(token, undefined, resolutionPath, resolutionStack);
    }
    return this.#resolveDefaultEntry(entry.binding, entry.owner, resolutionPath, resolutionStack) as Value;
  }

  #resolveDefaultEntry(
    binding: Binding,
    owner: DependencyResolver,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): unknown {
    const scope = binding.scope;
    if (scope === "transient") {
      if (binding.kind === "dynamic") {
        const containerHooks =
          this.#lifecycle.activationVersion === 0 ? undefined : this.#lifecycle.activationHandlersFor(binding.token);
        if (binding.onActivation === undefined && (containerHooks === undefined || containerHooks.length === 0)) {
          return this.#resolveTransientDynamicSyncFromContext(binding, resolutionPath, resolutionStack);
        }
        return this.#resolveTransientDynamicActivatedSync(binding, containerHooks, resolutionPath, resolutionStack);
      }
      // Compiled plans only run at the top level — inner levels keep the runtime cycle guard.
      if ((binding.kind === "class" || binding.kind === "resolved") && resolutionPath.length === 0) {
        const plan = this.#getInstantiationPlan(binding);
        if (plan !== null) {
          return plan();
        }
      }
    } else if (scope === "singleton") {
      // A constant is a singleton that is already its own instance.
      if (this.#isPlainConstant(binding)) {
        return binding.value;
      }
      const cachedSingleton = binding.instance;
      if (cachedSingleton !== NO_INSTANCE) {
        return cachedSingleton;
      }
      if (owner !== this) {
        return owner.#resolveBinding(binding, undefined, resolutionPath, resolutionStack);
      }
    } else {
      const cachedScoped = this.#readScoped(binding);
      if (cachedScoped !== SCOPED_MISS) {
        return cachedScoped;
      }
    }
    return this.#resolveBinding(binding, undefined, resolutionPath, resolutionStack);
  }

  // Lean lane for an activated transient dynamic binding: same observable behavior as the
  // generic #resolveBinding path (guard, frame, ctx, per-binding then container hooks) with
  // the kind/activation dispatch resolved statically.
  #resolveTransientDynamicActivatedSync(
    binding: DynamicBinding<unknown>,
    containerHooks: ReadonlyArray<ActivationHandler<unknown>> | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): unknown {
    // Same O(1) cycle guard as the unhooked lane: this is still one sync call stack, so the flag
    // *is* exact path membership — see ARCHITECTURE.md.
    const frame = this.#getResolutionFrame(binding);
    const tokenDisplayName = frame.tokenName;
    if (binding.inFlight) {
      throw new CircularDependencyError([...resolutionPath, tokenDisplayName]);
    }
    binding.inFlight = true;
    resolutionPath.push(tokenDisplayName);
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
          activated = activationResult;
        }
      }
      return activated;
    } finally {
      resolutionStack.pop();
      resolutionPath.pop();
      binding.inFlight = false;
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

  // Compiler behind #getInstantiationPlan — cold path, so the host indirection costs nothing hot.
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
    // Dispatches exactly as #resolveDep does, so an escaped dep is indistinguishable
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
    if (options !== undefined && isNameOnlyOptions(options)) {
      const namedEntry = this.#lookup.namedEntry(token, options.name);
      if (namedEntry !== null) {
        const namedBinding = namedEntry.binding;
        if (this.#isPlainConstant(namedBinding)) {
          return namedBinding.value as Value;
        }
        if (namedBinding.scope === "singleton" && namedBinding.instance !== NO_INSTANCE) {
          return namedBinding.instance as Value;
        }
        // Everything else keeps the full path (context, activation, guards).
      }
    }

    const { binding, owner } = this.#requireBinding(token, options, resolutionPath, resolutionStack);

    // A singleton owned by a parent resolver is resolved there, so the parent caches it.
    if (binding.scope === "singleton" && owner !== this) {
      return owner.#resolveBinding(binding, options, resolutionPath, resolutionStack) as Value;
    }
    return this.#resolveBinding(binding, options, resolutionPath, resolutionStack) as Value;
  }

  #resolveBinding(
    binding: Binding,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): unknown {
    if (this.#isPlainConstant(binding)) {
      return binding.value;
    }

    const scope = binding.scope;
    if (scope === "singleton") {
      if (binding.instance !== NO_INSTANCE) {
        return binding.instance;
      }
    } else if (scope === "scoped") {
      const cachedScoped = this.#readScoped(binding);
      if (cachedScoped !== SCOPED_MISS) {
        return cachedScoped;
      }
    }

    const frame = this.#getResolutionFrame(binding);
    const tokenDisplayName = frame.tokenName;
    const resolutionSet = enterResolutionPath(resolutionPath, tokenDisplayName);
    resolutionStack.push(frame);
    try {
      const needsActivation = this.#activation.needsActivation(binding);
      if (!needsActivation && scope === "transient" && binding.kind === "dynamic") {
        const resolutionCtx = this.#acquireSyncResolutionContext(resolutionPath, resolutionStack, options);
        const dynamicResult = binding.factory(resolutionCtx);
        if (dynamicResult instanceof Promise) {
          throw new AsyncResolutionError(tokenDisplayName, tokenDisplayName);
        }
        return dynamicResult;
      }

      const resolutionCtx =
        needsActivation || requiresResolutionContext(binding)
          ? this.#acquireSyncResolutionContext(resolutionPath, resolutionStack, options)
          : undefined;

      const instance = this.#instantiateSync(binding, resolutionCtx, resolutionPath, resolutionStack);

      const activated = this.#activation.refreshAfterFirstInstantiation(binding, needsActivation)
        ? this.#lifecycle.runActivationSync(
            resolutionCtx as DefaultResolutionContext,
            binding,
            instance,
            this.#metadataReader,
          )
        : instance;

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

  #instantiateSync(
    binding: Binding,
    ctx: DefaultResolutionContext | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): unknown {
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
        const deps = this.#resolveDeps(this.#constructorParams(binding.target), resolutionPath, resolutionStack);
        return this.#classes.instantiate(binding.target, deps);
      }

      case "resolved": {
        const deps = this.#resolveDeps(binding.deps, resolutionPath, resolutionStack);
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

  /**
   * The parameters a class binding injects.
   *
   * @remarks A class the metadata reader knows nothing about is constructible only if it declares
   * no parameters; anything else is a missing `@injectable()`.
   */
  #constructorParams(target: Constructor): ReadonlyArray<ParamMetadata> {
    const meta = this.#classes.constructorMetadata(target);
    if (meta !== undefined) {
      return meta.params;
    }
    if (target.length === 0) {
      return EMPTY_PARAM_LIST;
    }
    throw new MissingMetadataError(target.name);
  }

  // One dispatch table for both dependency sources — constructor params and `toResolved`
  // descriptors declare the same four things.
  #resolveDeps(
    deps: ReadonlyArray<DependencySlot>,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Array<unknown> {
    const count = deps.length;
    if (count === 0) {
      return [];
    }
    if (count === 1) {
      return [this.#resolveDep(deps[0]!, resolutionPath, resolutionStack)];
    }
    const resolved = new Array<unknown>(count);
    for (let index = 0; index < count; index += 1) {
      resolved[index] = this.#resolveDep(deps[index]!, resolutionPath, resolutionStack);
    }
    return resolved;
  }

  #resolveDep(dep: DependencySlot, resolutionPath: Array<string>, resolutionStack: Array<ResolutionFrame>): unknown {
    const options = injectionSlotToResolveOptions(dep);
    if (dep.multi) {
      return this.resolveAll(dep.token, options, resolutionPath, resolutionStack);
    }
    if (dep.optional) {
      return this.resolveOptional(dep.token, options, resolutionPath, resolutionStack);
    }
    if (options === undefined) {
      return this.resolveFromContext(dep.token, resolutionPath, resolutionStack);
    }
    return this.resolve(dep.token, options, resolutionPath, resolutionStack);
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
    const candidates = this.#candidateBindings(token, options, resolutionPath, resolutionStack);
    const resolved = new Array<Value>(candidates.length);
    for (let index = 0; index < candidates.length; index += 1) {
      resolved[index] = this.#resolveCandidateSync(
        candidates[index]!,
        options,
        resolutionPath,
        resolutionStack,
      ) as Value;
    }
    return resolved;
  }

  /** Every binding in the chain a `resolveAll` request matches, in chain order. */
  #candidateBindings(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): ReadonlyArray<Binding> {
    if (options !== undefined && isNameOnlyOptions(options)) {
      // The name index has matched the slot already, but a hit may still carry a predicate —
      // and that is the selection path's job to evaluate.
      const named = this.#namedBindingsFromChain(token, options.name);
      if (!anyPredicate(named)) {
        return named;
      }
      return selectAllBindings(named, options, this.#makeConstraintContext(resolutionPath, resolutionStack, options));
    }
    const allBindings = this.#allBindingsFromChain(token);
    if (allBindings.length === 0) {
      return allBindings;
    }
    return selectAllBindings(
      allBindings,
      options,
      this.#makeConstraintContext(resolutionPath, resolutionStack, options),
    );
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
        !this.#hasAnyActivation(fastBinding)
      ) {
        return this.#resolveTransientDynamicAsyncFromContext(
          fastBinding,
          resolutionPath,
          resolutionStack,
          callerContext,
        ) as Promise<Value>;
      }
      return this.#resolveAsyncDefaultEntry(
        fastBinding,
        this,
        resolutionPath,
        resolutionStack,
        callerContext,
      ) as Promise<Value>;
    }
    const entry = this.#lookup.defaultEntry(token);
    if (entry === null) {
      return this.resolveAsync(token, undefined, resolutionPath, resolutionStack);
    }
    return this.#resolveAsyncDefaultEntry(
      entry.binding,
      entry.owner,
      resolutionPath,
      resolutionStack,
      callerContext,
    ) as Promise<Value>;
  }

  #resolveAsyncDefaultEntry(
    binding: Binding,
    owner: DependencyResolver,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    callerContext?: DefaultResolutionContext,
  ): Promise<unknown> {
    if (this.#isPlainConstant(binding)) {
      return Promise.resolve(binding.value);
    }
    const scope = binding.scope;
    if (scope === "transient") {
      if ((binding.kind === "dynamic" || binding.kind === "dynamic-async") && !this.#hasAnyActivation(binding)) {
        return this.#resolveTransientDynamicAsyncFromContext(binding, resolutionPath, resolutionStack, callerContext);
      }
    } else if (scope === "singleton") {
      if (binding.instance !== NO_INSTANCE) {
        return Promise.resolve(binding.instance);
      }
      if (owner !== this) {
        return owner.#resolveBindingAsync(binding, undefined, resolutionPath, resolutionStack);
      }
    } else if (this.#scope.isChild) {
      if (this.#scope.hasScoped(binding.id)) {
        return Promise.resolve(this.#scope.getScoped(binding.id));
      }
    } else {
      // Not `#readScoped`: this entry point reports failure as a rejection, never a sync throw.
      return Promise.reject(new MissingScopeContextError(tokenName(binding.token)));
    }
    return this.#resolveBindingAsync(binding, undefined, resolutionPath, resolutionStack);
  }

  async resolveAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value> {
    const { binding, owner } = this.#requireBinding(token, options, resolutionPath, resolutionStack);

    if (binding.scope === "singleton" && owner !== this) {
      return owner.#resolveBindingAsync(binding, options, resolutionPath, resolutionStack) as Value;
    }
    return this.#resolveBindingAsync(binding, options, resolutionPath, resolutionStack) as Value;
  }

  async #resolveBindingAsync(
    binding: Binding,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<unknown> {
    if (this.#isPlainConstant(binding)) {
      return binding.value;
    }

    const scope = binding.scope;
    if (scope === "singleton") {
      if (binding.instance !== NO_INSTANCE) {
        return binding.instance;
      }
      // In-flight dedup: concurrent callers share the first creation.
      const inflight = this.#scope.getInflight(binding.id);
      if (inflight !== undefined) {
        return inflight;
      }
    } else if (scope === "scoped") {
      const cachedScoped = this.#readScoped(binding);
      if (cachedScoped !== SCOPED_MISS) {
        return cachedScoped;
      }
    }

    const frame = this.#getResolutionFrame(binding);
    const tokenDisplayName = frame.tokenName;
    const resolutionSet = enterResolutionPath(resolutionPath, tokenDisplayName);
    resolutionStack.push(frame);
    try {
      const needsActivation = this.#activation.needsActivation(binding);
      if (
        !needsActivation &&
        scope === "transient" &&
        (binding.kind === "dynamic" || binding.kind === "dynamic-async")
      ) {
        const resolutionCtx = new DefaultResolutionContext(this, resolutionPath, resolutionStack, options);
        if (binding.kind === "dynamic-async") {
          return await binding.factory(resolutionCtx);
        }
        const dynamicResult = binding.factory(resolutionCtx);
        return dynamicResult instanceof Promise ? await dynamicResult : dynamicResult;
      }

      const resolutionCtx =
        needsActivation || requiresResolutionContext(binding)
          ? new DefaultResolutionContext(this, resolutionPath, resolutionStack, options)
          : undefined;

      if (scope === "singleton") {
        // The promise is published before it settles, so concurrent callers dedup onto it.
        const singletonPromise = this.#instantiateAndActivateAsync(
          binding,
          resolutionCtx,
          resolutionPath,
          resolutionStack,
          needsActivation,
        ).then(
          (activated) => {
            this.#scope.setSingleton(binding, activated);
            this.#scope.clearInflight(binding.id);
            return activated;
          },
          (error: unknown) => {
            this.#scope.clearInflight(binding.id);
            throw error;
          },
        );
        this.#scope.setInflight(binding.id, singletonPromise as Promise<unknown>);
        return await singletonPromise;
      }

      const activated = await this.#instantiateAndActivateAsync(
        binding,
        resolutionCtx,
        resolutionPath,
        resolutionStack,
        needsActivation,
      );
      if (scope === "scoped") {
        this.#scope.setScoped(binding.id, activated);
      }
      return activated;
    } finally {
      resolutionStack.pop();
      resolutionPath.pop();
      resolutionSet?.delete(tokenDisplayName);
    }
  }

  async #instantiateAndActivateAsync(
    binding: Binding,
    ctx: DefaultResolutionContext | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    needsActivation: boolean,
  ): Promise<unknown> {
    const instance = await this.#instantiateAsync(binding, ctx, resolutionPath, resolutionStack);
    if (!this.#activation.refreshAfterFirstInstantiation(binding, needsActivation)) {
      return instance;
    }
    return this.#lifecycle.runActivation(ctx as DefaultResolutionContext, binding, instance, this.#metadataReader);
  }

  async #instantiateAsync(
    binding: Binding,
    ctx: DefaultResolutionContext | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<unknown> {
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
        const deps = await this.#resolveDepsAsync(
          this.#constructorParams(binding.target),
          resolutionPath,
          resolutionStack,
        );
        return this.#classes.instantiate(binding.target, deps);
      }

      case "resolved": {
        if (ctx === undefined) {
          throw new InternalError("resolved binding requires resolution context");
        }
        const deps = await this.#resolveDepsAsync(binding.deps, resolutionPath, resolutionStack);
        const factoryResult = binding.factory(...deps);
        return factoryResult instanceof Promise ? factoryResult : Promise.resolve(factoryResult);
      }

      case "resolved-async": {
        const deps = await this.#resolveDepsAsync(binding.deps, resolutionPath, resolutionStack);
        return binding.factory(...deps);
      }

      case "alias":
        throw new InternalError("alias should have been followed before instantiation");
    }
  }

  async #resolveDepsAsync(
    deps: ReadonlyArray<DependencySlot>,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Array<unknown>> {
    const count = deps.length;
    if (count === 0) {
      return [];
    }
    if (count === 1) {
      return [await this.#resolveDepAsync(deps[0]!, resolutionPath, resolutionStack)];
    }
    // Siblings resolve concurrently, so each gets its own path and stack — the resolver pushes
    // and pops the arrays it is handed, and interleaved chains would corrupt a shared pair.
    const pending = new Array<Promise<unknown>>(count);
    for (let index = 0; index < count; index += 1) {
      pending[index] = this.#resolveDepAsync(deps[index]!, [...resolutionPath], [...resolutionStack]);
    }
    return Promise.all(pending);
  }

  #resolveDepAsync(
    dep: DependencySlot,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<unknown> {
    const options = injectionSlotToResolveOptions(dep);
    if (dep.multi) {
      return this.resolveAllAsync(dep.token, options, resolutionPath, resolutionStack);
    }
    if (dep.optional) {
      return this.resolveOptionalAsync(dep.token, options, resolutionPath, resolutionStack);
    }
    if (options === undefined) {
      return this.resolveAsyncFromContext(dep.token, resolutionPath, resolutionStack);
    }
    return this.resolveAsync(dep.token, options, resolutionPath, resolutionStack);
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
    const candidates = this.#candidateBindings(token, options, resolutionPath, resolutionStack);
    const pending = new Array<Promise<Value>>(candidates.length);
    for (let index = 0; index < candidates.length; index += 1) {
      pending[index] = this.#resolveCandidateAsync(
        candidates[index]!,
        options,
        resolutionPath,
        resolutionStack,
      ) as Promise<Value>;
    }
    return Promise.all(pending);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  #allBindingsFromChain(token: Token<unknown> | Constructor): ReadonlyArray<Binding> {
    const ownBindings = this.#registry.getAll(token);
    if (this.#parent === undefined) {
      return ownBindings;
    }
    const result: Array<Binding> = [...ownBindings];
    for (let current: DependencyResolver | undefined = this.#parent; current !== undefined; current = current.#parent) {
      const own = current.#registry.getAll(token);
      if (own.length > 0) {
        result.push(...own);
      }
    }
    return result;
  }

  /** Every binding the chain's name indexes hold for one name, nearest container first. */
  #namedBindingsFromChain(token: Token<unknown> | Constructor, name: string): Array<Binding> {
    // A name resolves to at most one binding per registry, so a root container's answer is built
    // whole rather than grown — the list is sized at its allocation.
    const ownBinding = this.#registry.getSimpleNamed(token, name);
    if (this.#parent === undefined) {
      return ownBinding === undefined ? [] : [ownBinding];
    }
    const result: Array<Binding> = ownBinding === undefined ? [] : [ownBinding];
    for (let current: DependencyResolver | undefined = this.#parent; current !== undefined; current = current.#parent) {
      const binding = current.#registry.getSimpleNamed(token, name);
      if (binding !== undefined) {
        result.push(binding);
      }
    }
    return result;
  }

  /** A constant with no activation anywhere resolves to its value with no pipeline at all. */
  #isPlainConstant(binding: Binding): binding is ConstantBinding<unknown> {
    return (
      binding.kind === "constant" &&
      binding.onActivation === undefined &&
      (this.#lifecycle.activationVersion === 0 || !this.#lifecycle.hasActivationHandlers(binding.token))
    );
  }

  /** Whether either an own hook or a container-level hook would run for this binding. */
  #hasAnyActivation(binding: DynamicBinding<unknown> | DynamicAsyncBinding<unknown>): boolean {
    if (binding.onActivation !== undefined) {
      return true;
    }
    return this.#lifecycle.activationVersion !== 0 && this.#lifecycle.hasActivationHandlers(binding.token);
  }

  /**
   * The cached instance of a `scoped` binding, or {@link SCOPED_MISS}.
   *
   * @remarks A `scoped` binding outside a child container is a configuration error, not a miss, so
   * the check lives with the read that depends on it.
   */
  #readScoped(binding: Binding): unknown {
    if (!this.#scope.isChild) {
      throw new MissingScopeContextError(tokenName(binding.token));
    }
    if (this.#scope.hasScoped(binding.id)) {
      return this.#scope.getScoped(binding.id);
    }
    return SCOPED_MISS;
  }

  #makeConstraintContext(
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    options: ResolveOptions | undefined,
  ): ConstraintContext {
    if (options === undefined && resolutionPath.length === 0 && resolutionStack.length === 0) {
      return ROOT_CONSTRAINT_CONTEXT;
    }
    return {
      resolutionPath,
      resolutionStack,
      parent: resolutionStack.at(-1),
      ancestors: resolutionStack.length > 1 ? resolutionStack.slice(0, -1) : [],
      currentResolveOptions: options,
    };
  }

  #matchesBindingFast(
    binding: Binding,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): boolean {
    if (!matchesSlot(binding.slot, options)) {
      return false;
    }
    if (binding.predicate === undefined) {
      return true;
    }
    return binding.predicate(this.#makeConstraintContext(resolutionPath, resolutionStack, options));
  }

  #resolveTransientDynamicSyncFromContext(
    binding: DynamicBinding<unknown>,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): unknown {
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
  #resolveTransientDynamicAsyncFromContext(
    binding: DynamicBinding<unknown> | DynamicAsyncBinding<unknown>,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    callerContext?: DefaultResolutionContext,
  ): Promise<unknown> {
    // Path-scoped cycle detection, because async chains interleave — see ARCHITECTURE.md.
    const pool = this.#asyncChainContextPool;
    const frame = this.#getResolutionFrame(binding);
    const tokenDisplayName = frame.tokenName;
    try {
      enterResolutionPath(resolutionPath, tokenDisplayName);
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
    let factoryPromise: Promise<unknown>;
    try {
      if (binding.kind === "dynamic-async") {
        factoryPromise = binding.factory(ctx);
      } else {
        const factoryResult = binding.factory(ctx);
        factoryPromise = factoryResult instanceof Promise ? factoryResult : Promise.resolve(factoryResult);
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

  // A cached candidate answers here rather than re-entering the generic path: `resolveAll` pays
  // this per candidate, and a fan-out over cached handlers is the shape that makes it matter.
  #resolveCandidateSync(
    binding: Binding,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): unknown {
    if (this.#isPlainConstant(binding)) {
      return binding.value;
    }
    if (binding.kind === "alias") {
      return this.resolve(binding.target, options, resolutionPath, resolutionStack);
    }
    if (binding.scope === "singleton" && binding.instance !== NO_INSTANCE) {
      return binding.instance;
    }
    return this.#resolveBinding(binding, options, resolutionPath, resolutionStack);
  }

  #resolveCandidateAsync(
    binding: Binding,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<unknown> {
    if (this.#isPlainConstant(binding)) {
      return Promise.resolve(binding.value);
    }
    // Candidates settle concurrently, so each gets its own path and stack.
    const isolatedPath = [...resolutionPath];
    const isolatedStack = [...resolutionStack];
    if (binding.kind === "alias") {
      return this.resolveAsync(binding.target, options, isolatedPath, isolatedStack);
    }
    if (binding.scope === "singleton" && binding.instance !== NO_INSTANCE) {
      return Promise.resolve(binding.instance);
    }
    return this.#resolveBindingAsync(binding, options, isolatedPath, isolatedStack);
  }

  #getResolutionFrame(binding: Binding): ResolutionFrame {
    // Memoized on the binding rather than in a per-resolver Map: the frame derives only from
    // immutable binding fields, so it is identical for every resolver, and a field read beats a
    // Map lookup on every hop of a chain.
    const existing = binding.frame;
    if (existing !== undefined) {
      return existing;
    }
    const frame = buildResolutionFrame(tokenName(binding.token), binding.scope, binding.id, binding.kind, binding.slot);
    binding.frame = frame;
    return frame;
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

/** Absent scoped entry — distinguishes it from a cached `undefined`. */
const SCOPED_MISS: unique symbol = Symbol("di:scoped-miss");

function anyPredicate(bindings: ReadonlyArray<Binding>): boolean {
  for (let index = 0; index < bindings.length; index += 1) {
    if (bindings[index]!.predicate !== undefined) {
      return true;
    }
  }
  return false;
}

/** Only a factory is handed the resolution context; everything else gets its deps directly. */
function requiresResolutionContext(binding: Binding): boolean {
  return binding.kind === "dynamic" || binding.kind === "dynamic-async";
}

/**
 * Whether the tag index's answer is the one `Object.is` would give.
 *
 * @remarks An indexed binding has no name, no predicate and exactly one tag, and the request carries
 * only that tag, so `matchesSlot` reduces to the tag values — and the index matched the key already.
 * It answers by SameValueZero, which parts from `Object.is` (SPEC §3.5) on exactly one pair: `+0` and
 * `-0`. So a request whose value is not zero is already exact, and only a zero-valued one is worth
 * reading the stored value for.
 */
function matchesIndexedTagValue(binding: Binding, requestedValue: unknown): boolean {
  return requestedValue !== 0 || Object.is(binding.slot.tags[0]![1], requestedValue);
}
