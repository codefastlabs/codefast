/**
 * Fluent binding-builder chain behind `container.bind()` / `container.rebind()`.
 *
 * The chain registers once, on the `to*()` call, and every later refinement acts on that same
 * registered object — so a chain left half-finished is still a valid registration and a
 * completed one costs a single registry insertion. Refinements the indexes don't care about
 * (scope, activation hooks) are written in place; only `when*()` re-slots, which re-indexes
 * under the chain's original id.
 *
 * **One object per `bind()`.** A single instance plays every role — the `BindToBuilder` before
 * `to*()` and the kind-specific builder after — and commits to the registry itself rather than
 * through a separate committer. The ordering `to*()`-before-`when*()` is enforced by the return
 * types; a caller who defeats them (plain JavaScript, or a cast) gets a
 * {@link ChainNotRegisteredError} rather than a silent no-op.
 */
import type {
  AliasBindingBuilder,
  Binding,
  BindingBuilder,
  BindingSlot,
  BindToBuilder,
  ConstantBindingBuilder,
  PartialBinding,
  ScopedBindingBuilder,
  SingletonBindingBuilder,
  SingletonLifecycleBuilder,
  TransientBindingBuilder,
} from "#/binding";
import { bindingSlotEquals, createBinding, DEFAULT_BINDING_SLOT, refinableFields } from "#/binding";
import type { InjectableDependency, ResolvedDependencyValue } from "#/decorators/inject";
import { normalizeToDescriptor } from "#/decorators/inject";
import { ChainNotRegisteredError } from "#/errors";
import type { BindingRegistry } from "#/registry";
import type { Token } from "#/token";
import { tokenName } from "#/token";
import type {
  ActivationHandler,
  BindingIdentifier,
  BindingScope,
  ConstraintContext,
  Constructor,
  DeactivationHandler,
  ResolutionContext,
} from "#/types";

function updateSlotTag(slot: BindingSlot, tag: string, value: unknown): BindingSlot {
  const tags = [...slot.tags];
  const existingIndex = tags.findIndex(([key]) => key === tag);
  if (existingIndex === -1) {
    tags.push([tag, value]);
  } else {
    tags[existingIndex] = [tag, value];
  }
  return { ...slot, tags };
}

// True when re-adding `restored` would immediately be displaced again by `current`
// (both slot-based with equal slots) — in that case the replacement was legitimate.
function displacesRestoredBinding(current: Binding, restored: Binding): boolean {
  const currentIsPurePredicate =
    current.predicate !== undefined && current.slot.name === undefined && current.slot.tags.length === 0;
  if (currentIsPurePredicate) {
    return false;
  }
  return bindingSlotEquals(current.slot, restored.slot);
}

/** Record a module's binding id, dropping the id the chain re-slotted away from. */
function trackBindingForModule(
  ids: Array<BindingIdentifier>,
  id: BindingIdentifier,
  previousId: BindingIdentifier | undefined,
): void {
  if (previousId !== undefined) {
    const previousIndex = ids.indexOf(previousId);
    if (previousIndex !== -1) {
      ids.splice(previousIndex, 1);
    }
  }
  ids.push(id);
}

// ── Registration target ───────────────────────────────────────────────────────

/**
 * Where a chain registers, and on whose behalf.
 *
 * @remarks A container builds one of these and every chain it creates shares it, so `bind()`
 * allocates the builder and nothing else. `moduleBindingIds` is the id list of the module whose
 * load created this registration — present exactly when the chain belongs to a module load, which
 * is what lets the module bookkeeping be a plain array push instead of a keyed lookup.
 *
 * @since 0.5.0-canary.7
 */
export interface BindingRegistration {
  readonly registry: BindingRegistry;
  readonly moduleBindingIds: Array<BindingIdentifier> | undefined;
}

// ── BindingChain ──────────────────────────────────────────────────────────────

/**
 * The one builder behind `bind()` and every `to*()` return type. Each interface exposes only the
 * calls that are legal at that point in the chain; the runtime object is shared because every
 * refinement is the same operation — narrow the registered binding, keep its id.
 *
 * @since 0.5.0-canary.7
 */
export class BindingChain<Value>
  implements
    AliasBindingBuilder,
    BindingBuilder<Value>,
    BindToBuilder<Value>,
    ConstantBindingBuilder<Value>,
    ScopedBindingBuilder<Value>,
    SingletonBindingBuilder<Value>,
    SingletonLifecycleBuilder<Value>,
    TransientBindingBuilder<Value>
{
  // Undefined until a `to*()` call registers the binding.
  #binding: Binding<Value> | undefined;
  // Allocated only by a chain that actually displaces something — most never do.
  #displacedByChain: Array<Binding> | undefined;
  readonly #token: Token<Value> | Constructor<Value>;
  readonly #registration: BindingRegistration;

  constructor(token: Token<Value> | Constructor<Value>, registration: BindingRegistration) {
    this.#token = token;
    this.#registration = registration;
  }

  /** The registered binding, or a loud failure if no `to*()` has run yet. */
  #registered(): Binding<Value> {
    if (this.#binding === undefined) {
      throw new ChainNotRegisteredError(tokenName(this.#token));
    }
    return this.#binding;
  }

  #register(partial: PartialBinding<Value>): this {
    // Each `to*()` starts its own registration, so anything a previous one displaced is not this
    // registration's to restore.
    this.#displacedByChain = undefined;
    this.#binding = createBinding(partial, this.#token, DEFAULT_BINDING_SLOT, undefined);
    this.#commit(this.#binding, undefined);
    return this;
  }

  // ── Registration ───────────────────────────────────────────────────────────

  to(type: Constructor<Value>): BindingBuilder<Value> {
    return this.#register({ kind: "class", target: type, scope: "transient" });
  }

  toSelf(): BindingBuilder<Value> {
    if (typeof this.#token !== "function") {
      throw new Error("toSelf() requires token to be a Constructor");
    }
    return this.#register({ kind: "class", target: this.#token, scope: "transient" });
  }

  toConstantValue(value: Value): ConstantBindingBuilder<Value> {
    return this.#register({ kind: "constant", scope: "singleton", value });
  }

  toDynamic(factory: (ctx: ResolutionContext) => Value): BindingBuilder<Value> {
    return this.#register({ kind: "dynamic", factory, scope: "transient" });
  }

  toDynamicAsync(factory: (ctx: ResolutionContext) => Promise<Value>): BindingBuilder<Value> {
    return this.#register({ kind: "dynamic-async", factory, scope: "transient" });
  }

  toResolved<const Deps extends ReadonlyArray<InjectableDependency>>(
    factory: (...args: { [K in keyof Deps]: ResolvedDependencyValue<NoInfer<Deps>[K]> }) => Value,
    deps: Deps,
  ): BindingBuilder<Value> {
    return this.#register({
      kind: "resolved",
      deps: deps.map((dependency) => normalizeToDescriptor(dependency)),
      factory: factory as (...args: Array<unknown>) => Value,
      scope: "transient",
    });
  }

  toResolvedAsync<const Deps extends ReadonlyArray<InjectableDependency>>(
    factory: (...args: { [K in keyof Deps]: ResolvedDependencyValue<NoInfer<Deps>[K]> }) => Promise<Value>,
    deps: Deps,
  ): BindingBuilder<Value> {
    return this.#register({
      kind: "resolved-async",
      deps: deps.map((dependency) => normalizeToDescriptor(dependency)),
      factory: factory as (...args: Array<unknown>) => Promise<Value>,
      scope: "transient",
    });
  }

  toAlias(target: Token<Value> | Constructor<Value>): AliasBindingBuilder {
    return this.#register({ kind: "alias", target });
  }

  // ── Refinement ─────────────────────────────────────────────────────────────

  // Slot and predicate are what the registry indexes on, so a re-slot rebuilds the binding and
  // re-registers it — under the original id, keeping `id()` stable for the whole chain.
  #reslot(slot: BindingSlot, predicate: ((ctx: ConstraintContext) => boolean) | undefined): this {
    const previous = this.#registered();
    this.#binding = createBinding(previous, previous.token, slot, predicate, previous.id);
    this.#commit(this.#binding, previous.id);
    return this;
  }

  #withScope(scope: BindingScope): this {
    refinableFields(this.#registered()).scope = scope;
    this.#registration.registry.touch();
    return this;
  }

  when(predicate: (ctx: ConstraintContext) => boolean): this {
    return this.#reslot(this.#registered().slot, predicate);
  }

  whenNamed(name: string): this {
    return this.#reslot({ ...this.#registered().slot, name }, this.#registered().predicate);
  }

  whenTagged(tag: string, value: unknown): this {
    const binding = this.#registered();
    return this.#reslot(updateSlotTag(binding.slot, tag, value), binding.predicate);
  }

  whenDefault(): this {
    // The default slot is what a fresh registration already has, so there is nothing to re-slot —
    // but an unregistered chain must fail here exactly as it does in every other refinement.
    this.#registered();
    return this;
  }

  singleton(): SingletonBindingBuilder<Value> {
    return this.#withScope("singleton");
  }

  transient(): TransientBindingBuilder<Value> {
    return this.#withScope("transient");
  }

  scoped(): ScopedBindingBuilder<Value> {
    return this.#withScope("scoped");
  }

  onActivation(fn: ActivationHandler<Value>): this {
    refinableFields(this.#registered()).onActivation = fn;
    this.#registration.registry.touch();
    return this;
  }

  onDeactivation(fn: DeactivationHandler<Value>): this {
    refinableFields(this.#registered()).onDeactivation = fn;
    this.#registration.registry.touch();
    return this;
  }

  id(): BindingIdentifier {
    return this.#registered().id;
  }

  // ── Registry ───────────────────────────────────────────────────────────────

  /**
   * Register `binding`, first removing `previousId` when the chain is re-slotting.
   *
   * @remarks A `when*()` that follows `to*()` re-slots an already-live binding and can displace one
   * the final shape would never conflict with. Those stay parked in `#displacedByChain` until the
   * chain settles, then get restored.
   */
  #commit(binding: Binding<Value>, previousId: BindingIdentifier | undefined): void {
    const { registry, moduleBindingIds } = this.#registration;
    // The registry is heterogeneous by design — one instance holds every value type — so the
    // chain's `Binding<Value>` is erased once, here, rather than at each call site.
    const registered = binding as Binding;

    if (previousId !== undefined) {
      registry.removeById(previousId);
    }
    const displaced = registry.add(registered);
    if (displaced !== undefined) {
      (this.#displacedByChain ??= []).push(displaced);
    }
    if (previousId !== undefined && this.#displacedByChain !== undefined) {
      this.#restoreNonConflicting(registered, this.#displacedByChain);
    }
    if (moduleBindingIds !== undefined) {
      trackBindingForModule(moduleBindingIds, registered.id, previousId);
    }
  }

  #restoreNonConflicting(binding: Binding, displaced: Array<Binding>): void {
    for (let index = displaced.length - 1; index >= 0; index -= 1) {
      const candidate = displaced[index]!;
      if (!displacesRestoredBinding(binding, candidate)) {
        this.#registration.registry.add(candidate);
        displaced.splice(index, 1);
      }
    }
  }
}
