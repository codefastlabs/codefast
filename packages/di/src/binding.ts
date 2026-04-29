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

// ── SlotKey ───────────────────────────────────────────────────────────────────

export interface SlotKey {
  readonly name: string | undefined;
  readonly tags: ReadonlyArray<readonly [tag: string, value: unknown]>;
}

export function slotKeyEquals(a: SlotKey, b: SlotKey): boolean {
  if (a.name !== b.name) {
    return false;
  }
  if (a.tags.length !== b.tags.length) {
    return false;
  }
  for (const [tagKey, tagValue] of a.tags) {
    if (!b.tags.some(([k, v]) => k === tagKey && Object.is(v, tagValue))) {
      return false;
    }
  }
  return true;
}

export const DEFAULT_SLOT: SlotKey = { name: undefined, tags: [] };

export function slotKeyToString(slot: SlotKey): string {
  if (slot.name === undefined && slot.tags.length === 0) {
    return "default";
  }
  const parts: string[] = [];
  if (slot.name !== undefined) {
    parts.push(`name:${slot.name}`);
  }
  for (const [k, v] of slot.tags) {
    parts.push(`tag:${k}=${String(v)}`);
  }
  return parts.join(",");
}

// ── BindingBase ───────────────────────────────────────────────────────────────

interface BindingBase<Value> {
  readonly id: BindingIdentifier;
  readonly token: Token<Value> | Constructor<Value>;
  readonly slot: SlotKey;
  readonly predicate?: (ctx: ConstraintContext) => boolean;
}

// ── Binding kinds ─────────────────────────────────────────────────────────────

export interface ClassBinding<Value> extends BindingBase<Value> {
  readonly kind: "class";
  readonly target: Constructor<Value>;
  readonly scope: BindingScope;
  readonly onActivation?: ActivationHandler<Value>;
  readonly onDeactivation?: DeactivationHandler<Value>;
}

export interface DynamicBinding<Value> extends BindingBase<Value> {
  readonly kind: "dynamic";
  readonly factory: (ctx: ResolutionContext) => Value;
  readonly scope: BindingScope;
  readonly onActivation?: ActivationHandler<Value>;
  readonly onDeactivation?: DeactivationHandler<Value>;
}

export interface DynamicAsyncBinding<Value> extends BindingBase<Value> {
  readonly kind: "dynamic-async";
  readonly factory: (ctx: ResolutionContext) => Promise<Value>;
  readonly scope: BindingScope;
  readonly onActivation?: ActivationHandler<Value>;
  readonly onDeactivation?: DeactivationHandler<Value>;
}

export interface ResolvedBinding<Value> extends BindingBase<Value> {
  readonly kind: "resolved";
  readonly factory: (...args: unknown[]) => Value;
  readonly deps: readonly InjectionDescriptor[];
  readonly scope: BindingScope;
  readonly onActivation?: ActivationHandler<Value>;
  readonly onDeactivation?: DeactivationHandler<Value>;
}

export interface ResolvedAsyncBinding<Value> extends BindingBase<Value> {
  readonly kind: "resolved-async";
  readonly factory: (...args: unknown[]) => Promise<Value>;
  readonly deps: readonly InjectionDescriptor[];
  readonly scope: BindingScope;
  readonly onActivation?: ActivationHandler<Value>;
  readonly onDeactivation?: DeactivationHandler<Value>;
}

export interface ConstantBinding<Value> extends BindingBase<Value> {
  readonly kind: "constant";
  readonly value: Value;
  readonly scope: "singleton";
  readonly onActivation?: ActivationHandler<Value>;
  readonly onDeactivation?: DeactivationHandler<Value>;
}

export interface AliasBinding<Value> extends BindingBase<Value> {
  readonly kind: "alias";
  readonly target: Token<Value> | Constructor<Value>;
}

export type Binding<Value = unknown> =
  | ClassBinding<Value>
  | DynamicBinding<Value>
  | DynamicAsyncBinding<Value>
  | ResolvedBinding<Value>
  | ResolvedAsyncBinding<Value>
  | ConstantBinding<Value>
  | AliasBinding<Value>;

/** Builder-only payload before `id`, `token`, `slot`, and `predicate` are applied. */
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
export function generateBindingId(): BindingIdentifier {
  return String(++_idCounter) as BindingIdentifier;
}

// ── Builder interfaces ────────────────────────────────────────────────────────

export interface BindToBuilder<Value> {
  to(type: Constructor<Value>): BindingBuilder<Value>;
  toSelf(): BindingBuilder<Value>;
  toConstantValue(value: Value): ConstantBindingBuilder<Value>;
  toDynamic(factory: (ctx: ResolutionContext) => Value): BindingBuilder<Value>;
  toDynamicAsync(factory: (ctx: ResolutionContext) => Promise<Value>): BindingBuilder<Value>;
  toResolved<const Deps extends readonly DependencyKey[]>(
    factory: (...args: { [K in keyof Deps]: TokenValue<NoInfer<Deps>[K]> }) => Value,
    deps: Deps,
  ): BindingBuilder<Value>;
  toResolvedAsync<const Deps extends readonly DependencyKey[]>(
    factory: (...args: { [K in keyof Deps]: TokenValue<NoInfer<Deps>[K]> }) => Promise<Value>,
    deps: Deps,
  ): BindingBuilder<Value>;
  toAlias(target: Token<Value> | Constructor<Value>): AliasBindingBuilder;
}

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

export interface ConstantBindingBuilder<Value> {
  when(predicate: (ctx: ConstraintContext) => boolean): this;
  whenNamed(name: string): this;
  whenTagged(tag: string, value: unknown): this;
  whenDefault(): this;
  onActivation(fn: ActivationHandler<Value>): SingletonLifecycleBuilder<Value>;
  onDeactivation(fn: DeactivationHandler<Value>): SingletonLifecycleBuilder<Value>;
  id(): BindingIdentifier;
}

export interface AliasBindingBuilder {
  when(predicate: (ctx: ConstraintContext) => boolean): this;
  whenNamed(name: string): this;
  whenTagged(tag: string, value: unknown): this;
  whenDefault(): this;
  id(): BindingIdentifier;
}

export interface SingletonBindingBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): this;
  onDeactivation(fn: DeactivationHandler<Value>): this;
  id(): BindingIdentifier;
}

export interface TransientBindingBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): this;
  id(): BindingIdentifier;
}

export interface ScopedBindingBuilder<Value> extends TransientBindingBuilder<Value> {}

export interface SingletonLifecycleBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): this;
  onDeactivation(fn: DeactivationHandler<Value>): this;
  id(): BindingIdentifier;
}
