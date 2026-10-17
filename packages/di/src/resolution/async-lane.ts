/** The async resolution lane: one per resolver, built by the first async request so a sync-only program never ships it. */
import type { Binding, DynamicAsyncBinding, DynamicBinding } from "#core/binding";
import { NO_INSTANCE } from "#core/binding";
import type { BindingRegistry } from "#core/registry";
import type { Token } from "#core/token";
import { tokenName } from "#core/token";
import type { BindingIdentifier, BindingTag, Constructor, ResolutionFrame, ResolveOptions } from "#core/types";
import { CircularDependencyError, DisposedContainerError, InternalError } from "#errors";
import type { DependencySlot } from "#injection/dependency-slot";
import { resolveOptionsForSlot, singleCriterionForSlot, singleCriterionOnlyOf } from "#injection/dependency-slot";
import type { LifecycleManager } from "#lifecycle/hooks";
import type { ScopeManager } from "#lifecycle/scopes";
import { SCOPED_MISS } from "#lifecycle/scopes";
import { settleInOrder } from "#resolution/async-fan-out";
import type { ActivationNeedCache } from "#resolution/cache/activation-need";
import type { BindingLookupCache } from "#resolution/cache/lookup";
import type { AsyncLaneCallbacks } from "#resolution/context";
import { AsyncLevelContext } from "#resolution/context";
import type { BranchDepth, OwnedBranchStack } from "#resolution/path";
import { branchDepthOf, cycleNamesOf, extendResolutionBranch, ROOT_BRANCH, UNOWNED_BRANCH } from "#resolution/path";
import type { AsyncPlanHost } from "#resolution/plan/async-compiler";
import { AsyncPlanCompiler } from "#resolution/plan/async-compiler";
import { PLAN_RETRY } from "#resolution/plan/compiler";
import type { AsyncLaneState, DependencyResolver } from "#resolution/resolver";
import {
  countCompiledPlans,
  hasAnyActivationIn,
  isPlainConstantIn,
  NO_ARGUMENTS,
  readScopedIn,
  requiresResolutionContext,
  resolutionFrameOf,
  resolverInternals,
} from "#resolution/resolver";

const R = resolverInternals();

/**
 * A resolver's async lane: the `#settle*` pipeline, its compiled plans and the root level's context.
 *
 * @remarks Reads the resolver's private state through its accessors, so moving the lane out of the resolver class
 * changed what a sync-only program bundles and nothing about what the sync lanes run.
 */
export class AsyncLane implements AsyncLaneCallbacks, AsyncLaneState {
  readonly resolver: DependencyResolver;
  readonly #registry: BindingRegistry;
  readonly #scope: ScopeManager;
  readonly #lookup: BindingLookupCache<DependencyResolver>;
  readonly #lifecycle: LifecycleManager;
  // The last root level's context, kept so one instance is always live: a full collection that finds
  // none deoptimizes every optimized site that embedded the class's shape, and does so on every
  // collection after — measured on the async chain rows, and removed by this one field.
  #recentRootLevelContext: AsyncLevelContext | undefined;
  // The async lane's plans, stamped and invalidated apart from the sync lane's so neither pays the other's misses.
  #asyncPlanByBindingId: Map<BindingIdentifier, (() => unknown) | null> | undefined;
  #asyncPlanRequestedOnce: Set<BindingIdentifier> | undefined;
  #asyncPlanRegistryVersion = -1;
  #asyncPlanActivationVersion = -1;
  #planCompiler: AsyncPlanCompiler | undefined;
  #activation: ActivationNeedCache | undefined;

  private constructor(resolver: DependencyResolver) {
    this.resolver = resolver;
    this.#registry = R.registry(resolver);
    this.#scope = R.scope(resolver);
    this.#lookup = R.lookup(resolver);
    this.#lifecycle = R.lifecycle(resolver);
  }

  /** The lane of `resolver`, built on its first async request. */
  static of(resolver: DependencyResolver): AsyncLane {
    const existing = R.asyncLane(resolver);
    if (existing !== undefined) {
      return existing as AsyncLane;
    }
    const lane = new AsyncLane(resolver);
    R.setAsyncLane(resolver, lane);
    return lane;
  }

  get compiledPlanCount(): number {
    return countCompiledPlans(this.#asyncPlanByBindingId);
  }

  get generatedPlanCount(): number {
    return this.#planCompiler?.generatedPlanCount ?? 0;
  }

  get hasPlanCompiler(): boolean {
    return this.#planCompiler !== undefined;
  }

  get hasRootLevelContext(): boolean {
    return this.#recentRootLevelContext !== undefined;
  }

  // A binding's owner is this lane's resolver on the common lanes, which read its collaborators here, not through accessors.
  #lifecycleOf(owner: DependencyResolver): LifecycleManager {
    return owner === this.resolver ? this.#lifecycle : R.lifecycle(owner);
  }

  #activationNeedOf(owner: DependencyResolver): ActivationNeedCache {
    return owner === this.resolver ? (this.#activation ??= R.activationNeed(owner)) : R.activationNeed(owner);
  }

  // Built on the first async plan, so a lane that never compiles one never pays for the host.
  #compiler(): AsyncPlanCompiler {
    return (this.#planCompiler ??= new AsyncPlanCompiler(this.#buildPlanHost()));
  }

  // The sync host's lookups and escapes, plus the async plan map and the async lane's dispatch.
  #buildPlanHost(): AsyncPlanHost {
    return {
      ...R.planHost(this.resolver),
      // Identity-guarded: a map cleared and recompiled since no longer holds the plan being replaced.
      replaceAsyncPlan: (binding, current, next) => {
        const plans = this.#asyncPlanByBindingId;
        if (plans !== undefined && plans.get(binding.identifier) === current) {
          plans.set(binding.identifier, next);
        }
      },
      // Dispatches exactly as #settleDep does, for the async lane's escapes.
      resolveEscapedAsync: (token, options, arity, resolutionStack) => {
        if (arity === "all") {
          return this.resolveAllAsync(token, options, resolutionStack, UNOWNED_BRANCH);
        }
        if (arity === "optional") {
          return this.resolveOptionalAsync(token, options, resolutionStack, UNOWNED_BRANCH);
        }
        if (options === undefined) {
          return this.resolveAsyncFromContext(token, resolutionStack, UNOWNED_BRANCH);
        }
        return this.resolveAsync(token, options, resolutionStack, UNOWNED_BRANCH);
      },
    };
  }

  // A `#settle*` lane answers with the value when its level completed in this tick and with a promise
  // only where something had to be awaited, so a singleton or scoped instance built without yielding
  // is cached before the fan-out that started it moves on to a sibling that may read it synchronously.

  /** The async lane's plan for a statically-visible transient binding, mirroring the sync getter. */
  #getAsyncInstantiationPlan(
    binding: Binding & { kind: "class" | "resolved" | "resolved-async" },
  ): (() => unknown) | null {
    const registryVersion = this.#lookup.chainVersion();
    const activationVersion = R.chainActivationVersion(this.resolver);
    if (registryVersion !== this.#asyncPlanRegistryVersion || activationVersion !== this.#asyncPlanActivationVersion) {
      if (this.#asyncPlanByBindingId === undefined) {
        this.#asyncPlanByBindingId = new Map<BindingIdentifier, (() => unknown) | null>();
      } else {
        this.#asyncPlanByBindingId.clear();
        this.#asyncPlanRequestedOnce?.clear();
      }
      this.#asyncPlanRegistryVersion = registryVersion;
      this.#asyncPlanActivationVersion = activationVersion;
    }
    const plans = this.#asyncPlanByBindingId!;
    const cached = plans.get(binding.identifier);
    if (cached !== undefined) {
      return cached;
    }
    const requestedOnce = (this.#asyncPlanRequestedOnce ??= new Set<BindingIdentifier>());
    if (!requestedOnce.has(binding.identifier)) {
      requestedOnce.add(binding.identifier);
      return null;
    }
    const compiled = this.#compiler().compile(binding);
    if (compiled === PLAN_RETRY) {
      // Lifecycle metadata not discovered yet — the fallback resolve discovers it; retry then.
      return null;
    }
    plans.set(binding.identifier, compiled);
    return compiled;
  }

  /** The async twin of `resolveRootCollection`: a stable value list answers at once, candidates fan out as usual. */
  resolveRootCollectionAsync<Value>(token: Token<Value> | Constructor<Value>): Promise<ReadonlyArray<Value>> {
    // The async lane appends to its branch and never unwinds, so it works on a stack of its own.
    const resolutionStack: Array<ResolutionFrame> = [];
    try {
      // Selection runs `when()` predicates and follows aliases, either of which may throw.
      const memo = R.rootCollection(this.resolver, token, resolutionStack);
      if (memo.values !== undefined && memo.activationVersion === R.chainActivationVersion(this.resolver)) {
        return Promise.resolve(memo.values.slice() as Array<Value>);
      }
      return asPromise(
        this.#settleCandidates(memo.candidates, undefined, resolutionStack, UNOWNED_BRANCH, (values) => {
          R.settleOnRepeat(this.resolver, memo);
          return values;
        }),
      ) as Promise<ReadonlyArray<Value>>;
    } catch (collectionError) {
      return Promise.reject(collectionError);
    }
  }

  resolveAsyncFromContext<Value>(
    token: Token<Value> | Constructor<Value>,
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
        !hasAnyActivationIn(this.#lifecycle, fastBinding)
      ) {
        return this.#resolveTransientDynamicAsyncFromContext(
          fastBinding,
          resolutionStack,
          branchDepth,
        ) as Promise<Value>;
      }
      return this.#resolveAsyncDefaultEntry(fastBinding, this.resolver, resolutionStack, branchDepth) as Promise<Value>;
    }
    const entry = this.#lookup.defaultEntry(token);
    if (entry === null) {
      return this.resolveAsync(token, undefined, resolutionStack, branchDepth);
    }
    return this.#resolveAsyncDefaultEntry(entry.binding, entry.owner, resolutionStack, branchDepth) as Promise<Value>;
  }

  #resolveAsyncDefaultEntry(
    binding: Binding,
    owner: DependencyResolver,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
  ): Promise<unknown> {
    try {
      return asPromise(this.#settleDefaultEntry(binding, owner, resolutionStack, branchDepth));
    } catch (entryError) {
      // Not `async`: a failure is turned into the rejection the entry point promises.
      return Promise.reject(entryError);
    }
  }

  /** `resolveAsyncFromContext` for a dependency slot: the same lanes, answered in this tick where they can be. */
  #settleDefault(
    token: Token<unknown> | Constructor,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
  ): unknown {
    const fastBinding = this.#registry.getFastDefault(token);
    if (fastBinding !== undefined && fastBinding.kind !== "alias") {
      return this.#settleDefaultEntry(fastBinding, this.resolver, resolutionStack, branchDepth);
    }
    const entry = this.#lookup.defaultEntry(token);
    if (entry === null) {
      return this.#settleRequest(token, undefined, resolutionStack, branchDepth);
    }
    return this.#settleDefaultEntry(entry.binding, entry.owner, resolutionStack, branchDepth);
  }

  #settleDefaultEntry(
    binding: Binding,
    owner: DependencyResolver,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
  ): unknown {
    if (isPlainConstantIn(this.#lifecycleOf(owner), binding)) {
      return binding.value;
    }
    const scope = binding.scope;
    if (scope === "transient") {
      if (
        (binding.kind === "dynamic" || binding.kind === "dynamic-async") &&
        !hasAnyActivationIn(this.#lifecycleOf(owner), binding)
      ) {
        return this.#settleTransientFactory(binding, resolutionStack, branchDepth);
      }
    } else if (scope === "singleton") {
      if (binding.instance !== NO_INSTANCE) {
        return binding.instance;
      }
      if (owner !== this.resolver) {
        return AsyncLane.of(owner).#settleBinding(binding, undefined, resolutionStack, branchDepth, owner);
      }
    } else {
      const cachedScoped = readScopedIn(this.#scope, binding);
      if (cachedScoped !== SCOPED_MISS) {
        return cachedScoped;
      }
    }
    return this.#settleBinding(binding, undefined, resolutionStack, branchDepth, owner);
  }

  /**
   * Instantiates one owned binding directly, bypassing selection.
   *
   * @remarks Warm-up must build the binding it inspected: re-selecting by the slot's own criteria
   * could pick a different candidate whose criteria are a subset of them.
   */
  warmBindingAsync(binding: Binding, options: ResolveOptions | undefined): Promise<unknown> {
    try {
      return asPromise(this.#settleBinding(binding, options, [], ROOT_BRANCH, this.resolver));
    } catch (bindingError) {
      return Promise.reject(bindingError);
    }
  }

  resolveAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth = UNOWNED_BRANCH,
    precomputedCriterion?: BindingTag | null,
  ): Promise<Value> {
    try {
      return asPromise(
        this.#settleRequest(token, options, resolutionStack, branchDepth, precomputedCriterion),
      ) as Promise<Value>;
    } catch (requestError) {
      return Promise.reject(requestError);
    }
  }

  /** Selects the binding a request names and settles it on the async lane. */
  #settleRequest(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
    precomputedCriterion?: BindingTag | null,
  ): unknown {
    const path = ownPrefixOf(resolutionStack, branchDepth);
    const depth = path === resolutionStack ? branchDepth : branchDepthOf(path as OwnedBranchStack);
    const { binding, owner } = R.requireBinding(this.resolver, token, options, path, precomputedCriterion);

    if (binding.scope === "singleton" && owner !== this.resolver) {
      return AsyncLane.of(owner).#settleBinding(binding, options, path, depth, owner);
    }
    return this.#settleBinding(binding, options, path, depth, owner);
  }

  /**
   * Materialises one binding on the async lane: the instance once nothing yielded, else its promise.
   *
   * @remarks A singleton or scoped instance built in this tick is cached in this tick, so a sibling
   * reading it synchronously finds it; only a materialisation still pending is published in flight.
   */
  #settleBinding(
    binding: Binding,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
    owner: DependencyResolver,
  ): unknown {
    if (isPlainConstantIn(this.#lifecycleOf(owner), binding)) {
      return binding.value;
    }

    const scope = binding.scope;
    if (scope === "singleton") {
      if (binding.instance !== NO_INSTANCE) {
        return binding.instance;
      }
      // In-flight dedup: concurrent callers share the first creation.
      const inflight = this.#scope.getInflight(binding.identifier);
      if (inflight !== undefined) {
        return ownPromiseOf(inflight);
      }
      if (this.#scope.isClosed) {
        throw new DisposedContainerError();
      }
    } else if (scope === "scoped") {
      const cachedScoped = readScopedIn(this.#scope, binding);
      if (cachedScoped !== SCOPED_MISS) {
        return cachedScoped;
      }
      // In-flight dedup, scoped flavor: one instance per scope even under concurrency.
      const inflight = this.#scope.getInflight(binding.identifier);
      if (inflight !== undefined) {
        return ownPromiseOf(inflight);
      }
      if (this.#scope.isClosed) {
        throw new DisposedContainerError();
      }
    }

    const frame = resolutionFrameOf(binding);
    // This level appends to its own branch and never unwinds.
    const levelStack = extendResolutionBranch(resolutionStack, branchDepth, frame);
    const levelDepth = branchDepthOf(levelStack);

    const needsActivation = this.#activationNeedOf(owner).needsActivation(binding);
    if (!needsActivation && scope === "transient" && (binding.kind === "dynamic" || binding.kind === "dynamic-async")) {
      const resolutionCtx = new AsyncLevelContext(this, levelStack, options);
      if (branchDepth === ROOT_BRANCH) {
        this.#recentRootLevelContext = resolutionCtx;
      }
      return runFactoryPrefix(binding, resolutionCtx, levelStack);
    }

    const resolutionCtx =
      needsActivation || requiresResolutionContext(binding)
        ? new AsyncLevelContext(this, levelStack, options)
        : undefined;
    if (resolutionCtx !== undefined && branchDepth === ROOT_BRANCH) {
      this.#recentRootLevelContext = resolutionCtx;
    }

    const activated = this.#settleActivated(binding, resolutionCtx, levelStack, levelDepth, needsActivation, owner);
    if (scope === "transient") {
      return activated;
    }
    if (isPending(activated)) {
      return this.#publishInFlight(binding, activated, scope, owner);
    }
    if (scope === "singleton") {
      this.#scope.setSingleton(binding, activated);
    } else {
      this.#scope.setScoped(binding, activated, owner);
    }
    return activated;
  }

  /**
   * Publishes a pending singleton or scoped materialisation so concurrent callers dedup onto it,
   * and caches what it settles to; the creator, like every joiner, is handed a promise of its own.
   */
  #publishInFlight(
    binding: Binding,
    pending: Promise<unknown>,
    scope: "singleton" | "scoped",
    owner: DependencyResolver,
  ): Promise<unknown> {
    const published = pending.then(
      (activated) => {
        if (scope === "singleton") {
          this.#scope.setSingleton(binding, activated);
        } else {
          this.#scope.setScoped(binding, activated, owner);
        }
        this.#scope.clearInflight(binding.identifier);
        return activated;
      },
      (error: unknown) => {
        this.#scope.clearInflight(binding.identifier);
        throw error;
      },
    );
    this.#scope.setInflight(binding.identifier, published);
    return ownPromiseOf(published);
  }

  /** The activated instance: built and activated in this tick when nothing yielded, else its promise. */
  #settleActivated(
    binding: Binding,
    ctx: AsyncLevelContext | undefined,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
    needsActivation: boolean,
    owner: DependencyResolver,
  ): unknown {
    const instance = this.#settleInstance(binding, ctx, resolutionStack, branchDepth);
    if (isPending(instance)) {
      return instance.then((built) => this.#activateAsync(binding, ctx, built, needsActivation, owner));
    }
    return this.#activateAsync(binding, ctx, instance, needsActivation, owner);
  }

  #activateAsync(
    binding: Binding,
    ctx: AsyncLevelContext | undefined,
    instance: unknown,
    needsActivation: boolean,
    owner: DependencyResolver,
  ): unknown {
    R.mirrorPostConstructFromOwner(this.resolver, binding, owner);
    if (!this.#activationNeedOf(owner).refreshAfterFirstInstantiation(binding, needsActivation)) {
      return instance;
    }
    return this.#lifecycleOf(owner).runActivation(ctx as AsyncLevelContext, binding, instance, owner.metadataReader);
  }

  /** The instance a binding builds: in this tick when every dependency settled in it, else its promise. */
  #settleInstance(
    binding: Binding,
    ctx: AsyncLevelContext | undefined,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
  ): unknown {
    switch (binding.kind) {
      case "constant":
        return binding.value;

      case "dynamic":
      case "dynamic-async": {
        if (ctx === undefined) {
          throw new InternalError("dynamic binding requires resolution context");
        }
        return runFactoryPrefix(binding, ctx, resolutionStack);
      }

      case "class": {
        const introspector = R.introspector(this.resolver);
        const target = binding.target;
        const facts = introspector.facts(target);
        const params = R.constructorParams(this.resolver, target, facts);
        const needsActiveContainer = introspector.needsActiveContainerOf(target, facts);
        // Accessor initializers resolve synchronously, so the branch-owned path serves them directly.
        const ambient = needsActiveContainer ? R.ambientResolutionFor(this.resolver, resolutionStack) : undefined;
        if (params.length === 0) {
          return introspector.construct(target, NO_ARGUMENTS, needsActiveContainer, ambient);
        }
        const deps = this.#settleDeps(params, resolutionStack, branchDepth);
        if (isPending(deps)) {
          return deps.then((settled) => introspector.construct(target, settled, needsActiveContainer, ambient));
        }
        return introspector.construct(target, deps, needsActiveContainer, ambient);
      }

      case "resolved": {
        const factory = binding.factory;
        const deps = this.#settleDeps(binding.deps, resolutionStack, branchDepth);
        return isPending(deps) ? deps.then((settled) => factory(...settled)) : factory(...deps);
      }

      case "resolved-async": {
        const factory = binding.factory;
        const deps = this.#settleDeps(binding.deps, resolutionStack, branchDepth);
        return isPending(deps) ? deps.then((settled) => factory(...settled)) : factory(...deps);
      }

      case "alias":
        throw new InternalError("alias should have been followed before instantiation");
    }
  }

  /**
   * One level's dependencies: their values when every one settled in this tick, else the fan-out
   * that settles them in declaration order.
   */
  #settleDeps(
    deps: ReadonlyArray<DependencySlot>,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
  ): Array<unknown> | Promise<Array<unknown>> {
    const count = deps.length;
    if (count === 0) {
      return [];
    }
    if (count === 1) {
      const only = this.#settleDep(deps[0]!, resolutionStack, branchDepth);
      return isPending(only) ? only.then(settledAlone) : [only];
    }
    // Siblings start concurrently and each extends the same branch, so the first appends in
    // place and the rest copy the prefix — no caller has to isolate them. A sibling's sync throw
    // becomes its slot's rejection so the ones after it still start, as on every other lane.
    const pending = new Array<unknown>(count);
    let yielded = false;
    for (let index = 0; index < count; index += 1) {
      let settled: unknown;
      try {
        settled = this.#settleDep(deps[index]!, resolutionStack, branchDepth);
      } catch (dependencyError) {
        settled = Promise.reject(dependencyError);
      }
      if (isPending(settled)) {
        yielded = true;
      }
      pending[index] = settled;
    }
    return yielded ? settleInOrder(pending, identity) : pending;
  }

  #settleDep(dep: DependencySlot, resolutionStack: Array<ResolutionFrame>, branchDepth: BranchDepth): unknown {
    const options = resolveOptionsForSlot(dep);
    if (dep.multi) {
      return this.#settleCollection(dep.token, options, resolutionStack, branchDepth);
    }
    if (dep.optional) {
      return this.#settleOptionalRequest(dep.token, options, resolutionStack, branchDepth, singleCriterionForSlot(dep));
    }
    if (options === undefined) {
      return this.#settleDefault(dep.token, resolutionStack, branchDepth);
    }
    return this.#settleRequest(dep.token, options, resolutionStack, branchDepth, singleCriterionForSlot(dep));
  }

  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth = UNOWNED_BRANCH,
    precomputedCriterion?: BindingTag | null,
  ): Promise<Value | undefined> {
    try {
      return asPromise(
        this.#settleOptionalRequest(token, options, resolutionStack, branchDepth, precomputedCriterion),
      ) as Promise<Value | undefined>;
    } catch (requestError) {
      return Promise.reject(requestError);
    }
  }

  #settleOptionalRequest(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
    precomputedCriterion?: BindingTag | null,
  ): unknown {
    const path = ownPrefixOf(resolutionStack, branchDepth);
    const depth = path === resolutionStack ? branchDepth : branchDepthOf(path as OwnedBranchStack);
    const singleCriterion =
      precomputedCriterion === undefined ? singleCriterionOnlyOf(options) : (precomputedCriterion ?? undefined);
    let entry = R.findBinding(this.resolver, token, options, path, singleCriterion);
    // Same single-evaluation contract as the sync lane: resolve what the probe found.
    if (entry !== undefined && entry.binding.kind === "alias") {
      // Follow the alias off the throwing path: a chain that ends nowhere is a miss, not an error.
      entry = R.terminalOfAliasBinding(this.resolver, entry.binding, options, path, singleCriterion);
    }
    if (entry === undefined) {
      return undefined;
    }
    const { binding, owner } = entry;
    if (binding.scope === "singleton" && owner !== this.resolver) {
      return AsyncLane.of(owner).#settleBinding(binding, options, path, depth, owner);
    }
    return this.#settleBinding(binding, options, path, depth, owner);
  }

  resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth = UNOWNED_BRANCH,
  ): Promise<ReadonlyArray<Value>> {
    try {
      return asPromise(this.#settleCollection(token, options, resolutionStack, branchDepth)) as Promise<
        ReadonlyArray<Value>
      >;
    } catch (collectionError) {
      return Promise.reject(collectionError);
    }
  }

  #settleCollection(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
  ): unknown {
    const path = ownPrefixOf(resolutionStack, branchDepth);
    const depth = path === resolutionStack ? branchDepth : branchDepthOf(path as OwnedBranchStack);
    const candidates = R.candidateBindings(this.resolver, token, options, path);
    return this.#settleCandidates(candidates, options, path, depth, identity);
  }

  /**
   * Every candidate of a fan-out, started in order: `apply` over their values when all settled in
   * this tick, else over the fan-out settled in declaration order.
   */
  #settleCandidates(
    candidates: ReadonlyArray<Binding>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
    apply: (values: Array<unknown>) => unknown,
  ): unknown {
    const count = candidates.length;
    const pending = new Array<unknown>(count);
    let yielded = false;
    for (let index = 0; index < count; index += 1) {
      let settled: unknown;
      try {
        settled = this.#settleCandidate(candidates[index]!, options, resolutionStack, branchDepth);
      } catch (memberError) {
        settled = Promise.reject(memberError);
      }
      if (isPending(settled)) {
        yielded = true;
      }
      pending[index] = settled;
    }
    return yielded ? settleInOrder(pending, apply) : apply(pending);
  }

  /** A transient factory level with no activation: its factory's own result over the level's context. */
  #settleTransientFactory(
    binding: DynamicBinding<unknown> | DynamicAsyncBinding<unknown>,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
  ): unknown {
    const frame = resolutionFrameOf(binding);
    const levelStack = extendResolutionBranch(resolutionStack, branchDepth, frame);
    // Nothing this level appended is ever removed, so no level observes its own settlement.
    const ctx = new AsyncLevelContext(this, levelStack, undefined);
    if (branchDepth === ROOT_BRANCH) {
      this.#recentRootLevelContext = ctx;
    }
    return runFactoryPrefix(binding, ctx, levelStack);
  }

  // Deliberately not `async`: that would allocate a state machine and a promise per level. The
  // dominant lane keeps its body whole rather than reaching the settle core through a call.
  #resolveTransientDynamicAsyncFromContext(
    binding: DynamicBinding<unknown> | DynamicAsyncBinding<unknown>,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
  ): Promise<unknown> {
    const frame = resolutionFrameOf(binding);
    let levelStack: OwnedBranchStack;
    try {
      levelStack = extendResolutionBranch(resolutionStack, branchDepth, frame);
    } catch (cycleError) {
      // This method is not `async`; keep failures as rejections rather than sync throws.
      return Promise.reject(cycleError);
    }

    // Nothing this level appended is ever removed, so no level observes its own settlement.
    const ctx = new AsyncLevelContext(this, levelStack, undefined);
    if (branchDepth === ROOT_BRANCH) {
      this.#recentRootLevelContext = ctx;
    }
    try {
      const factoryResult = runFactoryPrefix(binding, ctx, levelStack);
      return factoryResult instanceof Promise ? factoryResult : Promise.resolve(factoryResult);
    } catch (factoryError) {
      return Promise.reject(factoryError);
    }
  }

  /**
   * Entry for an options-less resolve the container starts: the root of a branch of its own.
   *
   * @remarks A statically-visible transient graph answers from its compiled async plan; everything
   * else opens a branch over a fresh array, so every level's context keeps its own ancestors for as
   * long as the factory holds it — across an `await` included.
   */
  resolveAsyncFromRoot(token: Token<unknown> | Constructor): Promise<unknown> {
    const fastBinding = this.#registry.getFastDefault(token);
    if (fastBinding !== undefined) {
      const planned = this.#plannedRootAnswer(fastBinding);
      if (planned !== null) {
        return planned;
      }
      if (
        fastBinding.scope === "transient" &&
        (fastBinding.kind === "dynamic" || fastBinding.kind === "dynamic-async") &&
        !hasAnyActivationIn(this.#lifecycle, fastBinding)
      ) {
        return this.#rootFactoryAnswer(fastBinding);
      }
    }
    return this.resolveAsyncFromContext(token, [], ROOT_BRANCH);
  }

  /**
   * A transient factory root's answer: its factory run over the one context the binding keeps.
   *
   * @remarks The root's path is its own frame alone and the request carries no options, so the level's
   * context is a function of the binding, built on the first resolve and reused by every later one —
   * a concurrent root reads the same path, and a descendant that outgrows the branch copies its prefix.
   */
  #rootFactoryAnswer(binding: DynamicBinding<unknown> | DynamicAsyncBinding<unknown>): Promise<unknown> {
    let ctx = binding.rootContext as AsyncLevelContext | undefined;
    if (ctx === undefined) {
      ctx = new AsyncLevelContext(this, extendResolutionBranch([], ROOT_BRANCH, resolutionFrameOf(binding)), undefined);
      binding.rootContext = ctx;
    }
    try {
      const factoryResult = runFactoryPrefix(binding, ctx, ctx.ownPath);
      return factoryResult instanceof Promise ? factoryResult : Promise.resolve(factoryResult);
    } catch (factoryError) {
      return Promise.reject(factoryError);
    }
  }

  /** The compiled async plan's answer for a transient class or factory root, or `null` when there is none. */
  #plannedRootAnswer(fastBinding: Binding): Promise<unknown> | null {
    if (
      fastBinding.scope !== "transient" ||
      (fastBinding.kind !== "class" && fastBinding.kind !== "resolved" && fastBinding.kind !== "resolved-async")
    ) {
      return null;
    }
    const plan = this.#getAsyncInstantiationPlan(fastBinding);
    if (plan === null) {
      return null;
    }
    try {
      const planned = plan();
      return planned instanceof Promise ? planned : Promise.resolve(planned);
    } catch (planError) {
      // The interpreted lane is async, so a sync throw is a rejection there too.
      return Promise.reject(planError);
    }
  }

  #settleCandidate(
    binding: Binding,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
  ): unknown {
    if (
      binding.kind === "constant" &&
      binding.activationHook === undefined &&
      R.chainActivationVersion(this.resolver) === 0
    ) {
      return binding.value;
    }
    const owner = R.ownerOf(this.resolver, binding);
    if (isPlainConstantIn(this.#lifecycleOf(owner), binding)) {
      return binding.value;
    }
    if (binding.kind === "alias") {
      return this.#settleRequest(binding.target, options, resolutionStack, branchDepth);
    }
    if (binding.scope === "singleton") {
      if (binding.instance !== NO_INSTANCE) {
        return binding.instance;
      }
      return AsyncLane.of(owner).#settleBinding(binding, options, resolutionStack, branchDepth, owner);
    }
    // The dominant collection member — a transient factory with no activation, asked with no
    // options — takes the lane a single resolve takes, so a fan-out costs one factory result per
    // member rather than a promise on top of each.
    if (
      options === undefined &&
      binding.scope === "transient" &&
      (binding.kind === "dynamic" || binding.kind === "dynamic-async") &&
      !hasAnyActivationIn(this.#lifecycleOf(owner), binding)
    ) {
      return this.#settleTransientFactory(binding, resolutionStack, branchDepth);
    }
    return this.#settleBinding(binding, options, resolutionStack, branchDepth, owner);
  }
}

/**
 * Runs an async lane's factory with its binding flagged in flight for the factory's synchronous prefix.
 *
 * @remarks The flag is exact path membership only while synchronous code runs, so it is cleared when
 * the factory returns — its promise included — never when that promise settles: two branches that
 * await one binding are a diamond, not a cycle. A factory that resolves its own token from that
 * prefix is caught before it runs again, on the branch lane as on the sync lanes, where the level's
 * own flag already covers the whole call.
 */
function runFactoryPrefix(
  binding: DynamicBinding<unknown> | DynamicAsyncBinding<unknown>,
  ctx: AsyncLevelContext,
  levelStack: ReadonlyArray<ResolutionFrame>,
): unknown {
  if (binding.inFlight) {
    // The level's own frame is the last one, and the path an error names ends where the cycle closed.
    throw new CircularDependencyError(cycleNamesOf(levelStack.slice(0, -1), tokenName(binding.token)));
  }
  binding.inFlight = true;
  try {
    return binding.factory(ctx);
  } finally {
    binding.inFlight = false;
  }
}

/**
 * The frames a level may read as its own path: the array itself while nothing has grown it past the
 * level's depth, else a copy of the level's prefix.
 *
 * @remarks Siblings start concurrently on one branch and the first appends in place, so a later
 * sibling that read the whole array would hand a `when()` predicate the first sibling's frame as its
 * parent. The copy is the one the branch lane would take for that sibling anyway, and it owns itself.
 */
function ownPrefixOf(resolutionStack: Array<ResolutionFrame>, branchDepth: BranchDepth): Array<ResolutionFrame> {
  if (branchDepth === UNOWNED_BRANCH || resolutionStack.length === branchDepth) {
    return resolutionStack;
  }
  return resolutionStack.slice(0, branchDepth);
}

/** The settled values of a fan-out, as they are. */
function identity(values: Array<unknown>): Array<unknown> {
  return values;
}

/** A settled value, as it is. */
function settledValue(value: unknown): unknown {
  return value;
}

/** A promise of its own over a shared in-flight one: the same settlement, never the stored object. */
function ownPromiseOf(shared: Promise<unknown>): Promise<unknown> {
  return shared.then(settledValue);
}

/** A lone dependency's settled value as the argument list its level applies. */
function settledAlone(value: unknown): Array<unknown> {
  return [value];
}

/** Whether an async-lane answer is still pending, narrowing it to the promise it is. */
function isPending(answer: unknown): answer is Promise<unknown> {
  return answer instanceof Promise;
}

/** A settled answer as the promise an async entry point hands out; a pending one passes through. */
function asPromise(answer: unknown): Promise<unknown> {
  return answer instanceof Promise ? answer : Promise.resolve(answer);
}
