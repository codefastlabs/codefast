import type { Binding } from "#core/binding";
/** The `ResolutionContext` a factory is handed, and the callbacks the resolver answers it with. */
import type { Token } from "#core/token";
import type {
  AsyncResolutionContext,
  ConstraintContext,
  Constructor,
  ResolutionFrame,
  ResolutionContext,
  ResolveOptions,
} from "#core/types";
import type { BranchDepth, OwnedBranchStack } from "#resolution/path";
import { bindingsOf, enterSeededPath, leaveSeededPath } from "#resolution/path";

// ── ResolutionContext implementation ─────────────────────────────────────────────────────────────────────────────────

/**
 * The engine surface a resolution context calls back into to resolve further dependencies.
 *
 * @since 0.3.16-canary.0
 */
export interface ResolverCallbacks {
  resolveFromContext<Value>(token: Token<Value> | Constructor<Value>, resolutionStack: Array<ResolutionFrame>): Value;
  resolve<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
  ): Value;
  resolveOptional<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
  ): Value | undefined;
  resolveAll<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
  ): ReadonlyArray<Value>;
}

/**
 * The async lane a level's context calls back into: the sync callbacks it shares, and the async ones it adds.
 */
export interface AsyncLaneCallbacks {
  readonly resolver: ResolverCallbacks;
  resolveAsyncFromContext<Value>(
    token: Token<Value> | Constructor<Value>,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
  ): Promise<Value>;
  resolveAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value>;
  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value | undefined>;
  resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<ReadonlyArray<Value>>;
}

/**
 * The `ResolutionContext` handed to factories and hooks, backed by the engine's callbacks.
 *
 * @since 0.3.16-canary.0
 */
export class DefaultResolutionContext implements ResolutionContext {
  #resolver: ResolverCallbacks;
  #resolutionStack: Array<ResolutionFrame>;
  #currentOptions: ResolveOptions | undefined;

  constructor(
    resolver: ResolverCallbacks,
    resolutionStack: Array<ResolutionFrame>,
    currentOptions: ResolveOptions | undefined,
  ) {
    this.#resolver = resolver;
    this.#resolutionStack = resolutionStack;
    this.#currentOptions = currentOptions;
  }

  #graph: ConstraintContext | undefined;

  get graph(): ConstraintContext {
    if (this.#graph === undefined) {
      this.#graph = new DefaultConstraintContext(this.#resolutionStack, this.#currentOptions);
    }
    return this.#graph;
  }

  reset(
    resolver: ResolverCallbacks,
    resolutionStack: Array<ResolutionFrame>,
    currentOptions: ResolveOptions | undefined,
  ): void {
    // Compared before storing: a pooled context lives long enough to be in old space, so storing a
    // pointer costs a write barrier, and a sync resolve hands every depth the same stack.
    if (this.#resolver !== resolver) {
      this.#resolver = resolver;
    }
    if (this.#resolutionStack !== resolutionStack) {
      this.#resolutionStack = resolutionStack;
    }
    this.#currentOptions = currentOptions;
    if (this.#graph !== undefined) {
      this.#graph = undefined;
    }
  }

  resolve<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ): Value {
    if (options === undefined) {
      return this.#resolver.resolveFromContext(token, this.#resolutionStack);
    }
    return this.#resolver.resolve(token, options, this.#resolutionStack);
  }

  resolveOptional<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ): Value | undefined {
    return this.#resolver.resolveOptional(token, options, this.#resolutionStack);
  }

  resolveAll<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ): ReadonlyArray<Value> {
    return this.#resolver.resolveAll(token, options, this.#resolutionStack);
  }
}

/**
 * One async level's resolution context, which is also its branch of the resolution stack.
 *
 * @remarks Separate from {@link DefaultResolutionContext} so the sync lane's pooled context keeps
 * reading its stack as a plain field: only an async branch has a prefix to take, because an async
 * level owns its branch of the stack.
 *
 * @since 0.5.0-canary.9
 */
export class AsyncLevelContext implements AsyncResolutionContext {
  readonly #lane: AsyncLaneCallbacks;
  readonly #resolutionStack: OwnedBranchStack;
  readonly #currentOptions: ResolveOptions | undefined;
  readonly #branchDepth: BranchDepth;

  /**
   * @param lane - the async lane every request on this level goes through, sync ones via its resolver
   * @param resolutionStack - this level's own branch; the depth is read off it rather than passed,
   * so the two cannot disagree about where this level sits
   * @param currentOptions - the options of the request that opened this level, if any
   */
  constructor(lane: AsyncLaneCallbacks, resolutionStack: OwnedBranchStack, currentOptions: ResolveOptions | undefined) {
    this.#lane = lane;
    this.#resolutionStack = resolutionStack;
    this.#currentOptions = currentOptions;
    this.#branchDepth = resolutionStack.length as BranchDepth;
  }

  #graph: ConstraintContext | undefined;
  #exactStackCache: Array<ResolutionFrame> | undefined;
  #exactBindingsCache: Array<Binding> | undefined;

  get graph(): ConstraintContext {
    if (this.#graph === undefined) {
      this.#graph = new DefaultConstraintContext(this.#exactStack(), this.#currentOptions);
    }
    return this.#graph;
  }

  // The stack is append-only and a descendant may already have grown it past this level, so every
  // caller but the async lane is handed this branch's prefix. It is fixed for the level's lifetime.
  #exactStack(): Array<ResolutionFrame> {
    return (this.#exactStackCache ??= this.#resolutionStack.slice(0, this.#branchDepth));
  }

  /** This level's own path, fixed for its lifetime, for a caller that names it in an error. */
  get ownPath(): ReadonlyArray<ResolutionFrame> {
    return this.#exactStack();
  }

  // The bindings a synchronous call from this level marks in flight, read off the frames once.
  #exactBindings(): Array<Binding> {
    return (this.#exactBindingsCache ??= bindingsOf(this.#exactStack()));
  }

  // A synchronous call from an async level runs over a path no synchronous frame pushed, so the
  // level's ancestors are marked in flight for its duration — and the level itself, whose factory is
  // the caller: a factory resolving its own token synchronously has closed a cycle.
  resolve<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ): Value {
    const path = this.#exactStack();
    const marked = this.#exactBindings();
    const alreadyInFlight = enterSeededPath(marked);
    try {
      if (options === undefined) {
        return this.#lane.resolver.resolveFromContext(token, path);
      }
      return this.#lane.resolver.resolve(token, options, path);
    } finally {
      leaveSeededPath(marked, alreadyInFlight);
    }
  }

  resolveAsync<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ): Promise<Value> {
    if (options === undefined) {
      // The hot lane: the resolver reads this branch by depth, so nothing is materialized.
      return this.#lane.resolveAsyncFromContext(token, this.#resolutionStack, this.#branchDepth);
    }
    return this.#lane.resolveAsync(token, options, this.#exactStack());
  }

  resolveOptional<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ): Value | undefined {
    const path = this.#exactStack();
    const marked = this.#exactBindings();
    const alreadyInFlight = enterSeededPath(marked);
    try {
      return this.#lane.resolver.resolveOptional(token, options, path);
    } finally {
      leaveSeededPath(marked, alreadyInFlight);
    }
  }

  resolveOptionalAsync<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ): Promise<Value | undefined> {
    return this.#lane.resolveOptionalAsync(token, options, this.#exactStack());
  }

  resolveAll<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ): ReadonlyArray<Value> {
    const path = this.#exactStack();
    const marked = this.#exactBindings();
    const alreadyInFlight = enterSeededPath(marked);
    try {
      return this.#lane.resolver.resolveAll(token, options, path);
    } finally {
      leaveSeededPath(marked, alreadyInFlight);
    }
  }

  resolveAllAsync<Value, Names extends string = string>(
    token: Token<Value, Names> | Constructor<Value>,
    options?: NoInfer<ResolveOptions<Names>>,
  ): Promise<ReadonlyArray<Value>> {
    return this.#lane.resolveAllAsync(token, options, this.#exactStack());
  }
}

/**
 * The one constraint context every predicate reads, whatever lane built it.
 *
 * @remarks One shape for the shared root, a selection over a live synchronous stack, an async
 * level's prefix and an inspector's probe, so a predicate's call site stays monomorphic.
 *
 * @since 0.11.0
 */
export class DefaultConstraintContext implements ConstraintContext {
  readonly resolutionStack: ReadonlyArray<ResolutionFrame>;
  readonly parent: ResolutionFrame | undefined;
  readonly currentResolveOptions: Readonly<ResolveOptions> | undefined;

  constructor(resolutionStack: ReadonlyArray<ResolutionFrame>, currentResolveOptions: ResolveOptions | undefined) {
    this.resolutionStack = resolutionStack;
    this.parent = resolutionStack.at(-1);
    this.currentResolveOptions = currentResolveOptions;
  }

  // Derived per read, never cached: the stack this context aliases may be live, and the names must
  // report it as it stands — exactly as the dedicated name array did.
  get resolutionPath(): ReadonlyArray<string> {
    const names = new Array<string>(this.resolutionStack.length);
    for (let index = 0; index < this.resolutionStack.length; index += 1) {
      names[index] = this.resolutionStack[index]!.tokenName;
    }
    return names;
  }

  #ancestors: ReadonlyArray<ResolutionFrame> | undefined;

  get ancestors(): ReadonlyArray<ResolutionFrame> {
    if (this.#ancestors === undefined) {
      this.#ancestors = this.resolutionStack.length > 1 ? this.resolutionStack.slice(0, -1) : [];
    }
    return this.#ancestors;
  }
}
