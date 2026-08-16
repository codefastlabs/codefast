/** The `ResolutionContext` a factory is handed, and the callbacks the resolver answers it with. */
import type { Token } from "#/core/token";
import type {
  BindingIdentifier,
  BindingKind,
  BindingScope,
  ConstraintContext,
  Constructor,
  ResolutionFrame,
  ResolutionContext,
  ResolveOptions,
} from "#/core/types";
import type { BranchDepth, OwnedBranchStack } from "#/resolution/path/resolution-path";
import { UNOWNED_BRANCH } from "#/resolution/path/resolution-path";

// ── ResolutionContext implementation ──────────────────────────────────────────

/**
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
  /** Not one of the eight `Value`-naming entry points: its caller is, and casts once. */
  resolveAsyncFromCascade(token: Token<unknown> | Constructor): Promise<unknown>;
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
  ): Array<Value>;
  resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Array<Value>>;
}

/**
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

  resolveAll<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Array<Value> {
    return this.#resolver.resolveAll(token, options, this.#resolutionStack);
  }

  resolveAllAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Array<Value>> {
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
   * @param resolutionStack - this level's own branch; the depth is read off it rather than passed,
   * so the two cannot disagree about where this level sits
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

  resolve<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value {
    if (options === undefined) {
      return this.#resolver.resolveFromContext(token, this.#exactStack());
    }
    return this.#resolver.resolve(token, options, this.#exactStack());
  }

  resolveAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Value> {
    if (options === undefined) {
      // The hot lane: the resolver reads this branch by depth, so nothing is materialized.
      return this.#resolver.resolveAsyncFromContext(token, this.#resolutionStack, this.#branchDepth);
    }
    return this.#resolver.resolveAsync(token, options, this.#exactStack());
  }

  resolveOptional<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined {
    return this.#resolver.resolveOptional(token, options, this.#exactStack());
  }

  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Value | undefined> {
    return this.#resolver.resolveOptionalAsync(token, options, this.#exactStack());
  }

  resolveAll<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Array<Value> {
    return this.#resolver.resolveAll(token, options, this.#exactStack());
  }

  resolveAllAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Array<Value>> {
    return this.#resolver.resolveAllAsync(token, options, this.#exactStack());
  }
}

/**
 * The one context every level of an open synchronous factory cascade shares.
 *
 * @remarks It carries no per-level state at all: while the cascade is open, the resolver's stack
 * *is* this level's ancestor chain, so nothing has to be allocated per level.
 *
 * @since 0.5.0-canary.9
 */
export class AsyncCascadeContext implements ResolutionContext {
  readonly #resolver: ResolverCallbacks;
  readonly #cascadeStack: Array<ResolutionFrame>;

  constructor(resolver: ResolverCallbacks, cascadeStack: Array<ResolutionFrame>) {
    this.#resolver = resolver;
    this.#cascadeStack = cascadeStack;
  }

  get graph(): ConstraintContext {
    // Not memoized: this context outlives every level, so a cached graph would describe whichever
    // level asked first. The cascade stack is only this level's ancestors while it is open.
    return new DefaultConstraintContext(this.#cascadeStack, undefined);
  }

  resolve<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value {
    if (options === undefined) {
      return this.#resolver.resolveFromContext(token, this.#cascadeStack);
    }
    return this.#resolver.resolve(token, options, this.#cascadeStack);
  }

  resolveAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Value> {
    if (options === undefined) {
      return this.#resolver.resolveAsyncFromCascade(token) as Promise<Value>;
    }
    return this.#resolver.resolveAsync(token, options, [...this.#cascadeStack]);
  }

  resolveOptional<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined {
    return this.#resolver.resolveOptional(token, options, this.#cascadeStack);
  }

  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Value | undefined> {
    return this.#resolver.resolveOptionalAsync(token, options, [...this.#cascadeStack]);
  }

  resolveAll<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Array<Value> {
    return this.#resolver.resolveAll(token, options, this.#cascadeStack);
  }

  resolveAllAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Array<Value>> {
    return this.#resolver.resolveAllAsync(token, options, [...this.#cascadeStack]);
  }
}

class DefaultConstraintContext implements ConstraintContext {
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

/**
 * @since 0.3.16-canary.0
 */
export function buildResolutionFrame(
  tokenName: string,
  scope: BindingScope,
  bindingId: BindingIdentifier,
  kind: BindingKind,
  slot: ResolutionFrame["slot"],
): ResolutionFrame {
  return { tokenName, scope, bindingId, kind, slot };
}
