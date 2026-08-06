import type { Constructor } from "#/core/constructor-type";
import type { Token } from "#/core/token";

// Re-export for consumers that import from `#/types`
export type { Constructor } from "#/core/constructor-type";

/**
 * A single [tag, value] pair used in slot constraints and resolve options.
 *
 * @since 0.3.16-canary.0
 */
export type BindingTag = readonly [tag: string, value: unknown];

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
export type BindingKind = "class" | "dynamic" | "dynamic-async" | "resolved" | "resolved-async" | "constant" | "alias";

// ── Handlers ─────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export type ActivationHandler<Value> = (ctx: ResolutionContext, instance: Value) => Value | Promise<Value>;

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
   * Single-tag shorthand, equivalent to listing the one pair in `tags` (SPEC §3.5).
   *
   * @remarks Reaches the same tagged index, so choosing it costs nothing. `InjectOptions` accepts it
   * too and folds it into `tags`. Only `tags` expresses a request for more than one tag.
   */
  tag?: BindingTag;
  tags?: ReadonlyArray<BindingTag>;
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
    readonly tags: ReadonlyArray<BindingTag>;
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
  readonly currentResolveOptions: ResolveOptions | undefined;
}

// ── ResolutionContext ─────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface ResolutionContext {
  resolve<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value;
  resolveAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Value>;
  resolveOptional<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined;
  resolveOptionalAsync<Value>(
    token: Token<Value> | Constructor<Value>,
    options?: ResolveOptions,
  ): Promise<Value | undefined>;
  resolveAll<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Array<Value>;
  resolveAllAsync<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Promise<Array<Value>>;
  readonly graph: ConstraintContext;
}

// ── TokenValue ────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export type TokenValue<Type> =
  Type extends Token<infer Value> ? Value : Type extends Constructor<infer Value> ? Value : never;
