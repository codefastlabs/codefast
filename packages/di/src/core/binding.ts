import type { Token } from "#/core/token";
import type {
  ActivationHandler,
  BindingIdentifier,
  BindingScope,
  BindingTag,
  Constructor,
  DeactivationHandler,
  ResolutionContext,
  ResolutionFrame,
  ConstraintContext,
} from "#/core/types";
import type { InjectableDependency, InjectionDescriptor, ResolvedDependencyValue } from "#/decorators/inject";

// ── BindingSlot ───────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface BindingSlot {
  readonly name: string | undefined;
  readonly tags: ReadonlyArray<BindingTag>;
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
    if (!right.tags.some(([otherKey, otherValue]) => otherKey === tagKey && Object.is(otherValue, tagValue))) {
      return false;
    }
  }
  return true;
}

/**
 * Cached singleton absent — distinguishes "not resolved yet" from a cached `undefined`.
 *
 * @since 0.5.0-canary.8
 */
export const NO_INSTANCE: unique symbol = Symbol("di:no-instance");

/**
 * @since 0.3.16-canary.0
 */
export const DEFAULT_BINDING_SLOT = { name: undefined, tags: [] } satisfies BindingSlot;

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
  /**
   * True while this binding's factory is executing on the current synchronous call stack.
   *
   * @remarks Both cycle guards that can use an `O(1)` flag read this — the sync transient-dynamic
   * lane and the async cascade lane — because synchronous code does not interleave, so the flag *is*
   * exact path membership. Not optional: `createBinding` always sets it, and a field that may be
   * absent is a field that can cost the shared hidden class. Resolver-owned; callers never set it.
   */
  inFlight: boolean;
  /**
   * Memoized resolution frame for this binding. Its contents derive only from immutable binding
   * fields, so it is computed once on first resolve and reused instead of a per-resolver Map
   * lookup on every hop.
   *
   * @remarks Resolver-owned bookkeeping — `registry.add` normalizes it, so callers never set it.
   */
  frame?: ResolutionFrame | undefined;
  /**
   * Cached singleton instance, or {@link NO_INSTANCE}.
   *
   * @remarks A binding belongs to exactly one container, so its singleton slot is per-binding —
   * a field read replaces a keyed lookup on the hottest resolve shape there is.
   */
  instance?: unknown;
  readonly token: Token<Value> | Constructor<Value>;
  readonly slot: BindingSlot;
  readonly predicate?: ((ctx: ConstraintContext) => boolean) | undefined;
}

type BindingBaseKeys = keyof BindingBase<unknown>;

/**
 * The lifecycle hooks every kind but `alias` may carry.
 *
 * @remarks Declared as **methods**, not function-typed properties, so their parameters compare
 * bivariantly and `Binding<Value>` stays assignable to `Binding`. The engine erases the value type at
 * every lane boundary regardless; the public `ActivationHandler` / `DeactivationHandler` keep strict
 * checking, which is where a user's handler is actually verified. Not `readonly`: a fluent chain
 * refines both in place — see {@link RefinableBindingFields}.
 */
interface BindingLifecycleHooks<Value> {
  onActivation?(ctx: ResolutionContext, instance: Value): Value | Promise<Value>;
  onDeactivation?(instance: Value): void | Promise<void>;
}

// ── Binding kinds ─────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface ClassBinding<Value> extends BindingBase<Value>, BindingLifecycleHooks<Value> {
  readonly kind: "class";
  readonly target: Constructor<Value>;
  readonly scope: BindingScope;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DynamicBinding<Value> extends BindingBase<Value>, BindingLifecycleHooks<Value> {
  readonly kind: "dynamic";
  readonly factory: (ctx: ResolutionContext) => Value;
  readonly scope: BindingScope;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DynamicAsyncBinding<Value> extends BindingBase<Value>, BindingLifecycleHooks<Value> {
  readonly kind: "dynamic-async";
  readonly factory: (ctx: ResolutionContext) => Promise<Value>;
  readonly scope: BindingScope;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ResolvedBinding<Value> extends BindingBase<Value>, BindingLifecycleHooks<Value> {
  readonly kind: "resolved";
  readonly factory: (...args: Array<unknown>) => Value;
  readonly deps: ReadonlyArray<InjectionDescriptor>;
  readonly scope: BindingScope;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ResolvedAsyncBinding<Value> extends BindingBase<Value>, BindingLifecycleHooks<Value> {
  readonly kind: "resolved-async";
  readonly factory: (...args: Array<unknown>) => Promise<Value>;
  readonly deps: ReadonlyArray<InjectionDescriptor>;
  readonly scope: BindingScope;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ConstantBinding<Value> extends BindingBase<Value>, BindingLifecycleHooks<Value> {
  readonly kind: "constant";
  readonly value: Value;
  readonly scope: "singleton";
}

/**
 * @since 0.3.16-canary.0
 */
export interface AliasBinding<Value> extends BindingBase<Value> {
  readonly kind: "alias";
  readonly target: Token<Value> | Constructor<Value>;
  /**
   * Always `transient` — an alias defers scoping to the binding it points at.
   *
   * @remarks Declared so `scope` is present on every kind, which is what lets the engine read it
   * as a plain field instead of testing for the one kind that lacks it.
   */
  readonly scope: "transient";
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
  | Omit<ClassBinding<Value>, BindingBaseKeys>
  | Omit<DynamicBinding<Value>, BindingBaseKeys>
  | Omit<DynamicAsyncBinding<Value>, BindingBaseKeys>
  | Omit<ResolvedBinding<Value>, BindingBaseKeys>
  | Omit<ResolvedAsyncBinding<Value>, BindingBaseKeys>
  | Omit<ConstantBinding<Value>, BindingBaseKeys>
  | Omit<AliasBinding<Value>, BindingBaseKeys>;

// ── ID generation ─────────────────────────────────────────────────────────────

let bindingIdCounter = 0;
/**
 * @since 0.3.16-canary.0
 */
export function generateBindingId(): BindingIdentifier {
  return String(++bindingIdCounter) as BindingIdentifier;
}

// ── Construction ──────────────────────────────────────────────────────────────

// Superset of every kind's fields, so one literal can copy any binding shape.
/** Union of every key any binding kind declares — `keyof` a union would give the intersection. */
type BindingFieldName = Binding<unknown> extends infer Kind ? (Kind extends unknown ? keyof Kind : never) : never;

/**
 * Completeness guard for {@link createBinding}'s literal.
 *
 * @remarks The literal is `satisfies` this, so a field added to any binding kind that the literal
 * forgets to write is a compile error rather than a binding silently missing it.
 */
type ConstructedBindingFields = Record<BindingFieldName, unknown>;

type BindingFieldSuperset = {
  readonly kind: Binding["kind"];
  readonly instance?: unknown;
  readonly scope: BindingScope;
  readonly target?: unknown;
  readonly factory?: unknown;
  readonly deps?: unknown;
  readonly value?: unknown;
  readonly onActivation?: unknown;
  readonly onDeactivation?: unknown;
};

/**
 * The single construction site for bindings — one literal, one V8 hidden class.
 *
 * @see `ARCHITECTURE.md` — why the field order and the single site are load-bearing.
 *
 * @param source - the kind-specific payload, or an existing binding to re-slot
 * @param id - reuse a caller's id to keep a fluent chain's `id()` stable across refinements
 *
 * @since 0.5.0-canary.8
 */
export function createBinding<Value>(
  source: PartialBinding<Value> | Binding<Value>,
  token: Token<Value> | Constructor<Value>,
  slot: BindingSlot,
  predicate: ((ctx: ConstraintContext) => boolean) | undefined,
  id: BindingIdentifier = generateBindingId(),
): Binding<Value> {
  const fields = source as BindingFieldSuperset;
  return {
    kind: fields.kind,
    id,
    inFlight: false,
    frame: undefined,
    instance: fields.instance ?? NO_INSTANCE,
    token,
    slot,
    predicate,
    scope: fields.scope,
    target: fields.target,
    factory: fields.factory,
    deps: fields.deps,
    value: fields.value,
    onActivation: fields.onActivation,
    onDeactivation: fields.onDeactivation,
  } satisfies ConstructedBindingFields as Binding<Value>;
}

/**
 * Writable view of the only fields a fluent chain may refine after registration.
 *
 * @remarks No registry index is keyed on these, so a builder that owns the registered object
 * can write them directly instead of re-registering. `token`, `slot`, `predicate` and `id`
 * are excluded on purpose — changing those means re-indexing.
 *
 * @since 0.5.0-canary.8
 */
export interface RefinableBindingFields<Value> {
  onActivation: ActivationHandler<Value> | undefined;
  onDeactivation: DeactivationHandler<Value> | undefined;
  scope: BindingScope;
}

/**
 * Narrows a registered binding to the fields a fluent chain may still refine.
 *
 * @since 0.5.0-canary.8
 */
export function refinableFields<Value>(binding: Binding<Value>): RefinableBindingFields<Value> {
  return binding as RefinableBindingFields<Value>;
}

/**
 * Writable view of the memoized frame, which is a cache rather than part of a binding's identity.
 *
 * @remarks Named for the same reason as {@link RefinableBindingFields}: a write view stated once
 * cannot drift from `Binding`, where an inline cast at each site can.
 */
interface MemoizedFrameField {
  frame: ResolutionFrame | undefined;
}

/**
 * Drops the memoized resolution frame, for a refinement that changes what the frame reports.
 *
 * @remarks `scope` is the only field a chain writes in place that the frame derives from — a
 * re-slot builds a fresh binding, whose frame starts empty anyway.
 *
 * @since 0.5.0-canary.9
 */
export function clearBindingFrame<Value>(binding: Binding<Value>): void {
  (binding as MemoizedFrameField).frame = undefined;
}

// ── Builder interfaces ────────────────────────────────────────────────────────

/**
 * Common slot-constraint + id methods shared by all concrete binding builders.
 *
 * @since 0.3.16-canary.0
 */
export interface SlotConstrainedBuilder {
  when(predicate: (ctx: ConstraintContext) => boolean): this;
  whenNamed(name: string): this;
  whenTagged(tag: string, value: unknown): this;
  whenDefault(): this;
  id(): BindingIdentifier;
}

/**
 * @since 0.3.16-canary.0
 */
export interface BindToBuilder<Value> {
  to(type: Constructor<Value>): BindingBuilder<Value>;
  toSelf(): BindingBuilder<Value>;
  toConstantValue(value: Value): ConstantBindingBuilder<Value>;
  toDynamic(factory: (ctx: ResolutionContext) => Value): BindingBuilder<Value>;
  toDynamicAsync(factory: (ctx: ResolutionContext) => Promise<Value>): BindingBuilder<Value>;
  toResolved<const Deps extends ReadonlyArray<InjectableDependency>>(
    factory: (...args: { [K in keyof Deps]: ResolvedDependencyValue<NoInfer<Deps>[K]> }) => Value,
    deps: Deps,
  ): BindingBuilder<Value>;
  toResolvedAsync<const Deps extends ReadonlyArray<InjectableDependency>>(
    factory: (...args: { [K in keyof Deps]: ResolvedDependencyValue<NoInfer<Deps>[K]> }) => Promise<Value>,
    deps: Deps,
  ): BindingBuilder<Value>;
  toAlias(target: Token<Value> | Constructor<Value>): AliasBindingBuilder;
}

/**
 * @since 0.3.16-canary.0
 */
export interface BindingBuilder<Value> extends SlotConstrainedBuilder {
  singleton(): SingletonBindingBuilder<Value>;
  transient(): TransientBindingBuilder<Value>;
  scoped(): ScopedBindingBuilder<Value>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ConstantBindingBuilder<Value> extends SlotConstrainedBuilder {
  onActivation(fn: ActivationHandler<Value>): SingletonLifecycleBuilder<Value>;
  onDeactivation(fn: DeactivationHandler<Value>): SingletonLifecycleBuilder<Value>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface AliasBindingBuilder extends SlotConstrainedBuilder {}

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
