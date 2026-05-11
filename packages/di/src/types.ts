import type { Token } from "#/token";
import type { Constructor } from "#/constructor-type";

// Re-export for consumers that import from `#/types`
export type { Constructor } from "#/constructor-type";

/**
 * Token or class constructor used as a binding / injection / resolve key.
 *
 * @since 0.3.16-canary.0
 */
export type DependencyKey = Token<unknown> | Constructor;

// ── BindingScope ────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export type BindingScope = "singleton" | "transient" | "scoped";

// ── BindingIdentifier ────────────────────────────────────────────────────────

declare const BINDING_ID_BRAND: unique symbol;
/**
 * @since 0.3.16-canary.0
 */
export type BindingIdentifier = string & { readonly [BINDING_ID_BRAND]: true };

// ── BindingKind ───────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export type BindingKind =
  | "class"
  | "dynamic"
  | "dynamic-async"
  | "resolved"
  | "resolved-async"
  | "constant"
  | "alias";

// ── Handlers ─────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export type ActivationHandler<Value> = (
  ctx: ResolutionContext,
  instance: Value,
) => Value | Promise<Value>;

/**
 * @since 0.3.16-canary.0
 */
export type DeactivationHandler<Value> = (instance: Value) => void | Promise<void>;

// ── ResolveOptions ────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface ResolveOptions {
  name?: string;
  /**
   * Single-tag shorthand — semantics match including one pair in `tags`.
   * Enables fast-path lookup alongside `tags`.
   */
  tag?: readonly [tag: string, value: unknown];
  tags?: ReadonlyArray<readonly [tag: string, value: unknown]>;
}

// ── ResolutionFrame ──────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface ResolutionFrame {
  readonly tokenName: string;
  readonly scope: BindingScope;
  readonly bindingId: BindingIdentifier;
  readonly kind: BindingKind;
  readonly slot: {
    readonly name: string | undefined;
    readonly tags: ReadonlyArray<readonly [tag: string, value: unknown]>;
  };
}

// ── ConstraintContext ─────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface ConstraintContext {
  readonly resolutionPath: ReadonlyArray<string>;
  readonly resolutionStack: ReadonlyArray<ResolutionFrame>;
  readonly parent: ResolutionFrame | undefined;
  readonly ancestors: ReadonlyArray<ResolutionFrame>;
  readonly currentResolveHint: ResolveOptions | undefined;
}

// ── ResolutionContext ─────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface ResolutionContext {
  resolve<const Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveOptions): Value;
  resolveAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value>;
  resolveOptional<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Value | undefined;
  resolveOptionalAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value | undefined>;
  resolveAll<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Array<Value>;
  resolveAllAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Array<Value>>;
  readonly graph: ConstraintContext;
}

// ── TokenValue ────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export type TokenValue<Type> =
  Type extends Token<infer Value> ? Value : Type extends Constructor<infer Value> ? Value : never;
