import type { Binding } from "#core/binding";
/** The `ResolutionContext` a factory is handed, and the callbacks the resolver answers it with. */
import type { Token } from "#core/token";
import type { ConstraintContext, Constructor, ResolutionFrame, ResolutionContext, ResolveOptions } from "#core/types";
import type { BranchDepth, OwnedBranchStack } from "#resolution/path/resolution-path";
import { bindingsOf, enterSeededPath, leaveSeededPath, UNOWNED_BRANCH } from "#resolution/path/resolution-path";

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
  resolveOptional<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
  ): Value | undefined;
  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value | undefined>;
  resolveAll<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
  ): ReadonlyArray<Value>;
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

  resolve<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value {
    if (options === undefined) {
      return this.#resolver.resolveFromContext(token, this.#resolutionStack);
    }
    return this.#resolver.resolve(token, options, this.#resolutionStack);
  }

  resolveAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Value> {
    if (options === undefined) {
      // UNOWNED_BRANCH: this frame's array is a sync stack it will pop, so the lane must copy it.
      return this.#resolver.resolveAsyncFromContext(token, this.#resolutionStack, UNOWNED_BRANCH);
    }
    return this.#resolver.resolveAsync(token, options, this.#resolutionStack);
  }

  resolveOptional<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined {
    return this.#resolver.resolveOptional(token, options, this.#resolutionStack);
  }

  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Value | undefined> {
    return this.#resolver.resolveOptionalAsync(token, options, this.#resolutionStack);
  }

  resolveAll<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): ReadonlyArray<Value> {
    return this.#resolver.resolveAll(token, options, this.#resolutionStack);
  }

  resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<ReadonlyArray<Value>> {
    return this.#resolver.resolveAllAsync(token, options, this.#resolutionStack);
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
export class AsyncLevelContext implements ResolutionContext {
  readonly #resolver: ResolverCallbacks;
  readonly #resolutionStack: OwnedBranchStack;
  readonly #currentOptions: ResolveOptions | undefined;
  readonly #branchDepth: BranchDepth;

  /**
   * @param resolver - the engine callbacks every request on this level goes through
   * @param resolutionStack - this level's own branch; the depth is read off it rather than passed,
   * so the two cannot disagree about where this level sits
   * @param currentOptions - the options of the request that opened this level, if any
   */
  constructor(
    resolver: ResolverCallbacks,
    resolutionStack: OwnedBranchStack,
    currentOptions: ResolveOptions | undefined,
  ) {
    this.#resolver = resolver;
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

  // The bindings a synchronous call from this level marks in flight, read off the frames once.
  #exactBindings(): Array<Binding> {
    return (this.#exactBindingsCache ??= bindingsOf(this.#exactStack()));
  }

  // A synchronous call from an async level runs over a path no synchronous frame pushed, so the
  // level's ancestors are marked in flight for its duration — and the level itself, whose factory is
  // the caller: a factory resolving its own token synchronously has closed a cycle.
  resolve<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value {
    const path = this.#exactStack();
    const marked = this.#exactBindings();
    const alreadyInFlight = enterSeededPath(marked);
    try {
      if (options === undefined) {
        return this.#resolver.resolveFromContext(token, path);
      }
      return this.#resolver.resolve(token, options, path);
    } finally {
      leaveSeededPath(marked, alreadyInFlight);
    }
  }

  resolveAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Value> {
    if (options === undefined) {
      // The hot lane: the resolver reads this branch by depth, so nothing is materialized.
      return this.#resolver.resolveAsyncFromContext(token, this.#resolutionStack, this.#branchDepth);
    }
    return this.#resolver.resolveAsync(token, options, this.#exactStack());
  }

  resolveOptional<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined {
    const path = this.#exactStack();
    const marked = this.#exactBindings();
    const alreadyInFlight = enterSeededPath(marked);
    try {
      return this.#resolver.resolveOptional(token, options, path);
    } finally {
      leaveSeededPath(marked, alreadyInFlight);
    }
  }

  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Value | undefined> {
    return this.#resolver.resolveOptionalAsync(token, options, this.#exactStack());
  }

  resolveAll<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): ReadonlyArray<Value> {
    const path = this.#exactStack();
    const marked = this.#exactBindings();
    const alreadyInFlight = enterSeededPath(marked);
    try {
      return this.#resolver.resolveAll(token, options, path);
    } finally {
      leaveSeededPath(marked, alreadyInFlight);
    }
  }

  resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<ReadonlyArray<Value>> {
    return this.#resolver.resolveAllAsync(token, options, this.#exactStack());
  }
}

/**
 * The one constraint context every predicate reads, whatever lane built it.
 *
 * @remarks One shape for the shared root, a selection over a live synchronous stack, an async
 * level's prefix and an inspector's probe, so a predicate's call site stays monomorphic.
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
