import type { Constructor } from "#/core/constructor-type";
import type { BindingTag, TagKeyMask } from "#/core/tag";
import type { Token } from "#/core/token";

// Re-export for consumers that import from `#/types`
export type { Constructor } from "#/core/constructor-type";
export type { BindingTag, TagKey, TagKeyMask } from "#/core/tag";

/**
 * Token or class constructor used as a binding / injection / resolve key.
 *
 * @since 0.3.16-canary.0
 */
export type DependencyKey = Token<unknown> | Constructor;

// ── BindingScope ─────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The lifetime a binding's instances are cached under.
 *
 * @since 0.3.16-canary.0
 */
export type BindingScope = "singleton" | "transient" | "scoped";

// ── BindingIdentifier ────────────────────────────────────────────────────────────────────────────────────────────────

declare const BINDING_ID_BRAND: unique symbol;
/**
 * A branded string that uniquely identifies one binding.
 *
 * @since 0.3.16-canary.0
 */
export type BindingIdentifier = string & { readonly [BINDING_ID_BRAND]: true };

// ── BindingKind ──────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The strategy a binding produces values with, set by the `to*()` call that created it.
 *
 * @since 0.3.16-canary.0
 */
export type BindingKind = "class" | "dynamic" | "dynamic-async" | "resolved" | "resolved-async" | "constant" | "alias";

// ── Handlers ─────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * A hook that runs after an instance is created and returns the instance to hand out.
 *
 * @since 0.3.16-canary.0
 */
export type ActivationHandler<Value> = (ctx: ResolutionContext, instance: Value) => Value | Promise<Value>;

/**
 * A hook that runs when a cached instance is released from its scope.
 *
 * @since 0.3.16-canary.0
 */
export type DeactivationHandler<Value> = (instance: Value) => void | Promise<void>;

// ── ResolveOptions ───────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Slot-selection criteria — a name and tags — that narrow which binding a resolve call matches.
 *
 * @since 0.3.16-canary.0
 */
export interface ResolveOptions {
  name?: string | undefined;
  /**
   * Single-tag shorthand, equivalent to listing the one pair in `tags`.
   *
   * @remarks Reaches the same tagged index, so choosing it costs nothing. `InjectOptions` accepts it
   * too and folds it into `tags`. Only `tags` expresses a request for more than one tag.
   */
  tag?: BindingTag | undefined;
  tags?: ReadonlyArray<BindingTag> | undefined;
}

// ── ResolutionFrame ──────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * One entry of the resolution stack: the token, scope, binding, and slot being resolved.
 *
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
    readonly keyMask: TagKeyMask;
  };
}

// ── ConstraintContext ────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The resolution-time view — path, stack, parent, and ancestors — a `BindingConstraint` inspects.
 *
 * @since 0.3.16-canary.0
 */
export interface ConstraintContext {
  readonly resolutionPath: ReadonlyArray<string>;
  readonly resolutionStack: ReadonlyArray<ResolutionFrame>;
  readonly parent: ResolutionFrame | undefined;
  readonly ancestors: ReadonlyArray<ResolutionFrame>;
  /** Readonly because one frozen object answers every resolve of a slot — a write would throw. */
  readonly currentResolveOptions: Readonly<ResolveOptions> | undefined;
}

/**
 * The predicate `when()` selects a binding by, and the shape every `when*` helper returns.
 *
 * @since 0.6.0
 */
export type BindingConstraint = (ctx: ConstraintContext) => boolean;

// ── ResolutionContext ────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The container view a dynamic factory or activation handler resolves further dependencies through.
 *
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

// ── TokenValue ───────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The value type a token or class constructor resolves to.
 *
 * @since 0.3.16-canary.0
 */
export type TokenValue<Type> =
  Type extends Token<infer Value> ? Value : Type extends Constructor<infer Value> ? Value : never;
