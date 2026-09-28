import type { AmbientResolution } from "#ambient-container";
import type { Container } from "#container/container";
import type { Binding, ConstantBinding, DynamicAsyncBinding, DynamicBinding } from "#core/binding";
import { bindingSlotToString, NO_INSTANCE } from "#core/binding";
import type { BindingRegistry } from "#core/registry";
import { slotNameCriterionOf } from "#core/tag";
import type { Token } from "#core/token";
import { tokenName } from "#core/token";
import type {
  ActivationHandler,
  BindingIdentifier,
  BindingTag,
  ConstraintContext,
  Constructor,
  ResolutionContext,
  ResolutionFrame,
  ResolveOptions,
} from "#core/types";
import {
  AsyncActivationError,
  AsyncResolutionError,
  CircularDependencyError,
  DisposedContainerError,
  InternalError,
  MissingMetadataError,
  MissingScopeContextError,
  NoMatchingBindingError,
  TokenNotBoundError,
} from "#errors";
import type { DependencySlot } from "#injection/dependency-slot";
import {
  loneTagBesideNameOf,
  resolveOptionsForSlot,
  singleCriterionForSlot,
  singleCriterionOnlyOf,
} from "#injection/dependency-slot";
import type { ResolutionDiagnostics } from "#introspection/diagnostics";
import type { LifecycleManager } from "#lifecycle/hooks";
import type { ScopeManager } from "#lifecycle/scopes";
import { SCOPED_MISS } from "#lifecycle/scopes";
import type { MetadataReader, ParamMetadata } from "#metadata/types";
import { settleInOrder } from "#resolution/async-fan-out";
import { ActivationNeedCache } from "#resolution/cache/activation-need";
import type { ClassFacts } from "#resolution/cache/class-introspector";
import { ClassIntrospector } from "#resolution/cache/class-introspector";
import type { CollectionEntry, DefaultLookupEntry } from "#resolution/cache/lookup";
import { BindingLookupCache } from "#resolution/cache/lookup";
import type { ResolverCallbacks } from "#resolution/context";
import { AsyncLevelContext, DefaultConstraintContext, DefaultResolutionContext } from "#resolution/context";
import type { BranchDepth, OwnedBranchStack } from "#resolution/path";
import {
  branchDepthOf,
  buildResolutionFrame,
  cycleNamesOf,
  enterSyncPath,
  extendResolutionBranch,
  leaveSyncPath,
  missPathOf,
  ROOT_BRANCH,
  UNOWNED_BRANCH,
} from "#resolution/path";
import type { InstantiationPlanHost } from "#resolution/plan/compiler";
import { InstantiationPlanCompiler, PLAN_RETRY } from "#resolution/plan/compiler";
import { matchesSlot, selectAllBindings, selectBinding } from "#resolution/select/candidates";

const EMPTY_FRAME_LIST: ReadonlyArray<ResolutionFrame> = [];

const EMPTY_PARAM_LIST: ReadonlyArray<ParamMetadata> = [];
// A class with no params is constructed with no arguments, so no dependency array is built for it.
const NO_ARGUMENTS: ReadonlyArray<unknown> = [];
/** Plans compiled so far, with the `null` unplannable marks left out. */
function countCompiledPlans(plans: Map<BindingIdentifier, (() => unknown) | null> | undefined): number {
  let count = 0;
  if (plans !== undefined) {
    for (const plan of plans.values()) {
      if (plan !== null) {
        count += 1;
      }
    }
  }
  return count;
}

const ROOT_CONSTRAINT_CONTEXT = new DefaultConstraintContext(EMPTY_FRAME_LIST, undefined);

/**
 * The resolution engine driving binding selection, instantiation, scoping, and lifecycle hooks.
 *
 * @since 0.3.16-canary.0
 */
export class DependencyResolver implements ResolverCallbacks {
  // Contexts pooled by depth over the root stack — deferred: a plan-served or constant-only container never needs one.
  #syncResolutionContextPool: Array<DefaultResolutionContext> | undefined;
  /**
   * The stack a top-level **sync** resolve reuses instead of minting an array per call.
   *
   * @remarks Read directly rather than through an accessor: a shallow resolve is one top-level
   * call, so a call there is not amortised over anything. Every sync lane pops what it pushes, so
   * `rootStack.length === 0` means no resolve holds the stack; async appends without popping and
   * mints its own. Keeping it stable is also what lets a pooled context skip re-storing it.
   */
  readonly rootStack: Array<ResolutionFrame> = [];
  // The last root level's context, kept so one instance is always live: a full collection that finds
  // none deoptimizes every optimized site that embedded the class's shape, and does so on every
  // collection after — measured on the async chain rows, and removed by this one field.
  #recentRootLevelContext: AsyncLevelContext | undefined;
  // Compiled plans; `null` marks a binding as unplannable under the current cache versions. Both
  // maps are allocated by the first plan request, which only a class or resolved binding makes. A
  // root is compiled on the request that repeats it — the first interprets, so a container that
  // resolves a root once never compiles — and the set below remembers the first.
  #classPlanByBindingId: Map<BindingIdentifier, (() => unknown) | null> | undefined;
  #classPlanRequestedOnce: Set<BindingIdentifier> | undefined;
  #classPlanRegistryVersion = -1;
  #classPlanActivationVersion = -1;
  // The async lane's plans, stamped and invalidated apart so neither lane pays the other's misses.
  #asyncPlanByBindingId: Map<BindingIdentifier, (() => unknown) | null> | undefined;
  #asyncPlanRequestedOnce: Set<BindingIdentifier> | undefined;
  #asyncPlanRegistryVersion = -1;
  #asyncPlanActivationVersion = -1;

  readonly #registry: BindingRegistry;
  readonly #scope: ScopeManager;
  readonly #lifecycle: LifecycleManager;
  readonly #metadataReader: MetadataReader;
  readonly #container: Container;
  readonly #parent: DependencyResolver | undefined;
  readonly #lookup: BindingLookupCache<DependencyResolver>;
  // Built by the first class resolve: a container that never resolves a class never pays for it.
  #classes: ClassIntrospector | undefined;
  // Built by the first interpreted resolve that asks; a plan-served or constant-only container never does.
  #activation: ActivationNeedCache | undefined;

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
    this.#lookup = new BindingLookupCache<DependencyResolver>(
      registry,
      this,
      parent === undefined ? undefined : parent.#lookup,
    );
  }

  #introspector(): ClassIntrospector {
    return (this.#classes ??= new ClassIntrospector(
      this.#metadataReader,
      this.#container,
      this.#parent === undefined ? undefined : this.#parent.#introspector(),
    ));
  }

  /** The reader this resolver was built with, which is the one its container answers with. */
  get metadataReader(): MetadataReader {
    return this.#metadataReader;
  }

  #activationNeed(): ActivationNeedCache {
    return (this.#activation ??= new ActivationNeedCache(this.#lifecycle, this.#introspector(), this.#registry));
  }

  /** Structural counts and the resolver-owned collaborators built so far, for the {@link ResolutionDiagnostics} a container reports. */
  describeCaches(): Pick<
    ResolutionDiagnostics,
    "compiledPlanCount" | "compiledAsyncPlanCount" | "generatedPlanCount" | "syncContextPoolSize" | "builtSubsystems"
  > {
    const builtSubsystems: Array<string> = [];
    if (this.#planCompiler !== undefined) {
      builtSubsystems.push("resolver.planCompiler");
    }
    if (this.#lookup.isMemoBuilt) {
      builtSubsystems.push("resolver.lookupMemo");
    }
    const generatedPlanCount = this.#planCompiler?.generatedPlanCount ?? 0;
    if (generatedPlanCount > 0) {
      builtSubsystems.push("resolver.planCodegen");
    }
    if (this.#recentRootLevelContext !== undefined) {
      builtSubsystems.push("resolver.asyncRootLevel");
    }
    return {
      compiledPlanCount: countCompiledPlans(this.#classPlanByBindingId),
      compiledAsyncPlanCount: countCompiledPlans(this.#asyncPlanByBindingId),
      generatedPlanCount,
      syncContextPoolSize: this.#syncResolutionContextPool?.length ?? 0,
      builtSubsystems,
    };
  }

  // ── Binding lookup ─────────────────────────────────────────────────────────────────────────────────────────────────

  /**
   * Finds the binding a request selects in this container, walking up to the parent on a miss.
   *
   * @remarks `singleCriterion` is the request's lone criterion, folded once by the caller so alias
   * hops and parent walks do not re-fold it — `undefined` when the request carries none or several.
   */
  #findBinding(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
    singleCriterion: BindingTag | undefined,
  ): DefaultLookupEntry<DependencyResolver> | undefined {
    if (options === undefined) {
      const fastDefaultBinding = this.#registry.getFastDefault(token);
      if (fastDefaultBinding !== undefined) {
        return { binding: fastDefaultBinding, owner: this };
      }
    } else if (singleCriterion !== undefined) {
      const indexed = this.#registry.getSimpleTagged(token, singleCriterion);
      if (indexed === undefined) {
        // A one-criterion request matches only a slot carrying exactly that criterion, and every such
        // slot is in the index, so a miss here is a miss for this registry: nothing left to scan.
        return this.#forwardingAliasOrParent(token, options, resolutionStack, singleCriterion);
      }
      if (this.#satisfiesPredicate(indexed, options, resolutionStack)) {
        return { binding: indexed, owner: this };
      }
    } else if (options.name !== undefined) {
      const pairTag = loneTagBesideNameOf(options);
      if (pairTag !== undefined) {
        const nameCriterion = slotNameCriterionOf(options.name);
        // A name interned nowhere cannot key a slot, but a slot whose criteria are a subset of the
        // request's still matches — so an index miss falls through to the scan, never a clean miss.
        if (nameCriterion !== undefined) {
          // The exact two-criterion slot, memoized over the chain; a predicate or an alias declines to the scan.
          const entry = this.#lookup.namedTaggedEntry(token, nameCriterion, pairTag);
          if (entry !== null) {
            return entry;
          }
        }
      }
    }

    // A lone default-slot candidate is its own selection: the slot match is the whole decision,
    // it carries no predicate, and asking for it first keeps the registry from materialising its list.
    // An options-less request already probed the lone map above, so only a request with options asks again.
    const lone = options === undefined ? undefined : this.#registry.getFastDefault(token);
    if (lone !== undefined) {
      if (matchesSlot(lone.slot, options)) {
        return { binding: lone, owner: this };
      }
    } else {
      // The lone map has missed either way, so the record map is all that is left to read.
      const bindings = this.#registry.getRecorded(token);
      if (bindings.length > 0) {
        const selected = this.#selectFromList(bindings, options, resolutionStack, token);
        if (selected !== undefined) {
          return { binding: selected, owner: this };
        }
      }
    }
    if (options === undefined) {
      return this.#parent === undefined
        ? undefined
        : this.#parent.#findBinding(token, options, resolutionStack, singleCriterion);
    }
    return this.#forwardingAliasOrParent(token, options, resolutionStack, singleCriterion);
  }

  /**
   * What a request with criteria finds once no slot of this registry matches them: the token's
   * default-slot alias, which forwards them to its target, else the parent's answer.
   *
   * @remarks A default-slot alias carries no criterion, predicate or membership, so it is a pointer
   * rather than a candidate — every exact slot here was tried first, and the nearest container that
   * can answer still does.
   */
  #forwardingAliasOrParent(
    token: Token<unknown> | Constructor,
    options: ResolveOptions,
    resolutionStack: Array<ResolutionFrame>,
    singleCriterion: BindingTag | undefined,
  ): DefaultLookupEntry<DependencyResolver> | undefined {
    const defaultSlotAlias = this.#registry.defaultSlotAlias(token);
    if (defaultSlotAlias !== undefined) {
      return { binding: defaultSlotAlias, owner: this };
    }
    return this.#parent === undefined
      ? undefined
      : this.#parent.#findBinding(token, options, resolutionStack, singleCriterion);
  }

  /**
   * The scan a candidate list gets before full selection.
   *
   * @remarks A single slot match is the whole answer once its predicate, if any, agrees, and no
   * match is a clean miss; neither needs a display name or a candidate array. Two slot matches
   * hand the same list to full selection, which weighs specificity and reports ambiguity — so both
   * lanes answer identically.
   */
  #selectFromList(
    bindings: ReadonlyArray<Binding>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
    token: Token<unknown> | Constructor,
  ): Binding | undefined {
    let match: Binding | undefined;
    for (let index = 0; index < bindings.length; index += 1) {
      const candidate = bindings[index]!;
      if (candidate.isMany || !matchesSlot(candidate.slot, options)) {
        continue;
      }
      if (match !== undefined) {
        return selectBinding(
          bindings,
          options,
          this.#makeConstraintContext(resolutionStack, options),
          tokenName(token),
        );
      }
      match = candidate;
    }
    if (match === undefined) {
      return undefined;
    }
    return this.#satisfiesPredicate(match, options, resolutionStack) ? match : undefined;
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
    resolutionStack: Array<ResolutionFrame>,
    precomputedCriterion?: BindingTag | null,
  ): DefaultLookupEntry<DependencyResolver> {
    // `null` is a caller's "folded: none" — only an absent precomputation re-folds.
    const singleCriterion =
      precomputedCriterion === undefined ? singleCriterionOnlyOf(options) : (precomputedCriterion ?? undefined);
    let currentToken = token;
    let visitedAliasTokens: Set<Token<unknown> | Constructor> | undefined;
    let found = this.#findBinding(currentToken, options, resolutionStack, singleCriterion);

    while (found !== undefined && found.binding.kind === "alias") {
      const target = found.binding.target;
      visitedAliasTokens ??= new Set([currentToken]);
      if (visitedAliasTokens.has(target)) {
        throw new CircularDependencyError([...visitedAliasTokens, target].map((entry) => tokenName(entry)));
      }
      visitedAliasTokens.add(target);
      currentToken = target;
      found = this.#findBinding(currentToken, options, resolutionStack, singleCriterion);
    }

    if (found === undefined) {
      // Thrown here rather than from a helper: the error captures this stack, and an error path is
      // dominated by that capture. Bindings under the token anywhere in the chain mean the request
      // matched none of them, so a child reports the same miss its parent would.
      const bound = this.#allBindingsFromChain(currentToken);
      const path = missPathOf(resolutionStack, token, visitedAliasTokens);
      if (bound.length > 0) {
        throw new NoMatchingBindingError(
          tokenName(currentToken),
          options ?? {},
          bound.map((binding) => bindingSlotToString(binding.slot)),
          path,
        );
      }
      throw new TokenNotBoundError(tokenName(currentToken), path);
    }
    return found;
  }

  /**
   * Follows an alias binding's chain to its terminal binding, or `undefined` when the chain ends at
   * a token nothing matches.
   *
   * @remarks The non-throwing twin of {@link DependencyResolver.#requireBinding}'s alias walk, for
   * the optional and collection lanes: a dangling chain is a miss, but a revisited alias token still
   * raises {@link CircularDependencyError} — a cycle has no absent reading.
   */
  #terminalOfAliasBinding(
    alias: Binding,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
    singleCriterion: BindingTag | undefined,
  ): DefaultLookupEntry<DependencyResolver> | undefined {
    let currentToken: Token<unknown> | Constructor = alias.token;
    let found: DefaultLookupEntry<DependencyResolver> | undefined = { binding: alias, owner: this };
    let visitedAliasTokens: Set<Token<unknown> | Constructor> | undefined;
    while (found !== undefined && found.binding.kind === "alias") {
      const target = found.binding.target;
      visitedAliasTokens ??= new Set([currentToken]);
      if (visitedAliasTokens.has(target)) {
        throw new CircularDependencyError([...visitedAliasTokens, target].map((entry) => tokenName(entry)));
      }
      visitedAliasTokens.add(target);
      currentToken = target;
      found = this.#findBinding(currentToken, options, resolutionStack, singleCriterion);
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
    return this.#findBinding(token, options, [], singleCriterionOnlyOf(options));
  }

  /**
   * Mirrors {@link DependencyResolver.resolveAll} candidate selection only (no instantiation).
   */
  peekCandidateBindingsForValidate(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
  ): ReadonlyArray<Binding> {
    return this.#candidateBindings(token, options, []);
  }

  /**
   * The error `resolve` raises for a request nothing selects, or `undefined` while a `when()` candidate leaves it open.
   *
   * @remarks A predicate reads the resolution path, which a static walk does not have, so a slot-matching candidate
   * that carries one may still be selected when the request is really made.
   */
  missForValidate(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
    path: ReadonlyArray<string>,
  ): TokenNotBoundError | NoMatchingBindingError | undefined {
    const bound = this.#allBindingsFromChain(token);
    if (bound.length === 0) {
      return new TokenNotBoundError(tokenName(token), path);
    }
    for (const binding of bound) {
      if (binding.predicate !== undefined && !binding.isMany && matchesSlot(binding.slot, options)) {
        return undefined;
      }
    }
    return new NoMatchingBindingError(
      tokenName(token),
      options ?? {},
      bound.map((binding) => bindingSlotToString(binding.slot)),
      path,
    );
  }

  /** The resolver whose chain a binding this one can see resolves its dependencies from, as a singleton does. */
  ownerForValidate(binding: Binding): DependencyResolver {
    return this.#ownerOf(binding);
  }
  // ── Sync resolve ───────────────────────────────────────────────────────────────────────────────────────────────────

  resolveFromContext<Value>(token: Token<Value> | Constructor<Value>, resolutionStack: Array<ResolutionFrame>): Value {
    // Hot lane: own-registry fast default. Fall back to the chain-versioned memo
    // (parent-chain walk + alias folding) only on miss or alias.
    const fastBinding = this.#registry.getFastDefault(token);
    if (fastBinding !== undefined && fastBinding.kind !== "alias") {
      return this.#resolveDefaultEntry(fastBinding, this, resolutionStack) as Value;
    }
    const entry = this.#lookup.defaultEntry(token);
    if (entry === null) {
      return this.resolve(token, undefined, resolutionStack);
    }
    return this.#resolveDefaultEntry(entry.binding, entry.owner, resolutionStack) as Value;
  }

  #resolveDefaultEntry(binding: Binding, owner: DependencyResolver, resolutionStack: Array<ResolutionFrame>): unknown {
    const scope = binding.scope;
    if (scope === "transient") {
      if (binding.kind === "dynamic") {
        // Container-level hooks belong to the binding's owner — a child-registered hook must not
        // fire for a parent-owned binding, and the owner's must.
        const containerHooks =
          owner.#lifecycle.activationVersion === 0 ? undefined : owner.#lifecycle.activationHandlersFor(binding.token);
        if (binding.activationHook === undefined && (containerHooks === undefined || containerHooks.length === 0)) {
          return this.#resolveTransientDynamicSyncFromContext(binding, resolutionStack);
        }
        return this.#resolveTransientDynamicActivatedSync(binding, containerHooks, resolutionStack);
      }
      // Compiled plans only run at the top level — inner levels keep the runtime cycle guard.
      if ((binding.kind === "class" || binding.kind === "resolved") && resolutionStack.length === 0) {
        const plan = this.#getInstantiationPlan(binding);
        if (plan !== null) {
          return plan();
        }
      }
    } else if (scope === "singleton") {
      // A constant is a singleton that is already its own instance.
      if (owner.#isPlainConstant(binding)) {
        return binding.value;
      }
      const cachedSingleton = binding.instance;
      if (cachedSingleton !== NO_INSTANCE) {
        return cachedSingleton;
      }
      if (owner !== this) {
        return owner.#resolveBinding(binding, undefined, resolutionStack, owner);
      }
    } else {
      const cachedScoped = this.#readScoped(binding);
      if (cachedScoped !== SCOPED_MISS) {
        return cachedScoped;
      }
    }
    return this.#resolveBinding(binding, undefined, resolutionStack, owner);
  }

  // Lean lane for an activated transient dynamic binding: same observable behavior as the
  // generic #resolveBinding path (guard, frame, ctx, per-binding then container hooks) with
  // the kind/activation dispatch resolved statically.
  #resolveTransientDynamicActivatedSync(
    binding: DynamicBinding<unknown>,
    containerHooks: ReadonlyArray<ActivationHandler<unknown>> | undefined,
    resolutionStack: Array<ResolutionFrame>,
  ): unknown {
    // Same O(1) cycle guard as the unhooked lane: this is still one sync call stack, so the flag
    // *is* exact path membership.
    const frame = this.#getResolutionFrame(binding);
    const tokenDisplayName = frame.tokenName;
    if (binding.inFlight) {
      throw new CircularDependencyError(cycleNamesOf(resolutionStack, tokenDisplayName));
    }
    binding.inFlight = true;
    resolutionStack.push(frame);
    try {
      const resolutionCtx = this.#acquireSyncResolutionContext(resolutionStack, undefined);
      const factoryResult = binding.factory(resolutionCtx);
      if (factoryResult instanceof Promise) {
        throw new AsyncResolutionError(resolutionStack[0]?.tokenName ?? tokenDisplayName, tokenDisplayName);
      }
      let activated = factoryResult;
      if (binding.activationHook !== undefined) {
        const activationResult = binding.activationHook(resolutionCtx, activated);
        if (activationResult instanceof Promise) {
          // The hook has already run; adopt its rejection so it cannot surface as unhandled.
          void activationResult.catch(() => {});
          throw new AsyncActivationError(tokenDisplayName, "onActivation");
        }
        activated = activationResult;
      }
      if (containerHooks !== undefined) {
        for (let index = 0; index < containerHooks.length; index += 1) {
          const activationResult = containerHooks[index]!(resolutionCtx, activated);
          if (activationResult instanceof Promise) {
            void activationResult.catch(() => {});
            throw new AsyncActivationError(tokenDisplayName, "onActivation");
          }
          activated = activationResult;
        }
      }
      return activated;
    } finally {
      resolutionStack.pop();
      binding.inFlight = false;
    }
  }

  /**
   * Chain-summed activation version: a plan can inline a parent-owned binding, so a parent's hook
   * registration must invalidate it.
   */
  #chainActivationVersion(): number {
    if (this.#parent === undefined) {
      return this.#lifecycle.activationVersion;
    }
    let version = this.#lifecycle.activationVersion;
    for (let current: DependencyResolver | undefined = this.#parent; current !== undefined; current = current.#parent) {
      version += current.#lifecycle.activationVersion;
    }
    return version;
  }

  #getInstantiationPlan(binding: Binding & { kind: "class" | "resolved" }): (() => unknown) | null {
    const registryVersion = this.#lookup.chainVersion();
    const activationVersion = this.#chainActivationVersion();
    if (registryVersion !== this.#classPlanRegistryVersion || activationVersion !== this.#classPlanActivationVersion) {
      // The stamps start at -1, so the first request always lands here: allocate then, clear after.
      if (this.#classPlanByBindingId === undefined) {
        this.#classPlanByBindingId = new Map<BindingIdentifier, (() => unknown) | null>();
      } else {
        this.#classPlanByBindingId.clear();
        this.#classPlanRequestedOnce?.clear();
      }
      this.#classPlanRegistryVersion = registryVersion;
      this.#classPlanActivationVersion = activationVersion;
    }
    const plans = this.#classPlanByBindingId!;
    const cached = plans.get(binding.identifier);
    if (cached !== undefined) {
      return cached;
    }
    const requestedOnce = (this.#classPlanRequestedOnce ??= new Set<BindingIdentifier>());
    if (!requestedOnce.has(binding.identifier)) {
      // The first request interprets; the one that repeats it compiles.
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

  // Compiler behind #getInstantiationPlan — a cold path, and built on the first plan so a container
  // that never resolves a class or a resolved factory never pays for the host.
  #planCompiler: InstantiationPlanCompiler | undefined;

  #compiler(): InstantiationPlanCompiler {
    return (this.#planCompiler ??= new InstantiationPlanCompiler(this.#buildPlanCompilerHost()));
  }

  // The behaviour the plan compiler needs from this resolver — lookups, escapes, plan swaps, and the
  // accessor construction path. Built once with the compiler, so each closure is allocated once.
  #buildPlanCompilerHost(): InstantiationPlanHost {
    const classes = this.#introspector();
    return {
      hasActivationHandlers: (binding) => this.#ownerOf(binding).#lifecycle.hasActivationHandlers(binding.token),
      knownPostConstruct: (target) => classes.knownPostConstruct(target),
      needsActiveContainer: (target) => classes.needsActiveContainer(target),
      // A plan runs at the top level, so the lent root stack is free when it is; a plan reached
      // with the root stack held mints its own path, exactly as the interpreted lane would.
      constructWithAccessors: (binding, target, deps) => {
        const stack = this.rootStack.length === 0 ? this.rootStack : [];
        enterSyncPath(stack, binding, this.#getResolutionFrame(binding));
        try {
          return classes.instantiate(target, deps, this.#ambientResolutionFor(stack));
        } finally {
          leaveSyncPath(stack, binding);
        }
      },
      getConstructorMetadata: (target) => classes.constructorMetadata(target),
      lookupDependencyEntry: (token) => {
        const entry = this.#lookup.defaultEntry(token);
        return entry === null ? null : { binding: entry.binding };
      },
      // Exactly what #findBinding's single-criterion lane accepts, minus the half that reads a path:
      // a predicate is the compiler's cue to leave the selection to the runtime.
      lookupPathIndependentEntry: (token, options) => {
        const singleCriterion = singleCriterionOnlyOf(options);
        if (singleCriterion === undefined) {
          return null;
        }
        const entry = this.#lookup.taggedEntry(token, singleCriterion);
        if (entry === null || entry.binding.predicate !== undefined || !matchesSlot(entry.binding.slot, options)) {
          return null;
        }
        return { binding: entry.binding };
      },
      getResolutionFrame: (binding) => this.#getResolutionFrame(binding),
      // Identity-guarded: a map cleared and recompiled since no longer holds the plan being replaced.
      replacePlan: (binding, current, next) => {
        const plans = this.#classPlanByBindingId;
        if (plans !== undefined && plans.get(binding.identifier) === current) {
          plans.set(binding.identifier, next);
        }
      },
      replaceAsyncPlan: (binding, current, next) => {
        const plans = this.#asyncPlanByBindingId;
        if (plans !== undefined && plans.get(binding.identifier) === current) {
          plans.set(binding.identifier, next);
        }
      },
      // Dispatches exactly as #resolveDep does, so an escaped dep is indistinguishable
      // from the same dep on a fully interpreted resolve.
      resolveEscaped: (token, options, arity, resolutionStack) => {
        if (arity === "all") {
          return this.resolveAll(token, options, resolutionStack);
        }
        if (arity === "optional") {
          return this.resolveOptional(token, options, resolutionStack);
        }
        if (options === undefined) {
          return this.resolveFromContext(token, resolutionStack);
        }
        return this.resolve(token, options, resolutionStack);
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

  /** The async lane's plan for a statically-visible transient binding, mirroring the sync getter. */
  #getAsyncInstantiationPlan(
    binding: Binding & { kind: "class" | "resolved" | "resolved-async" },
  ): (() => unknown) | null {
    const registryVersion = this.#lookup.chainVersion();
    const activationVersion = this.#chainActivationVersion();
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
    const compiled = this.#compiler().compileAsync(binding);
    if (compiled === PLAN_RETRY) {
      // Lifecycle metadata not discovered yet — the fallback resolve discovers it; retry then.
      return null;
    }
    plans.set(binding.identifier, compiled);
    return compiled;
  }

  resolve<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
    precomputedCriterion?: BindingTag | null,
  ): Value {
    // Single-criterion fast lane (a lone name folds here too): memoized lookup, dispatching just
    // the shapes whose semantics involve no resolution context (constants, cached singletons).
    let singleCriterion: BindingTag | undefined;
    if (options !== undefined) {
      singleCriterion =
        precomputedCriterion === undefined ? singleCriterionOnlyOf(options) : (precomputedCriterion ?? undefined);
      if (singleCriterion !== undefined) {
        const indexedEntry = this.#lookup.taggedEntry(token, singleCriterion);
        if (indexedEntry !== null) {
          const indexedBinding = indexedEntry.binding;
          if (indexedEntry.owner.#isPlainConstant(indexedBinding)) {
            return indexedBinding.value as Value;
          }
          if (indexedBinding.scope === "singleton" && indexedBinding.instance !== NO_INSTANCE) {
            return indexedBinding.instance as Value;
          }
          // Everything else keeps the full path (context, activation, guards).
        }
      }
    }

    const { binding, owner } = this.#requireBinding(token, options, resolutionStack, singleCriterion ?? null);

    // A singleton owned by a parent resolver is resolved there, so the parent caches it.
    if (binding.scope === "singleton" && owner !== this) {
      return owner.#resolveBinding(binding, options, resolutionStack, owner) as Value;
    }
    return this.#resolveBinding(binding, options, resolutionStack, owner) as Value;
  }

  #resolveBinding(
    binding: Binding,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
    owner: DependencyResolver,
  ): unknown {
    if (owner.#isPlainConstant(binding)) {
      return binding.value;
    }

    const scope = binding.scope;
    if (scope === "singleton") {
      if (binding.instance !== NO_INSTANCE) {
        return binding.instance;
      }
      // An async materialization already in flight must not be raced by a second, sync one.
      if (this.#scope.getInflight(binding.identifier) !== undefined) {
        throw new AsyncResolutionError(
          resolutionStack[0]?.tokenName ?? tokenName(binding.token),
          tokenName(binding.token),
        );
      }
      if (this.#scope.isClosed) {
        throw new DisposedContainerError();
      }
    } else if (scope === "scoped") {
      const cachedScoped = this.#readScoped(binding);
      if (cachedScoped !== SCOPED_MISS) {
        return cachedScoped;
      }
      if (this.#scope.getInflight(binding.identifier) !== undefined) {
        throw new AsyncResolutionError(
          resolutionStack[0]?.tokenName ?? tokenName(binding.token),
          tokenName(binding.token),
        );
      }
      if (this.#scope.isClosed) {
        throw new DisposedContainerError();
      }
    }

    const frame = this.#getResolutionFrame(binding);
    const tokenDisplayName = frame.tokenName;
    // The level holds its binding's flag for its whole duration, so a factory below runs bare.
    enterSyncPath(resolutionStack, binding, frame);
    try {
      const needsActivation = owner.#activationNeed().needsActivation(binding);
      if (!needsActivation && scope === "transient" && binding.kind === "dynamic") {
        const resolutionCtx = this.#acquireSyncResolutionContext(resolutionStack, options);
        const dynamicResult = binding.factory(resolutionCtx);
        if (dynamicResult instanceof Promise) {
          throw new AsyncResolutionError(resolutionStack[0]?.tokenName ?? tokenDisplayName, tokenDisplayName);
        }
        return dynamicResult;
      }

      const resolutionCtx =
        needsActivation || requiresResolutionContext(binding)
          ? this.#acquireSyncResolutionContext(resolutionStack, options)
          : undefined;

      const instance = this.#instantiateSync(binding, resolutionCtx, resolutionStack);

      this.#mirrorPostConstructFromOwner(binding, owner);
      const activated = owner.#activationNeed().refreshAfterFirstInstantiation(binding, needsActivation)
        ? owner.#lifecycle.runActivationSync(
            resolutionCtx as DefaultResolutionContext,
            binding,
            instance,
            owner.#metadataReader,
          )
        : instance;

      if (scope === "singleton") {
        this.#scope.setSingleton(binding, activated);
      } else if (scope === "scoped") {
        this.#scope.setScoped(binding, activated);
      }

      return activated;
    } finally {
      leaveSyncPath(resolutionStack, binding);
    }
  }

  /**
   * Path-continuing resolution handed to the ambient slot while an accessor class constructs.
   *
   * @remarks The lent root stack is one array for the resolver's lifetime, so the closure pair over
   * it is built once and reused.
   */
  #rootAmbientResolution: AmbientResolution | undefined;

  #ambientResolutionFor(resolutionStack: Array<ResolutionFrame>): AmbientResolution {
    if (resolutionStack === this.rootStack) {
      return (this.#rootAmbientResolution ??= this.#buildAmbientResolution(resolutionStack));
    }
    return this.#buildAmbientResolution(resolutionStack);
  }

  #buildAmbientResolution(resolutionStack: Array<ResolutionFrame>): AmbientResolution {
    return {
      resolve: <Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value =>
        options === undefined
          ? this.resolveFromContext(token, resolutionStack)
          : this.resolve(token, options, resolutionStack),
      resolveOptional: <Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined =>
        this.resolveOptional(token, options, resolutionStack),
    };
  }

  #instantiateSync(
    binding: Binding,
    ctx: DefaultResolutionContext | undefined,
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
          throw asyncResolutionErrorFor(binding, resolutionStack);
        }
        return factoryResult;
      }

      case "dynamic-async":
        throw asyncResolutionErrorFor(binding, resolutionStack);

      case "class": {
        // One lookup of the class's facts serves the params, the accessor need and the construction.
        const introspector = this.#introspector();
        const target = binding.target;
        const facts = introspector.facts(target);
        const params = this.#constructorParams(target, facts);
        const needsActiveContainer = introspector.needsActiveContainerOf(target, facts);
        return introspector.construct(
          target,
          params.length === 0 ? NO_ARGUMENTS : this.#resolveDeps(params, resolutionStack),
          needsActiveContainer,
          needsActiveContainer ? this.#ambientResolutionFor(resolutionStack) : undefined,
        );
      }

      case "resolved": {
        const deps = this.#resolveDeps(binding.deps, resolutionStack);
        const factoryResult = binding.factory(...deps);
        if (factoryResult instanceof Promise) {
          throw asyncResolutionErrorFor(binding, resolutionStack);
        }
        return factoryResult;
      }

      case "resolved-async":
        throw asyncResolutionErrorFor(binding, resolutionStack);

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
  #constructorParams(target: Constructor, facts: ClassFacts): ReadonlyArray<ParamMetadata> {
    // Metadata is fixed once a class is defined, so the answer is too; only a throw is left unsettled.
    return (facts.params ??= this.#settleConstructorParams(target, facts));
  }

  #settleConstructorParams(target: Constructor, facts: ClassFacts): ReadonlyArray<ParamMetadata> {
    const meta = this.#introspector().constructorMetadataOf(target, facts);
    if (meta !== undefined) {
      return meta.params;
    }
    if (target.length === 0) {
      // A subclass with an implicit constructor and no own metadata inherits its base's declared
      // deps but would be built with zero arguments, injecting `undefined` silently — reject it.
      const inherited = this.#introspector().inheritedConstructorMetadata(target);
      if (inherited !== undefined && inherited.metadata.params.length > 0) {
        throw new MissingMetadataError(target.name, {
          baseName: inherited.base.name,
          dependencyCount: inherited.metadata.params.length,
        });
      }
      return EMPTY_PARAM_LIST;
    }
    throw new MissingMetadataError(target.name);
  }

  // One dispatch table for both dependency sources — constructor params and `toResolved`
  // descriptors declare the same four things.
  #resolveDeps(deps: ReadonlyArray<DependencySlot>, resolutionStack: Array<ResolutionFrame>): Array<unknown> {
    const count = deps.length;
    if (count === 0) {
      return [];
    }
    if (count === 1) {
      return [this.#resolveDep(deps[0]!, resolutionStack)];
    }
    const resolved = new Array<unknown>(count);
    for (let index = 0; index < count; index += 1) {
      resolved[index] = this.#resolveDep(deps[index]!, resolutionStack);
    }
    return resolved;
  }

  #resolveDep(dep: DependencySlot, resolutionStack: Array<ResolutionFrame>): unknown {
    const options = resolveOptionsForSlot(dep);
    if (dep.multi) {
      return this.resolveAll(dep.token, options, resolutionStack);
    }
    if (dep.optional) {
      return this.resolveOptional(dep.token, options, resolutionStack, singleCriterionForSlot(dep));
    }
    if (options === undefined) {
      return this.resolveFromContext(dep.token, resolutionStack);
    }
    return this.resolve(dep.token, options, resolutionStack, singleCriterionForSlot(dep));
  }

  resolveOptional<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
    precomputedCriterion?: BindingTag | null,
  ): Value | undefined {
    if (options === undefined) {
      // The lane a plain resolve takes: a lone default in this registry is the answer, predicate-free by
      // construction, and a root that keeps no records has nothing else that could hold the token.
      const fastBinding = this.#registry.getFastDefault(token);
      if (fastBinding !== undefined) {
        if (fastBinding.kind !== "alias") {
          return this.#resolveDefaultEntry(fastBinding, this, resolutionStack) as Value;
        }
      } else if (this.#parent === undefined && !this.#registry.isRecordMapBuilt) {
        return undefined;
      }
    }
    const singleCriterion =
      precomputedCriterion === undefined ? singleCriterionOnlyOf(options) : (precomputedCriterion ?? undefined);
    let entry = this.#findBinding(token, options, resolutionStack, singleCriterion);
    // Resolve the entry the probe found: re-looking the token up would evaluate every `when()`
    // predicate a second time, and a changed answer would throw where `undefined` was promised.
    if (entry !== undefined && entry.binding.kind === "alias") {
      // Follow the alias off the throwing path: a chain that ends nowhere is a miss, not an error.
      entry = this.#terminalOfAliasBinding(entry.binding, options, resolutionStack, singleCriterion);
    }
    if (entry === undefined) {
      return undefined;
    }
    const { binding, owner } = entry;
    if (binding.scope === "singleton" && owner !== this) {
      return owner.#resolveBinding(binding, options, resolutionStack, owner) as Value;
    }
    return this.#resolveBinding(binding, options, resolutionStack, owner) as Value;
  }

  resolveAll<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
  ): ReadonlyArray<Value> {
    const candidates = this.#candidateBindings(token, options, resolutionStack);
    const resolved = new Array<Value>(candidates.length);
    for (let index = 0; index < candidates.length; index += 1) {
      resolved[index] = this.#resolveCandidateSync(candidates[index]!, options, resolutionStack) as Value;
    }
    return resolved;
  }

  /**
   * A root-level, options-less collection read through its memo: the value list when it is stable,
   * the candidate list otherwise.
   *
   * @remarks Its own entry rather than a branch in `resolveAll`, so the options lane keeps the exact
   * shape it had; the container routes a top-level read with no options here.
   */
  resolveRootCollection<Value>(token: Token<Value> | Constructor<Value>): ReadonlyArray<Value> {
    const resolutionStack = this.rootStack;
    const memo = this.#rootCollection(token, resolutionStack);
    if (memo.values !== undefined && memo.activationVersion === this.#chainActivationVersion()) {
      // A copy, never the memo itself: a caller that writes into its result must not rewrite the
      // next caller's. Reading a frozen array is several times slower than reading a plain one, so
      // the copy is the cheaper guard by far, and it costs one allocation the read already paid before the memo.
      return memo.values.slice() as Array<Value>;
    }
    const { candidates } = memo;
    const resolved = new Array<Value>(candidates.length);
    for (let index = 0; index < candidates.length; index += 1) {
      resolved[index] = this.#resolveCandidateSync(candidates[index]!, undefined, resolutionStack) as Value;
    }
    this.#settleOnRepeat(memo);
    return resolved;
  }

  /** The async twin of `resolveRootCollection`: a stable value list answers at once, candidates fan out as usual. */
  resolveRootCollectionAsync<Value>(token: Token<Value> | Constructor<Value>): Promise<ReadonlyArray<Value>> {
    // The async lane appends to its branch and never unwinds, so it works on a stack of its own.
    const resolutionStack: Array<ResolutionFrame> = [];
    try {
      // Selection runs `when()` predicates and follows aliases, either of which may throw.
      const memo = this.#rootCollection(token, resolutionStack);
      if (memo.values !== undefined && memo.activationVersion === this.#chainActivationVersion()) {
        return Promise.resolve(memo.values.slice() as Array<Value>);
      }
      return asPromise(
        this.#settleCandidates(memo.candidates, undefined, resolutionStack, UNOWNED_BRANCH, (values) => {
          this.#settleOnRepeat(memo);
          return values;
        }),
      ) as Promise<ReadonlyArray<Value>>;
    } catch (collectionError) {
      return Promise.reject(collectionError);
    }
  }

  /**
   * The memoized candidate list of a root-level, options-less collection, built on its first read.
   *
   * @remarks Sound because a `when()` predicate is pure over its context and the root context is a
   * constant: the list can only change when a registry in the chain does, which is the version the
   * memo is stamped with. From the second read on, the value list is kept too while every member is
   * a hook-free constant and no activation hook exists anywhere in the chain.
   */
  #rootCollection(token: Token<unknown> | Constructor, resolutionStack: Array<ResolutionFrame>): CollectionEntry {
    const memo = this.#lookup.collection(token);
    if (memo !== undefined) {
      return memo;
    }
    const candidates = this.#candidateBindings(token, undefined, resolutionStack);
    const entry: CollectionEntry = { candidates, values: undefined, activationVersion: -1, readBefore: false };
    this.#lookup.rememberCollection(token, entry);
    return entry;
  }

  // The first read interprets and the read that repeats it settles the value list, as a plan compiles on repeat;
  // the members either read materialised may have made the list stable for the next one.
  #settleOnRepeat(entry: CollectionEntry): void {
    if (entry.readBefore) {
      this.#settleCollectionValues(entry);
    } else {
      entry.readBefore = true;
    }
  }

  /**
   * Fills a collection memo's value list once every member is stable: a hook-free constant, or a
   * hook-free singleton whose instance is cached — anything that changes either bumps a registry
   * version the memo is keyed on. A member still to be materialised leaves the list unfilled.
   */
  #settleCollectionValues(entry: CollectionEntry): void {
    if (entry.values !== undefined || this.#chainActivationVersion() !== 0) {
      return;
    }
    const { candidates } = entry;
    for (let index = 0; index < candidates.length; index += 1) {
      if (!isStableCollectionMember(candidates[index]!)) {
        return;
      }
    }
    // Kept unfrozen: a frozen array reads through a slow elements kind, and every read copies it anyway.
    entry.values = candidates.map(stableMemberValue);
    entry.activationVersion = 0;
  }

  /** Every binding in the chain a `resolveAll` request matches, in chain order. */
  #candidateBindings(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
  ): ReadonlyArray<Binding> {
    if (options !== undefined) {
      const indexed = this.#indexedCandidates(token, options, resolutionStack);
      if (indexed !== null) {
        return this.#withoutDanglingAliases(indexed, options, resolutionStack);
      }
    }
    const allBindings = this.#allBindingsFromChain(token);
    if (allBindings.length === 0) {
      return allBindings;
    }
    const selected = selectAllBindings(allBindings, options, this.#makeConstraintContext(resolutionStack, options));
    return this.#withoutDanglingAliases(selected, options, resolutionStack);
  }

  // A chain none of whose registries ever held an alias has none to drop, which spares the scan.
  #chainHeldAlias(): boolean {
    if (this.#registry.hasHeldAlias) {
      return true;
    }
    for (let current = this.#parent; current !== undefined; current = current.#parent) {
      if (current.#registry.hasHeldAlias) {
        return true;
      }
    }
    return false;
  }

  /**
   * The candidates with any alias whose chain ends nowhere dropped, so a fan-out skips a dangling
   * alias rather than throwing on it.
   *
   * @remarks A live alias stays and resolves as before; the common list carries no alias at all and
   * is returned untouched, so nothing is allocated for it.
   */
  #withoutDanglingAliases(
    candidates: ReadonlyArray<Binding>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
  ): ReadonlyArray<Binding> {
    if (!this.#chainHeldAlias()) {
      return candidates;
    }
    let hasAlias = false;
    for (let index = 0; index < candidates.length; index += 1) {
      if (candidates[index]!.kind === "alias") {
        hasAlias = true;
        break;
      }
    }
    if (!hasAlias) {
      return candidates;
    }
    const singleCriterion = singleCriterionOnlyOf(options);
    return candidates.filter(
      (candidate) =>
        candidate.kind !== "alias" ||
        this.#terminalOfAliasBinding(candidate, options, resolutionStack, singleCriterion) !== undefined,
    );
  }

  // ── Async resolve ──────────────────────────────────────────────────────────────────────────────────────────────────

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
        !this.#hasAnyActivation(fastBinding)
      ) {
        return this.#resolveTransientDynamicAsyncFromContext(
          fastBinding,
          resolutionStack,
          branchDepth,
        ) as Promise<Value>;
      }
      return this.#resolveAsyncDefaultEntry(fastBinding, this, resolutionStack, branchDepth) as Promise<Value>;
    }
    const entry = this.#lookup.defaultEntry(token);
    if (entry === null) {
      return this.resolveAsync(token, undefined, resolutionStack, branchDepth);
    }
    return this.#resolveAsyncDefaultEntry(entry.binding, entry.owner, resolutionStack, branchDepth) as Promise<Value>;
  }

  // A `#settle*` lane answers with the value when its level completed in this tick and with a promise
  // only where something had to be awaited, so a singleton or scoped instance built without yielding
  // is cached before the fan-out that started it moves on to a sibling that may read it synchronously.

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
      return this.#settleDefaultEntry(fastBinding, this, resolutionStack, branchDepth);
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
    if (owner.#isPlainConstant(binding)) {
      return binding.value;
    }
    const scope = binding.scope;
    if (scope === "transient") {
      if ((binding.kind === "dynamic" || binding.kind === "dynamic-async") && !owner.#hasAnyActivation(binding)) {
        return this.#settleTransientFactory(binding, resolutionStack, branchDepth);
      }
    } else if (scope === "singleton") {
      if (binding.instance !== NO_INSTANCE) {
        return binding.instance;
      }
      if (owner !== this) {
        return owner.#settleBinding(binding, undefined, resolutionStack, branchDepth, owner);
      }
    } else {
      const cachedScoped = this.#readScoped(binding);
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
      return asPromise(this.#settleBinding(binding, options, [], ROOT_BRANCH, this));
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
    const { binding, owner } = this.#requireBinding(token, options, path, precomputedCriterion);

    if (binding.scope === "singleton" && owner !== this) {
      return owner.#settleBinding(binding, options, path, depth, owner);
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
    if (owner.#isPlainConstant(binding)) {
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
      const cachedScoped = this.#readScoped(binding);
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

    const frame = this.#getResolutionFrame(binding);
    // This level appends to its own branch and never unwinds.
    const levelStack = extendResolutionBranch(resolutionStack, branchDepth, frame);
    const levelDepth = branchDepthOf(levelStack);

    const needsActivation = owner.#activationNeed().needsActivation(binding);
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
      return this.#publishInFlight(binding, activated, scope);
    }
    if (scope === "singleton") {
      this.#scope.setSingleton(binding, activated);
    } else {
      this.#scope.setScoped(binding, activated);
    }
    return activated;
  }

  /**
   * Publishes a pending singleton or scoped materialisation so concurrent callers dedup onto it,
   * and caches what it settles to; the creator, like every joiner, is handed a promise of its own.
   */
  #publishInFlight(binding: Binding, pending: Promise<unknown>, scope: "singleton" | "scoped"): Promise<unknown> {
    const published = pending.then(
      (activated) => {
        if (scope === "singleton") {
          this.#scope.setSingleton(binding, activated);
        } else {
          this.#scope.setScoped(binding, activated);
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

  /**
   * Settles this resolver's own `postConstruct` answer for a class binding a parent owns.
   *
   * @remarks The owner discovers it on first instantiation, but the plan compiler reads the
   * introspector of whoever is resolving — left unknown, that resolver refuses to compile a plan for
   * this binding on every call, forever.
   */
  #mirrorPostConstructFromOwner(binding: Binding, owner: DependencyResolver): void {
    if (
      owner !== this &&
      binding.kind === "class" &&
      this.#introspector().knownPostConstruct(binding.target) === undefined
    ) {
      this.#introspector().discoverPostConstruct(binding.target);
    }
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
    this.#mirrorPostConstructFromOwner(binding, owner);
    if (!owner.#activationNeed().refreshAfterFirstInstantiation(binding, needsActivation)) {
      return instance;
    }
    return owner.#lifecycle.runActivation(ctx as AsyncLevelContext, binding, instance, owner.#metadataReader);
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
        const introspector = this.#introspector();
        const target = binding.target;
        const facts = introspector.facts(target);
        const params = this.#constructorParams(target, facts);
        const needsActiveContainer = introspector.needsActiveContainerOf(target, facts);
        // Accessor initializers resolve synchronously, so the branch-owned path serves them directly.
        const ambient = needsActiveContainer ? this.#ambientResolutionFor(resolutionStack) : undefined;
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
    let entry = this.#findBinding(token, options, path, singleCriterion);
    // Same single-evaluation contract as the sync lane: resolve what the probe found.
    if (entry !== undefined && entry.binding.kind === "alias") {
      // Follow the alias off the throwing path: a chain that ends nowhere is a miss, not an error.
      entry = this.#terminalOfAliasBinding(entry.binding, options, path, singleCriterion);
    }
    if (entry === undefined) {
      return undefined;
    }
    const { binding, owner } = entry;
    if (binding.scope === "singleton" && owner !== this) {
      return owner.#settleBinding(binding, options, path, depth, owner);
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
    const candidates = this.#candidateBindings(token, options, path);
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

  // ── Helpers ────────────────────────────────────────────────────────────────────────────────────────────────────────

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

  /**
   * The candidates the index can name outright, or `null` when the request needs full selection.
   *
   * @remarks Kept off `#candidateBindings` so that method stays the size it was: a request the
   * index cannot serve must not pay for the shape it does.
   * An index has matched the slot already, but a hit may still carry a predicate, and evaluating
   * that is the selection path's job.
   */
  #indexedCandidates(
    token: Token<unknown> | Constructor,
    options: ResolveOptions,
    resolutionStack: Array<ResolutionFrame>,
  ): ReadonlyArray<Binding> | null {
    const singleCriterion = singleCriterionOnlyOf(options);
    if (singleCriterion === undefined) {
      return null;
    }
    const indexed = this.#taggedBindingsFromChain(token, singleCriterion);
    return anyPredicate(indexed)
      ? selectAllBindings(indexed, options, this.#makeConstraintContext(resolutionStack, options))
      : indexed;
  }

  /**
   * Every binding the chain's criterion indexes hold for one criterion, nearest container first.
   *
   * @remarks A request for exactly one criterion matches exactly the bindings the index keys, so
   * this is the whole candidate set rather than a prefilter — a multi-criterion slot cannot satisfy
   * it.
   */
  #taggedBindingsFromChain(token: Token<unknown> | Constructor, tag: BindingTag): Array<Binding> {
    // A criterion matches at most one binding per registry, so a root container's answer is built
    // whole rather than grown — the list is sized at its allocation.
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
      binding.activationHook === undefined &&
      (this.#lifecycle.activationVersion === 0 || !this.#lifecycle.hasActivationHandlers(binding.token))
    );
  }

  /** Whether either an own hook or a container-level hook would run for this binding. */
  #hasAnyActivation(binding: DynamicBinding<unknown> | DynamicAsyncBinding<unknown>): boolean {
    if (binding.activationHook !== undefined) {
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
    return this.#scope.readScoped(binding.scopedCacheKey);
  }

  // The shared root context answers every top-level request; building one is the rarer half and
  // lives outside, so what a selection inlines is the test and not the literal.
  #makeConstraintContext(
    resolutionStack: Array<ResolutionFrame>,
    options: ResolveOptions | undefined,
  ): ConstraintContext {
    if (options === undefined && resolutionStack.length === 0) {
      return ROOT_CONSTRAINT_CONTEXT;
    }
    return new DefaultConstraintContext(resolutionStack, options);
  }

  /** The predicate half of a match, for a lane whose index has already settled the slot. */
  #satisfiesPredicate(
    binding: Binding,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
  ): boolean {
    const predicate = binding.predicate;
    if (predicate === undefined) {
      return true;
    }
    return predicate(this.#makeConstraintContext(resolutionStack, options));
  }

  #resolveTransientDynamicSyncFromContext(
    binding: DynamicBinding<unknown>,
    resolutionStack: Array<ResolutionFrame>,
  ): unknown {
    // One lane at every depth: `binding.inFlight` is O(1), so there is nothing to escape.
    const frame = this.#getResolutionFrame(binding);
    const tokenDisplayName = frame.tokenName;
    if (binding.inFlight) {
      throw new CircularDependencyError(cycleNamesOf(resolutionStack, tokenDisplayName));
    }
    binding.inFlight = true;
    resolutionStack.push(frame);
    const resolutionCtx = this.#acquireSyncResolutionContext(resolutionStack, undefined);
    try {
      const dynamicResult = binding.factory(resolutionCtx);
      if (dynamicResult instanceof Promise) {
        throw new AsyncResolutionError(resolutionStack[0]?.tokenName ?? tokenDisplayName, tokenDisplayName);
      }
      return dynamicResult;
    } finally {
      resolutionStack.pop();
      binding.inFlight = false;
    }
  }

  /** A transient factory level with no activation: its factory's own result over the level's context. */
  #settleTransientFactory(
    binding: DynamicBinding<unknown> | DynamicAsyncBinding<unknown>,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
  ): unknown {
    const frame = this.#getResolutionFrame(binding);
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
    const frame = this.#getResolutionFrame(binding);
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

  // ── The async root ─────────────────────────────────────────────────────────────────────────────────────────────────

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
        !this.#hasAnyActivation(fastBinding)
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
      ctx = new AsyncLevelContext(
        this,
        extendResolutionBranch([], ROOT_BRANCH, this.#getResolutionFrame(binding)),
        undefined,
      );
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

  // A cached candidate answers here rather than re-entering the generic path: `resolveAll` pays
  // this per candidate, and a fan-out over cached handlers is the shape that makes it matter.
  #resolveCandidateSync(
    binding: Binding,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
  ): unknown {
    // Fan-outs are dominated by constants: with no activation hook anywhere in the chain, a
    // hook-free constant is plain no matter which container owns it — skip the owner probe.
    if (binding.kind === "constant" && binding.activationHook === undefined && this.#chainActivationVersion() === 0) {
      return binding.value;
    }
    const owner = this.#ownerOf(binding);
    if (owner.#isPlainConstant(binding)) {
      return binding.value;
    }
    if (binding.kind === "alias") {
      return this.resolve(binding.target, options, resolutionStack);
    }
    if (binding.scope === "singleton") {
      if (binding.instance !== NO_INSTANCE) {
        return binding.instance;
      }
      // Owner-routed like `resolve`: the owner materializes and caches its own singleton.
      return owner.#resolveBinding(binding, options, resolutionStack, owner);
    }
    return this.#resolveBinding(binding, options, resolutionStack, owner);
  }

  #settleCandidate(
    binding: Binding,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
  ): unknown {
    if (binding.kind === "constant" && binding.activationHook === undefined && this.#chainActivationVersion() === 0) {
      return binding.value;
    }
    const owner = this.#ownerOf(binding);
    if (owner.#isPlainConstant(binding)) {
      return binding.value;
    }
    if (binding.kind === "alias") {
      return this.#settleRequest(binding.target, options, resolutionStack, branchDepth);
    }
    if (binding.scope === "singleton") {
      if (binding.instance !== NO_INSTANCE) {
        return binding.instance;
      }
      return owner.#settleBinding(binding, options, resolutionStack, branchDepth, owner);
    }
    // The dominant collection member — a transient factory with no activation, asked with no
    // options — takes the lane a single resolve takes, so a fan-out costs one factory result per
    // member rather than a promise on top of each.
    if (
      options === undefined &&
      binding.scope === "transient" &&
      (binding.kind === "dynamic" || binding.kind === "dynamic-async") &&
      !owner.#hasAnyActivation(binding)
    ) {
      return this.#settleTransientFactory(binding, resolutionStack, branchDepth);
    }
    return this.#settleBinding(binding, options, resolutionStack, branchDepth, owner);
  }

  /** The resolver whose registry holds `binding` — `this` (the common case) when it is own. */
  #ownerOf(binding: Binding): DependencyResolver {
    // A root resolver can only hold its own bindings, so the per-candidate id probe is chain-only.
    if (this.#parent === undefined || this.#registry.getById(binding.identifier) !== undefined) {
      return this;
    }
    for (let current: DependencyResolver | undefined = this.#parent; current !== undefined; current = current.#parent) {
      if (current.#registry.getById(binding.identifier) !== undefined) {
        return current;
      }
    }
    return this;
  }

  #getResolutionFrame(binding: Binding): ResolutionFrame {
    // Memoized on the binding rather than in a per-resolver Map: the frame derives only from
    // immutable binding fields, so it is identical for every resolver, and a field read beats a
    // Map lookup on every hop of a chain.
    const existing = binding.frame;
    if (existing !== undefined) {
      return existing;
    }
    const frame = buildResolutionFrame(binding, tokenName(binding.token));
    binding.frame = frame;
    return frame;
  }

  // A pool is keyed by the one array pair its contexts hold, so reuse can never re-point a context
  // a live frame still reads — a nested top-level resolve reaches the same depth while the outer
  // factory runs, and it must get its own context, not the outer frame's re-bound.
  #acquireSyncResolutionContext(
    resolutionStack: Array<ResolutionFrame>,
    options: ResolveOptions | undefined,
  ): DefaultResolutionContext {
    if (resolutionStack === this.rootStack) {
      const depth = resolutionStack.length;
      const pool = (this.#syncResolutionContextPool ??= []);
      const existing = pool[depth];
      if (existing !== undefined) {
        existing.reset(this, resolutionStack, options);
        return existing;
      }
      const created = new DefaultResolutionContext(this, resolutionStack, options);
      pool[depth] = created;
      return created;
    }
    // A throwaway pair — a nested resolve, an async level's prefix — mints per call.
    return new DefaultResolutionContext(this, resolutionStack, options);
  }
}

/**
 * Whether a binding answers a collection read with a fixed value: a hook-free constant, or a
 * singleton whose instance is already cached.
 *
 * @remarks A cached singleton reads like a constant until a registry change evicts it, which also
 * drops the memo.
 */
function isStableCollectionMember(binding: Binding): boolean {
  if (binding.kind === "alias" || binding.activationHook !== undefined) {
    return false;
  }
  return binding.kind === "constant" || (binding.scope === "singleton" && binding.instance !== NO_INSTANCE);
}

function stableMemberValue(binding: Binding): unknown {
  return binding.kind === "constant" ? binding.value : binding.instance;
}

function anyPredicate(bindings: ReadonlyArray<Binding>): boolean {
  for (let index = 0; index < bindings.length; index += 1) {
    if (bindings[index]!.predicate !== undefined) {
      return true;
    }
  }
  return false;
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
  ctx: ResolutionContext,
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

/** The async-resolution failure for a binding reached on a sync path, naming what to await instead. */
function asyncResolutionErrorFor(
  binding: Binding,
  resolutionStack: ReadonlyArray<ResolutionFrame>,
): AsyncResolutionError {
  const sourceName = tokenName(binding.token);
  return new AsyncResolutionError(resolutionStack[0]?.tokenName ?? sourceName, sourceName);
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

/** Only a factory is handed the resolution context; everything else gets its deps directly. */
function requiresResolutionContext(binding: Binding): boolean {
  return binding.kind === "dynamic" || binding.kind === "dynamic-async";
}
