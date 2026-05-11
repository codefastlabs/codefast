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
import type { Token } from "#/token";
import type { Container } from "#/container";

// ── Active container ──────────────────────────────────────────────────────────

let _activeContainer: Container | undefined;

/**
 * @since 0.3.16-canary.0
 */
export function runWithContainer<Result>(container: Container, fn: () => Result): Result {
  const prev = _activeContainer;
  _activeContainer = container;
  try {
    return fn();
  } finally {
    _activeContainer = prev;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export function getActiveContainer(): Container | undefined {
  return _activeContainer;
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
    hint: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value;
  resolveAsyncFromContext<const Value>(
    token: Token<Value> | Constructor<Value>,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value>;
  resolveAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value>;
  resolveOptional<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Value | undefined;
  resolveOptionalAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Value | undefined>;
  resolveAll<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Array<Value>;
  resolveAllAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint: ResolveOptions | undefined,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
  ): Promise<Array<Value>>;
}

/**
 * @since 0.3.16-canary.0
 */
export class DefaultResolutionContext implements ResolutionContext {
  private _resolver: ResolverCallbacks;
  private _resolutionPath: Array<string>;
  private _resolutionStack: Array<ResolutionFrame>;
  private _currentHint: ResolveOptions | undefined;

  constructor(
    resolver: ResolverCallbacks,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    currentHint: ResolveOptions | undefined,
  ) {
    this._resolver = resolver;
    this._resolutionPath = resolutionPath;
    this._resolutionStack = resolutionStack;
    this._currentHint = currentHint;
  }

  private _graph: ConstraintContext | undefined;

  get graph(): ConstraintContext {
    if (this._graph === undefined) {
      this._graph = new DefaultConstraintContext(
        this._resolutionPath,
        this._resolutionStack,
        this._currentHint,
      );
    }
    return this._graph;
  }

  reset(
    resolver: ResolverCallbacks,
    resolutionPath: Array<string>,
    resolutionStack: Array<ResolutionFrame>,
    currentHint: ResolveOptions | undefined,
  ): void {
    this._resolver = resolver;
    this._resolutionPath = resolutionPath;
    this._resolutionStack = resolutionStack;
    this._currentHint = currentHint;
    this._graph = undefined;
  }

  resolve<const Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveOptions): Value {
    if (hint === undefined) {
      return this._resolver.resolveFromContext(token, this._resolutionPath, this._resolutionStack);
    }
    return this._resolver.resolve(token, hint, this._resolutionPath, this._resolutionStack);
  }

  resolveAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value> {
    if (hint === undefined) {
      return this._resolver.resolveAsyncFromContext(
        token,
        this._resolutionPath,
        this._resolutionStack,
      );
    }
    return this._resolver.resolveAsync(token, hint, this._resolutionPath, this._resolutionStack);
  }

  resolveOptional<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Value | undefined {
    return this._resolver.resolveOptional(token, hint, this._resolutionPath, this._resolutionStack);
  }

  resolveOptionalAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value | undefined> {
    return this._resolver.resolveOptionalAsync(
      token,
      hint,
      this._resolutionPath,
      this._resolutionStack,
    );
  }

  resolveAll<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Array<Value> {
    return this._resolver.resolveAll(token, hint, this._resolutionPath, this._resolutionStack);
  }

  resolveAllAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Array<Value>> {
    return this._resolver.resolveAllAsync(token, hint, this._resolutionPath, this._resolutionStack);
  }
}

class DefaultConstraintContext implements ConstraintContext {
  readonly resolutionPath: ReadonlyArray<string>;
  readonly resolutionStack: ReadonlyArray<ResolutionFrame>;
  readonly parent: ResolutionFrame | undefined;
  readonly currentResolveHint: ResolveOptions | undefined;

  constructor(
    resolutionPath: ReadonlyArray<string>,
    resolutionStack: ReadonlyArray<ResolutionFrame>,
    currentResolveHint: ResolveOptions | undefined,
  ) {
    this.resolutionPath = resolutionPath;
    this.resolutionStack = resolutionStack;
    this.parent = resolutionStack.at(-1);
    this.currentResolveHint = currentResolveHint;
  }

  private _ancestors: ReadonlyArray<ResolutionFrame> | undefined;

  get ancestors(): ReadonlyArray<ResolutionFrame> {
    if (this._ancestors === undefined) {
      this._ancestors = this.resolutionStack.length > 1 ? this.resolutionStack.slice(0, -1) : [];
    }
    return this._ancestors;
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
