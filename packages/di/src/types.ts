import type { Token } from "#/token";
import type { Constructor } from "#/constructor-type";

// Re-export for consumers that import from `#/types`
export type { Constructor } from "#/constructor-type";

/** Token or class constructor used as a binding / injection / resolve key. */
export type DependencyKey = Token<unknown> | Constructor;

// ── BindingScope ────────────────────────────────────────────────────────────

export type BindingScope = "singleton" | "transient" | "scoped";

// ── BindingIdentifier ────────────────────────────────────────────────────────

declare const BINDING_ID_BRAND: unique symbol;
export type BindingIdentifier = string & { readonly [BINDING_ID_BRAND]: true };

// ── BindingKind ───────────────────────────────────────────────────────────────

export type BindingKind =
  | "class"
  | "dynamic"
  | "dynamic-async"
  | "resolved"
  | "resolved-async"
  | "constant"
  | "alias";

// ── Handlers ─────────────────────────────────────────────────────────────────

export type ActivationHandler<Value> = (
  ctx: ResolutionContext,
  instance: Value,
) => Value | Promise<Value>;

export type DeactivationHandler<Value> = (instance: Value) => void | Promise<void>;

// ── ResolveOptions ────────────────────────────────────────────────────────────

export interface ResolveOptions {
  name?: string;
  tag?: readonly [tag: string, value: unknown];
  tags?: ReadonlyArray<readonly [tag: string, value: unknown]>;
}

// ── MaterializationFrame ──────────────────────────────────────────────────────

export interface MaterializationFrame {
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

export interface ConstraintContext {
  readonly resolutionPath: readonly string[];
  readonly materializationStack: readonly MaterializationFrame[];
  readonly parent: MaterializationFrame | undefined;
  readonly ancestors: readonly MaterializationFrame[];
  readonly currentResolveHint: ResolveOptions | undefined;
}

// ── ResolutionContext ─────────────────────────────────────────────────────────

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
  resolveAll<const Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveOptions): Value[];
  resolveAllAsync<const Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ): Promise<Value[]>;
  readonly graph: ConstraintContext;
}

// ── TokenValue ────────────────────────────────────────────────────────────────

export type TokenValue<Type> =
  Type extends Token<infer Value> ? Value : Type extends Constructor<infer Value> ? Value : never;
