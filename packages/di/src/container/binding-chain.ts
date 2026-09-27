/**
 * The fluent chain `bind()` returns, which is also the binding it registers.
 *
 * @remarks One object plays every role: each builder step, the record the registry stores, and the
 * binding the resolver reads. The binding fields are declared first and in a fixed order, so every
 * binding in the process shares one hidden class; the return type of each step pins the chain's
 * order, slot before strategy, so the binding registers once and is never re-slotted.
 */
import type { Binding, BindingSlot } from "#core/binding";
import {
  clearBindingFrame,
  NO_ACTIVATION_STAMP,
  DEFAULT_BINDING_SLOT,
  generateBindingId,
  NO_INSTANCE,
  withSlotCriterion,
} from "#core/binding";
import type {
  AliasBindingBuilder,
  BindingBuilder,
  BindToBuilder,
  ConstantBindingBuilder,
  ScopedBindingBuilder,
  SingletonBindingBuilder,
  SingletonLifecycleBuilder,
  TransientBindingBuilder,
} from "#core/binding-builders";
import type { DeclaredBinding } from "#core/binding-declaration";
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
  /** Runs for a binding this registration displaces, deactivating it on the spot. */
  readonly deactivateDisplaced?: ((binding: Binding) => void) | undefined;
  /** Notes a displaced binding so the container can still tear it down, when nothing deactivates it on the spot. */
  readonly onDisplaced?: ((binding: Binding) => void) | undefined;
}

// ── BindingChain ─────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The one builder behind `bind()` and every `to*()` return type — and the binding it registers.
 *
 * @remarks The binding fields come first, in the order every binding shares, and the chain's own
 * bookkeeping follows as a private field. The slot steps write the fields before anything registers;
 * `to*()` fills the strategy in place and hands this object to the registry once, so a bind is one
 * allocation and one add. A scope or hook afterwards writes the registered object in place.
 *
 * @since 0.5.0-canary.8
 */
export class BindingChain<Value, Names extends string = string>
  implements
    AliasBindingBuilder,
    BindingBuilder<Value>,
    BindToBuilder<Value, Names>,
    ConstantBindingBuilder<Value>,
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
  rootContext: ResolutionContext | undefined = undefined;
  activationStamp: number = NO_ACTIVATION_STAMP;
  instance: unknown = NO_INSTANCE;
  scopedCacheKey: BindingIdentifier = this.identifier;
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
  readonly #registration: BindingRegistration;

  constructor(token: Token<Value, Names> | Constructor<Value>, registration: BindingRegistration) {
    this.token = token;
    this.#registration = registration;
  }

  /** This object as the registry and the resolver see it: the value type erased once, here. */
  get #binding(): Binding {
    return this as Binding;
  }

  /** Loud failure for a scope, a hook or `id()` before `to*()`. */
  #requireRegistered(): void {
    if (!this.#isRegistered) {
      throw new ChainNotRegisteredError(tokenName(this.token));
    }
  }

  /** Loud failure for a slot step or a second `to*()` once registered, raised before a field is overwritten. */
  #requireUnregistered(): void {
    if (this.#isRegistered) {
      throw new ChainAlreadyRegisteredError(tokenName(this.token));
    }
  }

  #register(kind: BindingKind, scope: BindingScope): this {
    this.kind = kind;
    this.scope = scope;
    this.#isRegistered = true;
    const registration = this.#registration;
    const displaced = registration.registry.add(this.#binding);
    if (displaced !== undefined) {
      if (registration.deactivateDisplaced !== undefined) {
        registration.deactivateDisplaced(displaced);
      } else {
        registration.onDisplaced?.(displaced);
      }
    }
    if (registration.moduleBindingIds !== undefined) {
      registration.moduleBindingIds.push(this.identifier);
    }
    return this;
  }

  /** Registers a declared module's bindings in list order, each a chain of its own, handled as `to*()` handles one. */
  static registerDeclared(declarations: ReadonlyArray<DeclaredBinding>, registration: BindingRegistration): void {
    const { registry, moduleBindingIds, deactivateDisplaced, onDisplaced } = registration;
    for (let index = 0; index < declarations.length; index += 1) {
      const declaration = declarations[index]!;
      const binding = BindingChain.#fromDeclaration(declaration, registration);
      const displaced = registry.add(binding);
      if (displaced !== undefined) {
        if (deactivateDisplaced === undefined) {
          onDisplaced?.(displaced);
        } else {
          deactivateDisplaced(displaced);
        }
      }
      moduleBindingIds?.push(binding.identifier);
    }
  }

  /**
   * A registered chain in the shape a declaration's steps would have left.
   *
   * @remarks Typed `unknown` like the declaration it copies, so the value type is never asserted here.
   */
  static #fromDeclaration(declaration: DeclaredBinding, registration: BindingRegistration): Binding {
    const chain = new BindingChain<unknown>(declaration.token, registration);
    chain.kind = declaration.kind;
    chain.slot = declaration.slot;
    chain.predicate = declaration.predicate;
    chain.isMany = declaration.isMany;
    chain.scope = declaration.scope;
    chain.target = declaration.target;
    chain.factory = declaration.factory;
    chain.deps = declaration.deps;
    chain.value = declaration.value;
    chain.activationHook = declaration.activationHook;
    chain.deactivationHook = declaration.deactivationHook;
    chain.#isRegistered = true;
    return chain.#binding;
  }

  // ── Registration ───────────────────────────────────────────────────────────────────────────────────────────────────

  to(type: Constructor<Value>): BindingBuilder<Value> {
    this.#requireUnregistered();
    this.target = type;
    return this.#register("class", "transient");
  }

  toSelf(): BindingBuilder<Value> {
    this.#requireUnregistered();
    if (typeof this.token !== "function") {
      throw new SelfBindingRequiresClassError(tokenName(this.token));
    }
    this.target = this.token;
    return this.#register("class", "transient");
  }

  toConstantValue(value: Value): ConstantBindingBuilder<Value> {
    this.#requireUnregistered();
    this.value = value;
    return this.#register("constant", "singleton");
  }

  toDynamic(factory: (ctx: ResolutionContext) => Value): BindingBuilder<Value> {
    this.#requireUnregistered();
    this.factory = factory;
    return this.#register("dynamic", "transient");
  }

  toDynamicAsync(factory: (ctx: ResolutionContext) => Promise<Value>): BindingBuilder<Value> {
    this.#requireUnregistered();
    this.factory = factory;
    return this.#register("dynamic-async", "transient");
  }

  toResolved<const Deps extends ReadonlyArray<InjectableDependency>>(
    factory: (...args: { [K in keyof Deps]: ResolvedDependencyValue<NoInfer<Deps>[K]> }) => Value,
    deps: Deps,
  ): BindingBuilder<Value> {
    this.#requireUnregistered();
    this.factory = factory;
    this.deps = deps.map((dependency) => normalizeToDescriptor(dependency));
    return this.#register("resolved", "transient");
  }

  toResolvedAsync<const Deps extends ReadonlyArray<InjectableDependency>>(
    factory: (...args: { [K in keyof Deps]: ResolvedDependencyValue<NoInfer<Deps>[K]> }) => Promise<Value>,
    deps: Deps,
  ): BindingBuilder<Value> {
    this.#requireUnregistered();
    this.factory = factory;
    this.deps = deps.map((dependency) => normalizeToDescriptor(dependency));
    return this.#register("resolved-async", "transient");
  }

  toAlias(target: Token<Value> | Constructor<Value>): AliasBindingBuilder {
    this.#requireUnregistered();
    this.target = target;
    return this.#register("alias", "transient");
  }

  // ── Slot ───────────────────────────────────────────────────────────────────────────────────────────────────────────

  // SPEC calls a candidate a binding that passes *all* of a chain's predicates, so a second `when()`
  // narrows rather than replaces.
  when(predicate: BindingConstraint): this {
    this.#requireUnregistered();
    const previous = this.predicate;
    // The composite carries both sides' requirements, so validate() still sees them.
    this.predicate =
      previous === undefined
        ? predicate
        : mergingConstraintRequirements((ctx) => previous(ctx) && predicate(ctx), previous, predicate);
    return this;
  }

  whenNamed(name: Names): this {
    return this.whenTagged(slotName.of(name));
  }

  whenTagged(criterion: BindingTag): this {
    this.#requireUnregistered();
    if (this.isMany) {
      throw new ManyBindingSlotError(tokenName(this.token));
    }
    this.slot = withSlotCriterion(this.slot, criterion);
    return this;
  }

  many(): this {
    this.#requireUnregistered();
    if (this.slot.tags.length !== 0) {
      throw new ManyBindingSlotError(tokenName(this.token));
    }
    this.isMany = true;
    return this;
  }

  whenDefault(): this {
    // The default slot is what a fresh chain already has; the check keeps it a slot step like the others.
    this.#requireUnregistered();
    return this;
  }

  // ── Scope and lifecycle ────────────────────────────────────────────────────────────────────────────────────────────

  #withScope(scope: BindingScope): this {
    this.#requireRegistered();
    // Nothing a cache, a frame or the version answers for depends on a scope that did not change.
    if (this.scope === scope) {
      return this;
    }
    // An instance cached under the old scope must not survive the change — a later flip back to that
    // scope would resurrect it. A child's scoped cache is out of reach here, so leaving `scoped` retires
    // the key every child filed its instance under.
    const registration = this.#registration;
    if (this.instance !== NO_INSTANCE) {
      registration.scope.deleteSingleton(this.#binding);
    }
    if (this.scope === "scoped") {
      registration.scope.deleteScoped(this.scopedCacheKey);
      this.scopedCacheKey = generateBindingId();
    }
    this.scope = scope;
    // The frame reports the scope, so a resolve before this call memoized the previous one.
    if (this.frame !== undefined || this.rootContext !== undefined) {
      clearBindingFrame(this.#binding);
    }
    registration.registry.touch();
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
    this.#registration.registry.touch();
    return this;
  }

  onDeactivation(fn: DeactivationHandler<Value>): this {
    this.#requireRegistered();
    this.deactivationHook = fn;
    this.#registration.registry.touch();
    return this;
  }

  id(): BindingIdentifier {
    this.#requireRegistered();
    return this.identifier;
  }
}
