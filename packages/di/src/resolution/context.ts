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
import type { BranchDepth, OwnedBranchPath, OwnedBranchStack } from "#/resolution/path/resolution-path";
import { UNOWNED_BRANCH } from "#/resolution/path/resolution-path";

// ── ResolutionContext implementation ──────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface ResolverCallbacks {
  resolveFromContext<Value>(
    token: Token<Value> | Constructor<Value>,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value;
  resolve<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value;
  resolveAsyncFromContext<Value>(
    token: Token<Value> | Constructor<Value>,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    branchDepth: BranchDepth,
  ): Promise<Value>;
  /** Not one of the eight `Value`-naming entry points: its caller is, and casts once. */
  resolveAsyncFromCascade(token: Token<unknown> | Constructor): Promise<unknown>;
  resolveAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value>;
  resolveOptional<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value | undefined;
  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value | undefined>;
  resolveAll<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Array<Value>;
  resolveAllAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Array<Value>>;
}

/**
 * @since 0.3.16-canary.0
 */
export class DefaultResolutionContext implements ResolutionContext {
  #resolver: ResolverCallbacks;
  #resolutionPath: Array<string>;
  #resolutionStack: Array<ResolutionFrame>;
  #currentOptions: ResolveOptions | undefined;

  constructor(
    resolver: ResolverCallbacks,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    currentOptions: ResolveOptions | undefined,
  ) {
    this.#resolver = resolver;
    this.#resolutionPath = resolutionPath;
    this.#resolutionStack = resolutionStack;
    this.#currentOptions = currentOptions;
  }

  #graph: ConstraintContext | undefined;

  get graph(): ConstraintContext {
    if (this.#graph === undefined) {
      this.#graph = new DefaultConstraintContext(this.#resolutionPath, this.#resolutionStack, this.#currentOptions);
    }
    return this.#graph;
  }

  reset(
    resolver: ResolverCallbacks,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    currentOptions: ResolveOptions | undefined,
  ): void {
    // Compared before storing: a pooled context lives long enough to be in old space, so storing a
    // pointer costs a write barrier, and a sync resolve hands every depth the same two arrays.
    if (this.#resolver !== resolver) {
      this.#resolver = resolver;
    }
    if (this.#resolutionPath !== resolutionPath) {
      this.#resolutionPath = resolutionPath;
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
      return this.#resolver.resolveFromContext(token, this.#resolutionPath, this.#resolutionStack);
    }
    return this.#resolver.resolve(token, options, this.#resolutionPath, this.#resolutionStack);
  }

  resolveAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Value> {
    if (options === undefined) {
      // UNOWNED_BRANCH: this frame's array is a sync stack it will pop, so the lane must copy it.
      return this.#resolver.resolveAsyncFromContext(token, this.#resolutionPath, this.#resolutionStack, UNOWNED_BRANCH);
    }
    return this.#resolver.resolveAsync(token, options, this.#resolutionPath, this.#resolutionStack);
  }

  resolveOptional<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined {
    return this.#resolver.resolveOptional(token, options, this.#resolutionPath, this.#resolutionStack);
  }

  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Value | undefined> {
    return this.#resolver.resolveOptionalAsync(token, options, this.#resolutionPath, this.#resolutionStack);
  }

  resolveAll<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Array<Value> {
    return this.#resolver.resolveAll(token, options, this.#resolutionPath, this.#resolutionStack);
  }

  resolveAllAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Array<Value>> {
    return this.#resolver.resolveAllAsync(token, options, this.#resolutionPath, this.#resolutionStack);
  }
}

/**
 * One async level's resolution context, which is also its branch of the resolution path.
 *
 * @remarks Separate from {@link DefaultResolutionContext} so the sync lane's pooled context keeps
 * reading its arrays as plain fields: only an async branch has a prefix to take. See
 * `ARCHITECTURE.md` — an async level owns its branch of the path.
 *
 * @since 0.5.0-canary.9
 */
export class AsyncLevelContext implements ResolutionContext {
  readonly #resolver: ResolverCallbacks;
  readonly #resolutionPath: OwnedBranchPath;
  readonly #resolutionStack: OwnedBranchStack;
  readonly #currentOptions: ResolveOptions | undefined;
  readonly #branchDepth: BranchDepth;

  /**
   * @param resolutionPath - this level's own branch; the depth is read off it rather than passed,
   * so the two cannot disagree about where this level sits
   */
  constructor(
    resolver: ResolverCallbacks,
    resolutionPath: OwnedBranchPath,
    resolutionStack: OwnedBranchStack,
    currentOptions: ResolveOptions | undefined,
  ) {
    this.#resolver = resolver;
    this.#resolutionPath = resolutionPath;
    this.#resolutionStack = resolutionStack;
    this.#currentOptions = currentOptions;
    this.#branchDepth = resolutionPath.length as BranchDepth;
  }

  #graph: ConstraintContext | undefined;
  #exactPathCache: Array<string> | undefined;
  #exactStackCache: Array<ResolutionFrame> | undefined;

  get graph(): ConstraintContext {
    if (this.#graph === undefined) {
      this.#graph = new DefaultConstraintContext(this.#exactPath(), this.#exactStack(), this.#currentOptions);
    }
    return this.#graph;
  }

  // The path is append-only and a descendant may already have grown it past this level, so every
  // caller but the async lane is handed this branch's prefix. It is fixed for the level's lifetime.
  #exactPath(): Array<string> {
    return (this.#exactPathCache ??= this.#resolutionPath.slice(0, this.#branchDepth));
  }

  #exactStack(): Array<ResolutionFrame> {
    return (this.#exactStackCache ??= this.#resolutionStack.slice(0, this.#branchDepth));
  }

  resolve<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value {
    if (options === undefined) {
      return this.#resolver.resolveFromContext(token, this.#exactPath(), this.#exactStack());
    }
    return this.#resolver.resolve(token, options, this.#exactPath(), this.#exactStack());
  }

  resolveAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Value> {
    if (options === undefined) {
      // The hot lane: the resolver reads this branch by depth, so nothing is materialized.
      return this.#resolver.resolveAsyncFromContext(
        token,
        this.#resolutionPath,
        this.#resolutionStack,
        this.#branchDepth,
      );
    }
    return this.#resolver.resolveAsync(token, options, this.#exactPath(), this.#exactStack());
  }

  resolveOptional<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined {
    return this.#resolver.resolveOptional(token, options, this.#exactPath(), this.#exactStack());
  }

  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Value | undefined> {
    return this.#resolver.resolveOptionalAsync(token, options, this.#exactPath(), this.#exactStack());
  }

  resolveAll<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Array<Value> {
    return this.#resolver.resolveAll(token, options, this.#exactPath(), this.#exactStack());
  }

  resolveAllAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Array<Value>> {
    return this.#resolver.resolveAllAsync(token, options, this.#exactPath(), this.#exactStack());
  }
}

/**
 * The one context every level of an open synchronous factory cascade shares.
 *
 * @remarks It carries no per-level state at all: while the cascade is open, the resolver's arrays
 * *are* this level's ancestor chain, so nothing has to be allocated per level. See
 * `ARCHITECTURE.md` — the cascade lane.
 *
 * @since 0.5.0-canary.9
 */
export class AsyncCascadeContext implements ResolutionContext {
  readonly #resolver: ResolverCallbacks;
  readonly #cascadePath: Array<string>;
  readonly #cascadeStack: Array<ResolutionFrame>;

  constructor(resolver: ResolverCallbacks, cascadePath: Array<string>, cascadeStack: Array<ResolutionFrame>) {
    this.#resolver = resolver;
    this.#cascadePath = cascadePath;
    this.#cascadeStack = cascadeStack;
  }

  get graph(): ConstraintContext {
    // Not memoized: this context outlives every level, so a cached graph would describe whichever
    // level asked first. The cascade arrays are only this level's ancestors while it is open.
    return new DefaultConstraintContext(this.#cascadePath, this.#cascadeStack, undefined);
  }

  resolve<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value {
    if (options === undefined) {
      return this.#resolver.resolveFromContext(token, this.#cascadePath, this.#cascadeStack);
    }
    return this.#resolver.resolve(token, options, this.#cascadePath, this.#cascadeStack);
  }

  resolveAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Value> {
    if (options === undefined) {
      return this.#resolver.resolveAsyncFromCascade(token) as Promise<Value>;
    }
    return this.#resolver.resolveAsync(token, options, [...this.#cascadePath], [...this.#cascadeStack]);
  }

  resolveOptional<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined {
    return this.#resolver.resolveOptional(token, options, this.#cascadePath, this.#cascadeStack);
  }

  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Value | undefined> {
    return this.#resolver.resolveOptionalAsync(token, options, [...this.#cascadePath], [...this.#cascadeStack]);
  }

  resolveAll<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Array<Value> {
    return this.#resolver.resolveAll(token, options, this.#cascadePath, this.#cascadeStack);
  }

  resolveAllAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Array<Value>> {
    return this.#resolver.resolveAllAsync(token, options, [...this.#cascadePath], [...this.#cascadeStack]);
  }
}

class DefaultConstraintContext implements ConstraintContext {
  readonly resolutionPath: ReadonlyArray<string>;
  readonly resolutionStack: ReadonlyArray<ResolutionFrame>;
  readonly parent: ResolutionFrame | undefined;
  readonly currentResolveOptions: ResolveOptions | undefined;

  constructor(
    resolutionPath: ReadonlyArray<string>,
    resolutionStack: ReadonlyArray<ResolutionFrame>,
    currentResolveOptions: ResolveOptions | undefined,
  ) {
    this.resolutionPath = resolutionPath;
    this.resolutionStack = resolutionStack;
    this.parent = resolutionStack.at(-1);
    this.currentResolveOptions = currentResolveOptions;
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
