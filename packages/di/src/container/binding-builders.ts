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
  protected _slot: BindingSlot = DEFAULT_BINDING_SLOT; // ✓ T3-1: no redundant spread
  protected _predicate: ((ctx: ConstraintContext) => boolean) | undefined;
  protected _committed: BindingIdentifier | undefined;

  protected abstract _doCommit(): void;

  when(predicate: (ctx: ConstraintContext) => boolean): this {
    this._predicate = predicate;
    this._doCommit();
    return this;
  }

  whenNamed(name: string): this {
    this._slot = { ...this._slot, name };
    this._doCommit();
    return this;
  }

  whenTagged(tag: string, value: unknown): this {
    this._slot = updateSlotTag(this._slot, tag, value);
    this._doCommit();
    return this;
  }

  whenDefault(): this {
    return this;
  }

  id(): BindingIdentifier {
    return this._committed!;
  }
}

// ── BindingEntry ──────────────────────────────────────────────────────────────

export class BindingEntry<Value> implements BindToBuilder<Value> {
  readonly #token: Token<Value> | Constructor<Value>;
  readonly #commit: CommitFn;

  constructor(token: Token<Value> | Constructor<Value>, commit: CommitFn) {
    this.#token = token;
    this.#commit = commit;
  }

  to(type: Constructor<Value>): BindingBuilder<Value> {
    return new ConstraintBuilder<Value>(this.#token, { kind: "class", target: type, scope: "transient" }, this.#commit);
  }

  toSelf(): BindingBuilder<Value> {
    if (typeof this.#token !== "function") {
      throw new Error("toSelf() requires token to be a Constructor");
    }
    return new ConstraintBuilder<Value>(
      this.#token,
      { kind: "class", target: this.#token, scope: "transient" },
      this.#commit,
    );
  }

  toConstantValue(value: Value): ConstantBindingBuilder<Value> {
    return new ConstantBuilder<Value>(this.#token, value, this.#commit);
  }

  toDynamic(factory: (ctx: ResolutionContext) => Value): BindingBuilder<Value> {
    return new ConstraintBuilder<Value>(this.#token, { kind: "dynamic", factory, scope: "transient" }, this.#commit);
  }

  toDynamicAsync(factory: (ctx: ResolutionContext) => Promise<Value>): BindingBuilder<Value> {
    return new ConstraintBuilder<Value>(
      this.#token,
      { kind: "dynamic-async", factory, scope: "transient" },
      this.#commit,
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
      this.#commit,
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
      this.#commit,
    );
  }

  toAlias(target: Token<Value> | Constructor<Value>): AliasBindingBuilder {
    return new AliasBuilder<Value>(this.#token, target, this.#commit);
  }
}

// ── ConstraintBuilder ─────────────────────────────────────────────────────────

class ConstraintBuilder<Value> extends SlotBuilder implements BindingBuilder<Value> {
  readonly #token: Token<Value> | Constructor<Value>;
  readonly #partial: ScopedPartialBinding<Value>;
  readonly #commit: CommitFn;

  constructor(token: Token<Value> | Constructor<Value>, partial: ScopedPartialBinding<Value>, commit: CommitFn) {
    super();
    this.#token = token;
    this.#partial = partial;
    this.#commit = commit;
    this._doCommit();
  }

  protected _doCommit(): void {
    const previousId = this._committed;
    const binding: Binding<Value> = {
      ...this.#partial,
      id: generateBindingId(),
      token: this.#token,
      slot: this._slot,
      predicate: this._predicate,
    };
    this._committed = this.#commit(binding, previousId);
  }

  singleton(): SingletonBindingBuilder<Value> {
    const previousId = this._committed;
    this._committed = undefined;
    return new ScopeBuilder<Value>(
      this.#token,
      { ...this.#partial, scope: "singleton" },
      this._slot,
      this._predicate,
      this.#commit,
      previousId,
    );
  }

  transient(): TransientBindingBuilder<Value> {
    const previousId = this._committed;
    this._committed = undefined;
    return new ScopeBuilder<Value>(
      this.#token,
      { ...this.#partial, scope: "transient" },
      this._slot,
      this._predicate,
      this.#commit,
      previousId,
    );
  }

  scoped(): ScopedBindingBuilder<Value> {
    const previousId = this._committed;
    this._committed = undefined;
    return new ScopeBuilder<Value>(
      this.#token,
      { ...this.#partial, scope: "scoped" },
      this._slot,
      this._predicate,
      this.#commit,
      previousId,
    );
  }
}

// ── ScopeBuilder ─────────────────────────────────────────────────────────────

class ScopeBuilder<Value> implements SingletonBindingBuilder<Value>, TransientBindingBuilder<Value> {
  #onActivation: ActivationHandler<Value> | undefined;
  #onDeactivation: DeactivationHandler<Value> | undefined;
  #committed: BindingIdentifier | undefined;

  readonly #token: Token<Value> | Constructor<Value>;
  readonly #partial: ScopedPartialBinding<Value>;
  readonly #slot: BindingSlot;
  readonly #predicate: ((ctx: ConstraintContext) => boolean) | undefined;
  readonly #commit: CommitFn;
  readonly #initialPreviousId: BindingIdentifier | undefined;

  constructor(
    token: Token<Value> | Constructor<Value>,
    partial: ScopedPartialBinding<Value>,
    slot: BindingSlot,
    predicate: ((ctx: ConstraintContext) => boolean) | undefined,
    commit: CommitFn,
    initialPreviousId?: BindingIdentifier,
  ) {
    this.#token = token;
    this.#partial = partial;
    this.#slot = slot;
    this.#predicate = predicate;
    this.#commit = commit;
    this.#initialPreviousId = initialPreviousId;
    this.#doCommit();
  }

  #doCommit(): void {
    const previousId = this.#committed ?? this.#initialPreviousId;
    const binding: Binding<Value> = {
      ...this.#partial,
      id: generateBindingId(),
      token: this.#token,
      slot: this.#slot,
      predicate: this.#predicate,
      onActivation: this.#onActivation,
      onDeactivation: this.#onDeactivation,
    };
    this.#committed = this.#commit(binding, previousId);
  }

  onActivation(fn: ActivationHandler<Value>): this {
    this.#onActivation = fn;
    this.#doCommit();
    return this;
  }

  onDeactivation(fn: DeactivationHandler<Value>): this {
    this.#onDeactivation = fn;
    this.#doCommit();
    return this;
  }

  id(): BindingIdentifier {
    return this.#committed!;
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
  readonly #commit: CommitFn;

  constructor(token: Token<Value> | Constructor<Value>, value: Value, commit: CommitFn) {
    super();
    this.#token = token;
    this.#value = value;
    this.#commit = commit;
    this._doCommit();
  }

  protected _doCommit(): void {
    const previousId = this._committed;
    const binding: Binding<Value> = {
      kind: "constant",
      id: generateBindingId(),
      token: this.#token,
      slot: this._slot,
      predicate: this._predicate,
      value: this.#value,
      scope: "singleton",
      onActivation: this.#onActivation,
      onDeactivation: this.#onDeactivation,
    };
    this._committed = this.#commit(binding, previousId);
  }

  onActivation(fn: ActivationHandler<Value>): this {
    this.#onActivation = fn;
    this._doCommit();
    return this;
  }

  onDeactivation(fn: DeactivationHandler<Value>): this {
    this.#onDeactivation = fn;
    this._doCommit();
    return this;
  }
}

// ── AliasBuilder ──────────────────────────────────────────────────────────────

class AliasBuilder<Value> extends SlotBuilder implements AliasBindingBuilder {
  readonly #token: Token<Value> | Constructor<Value>;
  readonly #target: Token<Value> | Constructor<Value>;
  readonly #commit: CommitFn;

  constructor(token: Token<Value> | Constructor<Value>, target: Token<Value> | Constructor<Value>, commit: CommitFn) {
    super();
    this.#token = token;
    this.#target = target;
    this.#commit = commit;
    this._doCommit();
  }

  protected _doCommit(): void {
    const previousId = this._committed;
    const binding: Binding<Value> = {
      kind: "alias",
      id: generateBindingId(),
      token: this.#token,
      slot: this._slot,
      predicate: this._predicate,
      target: this.#target,
    };
    this._committed = this.#commit(binding, previousId);
  }
}
