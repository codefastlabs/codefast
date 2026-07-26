import type { Container } from "#/container/container";
import type { Token } from "#/token";
import type {
  BindingIdentifier,
  BindingKind,
  BindingScope,
  ConstraintContext,
  Constructor,
  ResolutionFrame,
  ResolutionContext,
  ResolveOptions,
} from "#/types";

// ── Active container ──────────────────────────────────────────────────────────

let activeContainer: Container | undefined;

/**
 * @since 0.3.16-canary.0
 */
export function runWithContainer<Result>(container: Container, fn: () => Result): Result {
  const prev = activeContainer;
  activeContainer = container;
  try {
    return fn();
  } finally {
    activeContainer = prev;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export function getActiveContainer(): Container | undefined {
  return activeContainer;
}

// ── ResolutionContext implementation ──────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface ResolverCallbacks {
  resolveFromContext<const Value>(
    token: Token<Value> | Constructor<Value>,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value;
  resolve<const Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value;
  resolveAsyncFromContext<const Value>(
    token: Token<Value> | Constructor<Value>,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    callerContext?: DefaultResolutionContext,
  ): Promise<Value>;
  resolveAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value>;
  resolveOptional<const Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value | undefined;
  resolveOptionalAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value | undefined>;
  resolveAll<const Value>(
    token: Token<Value> | Constructor<Value>,
    options: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Array<Value>;
  resolveAllAsync<const Value>(
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
    this.owner = resolver;
    this.#resolutionPath = resolutionPath;
    this.#resolutionStack = resolutionStack;
    this.#currentOptions = currentOptions;
  }

  #graph: ConstraintContext | undefined;

  /**
   * The unwind callback shared by every level of the async chain this context serves.
   *
   * @remarks A plain field, not a lazy accessor — a getter taking a factory would allocate that
   * factory on every level, which is the allocation this exists to avoid.
   */
  chainSettle: (() => void) | undefined;

  /**
   * How many levels of the async chain are still in flight on this context.
   *
   * @remarks The chain's first level acquires the context and every level increments; the last
   * one to settle returns it to the resolver's pool. Counting here rather than on the resolver
   * is what lets two concurrent chains run without a shared counter to get wrong.
   */
  chainLevels = 0;

  /**
   * The resolver this context speaks to — an inner async level checks it before reusing this.
   *
   * @remarks A field, not a method, because the check runs on every hop of every chain.
   */
  owner: ResolverCallbacks;

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
    this.#resolver = resolver;
    this.owner = resolver;
    this.#resolutionPath = resolutionPath;
    this.#resolutionStack = resolutionStack;
    this.#currentOptions = currentOptions;
    this.#graph = undefined;
    this.chainSettle = undefined;
    this.chainLevels = 0;
  }

  resolve<const Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value {
    if (options === undefined) {
      return this.#resolver.resolveFromContext(token, this.#resolutionPath, this.#resolutionStack);
    }
    return this.#resolver.resolve(token, options, this.#resolutionPath, this.#resolutionStack);
  }

  resolveAsync<const Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Value> {
    if (options === undefined) {
      // Hand the callee this context: an inner level of the same chain reuses it as-is.
      return this.#resolver.resolveAsyncFromContext(token, this.#resolutionPath, this.#resolutionStack, this);
    }
    return this.#resolver.resolveAsync(token, options, this.#resolutionPath, this.#resolutionStack);
  }

  resolveOptional<const Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined {
    return this.#resolver.resolveOptional(token, options, this.#resolutionPath, this.#resolutionStack);
  }

  resolveOptionalAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Value | undefined> {
    return this.#resolver.resolveOptionalAsync(token, options, this.#resolutionPath, this.#resolutionStack);
  }

  resolveAll<const Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Array<Value> {
    return this.#resolver.resolveAll(token, options, this.#resolutionPath, this.#resolutionStack);
  }

  resolveAllAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Array<Value>> {
    return this.#resolver.resolveAllAsync(token, options, this.#resolutionPath, this.#resolutionStack);
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
  slot: { name: string | undefined; tags: ReadonlyArray<readonly [string, unknown]> },
): ResolutionFrame {
  return { tokenName, scope, bindingId, kind, slot };
}
