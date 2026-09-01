/**
 * The fluent chain `bind()` returns: it registers the binding and refines it in place.
 *
 * @remarks One object plays every role in the chain; the return type of each step is what pins the
 * order, so no runtime check has to.
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
} from "#/core/binding";
import {
  clearBindingFrame,
  createBinding,
  createBindingSlot,
  DEFAULT_BINDING_SLOT,
  refinableFields,
} from "#/core/binding";
import { mergingConstraintRequirements } from "#/core/constraint-requirement";
import type { BindingRegistry } from "#/core/registry";
import type { BindingTag } from "#/core/tag";
import { slotName } from "#/core/tag";
import type { Token } from "#/core/token";
import { tokenName } from "#/core/token";
import type {
  ActivationHandler,
  BindingConstraint,
  BindingIdentifier,
  BindingScope,
  Constructor,
  DeactivationHandler,
  ResolutionContext,
} from "#/core/types";
import { ChainNotRegisteredError, SelfBindingRequiresClassError } from "#/errors/errors";
import type { InjectableDependency, ResolvedDependencyValue } from "#/injection/descriptor";
import { normalizeToDescriptor } from "#/injection/descriptor";
import type { ScopeManager } from "#/lifecycle/scope-manager";

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
}

// ── BindingChain ─────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The one builder behind `bind()` and every `to*()` return type. Each interface exposes only the
 * calls that are legal at that point in the chain; the runtime object is shared because every
 * refinement is the same operation — narrow the registered binding, keep its id.
 *
 * @since 0.5.0-canary.8
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
  // Registry version after this chain's last write — a mismatch means someone else wrote in between.
  #versionAfterLastWrite = -1;
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

  // ── Registration ───────────────────────────────────────────────────────────────────────────────────────────────────

  to(type: Constructor<Value>): BindingBuilder<Value> {
    return this.#register({ kind: "class", target: type, scope: "transient" });
  }

  toSelf(): BindingBuilder<Value> {
    if (typeof this.#token !== "function") {
      throw new SelfBindingRequiresClassError(tokenName(this.#token));
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
    return this.#register({ kind: "alias", scope: "transient", target });
  }

  // ── Refinement ─────────────────────────────────────────────────────────────────────────────────────────────────────

  // Slot and predicate are what the registry indexes on, so a re-slot rebuilds the binding and
  // re-registers it — under the original id, keeping `id()` stable for the whole chain.
  #reslot(slot: BindingSlot, predicate: BindingConstraint | undefined): this {
    const previous = this.#registered();
    this.#binding = createBinding(previous, previous.token, slot, predicate, previous.id);
    this.#commit(this.#binding, previous.id);
    // The tracked-singleton list holds object references, and the re-slot just replaced the object.
    this.#registration.scope.replaceSingleton(previous as Binding, this.#binding as Binding);
    return this;
  }

  #withScope(scope: BindingScope): this {
    const binding = this.#registered();
    if (binding.scope !== scope) {
      // An instance cached under the old scope must not survive the change — a later flip back
      // to that scope would resurrect it.
      this.#registration.scope.deleteSingleton(binding);
      this.#registration.scope.deleteScoped(binding.id);
      refinableFields(binding).scope = scope;
    }
    // The frame reports the scope, so a resolve before this call memoized the previous one.
    clearBindingFrame(binding);
    this.#registration.registry.touch();
    this.#versionAfterLastWrite = this.#registration.registry.version;
    return this;
  }

  // SPEC calls a candidate a binding that passes *all* of a chain's predicates, and the chain type
  // reads as refinement, so a second `when()` narrows rather than replaces.
  when(predicate: BindingConstraint): this {
    const binding = this.#registered();
    const previous = binding.predicate;

    if (previous === undefined) {
      return this.#reslot(binding.slot, predicate);
    }
    // The composite carries both sides' requirements, so validate() still sees them.
    const composed = mergingConstraintRequirements((ctx) => previous(ctx) && predicate(ctx), previous, predicate);

    return this.#reslot(binding.slot, composed);
  }

  whenNamed(name: string): this {
    return this.whenTagged(slotName.of(name));
  }

  whenTagged(criterion: BindingTag): this {
    const binding = this.#registered();
    return this.#reslot(updateSlotTag(binding.slot, criterion), binding.predicate);
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
    this.#versionAfterLastWrite = this.#registration.registry.version;
    return this;
  }

  onDeactivation(fn: DeactivationHandler<Value>): this {
    refinableFields(this.#registered()).onDeactivation = fn;
    this.#registration.registry.touch();
    this.#versionAfterLastWrite = this.#registration.registry.version;
    return this;
  }

  id(): BindingIdentifier {
    return this.#registered().id;
  }

  // ── Registry ───────────────────────────────────────────────────────────────────────────────────────────────────────

  /**
   * Registers `binding`, first removing `previousId` when the chain is re-slotting.
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
      // A registry someone else wrote since this chain's last write invalidates the parked
      // snapshot: restoring it could undo an unbind or shadow a newer binding.
      if (registry.version !== this.#versionAfterLastWrite) {
        this.#displacedByChain = undefined;
      }
      if (registry.removeById(previousId) === undefined) {
        // The chain's binding is no longer live (unbound or displaced) — a refinement must not
        // resurrect it, so the chain goes inert against the registry.
        this.#displacedByChain = undefined;
        this.#versionAfterLastWrite = registry.version;
        return;
      }
    }
    const displaced = registry.add(registered);
    if (displaced !== undefined) {
      (this.#displacedByChain ??= []).push(displaced);
    }
    if (previousId !== undefined && this.#displacedByChain !== undefined) {
      this.#restoreNonConflicting(this.#displacedByChain);
    }
    if (moduleBindingIds !== undefined) {
      trackBindingForModule(moduleBindingIds, registered.id, previousId);
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
