import type {
  ActivationHandler,
  BindingIdentifier,
  BindingScope,
  Constructor,
  DeactivationHandler,
  DependencyKey,
  ResolutionContext,
  TokenValue,
} from "#/types";
import type { Token } from "#/token";
import type { InjectionDescriptor } from "#/decorators/inject";
import type { ConstraintContext } from "#/types";

// ── BindingSlot ───────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface BindingSlot {
  readonly name: string | undefined;
  readonly tags: ReadonlyArray<readonly [tag: string, value: unknown]>;
}

/**
 * @since 0.3.16-canary.0
 */
export function bindingSlotEquals(left: BindingSlot, right: BindingSlot): boolean {
  if (left.name !== right.name) {
    return false;
  }
  if (left.tags.length !== right.tags.length) {
    return false;
  }
  for (const [tagKey, tagValue] of left.tags) {
    if (
      !right.tags.some(
        ([otherKey, otherValue]) => otherKey === tagKey && Object.is(otherValue, tagValue),
      )
    ) {
      return false;
    }
  }
  return true;
}

/**
 * @since 0.3.16-canary.0
 */
export const DEFAULT_BINDING_SLOT: BindingSlot = { name: undefined, tags: [] };

/**
 * @since 0.3.16-canary.0
 */
export function bindingSlotToString(slot: BindingSlot): string {
  if (slot.name === undefined && slot.tags.length === 0) {
    return "default";
  }
  const parts: Array<string> = [];
  if (slot.name !== undefined) {
    parts.push(`name:${slot.name}`);
  }
  for (const [tagKey, tagValue] of slot.tags) {
    parts.push(`tag:${tagKey}=${String(tagValue)}`);
  }
  return parts.join(",");
}

// ── BindingBase ───────────────────────────────────────────────────────────────

interface BindingBase<Value> {
  readonly id: BindingIdentifier;
  readonly token: Token<Value> | Constructor<Value>;
  readonly slot: BindingSlot;
  readonly predicate?: (ctx: ConstraintContext) => boolean;
}

// ── Binding kinds ─────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface ClassBinding<Value> extends BindingBase<Value> {
  readonly kind: "class";
  readonly target: Constructor<Value>;
  readonly scope: BindingScope;
  readonly onActivation?: ActivationHandler<Value>;
  readonly onDeactivation?: DeactivationHandler<Value>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DynamicBinding<Value> extends BindingBase<Value> {
  readonly kind: "dynamic";
  readonly factory: (ctx: ResolutionContext) => Value;
  readonly scope: BindingScope;
  readonly onActivation?: ActivationHandler<Value>;
  readonly onDeactivation?: DeactivationHandler<Value>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DynamicAsyncBinding<Value> extends BindingBase<Value> {
  readonly kind: "dynamic-async";
  readonly factory: (ctx: ResolutionContext) => Promise<Value>;
  readonly scope: BindingScope;
  readonly onActivation?: ActivationHandler<Value>;
  readonly onDeactivation?: DeactivationHandler<Value>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ResolvedBinding<Value> extends BindingBase<Value> {
  readonly kind: "resolved";
  readonly factory: (...args: Array<unknown>) => Value;
  readonly deps: ReadonlyArray<InjectionDescriptor>;
  readonly scope: BindingScope;
  readonly onActivation?: ActivationHandler<Value>;
  readonly onDeactivation?: DeactivationHandler<Value>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ResolvedAsyncBinding<Value> extends BindingBase<Value> {
  readonly kind: "resolved-async";
  readonly factory: (...args: Array<unknown>) => Promise<Value>;
  readonly deps: ReadonlyArray<InjectionDescriptor>;
  readonly scope: BindingScope;
  readonly onActivation?: ActivationHandler<Value>;
  readonly onDeactivation?: DeactivationHandler<Value>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ConstantBinding<Value> extends BindingBase<Value> {
  readonly kind: "constant";
  readonly value: Value;
  readonly scope: "singleton";
  readonly onActivation?: ActivationHandler<Value>;
  readonly onDeactivation?: DeactivationHandler<Value>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface AliasBinding<Value> extends BindingBase<Value> {
  readonly kind: "alias";
  readonly target: Token<Value> | Constructor<Value>;
}

/**
 * @since 0.3.16-canary.0
 */
export type Binding<Value = unknown> =
  | ClassBinding<Value>
  | DynamicBinding<Value>
  | DynamicAsyncBinding<Value>
  | ResolvedBinding<Value>
  | ResolvedAsyncBinding<Value>
  | ConstantBinding<Value>
  | AliasBinding<Value>;

/**
 * Builder-only payload before `id`, `token`, `slot`, and `predicate` are applied.
 *
 * @since 0.3.16-canary.0
 */
export type PartialBinding<Value> =
  | Omit<ClassBinding<Value>, "id" | "token" | "slot" | "predicate">
  | Omit<DynamicBinding<Value>, "id" | "token" | "slot" | "predicate">
  | Omit<DynamicAsyncBinding<Value>, "id" | "token" | "slot" | "predicate">
  | Omit<ResolvedBinding<Value>, "id" | "token" | "slot" | "predicate">
  | Omit<ResolvedAsyncBinding<Value>, "id" | "token" | "slot" | "predicate">
  | Omit<ConstantBinding<Value>, "id" | "token" | "slot" | "predicate">
  | Omit<AliasBinding<Value>, "id" | "token" | "slot" | "predicate">;

// ── ID generation ─────────────────────────────────────────────────────────────

let _idCounter = 0;
/**
 * @since 0.3.16-canary.0
 */
export function generateBindingId(): BindingIdentifier {
  return String(++_idCounter) as BindingIdentifier;
}

// ── Builder interfaces ────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface BindToBuilder<Value> {
  to(type: Constructor<Value>): BindingBuilder<Value>;
  toSelf(): BindingBuilder<Value>;
  toConstantValue(value: Value): ConstantBindingBuilder<Value>;
  toDynamic(factory: (ctx: ResolutionContext) => Value): BindingBuilder<Value>;
  toDynamicAsync(factory: (ctx: ResolutionContext) => Promise<Value>): BindingBuilder<Value>;
  toResolved<const Deps extends ReadonlyArray<DependencyKey>>(
    factory: (...args: { [K in keyof Deps]: TokenValue<NoInfer<Deps>[K]> }) => Value,
    deps: Deps,
  ): BindingBuilder<Value>;
  toResolvedAsync<const Deps extends ReadonlyArray<DependencyKey>>(
    factory: (...args: { [K in keyof Deps]: TokenValue<NoInfer<Deps>[K]> }) => Promise<Value>,
    deps: Deps,
  ): BindingBuilder<Value>;
  toAlias(target: Token<Value> | Constructor<Value>): AliasBindingBuilder;
}

/**
 * @since 0.3.16-canary.0
 */
export interface BindingBuilder<Value> {
  when(predicate: (ctx: ConstraintContext) => boolean): this;
  whenNamed(name: string): this;
  whenTagged(tag: string, value: unknown): this;
  whenDefault(): this;
  singleton(): SingletonBindingBuilder<Value>;
  transient(): TransientBindingBuilder<Value>;
  scoped(): ScopedBindingBuilder<Value>;
  id(): BindingIdentifier;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ConstantBindingBuilder<Value> {
  when(predicate: (ctx: ConstraintContext) => boolean): this;
  whenNamed(name: string): this;
  whenTagged(tag: string, value: unknown): this;
  whenDefault(): this;
  onActivation(fn: ActivationHandler<Value>): SingletonLifecycleBuilder<Value>;
  onDeactivation(fn: DeactivationHandler<Value>): SingletonLifecycleBuilder<Value>;
  id(): BindingIdentifier;
}

/**
 * @since 0.3.16-canary.0
 */
export interface AliasBindingBuilder {
  when(predicate: (ctx: ConstraintContext) => boolean): this;
  whenNamed(name: string): this;
  whenTagged(tag: string, value: unknown): this;
  whenDefault(): this;
  id(): BindingIdentifier;
}

/**
 * @since 0.3.16-canary.0
 */
export interface SingletonBindingBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): this;
  onDeactivation(fn: DeactivationHandler<Value>): this;
  id(): BindingIdentifier;
}

/**
 * @since 0.3.16-canary.0
 */
export interface TransientBindingBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): this;
  id(): BindingIdentifier;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ScopedBindingBuilder<Value> extends TransientBindingBuilder<Value> {}

/**
 * @since 0.3.16-canary.0
 */
export interface SingletonLifecycleBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): this;
  onDeactivation(fn: DeactivationHandler<Value>): this;
  id(): BindingIdentifier;
}
