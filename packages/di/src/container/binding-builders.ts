/**
 * The fluent chain `bind()` returns, which is also the binding it registers.
 *
 * @remarks One object plays every role: each builder step, the record the registry stores, and the
 * binding the resolver reads. The binding fields are declared first and in a fixed order, so every
 * binding in the process shares one hidden class; the return type of each step is what pins the
 * chain's order, so no runtime check has to.
 */
import type {
  AliasBindingBuilder,
  Binding,
  BindingBuilder,
  BindingSlot,
  BindToBuilder,
  ConstantBindingBuilder,
  ScopedBindingBuilder,
  SingletonBindingBuilder,
  SingletonLifecycleBuilder,
  TransientBindingBuilder,
} from "#core/binding";
import {
  clearBindingFrame,
  NO_ACTIVATION_STAMP,
  createBindingSlot,
  DEFAULT_BINDING_SLOT,
  generateBindingId,
  NO_INSTANCE,
} from "#core/binding";
import { mergingConstraintRequirements } from "#core/constraint-requirement";
import type { BindingRegistry } from "#core/registry";
import type { BindingTag } from "#core/tag";
import { slotName } from "#core/tag";
import type { Token } from "#core/token";
import { tokenName } from "#core/token";
import type {
  ActivationHandler,
  BindingConstraint,
  BindingIdentifier,
  BindingKind,
  BindingScope,
  Constructor,
  DeactivationHandler,
  ResolutionContext,
  ResolutionFrame,
} from "#core/types";
import {
  ChainAlreadyRegisteredError,
  ChainNotRegisteredError,
  ManyBindingSlotError,
  SelfBindingRequiresClassError,
} from "#errors/errors";
import type { InjectableDependency, InjectionDescriptor, ResolvedDependencyValue } from "#injection/descriptor";
import { normalizeToDescriptor } from "#injection/descriptor";
import type { ScopeManager } from "#lifecycle/scope-manager";

/** One criterion per key: re-tagging the same key replaces it rather than asking for both values. */
function updateSlotTag(slot: BindingSlot, criterion: BindingTag): BindingSlot {
  const tags = [...slot.tags];
  const existingIndex = tags.findIndex((existing) => existing.key === criterion.key);
  if (existingIndex === -1) {
    tags.push(criterion);
  } else {
    tags[existingIndex] = criterion;
  }
  return createBindingSlot(tags);
}

// ── Registration target ──────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Where a chain registers, and on whose behalf.
 *
 * @remarks Built once per container and shared by every chain it creates. `moduleBindingIds` is
 * present exactly when the chain belongs to a module load.
 *
 * @since 0.5.0-canary.8
 */
export interface BindingRegistration {
  readonly registry: BindingRegistry;
  readonly scope: ScopeManager;
  readonly moduleBindingIds: Array<BindingIdentifier> | undefined;
  /** Runs for a binding this registration displaces, instead of parking it for a later restore. */
  readonly deactivateDisplaced?: ((binding: Binding) => void) | undefined;
}

// ── BindingChain ─────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The one builder behind `bind()` and every `to*()` return type — and the binding it registers.
 *
 * @remarks The binding fields come first, in the order every binding shares, and the chain's own
 * bookkeeping follows as private fields; `to*()` fills the fields in place and hands this object to
 * the registry, so a plain bind is one allocation. Refinements write the registered object: a scope
 * or hook in place, a slot or predicate through the registry so its indexes follow.
 *
 * @since 0.5.0-canary.8
 */
export class BindingChain<Value, Names extends string = string>
  implements
    AliasBindingBuilder<Names>,
    BindingBuilder<Value, Names>,
    BindToBuilder<Value, Names>,
    ConstantBindingBuilder<Value, Names>,
    ScopedBindingBuilder<Value>,
    SingletonBindingBuilder<Value>,
    SingletonLifecycleBuilder<Value>,
    TransientBindingBuilder<Value>
{
  // The binding. Every field, every kind, written in this order and nowhere else: one hidden class.
  kind: BindingKind = "constant";
  readonly identifier: BindingIdentifier = generateBindingId();
  inFlight = false;
  frame: ResolutionFrame | undefined = undefined;
  activationStamp: number = NO_ACTIVATION_STAMP;
  instance: unknown = NO_INSTANCE;
  readonly token: Token<Value, Names> | Constructor<Value>;
  slot: BindingSlot = DEFAULT_BINDING_SLOT;
  predicate: BindingConstraint | undefined = undefined;
  isMany = false;
  scope: BindingScope = "singleton";
  target: unknown = undefined;
  factory: unknown = undefined;
  deps: ReadonlyArray<InjectionDescriptor> | undefined = undefined;
  value: unknown = undefined;
  activationHook: ActivationHandler<Value> | undefined = undefined;
  deactivationHook: DeactivationHandler<Value> | undefined = undefined;

  // The chain. Set by the first `to*()`, which is the only one a chain accepts.
  #isRegistered = false;
  // Allocated only by a chain that actually displaces something — most never do.
  #displacedByChain: Array<Binding> | undefined;
  // Registry version after this chain's last write — a mismatch means someone else wrote in between.
  #versionAfterLastWrite = -1;
  readonly #registration: BindingRegistration;

  constructor(token: Token<Value, Names> | Constructor<Value>, registration: BindingRegistration) {
    this.token = token;
    this.#registration = registration;
  }

  /** This object as the registry and the resolver see it: the value type erased once, here. */
  get #binding(): Binding {
    return this as unknown as Binding;
  }

  /** Loud failure for a refinement before `to*()`. */
  #requireRegistered(): void {
    if (!this.#isRegistered) {
      throw new ChainNotRegisteredError(tokenName(this.token));
    }
  }

  /** Loud failure for a second `to*()`, raised before the first one's fields can be overwritten. */
  #requireUnregistered(): void {
    if (this.#isRegistered) {
      throw new ChainAlreadyRegisteredError(tokenName(this.token));
    }
  }

  #register(kind: BindingKind, scope: BindingScope): this {
    this.kind = kind;
    this.scope = scope;
    this.#isRegistered = true;
    this.#commit(undefined);
    return this;
  }

  // ── Registration ───────────────────────────────────────────────────────────────────────────────────────────────────

  to(type: Constructor<Value>): BindingBuilder<Value, Names> {
    this.#requireUnregistered();
    this.target = type;
    return this.#register("class", "transient");
  }

  toSelf(): BindingBuilder<Value, Names> {
    this.#requireUnregistered();
    if (typeof this.token !== "function") {
      throw new SelfBindingRequiresClassError(tokenName(this.token));
    }
    this.target = this.token;
    return this.#register("class", "transient");
  }

  toConstantValue(value: Value): ConstantBindingBuilder<Value, Names> {
    this.#requireUnregistered();
    this.value = value;
    return this.#register("constant", "singleton");
  }

  toDynamic(factory: (ctx: ResolutionContext) => Value): BindingBuilder<Value, Names> {
    this.#requireUnregistered();
    this.factory = factory;
    return this.#register("dynamic", "transient");
  }

  toDynamicAsync(factory: (ctx: ResolutionContext) => Promise<Value>): BindingBuilder<Value, Names> {
    this.#requireUnregistered();
    this.factory = factory;
    return this.#register("dynamic-async", "transient");
  }

  toResolved<const Deps extends ReadonlyArray<InjectableDependency>>(
    factory: (...args: { [K in keyof Deps]: ResolvedDependencyValue<NoInfer<Deps>[K]> }) => Value,
    deps: Deps,
  ): BindingBuilder<Value, Names> {
    this.#requireUnregistered();
    this.factory = factory;
    this.deps = deps.map((dependency) => normalizeToDescriptor(dependency));
    return this.#register("resolved", "transient");
  }

  toResolvedAsync<const Deps extends ReadonlyArray<InjectableDependency>>(
    factory: (...args: { [K in keyof Deps]: ResolvedDependencyValue<NoInfer<Deps>[K]> }) => Promise<Value>,
    deps: Deps,
  ): BindingBuilder<Value, Names> {
    this.#requireUnregistered();
    this.factory = factory;
    this.deps = deps.map((dependency) => normalizeToDescriptor(dependency));
    return this.#register("resolved-async", "transient");
  }

  toAlias(target: Token<Value> | Constructor<Value>): AliasBindingBuilder<Names> {
    this.#requireUnregistered();
    this.target = target;
    return this.#register("alias", "transient");
  }

  // ── Refinement ─────────────────────────────────────────────────────────────────────────────────────────────────────

  /**
   * Whether this chain provably still owns the registry's last write with nothing parked.
   *
   * @remarks When it does, a refinement rewrites the live binding in place; otherwise `#reslot`
   * re-checks liveness and restores what the new shape frees.
   */
  get #isProvablyLive(): boolean {
    return this.#registration.registry.version === this.#versionAfterLastWrite && this.#displacedByChain === undefined;
  }

  /** Stamps this chain's last-write version after a mutation it made in place. */
  #recordWrite(): void {
    this.#versionAfterLastWrite = this.#registration.registry.version;
  }

  /** Bumps the registry for an index-neutral mutation (scope, hook) and records this chain's write. */
  #touchAndRecordWrite(): void {
    this.#registration.registry.touch();
    this.#recordWrite();
  }

  // Slot and predicate are what the registry indexes on, so a re-slot takes the binding out of the
  // registry, rewrites the two fields while it is out, and registers it again — same object, same id.
  #reslot(slot: BindingSlot, predicate: BindingConstraint | undefined): this {
    this.#requireRegistered();
    this.#commit(() => {
      this.slot = slot;
      this.predicate = predicate;
      // The frame reports the slot, so a resolve before this call memoized the previous one.
      clearBindingFrame(this.#binding);
    });
    return this;
  }

  #withScope(scope: BindingScope): this {
    this.#requireRegistered();
    if (this.scope !== scope) {
      // An instance cached under the old scope must not survive the change — a later flip back
      // to that scope would resurrect it.
      this.#registration.scope.deleteSingleton(this.#binding);
      this.#registration.scope.deleteScoped(this.identifier);
      this.scope = scope;
    }
    // The frame reports the scope, so a resolve before this call memoized the previous one.
    clearBindingFrame(this.#binding);
    this.#touchAndRecordWrite();
    return this;
  }

  // SPEC calls a candidate a binding that passes *all* of a chain's predicates, and the chain type
  // reads as refinement, so a second `when()` narrows rather than replaces.
  when(predicate: BindingConstraint): this {
    this.#requireRegistered();
    const previous = this.predicate;
    // The composite carries both sides' requirements, so validate() still sees them.
    const narrowed =
      previous === undefined
        ? predicate
        : mergingConstraintRequirements((ctx) => previous(ctx) && predicate(ctx), previous, predicate);
    // The slot is unchanged, so a provably-live binding just takes the predicate in place.
    if (this.#isProvablyLive) {
      this.#registration.registry.setPredicate(this.#binding, narrowed);
      this.#recordWrite();
      return this;
    }
    return this.#reslot(this.slot, narrowed);
  }

  whenNamed(name: Names): this {
    return this.whenTagged(slotName.of(name));
  }

  whenTagged(criterion: BindingTag): this {
    this.#requireRegistered();
    if (this.isMany) {
      throw new ManyBindingSlotError(tokenName(this.token));
    }
    return this.#reslot(updateSlotTag(this.slot, criterion), this.predicate);
  }

  many(): this {
    this.#requireRegistered();
    if (this.slot.tags.length !== 0) {
      throw new ManyBindingSlotError(tokenName(this.token));
    }
    if (this.isMany) {
      return this;
    }
    // A provably-live binding takes membership in place; the registry only moves it out of the lone
    // map. Otherwise `#commit` re-checks liveness and restores what the freed slot lets back in.
    if (this.#isProvablyLive) {
      this.#registration.registry.setMany(this.#binding);
      this.#recordWrite();
      return this;
    }
    this.#commit(() => {
      this.isMany = true;
    });
    return this;
  }

  whenDefault(): this {
    // The default slot is what a fresh registration already has, so there is nothing to re-slot —
    // but an unregistered chain must fail here exactly as it does in every other refinement.
    this.#requireRegistered();
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
    this.#requireRegistered();
    this.activationHook = fn;
    this.#touchAndRecordWrite();
    return this;
  }

  onDeactivation(fn: DeactivationHandler<Value>): this {
    this.#requireRegistered();
    this.deactivationHook = fn;
    this.#touchAndRecordWrite();
    return this;
  }

  id(): BindingIdentifier {
    this.#requireRegistered();
    return this.identifier;
  }

  // ── Registry ───────────────────────────────────────────────────────────────────────────────────────────────────────

  /**
   * Registers this binding; with `rewrite` given, first takes the live binding out, rewrites it, and
   * registers it again.
   *
   * @remarks A `when*()` that follows `to*()` re-slots an already-live binding and can displace one
   * the final shape would never conflict with. Those stay parked in `#displacedByChain` until the
   * chain settles, then get restored.
   */
  #commit(rewrite: (() => void) | undefined): void {
    const { registry, moduleBindingIds } = this.#registration;
    const registered = this.#binding;

    if (rewrite !== undefined) {
      // A registry someone else wrote since this chain's last write invalidates the parked
      // snapshot: restoring it could undo an unbind or shadow a newer binding.
      if (registry.version !== this.#versionAfterLastWrite) {
        this.#displacedByChain = undefined;
      }
      if (!registry.reslot(registered, rewrite)) {
        // The chain's binding is no longer live (unbound or displaced) — a refinement must not
        // resurrect it, so the chain goes inert against the registry.
        this.#displacedByChain = undefined;
        this.#versionAfterLastWrite = registry.version;
        return;
      }
    } else {
      // Each `to*()` starts its own registration, so anything a previous one displaced is not this
      // registration's to restore.
      this.#displacedByChain = undefined;
    }
    const displaced = registry.add(registered);
    if (displaced !== undefined) {
      if (this.#registration.deactivateDisplaced !== undefined && rewrite === undefined) {
        this.#registration.deactivateDisplaced(displaced);
      } else {
        (this.#displacedByChain ??= []).push(displaced);
      }
    }
    if (rewrite !== undefined && this.#displacedByChain !== undefined) {
      this.#restoreNonConflicting(this.#displacedByChain);
    }
    if (rewrite === undefined && moduleBindingIds !== undefined) {
      moduleBindingIds.push(this.identifier);
    }
    this.#versionAfterLastWrite = registry.version;
  }

  #restoreNonConflicting(displaced: Array<Binding>): void {
    for (let index = displaced.length - 1; index >= 0; index -= 1) {
      const candidate = displaced[index]!;
      // A restore must never displace: a slot that has been re-occupied keeps its occupant, and
      // the candidate stays parked.
      if (!this.#registration.registry.hasSlotOccupant(candidate)) {
        this.#registration.registry.add(candidate);
        displaced.splice(index, 1);
      }
    }
  }
}
