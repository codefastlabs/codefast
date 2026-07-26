import type { InjectableDependency, InjectionDescriptor, ResolvedDependencyValue } from "#/decorators/inject";
import type { Token } from "#/token";
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
} from "#/types";

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
   * True while this binding's factory is on the sync resolution stack. The sync resolver marks
   * it on enter and clears it on exit, making cycle detection an O(1) field read with no hashing,
   * no path scan, and no side table. Sync resolution is single-threaded, so the flag is exactly
   * path membership; the async lane keeps its own per-path check because chains can interleave.
   *
   * @remarks Resolver-owned bookkeeping — `registry.add` normalizes it, so callers never set it.
   */
  inFlight?: boolean | undefined;
  /**
   * Memoized resolution frame for this binding. Its contents derive only from immutable binding
   * fields, so it is computed once on first resolve and reused instead of a per-resolver Map
   * lookup on every hop.
   *
   * @remarks Resolver-owned bookkeeping — `registry.add` normalizes it, so callers never set it.
   */
  frame?: ResolutionFrame | undefined;
  readonly token: Token<Value> | Constructor<Value>;
  readonly slot: BindingSlot;
  readonly predicate?: ((ctx: ConstraintContext) => boolean) | undefined;
}

type BindingBaseKeys = keyof BindingBase<unknown>;

// ── Binding kinds ─────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface ClassBinding<Value> extends BindingBase<Value> {
  readonly kind: "class";
  readonly target: Constructor<Value>;
  readonly scope: BindingScope;
  readonly onActivation?: ActivationHandler<Value> | undefined;
  readonly onDeactivation?: DeactivationHandler<Value> | undefined;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DynamicBinding<Value> extends BindingBase<Value> {
  readonly kind: "dynamic";
  readonly factory: (ctx: ResolutionContext) => Value;
  readonly scope: BindingScope;
  readonly onActivation?: ActivationHandler<Value> | undefined;
  readonly onDeactivation?: DeactivationHandler<Value> | undefined;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DynamicAsyncBinding<Value> extends BindingBase<Value> {
  readonly kind: "dynamic-async";
  readonly factory: (ctx: ResolutionContext) => Promise<Value>;
  readonly scope: BindingScope;
  readonly onActivation?: ActivationHandler<Value> | undefined;
  readonly onDeactivation?: DeactivationHandler<Value> | undefined;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ResolvedBinding<Value> extends BindingBase<Value> {
  readonly kind: "resolved";
  readonly factory: (...args: Array<unknown>) => Value;
  readonly deps: ReadonlyArray<InjectionDescriptor>;
  readonly scope: BindingScope;
  readonly onActivation?: ActivationHandler<Value> | undefined;
  readonly onDeactivation?: DeactivationHandler<Value> | undefined;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ResolvedAsyncBinding<Value> extends BindingBase<Value> {
  readonly kind: "resolved-async";
  readonly factory: (...args: Array<unknown>) => Promise<Value>;
  readonly deps: ReadonlyArray<InjectionDescriptor>;
  readonly scope: BindingScope;
  readonly onActivation?: ActivationHandler<Value> | undefined;
  readonly onDeactivation?: DeactivationHandler<Value> | undefined;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ConstantBinding<Value> extends BindingBase<Value> {
  readonly kind: "constant";
  readonly value: Value;
  readonly scope: "singleton";
  readonly onActivation?: ActivationHandler<Value> | undefined;
  readonly onDeactivation?: DeactivationHandler<Value> | undefined;
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
type BindingFieldSuperset = {
  readonly kind: Binding["kind"];
  readonly scope?: unknown;
  readonly target?: unknown;
  readonly factory?: unknown;
  readonly deps?: unknown;
  readonly value?: unknown;
  readonly onActivation?: unknown;
  readonly onDeactivation?: unknown;
};

/**
 * The single construction site for bindings: one literal listing every kind's fields in one
 * fixed order, so all bindings in a process share a single V8 hidden class.
 *
 * @remarks Mixed binding kinds otherwise turn the resolver's hot property reads
 * (kind/scope/factory/…) megamorphic, which costs ~30% throughput in processes that exercise
 * many kinds. Because this is the only site, the registry stores what it is given rather than
 * re-copying it — so a builder that owns the returned object can refine it in place.
 *
 * @param source - the kind-specific payload, or an existing binding to re-slot
 * @param id - reuse a caller's id to keep a fluent chain's `id()` stable across refinements
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
  } as Binding<Value>;
}

/**
 * Writable view of the only fields a fluent chain may refine after registration.
 *
 * @remarks No registry index is keyed on these, so a builder that owns the registered object
 * can write them directly instead of re-registering. `token`, `slot`, `predicate` and `id`
 * are excluded on purpose — changing those means re-indexing.
 *
 * @since 0.5.0-canary.7
 */
export interface RefinableBindingFields<Value> {
  onActivation: ActivationHandler<Value> | undefined;
  onDeactivation: DeactivationHandler<Value> | undefined;
  scope: BindingScope;
}

/**
 * Narrows a registered binding to the fields a fluent chain may still refine.
 *
 * @since 0.5.0-canary.7
 */
export function refinableFields<Value>(binding: Binding<Value>): RefinableBindingFields<Value> {
  return binding as unknown as RefinableBindingFields<Value>;
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
