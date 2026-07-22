/**
 * Fluent binding-builder chain behind `container.bind()` / `container.rebind()`.
 *
 * Every builder commits eagerly on construction and re-commits (replacing the
 * previous binding by id) whenever a later fluent call refines the binding —
 * so a chain left half-finished is still a valid registration.
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
import { DEFAULT_BINDING_SLOT, generateBindingId } from "#/binding";
import { normalizeToDescriptor } from "#/decorators/inject";
import type { Token } from "#/token";
import type {
  ActivationHandler,
  BindingIdentifier,
  ConstraintContext,
  Constructor,
  DeactivationHandler,
  DependencyKey,
  ResolutionContext,
  TokenValue,
} from "#/types";

// ── Shared builder helpers ────────────────────────────────────────────────────

export type CommitFn = <Value>(binding: Binding<Value>, previousId?: BindingIdentifier) => BindingIdentifier;

// Builder payloads that still accept a scope — alias/constant bindings never flow through ConstraintBuilder/ScopeBuilder.
type ScopedPartialBinding<Value> = Exclude<PartialBinding<Value>, { kind: "alias" } | { kind: "constant" }>;

function updateSlotTag(slot: BindingSlot, tag: string, value: unknown): BindingSlot {
  const existing = [...slot.tags];
  const idx = existing.findIndex(([k]) => k === tag);
  if (idx !== -1) {
    existing[idx] = [tag, value];
  } else {
    existing.push([tag, value]);
  }
  return { ...slot, tags: existing };
}

// ── SlotBuilder ───────────────────────────────────────────────────────────────

abstract class SlotBuilder {
  protected slot: BindingSlot = DEFAULT_BINDING_SLOT; // ✓ T3-1: no redundant spread
  protected predicate: ((ctx: ConstraintContext) => boolean) | undefined;
  protected committedId: BindingIdentifier | undefined;

  protected abstract commit(): void;

  when(predicate: (ctx: ConstraintContext) => boolean): this {
    this.predicate = predicate;
    this.commit();
    return this;
  }

  whenNamed(name: string): this {
    this.slot = { ...this.slot, name };
    this.commit();
    return this;
  }

  whenTagged(tag: string, value: unknown): this {
    this.slot = updateSlotTag(this.slot, tag, value);
    this.commit();
    return this;
  }

  whenDefault(): this {
    return this;
  }

  id(): BindingIdentifier {
    return this.committedId!;
  }
}

// ── BindingEntry ──────────────────────────────────────────────────────────────

export class BindingEntry<Value> implements BindToBuilder<Value> {
  readonly #token: Token<Value> | Constructor<Value>;
  readonly #commitBinding: CommitFn;

  constructor(token: Token<Value> | Constructor<Value>, commitBinding: CommitFn) {
    this.#token = token;
    this.#commitBinding = commitBinding;
  }

  to(type: Constructor<Value>): BindingBuilder<Value> {
    return new ConstraintBuilder<Value>(
      this.#token,
      { kind: "class", target: type, scope: "transient" },
      this.#commitBinding,
    );
  }

  toSelf(): BindingBuilder<Value> {
    if (typeof this.#token !== "function") {
      throw new Error("toSelf() requires token to be a Constructor");
    }
    return new ConstraintBuilder<Value>(
      this.#token,
      { kind: "class", target: this.#token, scope: "transient" },
      this.#commitBinding,
    );
  }

  toConstantValue(value: Value): ConstantBindingBuilder<Value> {
    return new ConstantBuilder<Value>(this.#token, value, this.#commitBinding);
  }

  toDynamic(factory: (ctx: ResolutionContext) => Value): BindingBuilder<Value> {
    return new ConstraintBuilder<Value>(
      this.#token,
      { kind: "dynamic", factory, scope: "transient" },
      this.#commitBinding,
    );
  }

  toDynamicAsync(factory: (ctx: ResolutionContext) => Promise<Value>): BindingBuilder<Value> {
    return new ConstraintBuilder<Value>(
      this.#token,
      { kind: "dynamic-async", factory, scope: "transient" },
      this.#commitBinding,
    );
  }

  toResolved<const Deps extends ReadonlyArray<DependencyKey>>(
    factory: (...args: { [K in keyof Deps]: TokenValue<NoInfer<Deps>[K]> }) => Value,
    deps: Deps,
  ): BindingBuilder<Value> {
    const normalizedDeps = deps.map((dependency) => normalizeToDescriptor(dependency));
    return new ConstraintBuilder<Value>(
      this.#token,
      {
        kind: "resolved",
        factory: factory as (...args: Array<unknown>) => Value,
        deps: normalizedDeps,
        scope: "transient",
      },
      this.#commitBinding,
    );
  }

  toResolvedAsync<const Deps extends ReadonlyArray<DependencyKey>>(
    factory: (...args: { [K in keyof Deps]: TokenValue<NoInfer<Deps>[K]> }) => Promise<Value>,
    deps: Deps,
  ): BindingBuilder<Value> {
    const normalizedDeps = deps.map((dependency) => normalizeToDescriptor(dependency));
    return new ConstraintBuilder<Value>(
      this.#token,
      {
        kind: "resolved-async",
        factory: factory as (...args: Array<unknown>) => Promise<Value>,
        deps: normalizedDeps,
        scope: "transient",
      },
      this.#commitBinding,
    );
  }

  toAlias(target: Token<Value> | Constructor<Value>): AliasBindingBuilder {
    return new AliasBuilder<Value>(this.#token, target, this.#commitBinding);
  }
}

// ── ConstraintBuilder ─────────────────────────────────────────────────────────

class ConstraintBuilder<Value> extends SlotBuilder implements BindingBuilder<Value> {
  readonly #token: Token<Value> | Constructor<Value>;
  readonly #partial: ScopedPartialBinding<Value>;
  readonly #commitBinding: CommitFn;

  constructor(token: Token<Value> | Constructor<Value>, partial: ScopedPartialBinding<Value>, commitBinding: CommitFn) {
    super();
    this.#token = token;
    this.#partial = partial;
    this.#commitBinding = commitBinding;
    this.commit();
  }

  protected commit(): void {
    const previousId = this.committedId;
    const binding: Binding<Value> = {
      ...this.#partial,
      id: generateBindingId(),
      token: this.#token,
      slot: this.slot,
      predicate: this.predicate,
    };
    this.committedId = this.#commitBinding(binding, previousId);
  }

  singleton(): SingletonBindingBuilder<Value> {
    const previousId = this.committedId;
    this.committedId = undefined;
    return new ScopeBuilder<Value>(
      this.#token,
      { ...this.#partial, scope: "singleton" },
      this.slot,
      this.predicate,
      this.#commitBinding,
      previousId,
    );
  }

  transient(): TransientBindingBuilder<Value> {
    const previousId = this.committedId;
    this.committedId = undefined;
    return new ScopeBuilder<Value>(
      this.#token,
      { ...this.#partial, scope: "transient" },
      this.slot,
      this.predicate,
      this.#commitBinding,
      previousId,
    );
  }

  scoped(): ScopedBindingBuilder<Value> {
    const previousId = this.committedId;
    this.committedId = undefined;
    return new ScopeBuilder<Value>(
      this.#token,
      { ...this.#partial, scope: "scoped" },
      this.slot,
      this.predicate,
      this.#commitBinding,
      previousId,
    );
  }
}

// ── ScopeBuilder ─────────────────────────────────────────────────────────────

class ScopeBuilder<Value> implements SingletonBindingBuilder<Value>, TransientBindingBuilder<Value> {
  #onActivation: ActivationHandler<Value> | undefined;
  #onDeactivation: DeactivationHandler<Value> | undefined;
  #committedId: BindingIdentifier | undefined;

  readonly #token: Token<Value> | Constructor<Value>;
  readonly #partial: ScopedPartialBinding<Value>;
  readonly #slot: BindingSlot;
  readonly #predicate: ((ctx: ConstraintContext) => boolean) | undefined;
  readonly #commitBinding: CommitFn;
  readonly #initialPreviousId: BindingIdentifier | undefined;

  constructor(
    token: Token<Value> | Constructor<Value>,
    partial: ScopedPartialBinding<Value>,
    slot: BindingSlot,
    predicate: ((ctx: ConstraintContext) => boolean) | undefined,
    commitBinding: CommitFn,
    initialPreviousId?: BindingIdentifier,
  ) {
    this.#token = token;
    this.#partial = partial;
    this.#slot = slot;
    this.#predicate = predicate;
    this.#commitBinding = commitBinding;
    this.#initialPreviousId = initialPreviousId;
    this.#commit();
  }

  #commit(): void {
    const previousId = this.#committedId ?? this.#initialPreviousId;
    const binding: Binding<Value> = {
      ...this.#partial,
      id: generateBindingId(),
      token: this.#token,
      slot: this.#slot,
      predicate: this.#predicate,
      onActivation: this.#onActivation,
      onDeactivation: this.#onDeactivation,
    };
    this.#committedId = this.#commitBinding(binding, previousId);
  }

  onActivation(fn: ActivationHandler<Value>): this {
    this.#onActivation = fn;
    this.#commit();
    return this;
  }

  onDeactivation(fn: DeactivationHandler<Value>): this {
    this.#onDeactivation = fn;
    this.#commit();
    return this;
  }

  id(): BindingIdentifier {
    return this.#committedId!;
  }
}

// ── ConstantBuilder ───────────────────────────────────────────────────────────

class ConstantBuilder<Value>
  extends SlotBuilder
  implements ConstantBindingBuilder<Value>, SingletonLifecycleBuilder<Value>
{
  #onActivation: ActivationHandler<Value> | undefined;
  #onDeactivation: DeactivationHandler<Value> | undefined;

  readonly #token: Token<Value> | Constructor<Value>;
  readonly #value: Value;
  readonly #commitBinding: CommitFn;

  constructor(token: Token<Value> | Constructor<Value>, value: Value, commitBinding: CommitFn) {
    super();
    this.#token = token;
    this.#value = value;
    this.#commitBinding = commitBinding;
    this.commit();
  }

  protected commit(): void {
    const previousId = this.committedId;
    const binding: Binding<Value> = {
      kind: "constant",
      id: generateBindingId(),
      token: this.#token,
      slot: this.slot,
      predicate: this.predicate,
      value: this.#value,
      scope: "singleton",
      onActivation: this.#onActivation,
      onDeactivation: this.#onDeactivation,
    };
    this.committedId = this.#commitBinding(binding, previousId);
  }

  onActivation(fn: ActivationHandler<Value>): this {
    this.#onActivation = fn;
    this.commit();
    return this;
  }

  onDeactivation(fn: DeactivationHandler<Value>): this {
    this.#onDeactivation = fn;
    this.commit();
    return this;
  }
}

// ── AliasBuilder ──────────────────────────────────────────────────────────────

class AliasBuilder<Value> extends SlotBuilder implements AliasBindingBuilder {
  readonly #token: Token<Value> | Constructor<Value>;
  readonly #target: Token<Value> | Constructor<Value>;
  readonly #commitBinding: CommitFn;

  constructor(
    token: Token<Value> | Constructor<Value>,
    target: Token<Value> | Constructor<Value>,
    commitBinding: CommitFn,
  ) {
    super();
    this.#token = token;
    this.#target = target;
    this.#commitBinding = commitBinding;
    this.commit();
  }

  protected commit(): void {
    const previousId = this.committedId;
    const binding: Binding<Value> = {
      kind: "alias",
      id: generateBindingId(),
      token: this.#token,
      slot: this.slot,
      predicate: this.predicate,
      target: this.#target,
    };
    this.committedId = this.#commitBinding(binding, previousId);
  }
}
