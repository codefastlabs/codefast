import type { BindingTag, TagKeyMask } from "#core/tag";
import { NO_TAG_KEYS, slotName, tagKeyMaskOf } from "#core/tag";
import type { Token } from "#core/token";
import type {
  BindingConstraint,
  BindingIdentifier,
  BindingScope,
  Constructor,
  ResolutionContext,
  ResolutionFrame,
} from "#core/types";
import type { InjectionDescriptor } from "#injection/descriptor";

// ── BindingSlot ──────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The criterion set a binding registers under and a request matches against.
 *
 * @since 0.3.16-canary.0
 */
export interface BindingSlot {
  /** Derived view of the reserved `slotName` criterion — `undefined` when the slot carries none. */
  readonly name: string | undefined;
  /** The whole criterion set, the reserved name criterion included. */
  readonly tags: ReadonlyArray<BindingTag>;
  /** OR of this slot's tag keys, so the subset test is one word compare. */
  readonly keyMask: TagKeyMask;
}

/**
 * Builds a slot from its criterion set, deriving the name view and key mask.
 *
 * @remarks The one place the derived `name` is computed — a slot assembled any other way can carry
 * a name criterion the readers of the view never see.
 *
 * @since 0.8.0
 */
export function createBindingSlot(tags: ReadonlyArray<BindingTag>): BindingSlot {
  let name: string | undefined;
  for (const criterion of tags) {
    if (criterion.key === slotName) {
      name = criterion.value as string;
      break;
    }
  }
  // Frozen like DEFAULT_BINDING_SLOT's list: frames and snapshots alias a slot's tags.
  return { name, tags: Object.freeze([...tags]), keyMask: tagKeyMaskOf(tags) };
}

/**
 * Returns whether two slots carry the same criterion set, in any order.
 *
 * @remarks The derived `name` is not compared — the criterion set alone is the identity.
 *
 * @since 0.3.16-canary.0
 */
export function bindingSlotEquals(left: BindingSlot, right: BindingSlot): boolean {
  if (left.keyMask !== right.keyMask || left.tags.length !== right.tags.length) {
    return false;
  }
  for (const criterion of left.tags) {
    if (!right.tags.includes(criterion)) {
      return false;
    }
  }
  return true;
}

/**
 * Returns the slot with one criterion added, replacing any earlier criterion of the same key.
 *
 * @remarks One criterion per key: re-tagging a key replaces it rather than asking for both values.
 *
 * @since 0.11.0
 */
export function withSlotCriterion(slot: BindingSlot, criterion: BindingTag): BindingSlot {
  const tags = [...slot.tags];
  const existingIndex = tags.findIndex((existing) => existing.key === criterion.key);
  if (existingIndex === -1) {
    tags.push(criterion);
  } else {
    tags[existingIndex] = criterion;
  }
  return createBindingSlot(tags);
}

/**
 * Cached singleton absent — distinguishes "not resolved yet" from a cached `undefined`.
 *
 * @since 0.5.0-canary.8
 */
export const NO_INSTANCE: unique symbol = Symbol("di:no-instance");

/**
 * The slot every unconstrained binding shares.
 *
 * @remarks Tags are frozen where they are built (here and in the builder's re-tag), never per
 * binding: frames and snapshots alias the array, so a caller's write throws instead of corrupting
 * the registry.
 *
 * @since 0.3.16-canary.0
 */
export const DEFAULT_BINDING_SLOT: BindingSlot = { name: undefined, tags: Object.freeze([]), keyMask: NO_TAG_KEYS };

/**
 * Renders a tag value for a diagnostic, never throwing.
 *
 * @remarks A tag value is caller data — a bigint, a null-prototype object, a throwing `toString` —
 * so stringifying it must not become the error that masks the real one.
 *
 * @since 0.11.0
 */
export function stringifyTagValue(value: unknown): string {
  try {
    return String(value);
  } catch {
    return "<unprintable>";
  }
}

/**
 * Formats a slot for diagnostics — `default`, or its `name:`/`tag:` parts.
 *
 * @since 0.3.16-canary.0
 */
export function bindingSlotToString(slot: BindingSlot): string {
  if (slot.tags.length === 0) {
    return "default";
  }
  const parts: Array<string> = [];
  if (slot.name !== undefined) {
    parts.push(`name:${slot.name}`);
  }
  for (const criterion of slot.tags) {
    // The reserved criterion already printed as the `name:` part.
    if (criterion.key === slotName) {
      continue;
    }
    parts.push(`tag:${criterion.key.name}=${stringifyTagValue(criterion.value)}`);
  }
  return parts.join(",");
}

// ── BindingBase ──────────────────────────────────────────────────────────────────────────────────────────────────────

interface BindingBase<Value> {
  readonly identifier: BindingIdentifier;
  /**
   * True while this binding is being resolved on the current synchronous call stack.
   *
   * @remarks Every synchronous cycle guard reads this flag and nothing else: synchronous code does not
   * interleave, so the flag *is* exact path membership at any depth. The async lanes hold it only for a
   * factory's synchronous prefix, or for the seeded path a synchronous call from an async level runs
   * over. Not optional: the binding builder always initializes it, and a field that may be absent is a
   * field that can cost the shared hidden class. Resolver-owned; callers never set it.
   */
  inFlight: boolean;
  /**
   * Memoized resolution frame for this binding. Its contents derive only from immutable binding
   * fields, so it is computed once on first resolve and reused instead of a per-resolver Map
   * lookup on every hop.
   *
   * @remarks Resolver-owned bookkeeping — `registry.add` normalizes it, so callers never set it.
   */
  frame: ResolutionFrame | undefined;
  /**
   * The context a transient factory root is handed, built once per binding: the root's path is its own frame
   * alone, so every resolve of the root reads the same one.
   *
   * @remarks Resolver-owned bookkeeping, cleared with the frame it is built over.
   */
  rootContext: ResolutionContext | undefined;
  /**
   * The activation need last computed for this binding, stamped with the versions it was computed
   * under, or {@link NO_ACTIVATION_STAMP}.
   *
   * @remarks Resolver-owned bookkeeping: a field the level reads beats a per-resolver map that a
   * container resolving each binding once would build and never read again.
   */
  activationStamp: number;
  /**
   * Cached singleton instance, or {@link NO_INSTANCE}.
   *
   * @remarks A binding belongs to exactly one container, so its singleton slot is per-binding —
   * a field read replaces a keyed lookup on the hottest resolve shape there is.
   */
  instance: unknown;
  /**
   * The key every container's scoped cache files this binding's instance under.
   *
   * @remarks Chain-owned. It starts as the binding's id, and a scope verb that changes the scope mints a new one, so
   * a scoped instance any child cached under an earlier scope is never found again. The id itself stays stable.
   */
  scopedCacheKey: BindingIdentifier;
  readonly token: Token<Value> | Constructor<Value>;
  readonly slot: BindingSlot;
  readonly predicate?: BindingConstraint | undefined;
  /**
   * Whether the binding is a collection member only: `resolveAll` includes it, `resolve` never
   * selects it, and it neither displaces nor is displaced under slot last-wins.
   */
  readonly isMany: boolean;
}

/**
 * The lifecycle hooks every kind but `alias` may carry.
 *
 * @remarks Declared as **methods**, not function-typed properties, so their parameters compare
 * bivariantly and `Binding<Value>` stays assignable to `Binding`. The engine erases the value type at
 * every lane boundary regardless; the public `ActivationHandler` / `DeactivationHandler` keep strict
 * checking, which is where a user's handler is actually verified. Named apart from the fluent
 * `onActivation()` / `onDeactivation()` steps because the chain that registers them is the binding
 * itself, and a field cannot share a name with a method on the same object.
 */
interface BindingLifecycleHooks<Value> {
  activationHook?(ctx: ResolutionContext, instance: Value): Value | Promise<Value>;
  deactivationHook?(instance: Value): void | Promise<void>;
}

// ── Binding kinds ────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * A binding that instantiates a constructor.
 *
 * @since 0.3.16-canary.0
 */
export interface ClassBinding<Value> extends BindingBase<Value>, BindingLifecycleHooks<Value> {
  readonly kind: "class";
  readonly target: Constructor<Value>;
  readonly scope: BindingScope;
}

/**
 * A binding that computes its value with a synchronous factory.
 *
 * @since 0.3.16-canary.0
 */
export interface DynamicBinding<Value> extends BindingBase<Value>, BindingLifecycleHooks<Value> {
  readonly kind: "dynamic";
  readonly factory: (ctx: ResolutionContext) => Value;
  readonly scope: BindingScope;
}

/**
 * A binding whose factory returns a promise of the value.
 *
 * @since 0.3.16-canary.0
 */
export interface DynamicAsyncBinding<Value> extends BindingBase<Value>, BindingLifecycleHooks<Value> {
  readonly kind: "dynamic-async";
  readonly factory: (ctx: ResolutionContext) => Promise<Value>;
  readonly scope: BindingScope;
}

/**
 * A binding whose factory is called with its declared dependencies already resolved.
 *
 * @since 0.3.16-canary.0
 */
export interface ResolvedBinding<Value> extends BindingBase<Value>, BindingLifecycleHooks<Value> {
  readonly kind: "resolved";
  readonly factory: (...args: Array<unknown>) => Value;
  readonly deps: ReadonlyArray<InjectionDescriptor>;
  readonly scope: BindingScope;
}

/**
 * The async form of {@link ResolvedBinding} — the factory returns a promise.
 *
 * @since 0.3.16-canary.0
 */
export interface ResolvedAsyncBinding<Value> extends BindingBase<Value>, BindingLifecycleHooks<Value> {
  readonly kind: "resolved-async";
  readonly factory: (...args: Array<unknown>) => Promise<Value>;
  readonly deps: ReadonlyArray<InjectionDescriptor>;
  readonly scope: BindingScope;
}

/**
 * A binding that hands out one fixed value, so its scope is always `singleton`.
 *
 * @since 0.3.16-canary.0
 */
export interface ConstantBinding<Value> extends BindingBase<Value>, BindingLifecycleHooks<Value> {
  readonly kind: "constant";
  readonly value: Value;
  readonly scope: "singleton";
}

/**
 * A binding that defers to whatever binding its target token selects.
 *
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
 * Every binding shape the engine resolves, discriminated by `kind`.
 *
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
 * The scope a binding resolves under.
 *
 * @remarks Every kind declares one — an alias declares `transient`, since it defers scoping to the
 * binding it points at — so this is a field read, kept as a named function because it is the
 * vocabulary validation and introspection speak.
 *
 * @since 0.3.16-canary.0
 */
export function effectiveBindingScope(binding: Binding): BindingScope {
  return binding.scope;
}

// ── ID generation ────────────────────────────────────────────────────────────────────────────────────────────────────

let bindingIdCounter = 0;
/**
 * Returns a process-unique identifier for a new binding.
 *
 * @since 0.3.16-canary.0
 */
export function generateBindingId(): BindingIdentifier {
  bindingIdCounter += 1;
  return bindingIdCounter as BindingIdentifier;
}

/**
 * Writable view of the memoized frame, which is a cache rather than part of a binding's identity.
 *
 * @remarks A write view stated once cannot drift from `Binding`, where an inline cast at each site
 * can.
 */
interface MemoizedFrameField {
  frame: ResolutionFrame | undefined;
  rootContext: ResolutionContext | undefined;
}

/**
 * The stamp of a binding whose activation need has not been computed under the current versions.
 *
 * @since 0.11.0
 */
export const NO_ACTIVATION_STAMP = -1;

/**
 * Drops the memoized resolution frame, for a scope change that alters what the frame reports.
 *
 * @remarks The frame derives from `scope` and `slot`; the slot is final once the binding registers, so
 * only a scope written in place on the registered object clears it.
 *
 * @since 0.5.0-canary.9
 */
export function clearBindingFrame<Value>(binding: Binding<Value>): void {
  (binding as MemoizedFrameField).frame = undefined;
  (binding as MemoizedFrameField).rootContext = undefined;
}
