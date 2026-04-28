import type {
  BindingIdentifier,
  BindingKind,
  BindingScope,
  ConstraintContext,
  Constructor,
  MaterializationFrame,
  ResolutionContext,
  ResolveOptions,
} from "#/types";
import type { Token } from "#/token";
import type { Container } from "#/container";

// ── Active container ──────────────────────────────────────────────────────────

let _activeContainer: Container | undefined;

export function runWithContainer<Result>(container: Container, fn: () => Result): Result {
  const prev = _activeContainer;
  _activeContainer = container;
  try {
    return fn();
  } finally {
    _activeContainer = prev;
  }
}

export function getActiveContainer(): Container | undefined {
  return _activeContainer;
}

// ── ResolutionContext implementation ──────────────────────────────────────────

export interface ResolverCallbacks {
  resolveFromContext<const V>(
    t: Token<V> | Constructor<V>,
    path: string[],
    stack: MaterializationFrame[],
  ): V;
  resolve<const V>(
    t: Token<V> | Constructor<V>,
    h: ResolveOptions | undefined,
    path: string[],
    stack: MaterializationFrame[],
  ): V;
  resolveAsyncFromContext<const V>(
    t: Token<V> | Constructor<V>,
    path: string[],
    stack: MaterializationFrame[],
  ): Promise<V>;
  resolveAsync<const V>(
    t: Token<V> | Constructor<V>,
    h: ResolveOptions | undefined,
    path: string[],
    stack: MaterializationFrame[],
  ): Promise<V>;
  resolveOptional<const V>(
    t: Token<V> | Constructor<V>,
    h: ResolveOptions | undefined,
    path: string[],
    stack: MaterializationFrame[],
  ): V | undefined;
  resolveOptionalAsync<const V>(
    t: Token<V> | Constructor<V>,
    h: ResolveOptions | undefined,
    path: string[],
    stack: MaterializationFrame[],
  ): Promise<V | undefined>;
  resolveAll<const V>(
    t: Token<V> | Constructor<V>,
    h: ResolveOptions | undefined,
    path: string[],
    stack: MaterializationFrame[],
  ): V[];
  resolveAllAsync<const V>(
    t: Token<V> | Constructor<V>,
    h: ResolveOptions | undefined,
    path: string[],
    stack: MaterializationFrame[],
  ): Promise<V[]>;
}

export class DefaultResolutionContext implements ResolutionContext {
  private _resolver: ResolverCallbacks;
  private _resolutionPath: string[];
  private _materializationStack: MaterializationFrame[];
  private _currentHint: ResolveOptions | undefined;

  constructor(
    resolver: ResolverCallbacks,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
    currentHint: ResolveOptions | undefined,
  ) {
    this._resolver = resolver;
    this._resolutionPath = resolutionPath;
    this._materializationStack = materializationStack;
    this._currentHint = currentHint;
  }

  private _graph: ConstraintContext | undefined;

  get graph(): ConstraintContext {
    if (this._graph === undefined) {
      this._graph = new DefaultConstraintContext(
        this._resolutionPath,
        this._materializationStack,
        this._currentHint,
      );
    }
    return this._graph;
  }

  reset(
    resolver: ResolverCallbacks,
    resolutionPath: string[],
    materializationStack: MaterializationFrame[],
    currentHint: ResolveOptions | undefined,
  ): void {
    this._resolver = resolver;
    this._resolutionPath = resolutionPath;
    this._materializationStack = materializationStack;
    this._currentHint = currentHint;
    this._graph = undefined;
  }

  resolve<const Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveOptions): Value {
    if (hint === undefined) {
      return this._resolver.resolveFromContext(
        token,
        this._resolutionPath,
        this._materializationStack,
      );
    }
    return this._resolver.resolve(token, hint, this._resolutionPath, this._materializationStack);
  }

  resolveAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value> {
    if (hint === undefined) {
      return this._resolver.resolveAsyncFromContext(
        token,
        this._resolutionPath,
        this._materializationStack,
      );
    }
    return this._resolver.resolveAsync(
      token,
      hint,
      this._resolutionPath,
      this._materializationStack,
    );
  }

  resolveOptional<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Value | undefined {
    return this._resolver.resolveOptional(
      token,
      hint,
      this._resolutionPath,
      this._materializationStack,
    );
  }

  resolveOptionalAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value | undefined> {
    return this._resolver.resolveOptionalAsync(
      token,
      hint,
      this._resolutionPath,
      this._materializationStack,
    );
  }

  resolveAll<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Value[] {
    return this._resolver.resolveAll(token, hint, this._resolutionPath, this._materializationStack);
  }

  resolveAllAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value[]> {
    return this._resolver.resolveAllAsync(
      token,
      hint,
      this._resolutionPath,
      this._materializationStack,
    );
  }
}

class DefaultConstraintContext implements ConstraintContext {
  readonly resolutionPath: readonly string[];
  readonly materializationStack: readonly MaterializationFrame[];
  readonly parent: MaterializationFrame | undefined;
  readonly currentResolveHint: ResolveOptions | undefined;

  constructor(
    resolutionPath: readonly string[],
    materializationStack: readonly MaterializationFrame[],
    currentResolveHint: ResolveOptions | undefined,
  ) {
    this.resolutionPath = resolutionPath;
    this.materializationStack = materializationStack;
    this.parent = materializationStack.at(-1);
    this.currentResolveHint = currentResolveHint;
  }

  private _ancestors: readonly MaterializationFrame[] | undefined;

  get ancestors(): readonly MaterializationFrame[] {
    if (this._ancestors === undefined) {
      this._ancestors =
        this.materializationStack.length > 1 ? this.materializationStack.slice(0, -1) : [];
    }
    return this._ancestors;
  }
}

export function buildMaterializationFrame(
  tokenName: string,
  scope: BindingScope,
  bindingId: BindingIdentifier,
  kind: BindingKind,
  slot: { name: string | undefined; tags: ReadonlyArray<readonly [string, unknown]> },
): MaterializationFrame {
  return { tokenName, scope, bindingId, kind, slot };
}
