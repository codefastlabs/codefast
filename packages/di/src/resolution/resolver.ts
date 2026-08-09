import type { Container } from "#/container/container";
import type { Binding, ConstantBinding, DynamicAsyncBinding, DynamicBinding } from "#/core/binding";
import { NO_INSTANCE } from "#/core/binding";
import type { BindingRegistry } from "#/core/registry";
import type { Token } from "#/core/token";
import { tokenName } from "#/core/token";
import type {
  ActivationHandler,
  BindingIdentifier,
  BindingTag,
  ConstraintContext,
  Constructor,
  ResolutionFrame,
  ResolveOptions,
} from "#/core/types";
import type { ResolutionDiagnostics } from "#/errors/diagnostics";
import {
  AsyncActivationError,
  AsyncResolutionError,
  CircularDependencyError,
  InternalError,
  MissingMetadataError,
  MissingScopeContextError,
  NoMatchingBindingError,
  TokenNotBoundError,
} from "#/errors/errors";
import type { DependencySlot } from "#/injection/resolve-options";
import { isNameOnlyOptions, resolveOptionsForSlot, singleTagOnlyOf } from "#/injection/resolve-options";
import type { LifecycleManager } from "#/lifecycle/lifecycle-manager";
import type { ScopeManager } from "#/lifecycle/scope-manager";
import { SCOPED_MISS } from "#/lifecycle/scope-manager";
import type { MetadataReader, ParamMetadata } from "#/metadata/metadata-types";
import { ActivationNeedCache } from "#/resolution/cache/activation-need";
import type { DefaultLookupEntry } from "#/resolution/cache/binding-lookup-cache";
import { BindingLookupCache } from "#/resolution/cache/binding-lookup-cache";
import { ClassIntrospector } from "#/resolution/cache/class-introspector";
import type { ResolverCallbacks } from "#/resolution/context";
import {
  AsyncCascadeContext,
  AsyncLevelContext,
  buildResolutionFrame,
  DefaultResolutionContext,
} from "#/resolution/context";
import type { BranchDepth, OwnedBranchPath } from "#/resolution/path/resolution-path";
import {
  branchDepthOf,
  enterResolutionPath,
  extendResolutionBranch,
  extendResolutionStackBranch,
  ROOT_BRANCH,
  UNOWNED_BRANCH,
} from "#/resolution/path/resolution-path";
import { InstantiationPlanCompiler, PLAN_RETRY } from "#/resolution/plan/instantiation-plan";
import { matchesSlot, selectAllBindings, selectBinding } from "#/resolution/select/binding-select";

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
  /**
   * The pair a top-level **sync** resolve reuses instead of minting two arrays per call.
   *
   * @remarks Read directly rather than through an accessor returning both: a shallow resolve is one
   * top-level call, so a call and an object literal there are not amortised over anything. Every sync
   * lane pops what it pushes, so `rootStack.length === 0` means no resolve holds the pair; async
   * appends without popping and mints its own. Keeping the pair stable is also what lets a pooled
   * context skip storing pointers it already holds.
   */
  readonly rootPath: Array<string> = [];
  readonly rootStack: Array<ResolutionFrame> = [];
  // The open synchronous factory cascade: its arrays are the ancestor chain, and they are balanced
  // because synchronous code does not interleave.
  readonly #cascadePath: Array<string> = [];
  readonly #cascadeStack: Array<ResolutionFrame> = [];
  #cascadeContext: AsyncCascadeContext | undefined;
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
    this.#activation = new ActivationNeedCache(lifecycle, this.#classes, registry);
  }

  /** The reader this resolver was built with, which is the one its container answers with. */
  get metadataReader(): MetadataReader {
    return this.#metadataReader;
  }

  /** Structural counts for {@link RESOLUTION_DIAGNOSTICS}; see `resolution/diagnostics.ts`. */
  describeCaches(): Pick<ResolutionDiagnostics, "compiledPlanCount" | "syncContextPoolSize"> {
    let compiledPlanCount = 0;
    for (const plan of this.#classPlanByBindingId.values()) {
      if (plan !== null) {
        compiledPlanCount += 1;
      }
    }
    return {
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
        const tagged = this.#registry.getSimpleTagged(token, singleTag);
        if (tagged !== undefined && this.#satisfiesPredicate(tagged, options, resolutionPath, resolutionStack)) {
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

  resolveFromContext<Value>(
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
    // *is* exact path membership.
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
        throw new AsyncResolutionError(resolutionPath[0] ?? tokenDisplayName, tokenDisplayName);
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

  resolve<Value>(
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
          throw new AsyncResolutionError(resolutionPath[0] ?? tokenDisplayName, tokenDisplayName);
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
        this.#scope.setScoped(binding, activated);
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
          throw asyncResolutionErrorFor(binding, resolutionPath);
        }
        return factoryResult;
      }

      case "dynamic-async":
        throw asyncResolutionErrorFor(binding, resolutionPath);

      case "class": {
        const deps = this.#resolveDeps(this.#constructorParams(binding.target), resolutionPath, resolutionStack);
        return this.#classes.instantiate(binding.target, deps);
      }

      case "resolved": {
        const deps = this.#resolveDeps(binding.deps, resolutionPath, resolutionStack);
        const factoryResult = binding.factory(...deps);
        if (factoryResult instanceof Promise) {
          throw asyncResolutionErrorFor(binding, resolutionPath);
        }
        return factoryResult;
      }

      case "resolved-async":
        throw asyncResolutionErrorFor(binding, resolutionPath);

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
    const options = resolveOptionsForSlot(dep);
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

  resolveOptional<Value>(
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

  resolveAll<Value>(
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
    if (options !== undefined) {
      const indexed = this.#indexedCandidates(token, options, resolutionPath, resolutionStack);
      if (indexed !== null) {
        return indexed;
      }
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

  resolveAsyncFromContext<Value>(
    token: Token<Value> | Constructor<Value>,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
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
          branchDepth,
        ) as Promise<Value>;
      }
      return this.#resolveAsyncDefaultEntry(
        fastBinding,
        this,
        resolutionPath,
        resolutionStack,
        branchDepth,
      ) as Promise<Value>;
    }
    const entry = this.#lookup.defaultEntry(token);
    if (entry === null) {
      return this.resolveAsync(token, undefined, resolutionPath, resolutionStack, branchDepth);
    }
    return this.#resolveAsyncDefaultEntry(
      entry.binding,
      entry.owner,
      resolutionPath,
      resolutionStack,
      branchDepth,
    ) as Promise<Value>;
  }

  #resolveAsyncDefaultEntry(
    binding: Binding,
    owner: DependencyResolver,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
  ): Promise<unknown> {
    if (this.#isPlainConstant(binding)) {
      return Promise.resolve(binding.value);
    }
    const scope = binding.scope;
    if (scope === "transient") {
      if ((binding.kind === "dynamic" || binding.kind === "dynamic-async") && !this.#hasAnyActivation(binding)) {
        return this.#resolveTransientDynamicAsyncFromContext(binding, resolutionPath, resolutionStack, branchDepth);
      }
    } else if (scope === "singleton") {
      if (binding.instance !== NO_INSTANCE) {
        return Promise.resolve(binding.instance);
      }
      if (owner !== this) {
        return owner.#resolveBindingAsync(binding, undefined, resolutionPath, resolutionStack, branchDepth);
      }
    } else if (this.#scope.isChild) {
      const cachedScoped = this.#scope.readScoped(binding.id);
      if (cachedScoped !== SCOPED_MISS) {
        return Promise.resolve(cachedScoped);
      }
    } else {
      // Not `#readScoped`: this entry point reports failure as a rejection, never a sync throw.
      return Promise.reject(new MissingScopeContextError(tokenName(binding.token)));
    }
    return this.#resolveBindingAsync(binding, undefined, resolutionPath, resolutionStack, branchDepth);
  }

  async resolveAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth = UNOWNED_BRANCH,
  ): Promise<Value> {
    const { binding, owner } = this.#requireBinding(token, options, resolutionPath, resolutionStack);

    if (binding.scope === "singleton" && owner !== this) {
      return owner.#resolveBindingAsync(binding, options, resolutionPath, resolutionStack, branchDepth) as Value;
    }
    return this.#resolveBindingAsync(binding, options, resolutionPath, resolutionStack, branchDepth) as Value;
  }

  async #resolveBindingAsync(
    binding: Binding,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
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
    // This level appends to its own branch and never unwinds.
    const levelPath = extendResolutionBranch(resolutionPath, branchDepth, frame.tokenName);
    const levelStack = extendResolutionStackBranch(resolutionStack, branchDepth, frame);
    const levelDepth = branchDepthOf(levelPath);

    const needsActivation = this.#activation.needsActivation(binding);
    if (!needsActivation && scope === "transient" && (binding.kind === "dynamic" || binding.kind === "dynamic-async")) {
      const resolutionCtx = new AsyncLevelContext(this, levelPath, levelStack, options);
      if (binding.kind === "dynamic-async") {
        return await binding.factory(resolutionCtx);
      }
      const dynamicResult = binding.factory(resolutionCtx);
      return dynamicResult instanceof Promise ? await dynamicResult : dynamicResult;
    }

    const resolutionCtx =
      needsActivation || requiresResolutionContext(binding)
        ? new AsyncLevelContext(this, levelPath, levelStack, options)
        : undefined;

    if (scope === "singleton") {
      // The promise is published before it settles, so concurrent callers dedup onto it.
      const singletonPromise = this.#instantiateAndActivateAsync(
        binding,
        resolutionCtx,
        levelPath,
        levelStack,
        levelDepth,
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
      levelPath,
      levelStack,
      levelDepth,
      needsActivation,
    );
    if (scope === "scoped") {
      this.#scope.setScoped(binding, activated);
    }
    return activated;
  }

  async #instantiateAndActivateAsync(
    binding: Binding,
    ctx: AsyncLevelContext | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
    needsActivation: boolean,
  ): Promise<unknown> {
    const instance = await this.#instantiateAsync(binding, ctx, resolutionPath, resolutionStack, branchDepth);
    if (!this.#activation.refreshAfterFirstInstantiation(binding, needsActivation)) {
      return instance;
    }
    return this.#lifecycle.runActivation(ctx as AsyncLevelContext, binding, instance, this.#metadataReader);
  }

  async #instantiateAsync(
    binding: Binding,
    ctx: AsyncLevelContext | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
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
          branchDepth,
        );
        return this.#classes.instantiate(binding.target, deps);
      }

      case "resolved": {
        const deps = await this.#resolveDepsAsync(binding.deps, resolutionPath, resolutionStack, branchDepth);
        const factoryResult = binding.factory(...deps);
        return factoryResult instanceof Promise ? factoryResult : Promise.resolve(factoryResult);
      }

      case "resolved-async": {
        const deps = await this.#resolveDepsAsync(binding.deps, resolutionPath, resolutionStack, branchDepth);
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
    branchDepth: BranchDepth,
  ): Promise<Array<unknown>> {
    const count = deps.length;
    if (count === 0) {
      return [];
    }
    if (count === 1) {
      return [await this.#resolveDepAsync(deps[0]!, resolutionPath, resolutionStack, branchDepth)];
    }
    // Siblings resolve concurrently and each extends the same branch, so the first appends in
    // place and the rest copy the prefix — no caller has to isolate them.
    const pending = new Array<Promise<unknown>>(count);
    for (let index = 0; index < count; index += 1) {
      pending[index] = this.#resolveDepAsync(deps[index]!, resolutionPath, resolutionStack, branchDepth);
    }
    return Promise.all(pending);
  }

  #resolveDepAsync(
    dep: DependencySlot,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
  ): Promise<unknown> {
    const options = resolveOptionsForSlot(dep);
    if (dep.multi) {
      return this.resolveAllAsync(dep.token, options, resolutionPath, resolutionStack, branchDepth);
    }
    if (dep.optional) {
      return this.resolveOptionalAsync(dep.token, options, resolutionPath, resolutionStack, branchDepth);
    }
    if (options === undefined) {
      return this.resolveAsyncFromContext(dep.token, resolutionPath, resolutionStack, branchDepth);
    }
    return this.resolveAsync(dep.token, options, resolutionPath, resolutionStack, branchDepth);
  }

  async resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth = UNOWNED_BRANCH,
  ): Promise<Value | undefined> {
    if (this.#findBinding(token, options, resolutionPath, resolutionStack) === undefined) {
      return undefined;
    }
    return this.resolveAsync(token, options, resolutionPath, resolutionStack, branchDepth);
  }

  async resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth = UNOWNED_BRANCH,
  ): Promise<Array<Value>> {
    const candidates = this.#candidateBindings(token, options, resolutionPath, resolutionStack);
    const pending = new Array<Promise<Value>>(candidates.length);
    for (let index = 0; index < candidates.length; index += 1) {
      pending[index] = this.#resolveCandidateAsync(
        candidates[index]!,
        options,
        resolutionPath,
        resolutionStack,
        branchDepth,
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

  /**
   * The candidates an index can name outright, or `null` when the request needs full selection.
   *
   * @remarks Kept off `#candidateBindings` so that method stays the size it was: a request neither
   * index serves must not pay for the two that do.
   * An index has matched the slot already, but a hit may still carry a predicate, and evaluating
   * that is the selection path's job.
   */
  #indexedCandidates(
    token: Token<unknown> | Constructor,
    options: ResolveOptions,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): ReadonlyArray<Binding> | null {
    if (isNameOnlyOptions(options)) {
      const named = this.#namedBindingsFromChain(token, options.name);
      return anyPredicate(named)
        ? selectAllBindings(named, options, this.#makeConstraintContext(resolutionPath, resolutionStack, options))
        : named;
    }
    const singleTag = singleTagOnlyOf(options);
    if (singleTag === undefined) {
      return null;
    }
    const tagged = this.#taggedBindingsFromChain(token, singleTag);
    return anyPredicate(tagged)
      ? selectAllBindings(tagged, options, this.#makeConstraintContext(resolutionPath, resolutionStack, options))
      : tagged;
  }

  /**
   * Every binding the chain's tag indexes hold for one tag, nearest container first.
   *
   * @remarks A request for one tag and no name matches exactly the bindings the index keys, so this
   * is the whole candidate set rather than a prefilter — a named or multi-tag slot cannot satisfy it.
   */
  #taggedBindingsFromChain(token: Token<unknown> | Constructor, tag: BindingTag): Array<Binding> {
    // A tag matches at most one binding per registry, so a root container's answer is built whole
    // rather than grown — the shape `#namedBindingsFromChain` takes, for the same reason.
    const ownBinding = this.#registry.getSimpleTagged(token, tag);
    if (this.#parent === undefined) {
      return ownBinding === undefined ? [] : [ownBinding];
    }
    const result: Array<Binding> = ownBinding === undefined ? [] : [ownBinding];
    for (let current: DependencyResolver | undefined = this.#parent; current !== undefined; current = current.#parent) {
      const binding = current.#registry.getSimpleTagged(token, tag);
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
    return this.#scope.readScoped(binding.id);
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
    return this.#satisfiesPredicate(binding, options, resolutionPath, resolutionStack);
  }

  /** The predicate half of a match, for a lane whose index has already settled the slot. */
  #satisfiesPredicate(
    binding: Binding,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): boolean {
    const predicate = binding.predicate;
    if (predicate === undefined) {
      return true;
    }
    return predicate(this.#makeConstraintContext(resolutionPath, resolutionStack, options));
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
        throw new AsyncResolutionError(resolutionPath[0] ?? tokenDisplayName, tokenDisplayName);
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
    branchDepth: BranchDepth,
  ): Promise<unknown> {
    const frame = this.#getResolutionFrame(binding);
    let levelPath: OwnedBranchPath;
    try {
      levelPath = extendResolutionBranch(resolutionPath, branchDepth, frame.tokenName);
    } catch (cycleError) {
      // This method is not `async`; keep failures as rejections rather than sync throws.
      return Promise.reject(cycleError);
    }
    const levelStack = extendResolutionStackBranch(resolutionStack, branchDepth, frame);

    // Nothing this level appended is ever removed, so no level observes its own settlement.
    const ctx = new AsyncLevelContext(this, levelPath, levelStack, undefined);
    try {
      if (binding.kind === "dynamic-async") {
        return binding.factory(ctx);
      }
      const factoryResult = binding.factory(ctx);
      return factoryResult instanceof Promise ? factoryResult : Promise.resolve(factoryResult);
    } catch (factoryError) {
      return Promise.reject(factoryError);
    }
  }

  // ── The cascade lane ───────────────────────────────────────────────────────

  /**
   * Entry for a request a factory makes from inside an open synchronous cascade.
   *
   * @remarks A request arriving with no cascade open came out of a continuation, so its ancestors
   * are on no call stack — it escapes to the branch lane.
   */
  resolveAsyncFromCascade(token: Token<unknown> | Constructor): Promise<unknown> {
    if (this.#cascadePath.length === 0) {
      return this.resolveAsyncFromContext(token, [], [], ROOT_BRANCH);
    }
    return this.#dispatchCascade(token);
  }

  /** Entry for a resolve the container starts, which opens the cascade rather than joining one. */
  resolveAsyncFromRoot(token: Token<unknown> | Constructor): Promise<unknown> {
    return this.#dispatchCascade(token);
  }

  #dispatchCascade(token: Token<unknown> | Constructor): Promise<unknown> {
    const fastBinding = this.#registry.getFastDefault(token);
    if (fastBinding !== undefined) {
      if (
        (fastBinding.kind === "dynamic-async" || fastBinding.kind === "dynamic") &&
        fastBinding.scope === "transient" &&
        !this.#hasAnyActivation(fastBinding)
      ) {
        return this.#resolveTransientDynamicAsyncCascade(fastBinding);
      }
      // A value that already exists answers here: escaping would snapshot the cascade for a resolve
      // that never looks at a path.
      if (this.#isPlainConstant(fastBinding)) {
        return Promise.resolve(fastBinding.value);
      }
      if (fastBinding.scope === "singleton" && fastBinding.instance !== NO_INSTANCE) {
        return Promise.resolve(fastBinding.instance);
      }
    }
    // Anything else leaves the cascade lane for good, seeded with a snapshot of the ancestors it
    // accumulated — so a cycle across the boundary is still on one path.
    return this.resolveAsyncFromContext(token, [...this.#cascadePath], [...this.#cascadeStack], UNOWNED_BRANCH);
  }

  #resolveTransientDynamicAsyncCascade(
    binding: DynamicBinding<unknown> | DynamicAsyncBinding<unknown>,
  ): Promise<unknown> {
    const frame = this.#getResolutionFrame(binding);
    // The request that closes a cycle is made from a factory's synchronous prefix, and synchronous
    // code does not interleave — so the O(1) flag is exact path membership here, as it is for the
    // sync lane. It is cleared when the factory returns its promise, not when that promise settles.
    if (binding.inFlight) {
      return Promise.reject(new CircularDependencyError([...this.#cascadePath, frame.tokenName]));
    }
    const ctx = (this.#cascadeContext ??= new AsyncCascadeContext(this, this.#cascadePath, this.#cascadeStack));
    binding.inFlight = true;
    this.#cascadePath.push(frame.tokenName);
    this.#cascadeStack.push(frame);
    try {
      if (binding.kind === "dynamic-async") {
        return binding.factory(ctx);
      }
      const factoryResult = binding.factory(ctx);
      return factoryResult instanceof Promise ? factoryResult : Promise.resolve(factoryResult);
    } catch (factoryError) {
      return Promise.reject(factoryError);
    } finally {
      this.#cascadeStack.pop();
      this.#cascadePath.pop();
      binding.inFlight = false;
    }
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
    branchDepth: BranchDepth,
  ): Promise<unknown> {
    if (this.#isPlainConstant(binding)) {
      return Promise.resolve(binding.value);
    }
    if (binding.kind === "alias") {
      return this.resolveAsync(binding.target, options, resolutionPath, resolutionStack, branchDepth);
    }
    if (binding.scope === "singleton" && binding.instance !== NO_INSTANCE) {
      return Promise.resolve(binding.instance);
    }
    return this.#resolveBindingAsync(binding, options, resolutionPath, resolutionStack, branchDepth);
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

function anyPredicate(bindings: ReadonlyArray<Binding>): boolean {
  for (let index = 0; index < bindings.length; index += 1) {
    if (bindings[index]!.predicate !== undefined) {
      return true;
    }
  }
  return false;
}

/** The async-resolution failure for a binding reached on a sync path, naming what to await instead. */
function asyncResolutionErrorFor(binding: Binding, resolutionPath: ReadonlyArray<string>): AsyncResolutionError {
  const sourceName = tokenName(binding.token);
  return new AsyncResolutionError(resolutionPath[0] ?? sourceName, sourceName);
}

/** Only a factory is handed the resolution context; everything else gets its deps directly. */
function requiresResolutionContext(binding: Binding): boolean {
  return binding.kind === "dynamic" || binding.kind === "dynamic-async";
}
