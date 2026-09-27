/**
 * The fluent chain's contract: the slot steps `bind()` offers before `to*()`, and the builder each `to*()` returns.
 */
import type { BindingTag } from "#core/tag";
import type { Token } from "#core/token";
import type {
  ActivationHandler,
  BindingConstraint,
  BindingIdentifier,
  Constructor,
  DeactivationHandler,
  ResolutionContext,
} from "#core/types";
import type { InjectableDependency, ResolvedDependencyValue } from "#injection/descriptor";

/**
 * The slot steps of the fluent chain, taken before `to*()` so the binding registers once, in its final shape.
 *
 * @since 0.3.16-canary.0
 */
export interface SlotConstrainedBuilder<Names extends string = string> {
  /** Narrows the binding to requests the predicate accepts, evaluated on every resolve. */
  when(predicate: BindingConstraint): this;
  /** Declares the binding's slot name, one of the names the token declares. */
  whenNamed(name: Names): this;
  /** Declares one criterion of the binding's slot, replacing any earlier criterion of the same key. */
  whenTagged(criterion: BindingTag): this;
  /** Keeps the binding on the default slot, the one an unconstrained request selects. */
  whenDefault(): this;
  /**
   * Makes the binding a collection member: one of several the token's `resolveAll` returns, never
   * what a single `resolve` selects, and outside slot last-wins. It keeps the default slot.
   */
  many(): this;
}

/**
 * The first step of the fluent chain: the slot, then the `to*` strategy that registers the binding.
 *
 * @since 0.3.16-canary.0
 */
export interface BindToBuilder<Value, Names extends string = string> extends SlotConstrainedBuilder<Names> {
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
 * The scope-selection step of the fluent chain, which the binding enters once registered.
 *
 * @since 0.3.16-canary.0
 */
export interface BindingBuilder<Value> {
  singleton(): SingletonBindingBuilder<Value>;
  transient(): TransientBindingBuilder<Value>;
  scoped(): ScopedBindingBuilder<Value>;
  /** The identifier this binding is registered under. */
  id(): BindingIdentifier;
}

/**
 * The fluent chain for a constant — lifecycle hooks only, since the scope is fixed.
 *
 * @since 0.3.16-canary.0
 */
export interface ConstantBindingBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): SingletonLifecycleBuilder<Value>;
  onDeactivation(fn: DeactivationHandler<Value>): SingletonLifecycleBuilder<Value>;
  /** The identifier this binding is registered under. */
  id(): BindingIdentifier;
}

/**
 * The fluent chain for an alias — nothing to add, since scoping belongs to the target.
 *
 * @since 0.3.16-canary.0
 */
export interface AliasBindingBuilder {
  /** The identifier this binding is registered under. */
  id(): BindingIdentifier;
}

/**
 * The fluent chain after `singleton()`, where both lifecycle hooks stay available.
 *
 * @since 0.3.16-canary.0
 */
export interface SingletonBindingBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): this;
  onDeactivation(fn: DeactivationHandler<Value>): this;
  id(): BindingIdentifier;
}

/**
 * The fluent chain after `transient()`, where activation is the one lifecycle hook offered.
 *
 * @since 0.3.16-canary.0
 */
export interface TransientBindingBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): this;
  id(): BindingIdentifier;
}

/**
 * The fluent chain after `scoped()`, sharing the `transient()` surface.
 *
 * @since 0.3.16-canary.0
 */
export interface ScopedBindingBuilder<Value> extends TransientBindingBuilder<Value> {}

/**
 * The fluent chain a constant enters once a lifecycle hook is added.
 *
 * @since 0.3.16-canary.0
 */
export interface SingletonLifecycleBuilder<Value> {
  onActivation(fn: ActivationHandler<Value>): this;
  onDeactivation(fn: DeactivationHandler<Value>): this;
  id(): BindingIdentifier;
}
