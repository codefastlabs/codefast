import { InternalError } from "#/errors";
import type { RegistryKey } from "#/registry";
import type { Token, TokenValue } from "#/token";

declare const bindingIdentifierBrand: unique symbol;

/**
 * Stable, opaque identifier for a single binding entry inside the registry.
 */
export type BindingIdentifier = string & { readonly [bindingIdentifierBrand]: void };

/**
 * Allocates a new opaque binding identifier (used when `.id(...)` is not supplied).
 */
export function createBindingIdentifier(): BindingIdentifier {
  return globalThis.crypto.randomUUID() as BindingIdentifier;
}

/**
 * Runtime constructor token used as a registry key (no reflection metadata).
 */
export type Constructor<Value> = abstract new (...args: never[]) => Value;

/**
 * Lifetime strategy for a resolved instance.
 */
export type BindingScope = "singleton" | "transient" | "scoped";

/**
 * Hint for disambiguating multi-bindings registered against the same token or constructor.
 */
export type ResolveHint = {
  /** Matches bindings configured with `.whenNamed(name)`. */
  readonly name?: string;
  /** Matches bindings configured with `.whenTagged(tagKey, value)`. */
  readonly tag?: readonly [tag: string, value: unknown];
};

/**
 * Public alias for {@link ResolveHint} — the `hint` parameter accepted by
 * `Container.resolve`, `Container.resolveAsync`, and related methods.
 * Passes `name` and/or `tag` to select among multi-bindings.
 */
export type ResolveOptions = ResolveHint;

/**
 * Snapshot of a binding on the materialization stack (for {@link ConstraintContext}).
 */
export type ConstraintBindingKind =
  | "constant"
  | "class"
  | "dynamic"
  | "async-dynamic"
  | "resolved"
  | "alias";

/**
 * Snapshot of a single binding on the materialization stack during resolution.
 * Each frame captures enough identity to implement contextual constraints
 * ({@link whenParentIs}, {@link whenAnyAncestorIs}) and captive-dependency detection.
 */
export type ConstraintParentFrame = {
  /** Registry key (token/constructor) that selected this binding. */
  readonly registryKey: RegistryKey;
  /** Stable identifier of the materialized binding. */
  readonly bindingId: BindingIdentifier;
  /** Discriminant of the selected binding strategy. */
  readonly bindingKind: ConstraintBindingKind;
  /** Immutable tag map present on the selected binding. */
  readonly tags: ReadonlyMap<string, unknown>;
  /** Effective scope of the selected binding. */
  readonly scope: BindingScope;
};

/**
 * @alias {@link ConstraintParentFrame} — frame on the materialization stack during resolution.
 */
export type MaterializationFrame = ConstraintParentFrame;

/**
 * Context for {@link BindingBuilder.when} predicates: path, ancestor metadata, and the current resolve hint.
 */
export type ConstraintContext = {
  /** Resolution labels from root request to current key. */
  readonly resolutionPath: readonly string[];
  /** Full chain of materialized parent frames (oldest → newest). */
  readonly materializationStack: readonly ConstraintParentFrame[];
  /** Immediate parent frame, if the current resolution has one. */
  readonly parent: ConstraintParentFrame | undefined;
  /** Parent chain excluding the immediate parent frame. */
  readonly ancestors: readonly ConstraintParentFrame[];
  /** Name/tag hint used for the current lookup, if provided. */
  readonly currentResolveHint: ResolveHint | undefined;
};

/**
 * Context passed to factories and lifecycle hooks so nested dependencies resolve with the same path rules.
 *
 * `graph` exposes the current position in the dependency graph (resolution path, materialization
 * stack, parent/ancestor frames) — used by {@link BindingBuilder.when} predicates to implement
 * context-sensitive bindings such as `whenParentIs` or `whenAnyAncestorIs`.
 */
export type ResolutionContext = {
  /** Resolves one binding synchronously using current path/stack context. */
  readonly resolve: <Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ) => Value;
  /** Async variant of {@link ResolutionContext.resolve}. */
  readonly resolveAsync: <Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ) => Promise<Value>;
  /** Returns `undefined` when the requested root key is unbound. */
  readonly resolveOptional: <Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ) => Value | undefined;
  /** Resolves every binding registered for `token` (multi-binding). */
  readonly resolveAll: <Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ) => Value[];
  /** Async variant of {@link ResolutionContext.resolveAll}. */
  readonly resolveAllAsync: <Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ) => Promise<Value[]>;
  /**
   * Dependency-graph navigation context — path, materialization stack, parent/ancestor frames.
   */
  readonly graph: ConstraintContext;
};

/**
 * Lifecycle and constraint fields shared by every concrete {@link Binding} variant.
 * Separated from {@link BindingBase} so the builder can accumulate them independently of `id` / `scope`.
 */
type BindingLifecycle = {
  readonly bindingName?: string;
  readonly tags: ReadonlyMap<string, unknown>;
  readonly onActivation?: ActivationHandler<unknown>;
  readonly onDeactivation?: DeactivationHandler<unknown>;
  readonly constraint?: (ctx: ConstraintContext) => boolean;
};

/**
 * Called after an instance is constructed (and after `@postConstruct`).
 * The return value replaces the instance in the scope cache — use this to wrap with a proxy or
 * apply post-processing. May be async; async handlers require `resolveAsync`.
 */
export type ActivationHandler<Value> = (
  ctx: ResolutionContext,
  instance: Value,
) => Value | Promise<Value>;

/**
 * Called before a singleton/scoped instance is evicted from the scope cache.
 * Runs after `@preDestroy`. May be async; async deactivation requires `disposeAsync` / `unloadAsync`.
 */
export type DeactivationHandler<Value> = (instance: Value) => void | Promise<void>;

type BindingBase = BindingLifecycle & {
  readonly id: BindingIdentifier;
  readonly scope: BindingScope;
  /**
   * Set when the binding was registered from {@link Module} / {@link AsyncModule} setup.
   */
  readonly moduleId?: string;
};

/**
 * Binding backed by a pre-existing constant value; always singleton, no construction cost.
 */
export type ConstantBinding<Value> = BindingBase & {
  readonly kind: "constant";
  readonly value: Value;
};

/**
 * Binding that constructs `implementationClass` via the container's metadata-driven instantiation.
 */
export type ClassBinding<Value> = BindingBase & {
  readonly kind: "class";
  readonly implementationClass: Constructor<Value>;
};

/**
 * Binding backed by a synchronous factory that receives a {@link ResolutionContext}.
 */
export type DynamicBinding<Value> = BindingBase & {
  readonly kind: "dynamic";
  readonly factory: (ctx: ResolutionContext) => Value;
};

/**
 * Binding backed by an async factory; must be resolved via `resolveAsync` / `resolveAllAsync`.
 */
export type AsyncDynamicBinding<Value> = BindingBase & {
  readonly kind: "async-dynamic";
  readonly factory: (ctx: ResolutionContext) => Promise<Value>;
};

/**
 * Binding whose dependencies are declared statically and pre-resolved before the factory is called.
 */
export type ResolvedBinding<Value> = BindingBase & {
  readonly kind: "resolved";
  readonly dependencyTokens: readonly (Token<unknown> | Constructor<unknown>)[];
  readonly factory: (...args: unknown[]) => Value;
};

/**
 * Binding that forwards resolution to `targetToken`; the container resolves whatever is bound there.
 */
export type AliasBinding<Value> = BindingBase & {
  readonly kind: "alias";
  readonly targetToken: Token<Value>;
};

/**
 * Discriminated union of all binding strategies the container can resolve.
 */
export type Binding<Value> =
  | ConstantBinding<Value>
  | ClassBinding<Value>
  | DynamicBinding<Value>
  | AsyncDynamicBinding<Value>
  | ResolvedBinding<Value>
  | AliasBinding<Value>;

/**
 * Internal discriminated union tracking which `to*()` method has been called on a
 * {@link BindingBuilder}. Starts as `"unset"` and transitions exactly once.
 */
type Strategy<Value> =
  | { readonly type: "unset" }
  | { readonly type: "constant"; readonly value: Value }
  | { readonly type: "class"; readonly implementationClass: Constructor<Value> }
  | { readonly type: "dynamic"; readonly factory: (ctx: ResolutionContext) => Value }
  | {
      readonly type: "async-dynamic";
      readonly factory: (ctx: ResolutionContext) => Promise<Value>;
    }
  | {
      readonly type: "resolved";
      readonly factory: (...args: unknown[]) => Value;
      readonly dependencyTokens: readonly (Token<unknown> | Constructor<unknown>)[];
    }
  | { readonly type: "alias"; readonly targetToken: Token<Value> };

/**
 * Callbacks injected by the owning container to sync each builder mutation into the registry.
 * `register` fires once when the staged binding is committed; `update` fires on every
 * subsequent chain call after commit (`.singleton()`, `.onActivation()`, …).
 */
type RegistryCallbacks<Value> = {
  readonly register?: (binding: Binding<Value>) => void;
  readonly update?: (binding: Binding<Value>) => void;
  readonly onPending?: (builder: BindingBuilder<Value>) => void;
  readonly onCommitted?: (builder: BindingBuilder<Value>) => void;
};

const pendingBindingBuilders = new Set<BindingBuilder<unknown>>();

export function hasPendingBindingRegistrations(): boolean {
  return pendingBindingBuilders.size > 0;
}

export function flushPendingBindingRegistrations(): void {
  while (pendingBindingBuilders.size > 0) {
    const nextPendingBuilder = pendingBindingBuilders.values().next().value as
      | BindingBuilder<unknown>
      | undefined;
    if (nextPendingBuilder === undefined) {
      return;
    }
    nextPendingBuilder.flushPendingRegistration();
  }
}

/**
 * Fluent builder for registering a single binding against a {@link Token} or {@link Constructor}.
 *
 * A builder has two phases:
 * 1. **Strategy selection** — exactly one `to*()` call (`to`, `toSelf`, `toConstantValue`,
 *    `toDynamic`, `toDynamicAsync`, `toResolved`, `toAlias`) that determines how the value is produced.
 * 2. **Refinement chain** — optional calls to `singleton()`, `transient()`, `scoped()`,
 *    `onActivation()`, `onDeactivation()`, `whenNamed()`, `whenTagged()`, `when()`, and `id()`.
 *
 * Calling a second `to*()` method throws {@link InternalError}.
 *
 * The builder is created by {@link Container.bind} or by `bind` on {@link ModuleBuilder}.
 * The container injects {@link RegistryCallbacks}. Registration is staged and committed
 * automatically at the end of the current chain (microtask), then subsequent refinements
 * update the committed binding.
 */
export class BindingBuilder<Value> {
  /**
   * Current resolution strategy; starts as `"unset"` until a `to*()` method is called.
   */
  private strategy: Strategy<Value> = { type: "unset" };
  /**
   * Lifetime scope applied to the next binding snapshot; defaults to `"transient"`.
   */
  private scope: BindingScope = "transient";
  /**
   * True after an explicit `.singleton()` / `.transient()` / `.scoped()` call (prevents constant scope change).
   */
  private isScopeExplicit = false;
  /**
   * Pre-allocated binding ID set via `id(identifier)` before the first `to*()` call.
   */
  private explicitId: BindingIdentifier | undefined;
  /**
   * Resolve-hint name filter set by `.whenNamed()`.
   */
  private bindingName: string | undefined;
  /**
   * Tag filters accumulated by successive `.whenTagged()` calls.
   */
  private readonly tags = new Map<string, unknown>();
  /**
   * Custom constraint predicates accumulated by `.when()`; all must pass for this binding to be selected.
   */
  private readonly constraintPredicates: ((ctx: ConstraintContext) => boolean)[] = [];
  /**
   * Latest `onActivation` hook provided by `.onActivation(...)`.
   * Applied to emitted binding snapshots until replaced.
   */
  private onActivationHandler: ActivationHandler<unknown> | undefined;
  /**
   * Latest `onDeactivation` hook provided by `.onDeactivation(...)`.
   * Emitted only on builder variants that expose deactivation support.
   */
  private onDeactivationHandler: DeactivationHandler<unknown> | undefined;
  /**
   * Set when this binding was created inside a {@link Module} / {@link AsyncModule} setup callback.
   */
  private readonly moduleId: string | undefined;
  /** The committed snapshot in the registry; undefined until the first staged commit. */
  private committedBinding: Binding<Value> | undefined;
  /** Guards against scheduling duplicate microtask commits. */
  private isAutoCommitQueued = false;
  /** Ensures container pending accounting increments/decrements exactly once per staged register. */
  private hasPendingNotification = false;
  /**
   * Container-injected hooks that sync builder mutations into the live registry.
   */
  private readonly callbacks: RegistryCallbacks<Value>;

  constructor(
    protected readonly bindingKey: Token<Value> | Constructor<Value>,
    moduleId?: string,
    callbacks?: RegistryCallbacks<Value>,
  ) {
    this.moduleId = moduleId;
    this.callbacks = callbacks ?? {};
  }

  /**
   * Binds the token to a concrete implementation class; the container constructs it on demand.
   */
  to<C extends Constructor<Value>>(implementationClass: C): TransientBindingBuilder<Value> {
    this.registerWithStrategy({ type: "class", implementationClass });
    return this as unknown as TransientBindingBuilder<Value>;
  }

  /**
   * Binds the class key to itself — only valid when the key is a constructor.
   */
  toSelf(): TransientBindingBuilder<Value> {
    if (typeof this.bindingKey !== "function") {
      throw new InternalError(
        "toSelf() requires the binding key to be a constructor; use bind(SomeClass) or call to(Class) instead.",
      );
    }
    this.registerWithStrategy({ type: "class", implementationClass: this.bindingKey });
    return this as unknown as TransientBindingBuilder<Value>;
  }

  /**
   * Binds the token to a pre-existing value; always resolved as singleton, no construction.
   */
  toConstantValue<const ConcreteValue extends Value>(
    value: ConcreteValue,
  ): ConstantBindingBuilder<Value> {
    this.scope = "singleton";
    this.registerWithStrategy({ type: "constant", value });
    return this as unknown as ConstantBindingBuilder<Value>;
  }

  /**
   * Binds to a synchronous factory; `ctx` provides nested resolution within the same path.
   */
  toDynamic(factory: (ctx: ResolutionContext) => Value): TransientBindingBuilder<Value> {
    this.registerWithStrategy({ type: "dynamic", factory });
    return this as unknown as TransientBindingBuilder<Value>;
  }

  /**
   * Binds to an async factory; must be resolved via `resolveAsync` / `resolveAllAsync`.
   */
  toDynamicAsync(
    factory: (ctx: ResolutionContext) => Promise<Value>,
  ): TransientBindingBuilder<Value> {
    this.registerWithStrategy({ type: "async-dynamic", factory });
    return this as unknown as TransientBindingBuilder<Value>;
  }

  /**
   * Binds to a factory whose dependencies are declared explicitly in `deps` and pre-resolved by
   * the container before the factory is called — no `ResolutionContext` needed inside the factory.
   */
  toResolved<Deps extends readonly (Token<unknown> | Constructor<unknown>)[]>(
    factory: (...args: { [Index in keyof Deps]: TokenValue<Deps[Index]> }) => Value,
    deps: Deps,
  ): TransientBindingBuilder<Value> {
    this.registerWithStrategy({
      type: "resolved",
      factory: factory as unknown as (...args: unknown[]) => Value,
      dependencyTokens: deps,
    });
    return this as unknown as TransientBindingBuilder<Value>;
  }

  /**
   * Redirects resolution to `targetToken`; the container resolves whatever is bound there.
   */
  toAlias(targetToken: Token<Value>): TransientBindingBuilder<Value> {
    this.registerWithStrategy({ type: "alias", targetToken });
    return this as unknown as TransientBindingBuilder<Value>;
  }

  /**
   * One instance per container; supports `onDeactivation`.
   */
  singleton(): SingletonBindingBuilder<Value> {
    this.assertScopeMutable();
    this.scope = "singleton";
    this.isScopeExplicit = true;
    this.refreshRegisteredBinding();
    return this as unknown as SingletonBindingBuilder<Value>;
  }

  /**
   * New instance on every resolution (default scope).
   */
  transient(): TransientBindingBuilder<Value> {
    this.assertScopeMutable();
    this.scope = "transient";
    this.isScopeExplicit = true;
    this.refreshRegisteredBinding();
    return this as unknown as TransientBindingBuilder<Value>;
  }

  /**
   * One instance per child container scope.
   */
  scoped(): ScopedBindingBuilder<Value> {
    this.assertScopeMutable();
    this.scope = "scoped";
    this.isScopeExplicit = true;
    this.refreshRegisteredBinding();
    return this as unknown as ScopedBindingBuilder<Value>;
  }

  /**
   * Called with the resolved instance after construction; the return value replaces the instance.
   */
  onActivation(handler: ActivationHandler<Value>): this {
    this.onActivationHandler = handler as ActivationHandler<unknown>;
    this.refreshRegisteredBinding();
    return this;
  }

  /**
   * @internal Keep public for runtime correctness; hidden from transient/scoped builders via type aliases.
   */
  onDeactivation(handler: DeactivationHandler<Value>): this {
    this.onDeactivationHandler = handler as DeactivationHandler<unknown>;
    this.refreshRegisteredBinding();
    return this;
  }

  /**
   * This binding only resolves when the caller passes `{ name }` as the resolve hint.
   */
  whenNamed(name: string): this {
    this.bindingName = name;
    this.refreshRegisteredBinding();
    return this;
  }

  /**
   * This binding only resolves when the caller passes `{ tag: [tag, tagValue] }` as the resolve hint.
   */
  whenTagged(tag: string, tagValue: unknown): this {
    this.tags.set(tag, tagValue);
    this.refreshRegisteredBinding();
    return this;
  }

  /**
   * Adds a custom predicate; all predicates must pass for the binding to be selected.
   */
  when(constraint: (ctx: ConstraintContext) => boolean): this {
    this.constraintPredicates.push(constraint);
    this.refreshRegisteredBinding();
    return this;
  }

  /**
   * Returns the binding's stable ID, allocating one if needed.
   * Passing an `identifier` pre-sets the ID before a `to*()` call — useful when modules need to
   * reference a binding ID before it is registered.
   */
  id(): BindingIdentifier;
  id(identifier: BindingIdentifier): BindingIdentifier;
  id(identifier?: BindingIdentifier): BindingIdentifier {
    if (this.committedBinding !== undefined) {
      if (identifier !== undefined && identifier !== this.committedBinding.id) {
        throw new InternalError("Cannot change binding identifier after registration.");
      }
      return this.committedBinding.id;
    }
    if (identifier !== undefined) {
      this.explicitId = identifier;
      return this.explicitId;
    }
    this.explicitId = this.explicitId ?? createBindingIdentifier();
    return this.explicitId;
  }

  /**
   * Records the chosen strategy and emits the first {@link Binding} snapshot.
   * Throws {@link InternalError} if a strategy was already selected (double `to*()` call).
   */
  private registerWithStrategy(next: Exclude<Strategy<Value>, { type: "unset" }>): void {
    if (this.strategy.type !== "unset") {
      throw new InternalError(
        "A binding strategy was already selected; only one to*(...) chain is allowed per builder.",
      );
    }
    this.strategy = next;
    this.queueAutoCommit();
  }

  /**
   * Re-creates the {@link Binding} snapshot from the current builder state and pushes
   * the update to the registry. No-op if no strategy has been set yet.
   */
  private refreshRegisteredBinding(): void {
    if (this.strategy.type === "unset") {
      return;
    }
    if (this.committedBinding === undefined) {
      this.queueAutoCommit();
      return;
    }
    const updatedBinding = this.createBinding(this.committedBinding.id, this.strategy);
    this.committedBinding = updatedBinding;
    this.callbacks.update?.(updatedBinding);
  }

  private queueAutoCommit(): void {
    if (
      this.strategy.type === "unset" ||
      this.committedBinding !== undefined ||
      this.isAutoCommitQueued
    ) {
      return;
    }
    if (!this.hasPendingNotification) {
      this.hasPendingNotification = true;
      this.callbacks.onPending?.(this);
    }
    this.isAutoCommitQueued = true;
    pendingBindingBuilders.add(this as BindingBuilder<unknown>);
    queueMicrotask(() => {
      this.isAutoCommitQueued = false;
      this.flushPendingRegistration();
    });
  }

  flushPendingRegistration(): void {
    if (this.strategy.type === "unset" || this.committedBinding !== undefined) {
      pendingBindingBuilders.delete(this as BindingBuilder<unknown>);
      return;
    }
    const pendingBindingId = this.id();
    const pendingBinding = this.createBinding(pendingBindingId, this.strategy);
    this.committedBinding = pendingBinding;
    this.callbacks.register?.(pendingBinding);
    if (this.hasPendingNotification) {
      this.hasPendingNotification = false;
      this.callbacks.onCommitted?.(this);
    }
    pendingBindingBuilders.delete(this as BindingBuilder<unknown>);
  }

  /**
   * Guards against calling `.singleton()` / `.transient()` / `.scoped()` on a constant binding,
   * which is locked to `"singleton"` scope by invariant.
   */
  private assertScopeMutable(): void {
    if (this.strategy.type === "constant") {
      throw new InternalError(
        "Constant bindings are always singleton and do not support scope changes.",
      );
    }
  }

  /**
   * Produces an immutable {@link Binding} snapshot from the current builder fields.
   * Called by both {@link registerWithStrategy} and {@link refreshRegisteredBinding}.
   */
  private createBinding(
    id: BindingIdentifier,
    strategy: Exclude<Strategy<Value>, { type: "unset" }>,
  ): Binding<Value> {
    const constraint =
      this.constraintPredicates.length === 0
        ? undefined
        : (ctx: ConstraintContext) =>
            this.constraintPredicates.every((predicate) => predicate(ctx));
    const lifecycle: BindingLifecycle = {
      bindingName: this.bindingName,
      tags: new Map(this.tags),
      onActivation: this.onActivationHandler,
      onDeactivation: this.onDeactivationHandler,
      constraint,
    };
    const moduleFields =
      this.moduleId === undefined ? {} : ({ moduleId: this.moduleId } as { moduleId: string });

    switch (strategy.type) {
      case "constant":
        return {
          ...lifecycle,
          ...moduleFields,
          id,
          scope: "singleton",
          kind: "constant",
          value: strategy.value,
        };
      case "class":
        return {
          ...lifecycle,
          ...moduleFields,
          id,
          scope: this.scope,
          kind: "class",
          implementationClass: strategy.implementationClass,
        };
      case "dynamic":
        return {
          ...lifecycle,
          ...moduleFields,
          id,
          scope: this.scope,
          kind: "dynamic",
          factory: strategy.factory,
        };
      case "async-dynamic":
        return {
          ...lifecycle,
          ...moduleFields,
          id,
          scope: this.scope,
          kind: "async-dynamic",
          factory: strategy.factory,
        };
      case "resolved":
        return {
          ...lifecycle,
          ...moduleFields,
          id,
          scope: this.scope,
          kind: "resolved",
          dependencyTokens: strategy.dependencyTokens,
          factory: strategy.factory,
        };
      case "alias":
        return {
          ...lifecycle,
          ...moduleFields,
          id,
          scope: this.scope,
          kind: "alias",
          targetToken: strategy.targetToken,
        };
      default: {
        const exhaustiveCheck: never = strategy;
        return exhaustiveCheck;
      }
    }
  }
}

/**
 * Builder returned after calling `.singleton()` — exposes `onDeactivation`.
 */
export type SingletonBindingBuilder<Value> = BindingBuilder<Value>;

/**
 * Builder returned after calling `.transient()`, or any strategy method before a scope is set.
 * Does NOT expose `onDeactivation` at the type level.
 */
export type TransientBindingBuilder<Value> = Omit<BindingBuilder<Value>, "onDeactivation">;

/**
 * Builder returned after calling `.scoped()`.
 * Does NOT expose `onDeactivation` at the type level.
 */
export type ScopedBindingBuilder<Value> = Omit<BindingBuilder<Value>, "onDeactivation">;

/**
 * Builder returned after calling `.toConstantValue()`.
 */
export type ConstantBindingBuilder<Value> = Omit<
  SingletonBindingBuilder<Value>,
  "singleton" | "transient" | "scoped"
>;

/**
 * Starts a fluent binding for the given token or constructor key.
 */
export function bind<Value>(key: Token<Value>): BindingBuilder<Value>;
export function bind<Value>(key: Constructor<Value>): BindingBuilder<Value>;
export function bind<Value>(key: Token<Value> | Constructor<Value>): BindingBuilder<Value> {
  return new BindingBuilder<Value>(key, undefined);
}
