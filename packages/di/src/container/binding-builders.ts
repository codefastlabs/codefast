/**
 * Fluent binding-builder chain behind `container.bind()` / `container.rebind()`.
 *
 * The chain registers once, on the `to*()` call, and every later refinement acts on that same
 * registered object — so a chain left half-finished is still a valid registration and a
 * completed one costs a single registry insertion. Refinements the indexes don't care about
 * (scope, activation hooks) are written in place; only `when*()` re-slots, which re-indexes
 * under the chain's original id.
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
import { createBinding, DEFAULT_BINDING_SLOT, refinableFields } from "#/binding";
import type { InjectableDependency, ResolvedDependencyValue } from "#/decorators/inject";
import { normalizeToDescriptor } from "#/decorators/inject";
import type { Token } from "#/token";
import type {
  ActivationHandler,
  BindingIdentifier,
  BindingScope,
  ConstraintContext,
  Constructor,
  DeactivationHandler,
  ResolutionContext,
} from "#/types";

/**
 * How a fluent chain reaches its container's registry.
 *
 * @since 0.5.0-canary.7
 */
export interface BindingCommitter {
  /** Register `binding`, first removing `previousId` when the chain is re-slotting. */
  commit(binding: Binding, previousId: BindingIdentifier | undefined): void;
  /** The chain wrote a field in place; nothing to re-index, but caches must invalidate. */
  refine(): void;
}

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

// ── BindingEntry ──────────────────────────────────────────────────────────────

/**
 * @since 0.5.0-canary.7
 */
export class BindingEntry<Value> implements BindToBuilder<Value> {
  readonly #token: Token<Value> | Constructor<Value>;
  readonly #committer: BindingCommitter;

  constructor(token: Token<Value> | Constructor<Value>, committer: BindingCommitter) {
    this.#token = token;
    this.#committer = committer;
  }

  #chain(partial: PartialBinding<Value>): BindingChain<Value> {
    return new BindingChain<Value>(this.#token, partial, this.#committer);
  }

  to(type: Constructor<Value>): BindingBuilder<Value> {
    return this.#chain({ kind: "class", target: type, scope: "transient" });
  }

  toSelf(): BindingBuilder<Value> {
    if (typeof this.#token !== "function") {
      throw new Error("toSelf() requires token to be a Constructor");
    }
    return this.#chain({ kind: "class", target: this.#token, scope: "transient" });
  }

  toConstantValue(value: Value): ConstantBindingBuilder<Value> {
    return this.#chain({ kind: "constant", scope: "singleton", value });
  }

  toDynamic(factory: (ctx: ResolutionContext) => Value): BindingBuilder<Value> {
    return this.#chain({ kind: "dynamic", factory, scope: "transient" });
  }

  toDynamicAsync(factory: (ctx: ResolutionContext) => Promise<Value>): BindingBuilder<Value> {
    return this.#chain({ kind: "dynamic-async", factory, scope: "transient" });
  }

  toResolved<const Deps extends ReadonlyArray<InjectableDependency>>(
    factory: (...args: { [K in keyof Deps]: ResolvedDependencyValue<NoInfer<Deps>[K]> }) => Value,
    deps: Deps,
  ): BindingBuilder<Value> {
    return this.#chain({
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
    return this.#chain({
      kind: "resolved-async",
      deps: deps.map((dependency) => normalizeToDescriptor(dependency)),
      factory: factory as (...args: Array<unknown>) => Promise<Value>,
      scope: "transient",
    });
  }

  toAlias(target: Token<Value> | Constructor<Value>): AliasBindingBuilder {
    return this.#chain({ kind: "alias", target });
  }
}

// ── BindingChain ──────────────────────────────────────────────────────────────

/**
 * The one builder behind every `to*()` return type. Each interface exposes only the calls that
 * are legal for that binding kind; the runtime object is shared because every refinement is the
 * same operation — narrow the registered binding, keep its id.
 */
class BindingChain<Value>
  implements
    AliasBindingBuilder,
    BindingBuilder<Value>,
    ConstantBindingBuilder<Value>,
    ScopedBindingBuilder<Value>,
    SingletonBindingBuilder<Value>,
    SingletonLifecycleBuilder<Value>,
    TransientBindingBuilder<Value>
{
  #binding: Binding<Value>;
  readonly #committer: BindingCommitter;

  constructor(token: Token<Value> | Constructor<Value>, partial: PartialBinding<Value>, committer: BindingCommitter) {
    this.#binding = createBinding(partial, token, DEFAULT_BINDING_SLOT, undefined);
    this.#committer = committer;
    committer.commit(this.#binding as Binding, undefined);
  }

  // Slot and predicate are what the registry indexes on, so a re-slot rebuilds the binding and
  // re-registers it — under the original id, keeping `id()` stable for the whole chain.
  #reslot(slot: BindingSlot, predicate: ((ctx: ConstraintContext) => boolean) | undefined): this {
    const previous = this.#binding;
    this.#binding = createBinding(previous, previous.token, slot, predicate, previous.id);
    this.#committer.commit(this.#binding as Binding, previous.id);
    return this;
  }

  #withScope(scope: BindingScope): this {
    refinableFields(this.#binding).scope = scope;
    this.#committer.refine();
    return this;
  }

  when(predicate: (ctx: ConstraintContext) => boolean): this {
    return this.#reslot(this.#binding.slot, predicate);
  }

  whenNamed(name: string): this {
    return this.#reslot({ ...this.#binding.slot, name }, this.#binding.predicate);
  }

  whenTagged(tag: string, value: unknown): this {
    return this.#reslot(updateSlotTag(this.#binding.slot, tag, value), this.#binding.predicate);
  }

  whenDefault(): this {
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
    refinableFields(this.#binding).onActivation = fn;
    this.#committer.refine();
    return this;
  }

  onDeactivation(fn: DeactivationHandler<Value>): this {
    refinableFields(this.#binding).onDeactivation = fn;
    this.#committer.refine();
    return this;
  }

  id(): BindingIdentifier {
    return this.#binding.id;
  }
}
