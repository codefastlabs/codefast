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

/** Lifetime strategy for a resolved instance. */
export type BindingScope = "singleton" | "transient" | "scoped";

/**
 * Hint for disambiguating multi-bindings registered against the same token or constructor.
 */
export type ResolveHint = {
  readonly name?: string;
  readonly tag?: readonly [tag: string, value: unknown];
};

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

export type ConstraintParentFrame = {
  readonly registryKey: RegistryKey;
  readonly bindingId: BindingIdentifier;
  readonly bindingKind: ConstraintBindingKind;
  readonly tags: ReadonlyMap<string, unknown>;
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
  readonly resolutionPath: readonly string[];
  readonly materializationStack: readonly ConstraintParentFrame[];
  readonly parent: ConstraintParentFrame | undefined;
  readonly ancestors: readonly ConstraintParentFrame[];
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
  readonly resolve: <Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ) => Value;
  readonly resolveAsync: <Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ) => Promise<Value>;
  readonly resolveOptional: <Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ) => Value | undefined;
  /** Dependency-graph navigation context — path, materialization stack, parent/ancestor frames. */
  readonly graph: ConstraintContext;
};

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
  /** Set when the binding was registered from {@link Module} / {@link AsyncModule} setup. */
  readonly moduleId?: string;
};

/** Binding backed by a pre-existing constant value; always singleton, no construction cost. */
export type ConstantBinding<Value> = BindingBase & {
  readonly kind: "constant";
  readonly value: Value;
};

/** Binding that constructs `implementationClass` via the container's metadata-driven instantiation. */
export type ClassBinding<Value> = BindingBase & {
  readonly kind: "class";
  readonly implementationClass: Constructor<Value>;
};

/** Binding backed by a synchronous factory that receives a {@link ResolutionContext}. */
export type DynamicBinding<Value> = BindingBase & {
  readonly kind: "dynamic";
  readonly factory: (ctx: ResolutionContext) => Value;
};

/** Binding backed by an async factory; must be resolved via `resolveAsync` / `resolveAllAsync`. */
export type AsyncDynamicBinding<Value> = BindingBase & {
  readonly kind: "async-dynamic";
  readonly factory: (ctx: ResolutionContext) => Promise<Value>;
};

/** Binding whose dependencies are declared statically and pre-resolved before the factory is called. */
export type ResolvedBinding<Value> = BindingBase & {
  readonly kind: "resolved";
  readonly dependencyTokens: readonly (Token<unknown> | Constructor<unknown>)[];
  readonly factory: (...args: unknown[]) => Value;
};

/** Binding that forwards resolution to `targetToken`; the container resolves whatever is bound there. */
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
 * `register` fires once when a `to*(…)` strategy is selected; `update` fires on every
 * subsequent chain call (`.singleton()`, `.onActivation()`, …).
 */
type RegistryCallbacks<Value> = {
  readonly register?: (binding: Binding<Value>) => void;
  readonly update?: (binding: Binding<Value>) => void;
};

export class BindingBuilder<Value> {
  private strategy: Strategy<Value> = { type: "unset" };
  private scope: BindingScope = "transient";
  private isScopeExplicit = false;
  private explicitId: BindingIdentifier | undefined;
  private bindingName: string | undefined;
  private readonly tags = new Map<string, unknown>();
  private readonly constraintPredicates: ((ctx: ConstraintContext) => boolean)[] = [];
  private onActivationHandler: ActivationHandler<unknown> | undefined;
  private onDeactivationHandler: DeactivationHandler<unknown> | undefined;
  private readonly moduleId: string | undefined;
  private currentBinding: Binding<Value> | undefined;
  private readonly callbacks: RegistryCallbacks<Value>;

  constructor(
    protected readonly bindingKey: Token<Value> | Constructor<Value>,
    moduleId?: string,
    callbacks?: RegistryCallbacks<Value>,
  ) {
    this.moduleId = moduleId;
    this.callbacks = callbacks ?? {};
  }

  /** Binds the token to a concrete implementation class; the container constructs it on demand. */
  to<C extends Constructor<Value>>(implementationClass: C): TransientBindingBuilder<Value> {
    this.registerWithStrategy({ type: "class", implementationClass });
    return this as unknown as TransientBindingBuilder<Value>;
  }

  /** Binds the class key to itself — only valid when the key is a constructor. */
  toSelf(): TransientBindingBuilder<Value> {
    if (typeof this.bindingKey !== "function") {
      throw new InternalError(
        "toSelf() requires the binding key to be a constructor; use bind(SomeClass) or call to(Class) instead.",
      );
    }
    this.registerWithStrategy({ type: "class", implementationClass: this.bindingKey });
    return this as unknown as TransientBindingBuilder<Value>;
  }

  /** Binds the token to a pre-existing value; always resolved as singleton, no construction. */
  toConstantValue<const ConcreteValue extends Value>(
    value: ConcreteValue,
  ): ConstantBindingBuilder<Value> {
    this.scope = "singleton";
    this.registerWithStrategy({ type: "constant", value });
    return this as unknown as ConstantBindingBuilder<Value>;
  }

  /** Binds to a synchronous factory; `ctx` provides nested resolution within the same path. */
  toDynamic(factory: (ctx: ResolutionContext) => Value): TransientBindingBuilder<Value> {
    this.registerWithStrategy({ type: "dynamic", factory });
    return this as unknown as TransientBindingBuilder<Value>;
  }

  /** Binds to an async factory; must be resolved via `resolveAsync` / `resolveAllAsync`. */
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

  /** Redirects resolution to `targetToken`; the container resolves whatever is bound there. */
  toAlias(targetToken: Token<Value>): TransientBindingBuilder<Value> {
    this.registerWithStrategy({ type: "alias", targetToken });
    return this as unknown as TransientBindingBuilder<Value>;
  }

  /** One instance per container; supports `onDeactivation`. */
  singleton(): SingletonBindingBuilder<Value> {
    this.assertScopeMutable();
    this.scope = "singleton";
    this.isScopeExplicit = true;
    this.refreshRegisteredBinding();
    return this as unknown as SingletonBindingBuilder<Value>;
  }

  /** New instance on every resolution (default scope). */
  transient(): TransientBindingBuilder<Value> {
    this.assertScopeMutable();
    this.scope = "transient";
    this.isScopeExplicit = true;
    this.refreshRegisteredBinding();
    return this as unknown as TransientBindingBuilder<Value>;
  }

  /** One instance per child container scope. */
  scoped(): ScopedBindingBuilder<Value> {
    this.assertScopeMutable();
    this.scope = "scoped";
    this.isScopeExplicit = true;
    this.refreshRegisteredBinding();
    return this as unknown as ScopedBindingBuilder<Value>;
  }

  /** Called with the resolved instance after construction; the return value replaces the instance. */
  onActivation(handler: ActivationHandler<Value>): this {
    this.onActivationHandler = handler as ActivationHandler<unknown>;
    this.refreshRegisteredBinding();
    return this;
  }

  /** @internal Keep public for runtime correctness; hidden from transient/scoped builders via type aliases. */
  onDeactivation(handler: DeactivationHandler<Value>): this {
    this.onDeactivationHandler = handler as DeactivationHandler<unknown>;
    this.refreshRegisteredBinding();
    return this;
  }

  /** This binding only resolves when the caller passes `{ name }` as the resolve hint. */
  whenNamed(name: string): this {
    this.bindingName = name;
    this.refreshRegisteredBinding();
    return this;
  }

  /** This binding only resolves when the caller passes `{ tag: [tag, tagValue] }` as the resolve hint. */
  whenTagged(tag: string, tagValue: unknown): this {
    this.tags.set(tag, tagValue);
    this.refreshRegisteredBinding();
    return this;
  }

  /** Adds a custom predicate; all predicates must pass for the binding to be selected. */
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
    if (this.currentBinding !== undefined) {
      if (identifier !== undefined && identifier !== this.currentBinding.id) {
        throw new InternalError("Cannot change binding identifier after registration.");
      }
      return this.currentBinding.id;
    }
    if (identifier !== undefined) {
      this.explicitId = identifier;
      return this.explicitId;
    }
    this.explicitId = this.explicitId ?? createBindingIdentifier();
    return this.explicitId;
  }

  private registerWithStrategy(next: Exclude<Strategy<Value>, { type: "unset" }>): void {
    if (this.strategy.type !== "unset") {
      throw new InternalError(
        "A binding strategy was already selected; only one to*(...) chain is allowed per builder.",
      );
    }
    this.strategy = next;
    const bindingId = this.id();
    const binding = this.createBinding(bindingId, next);
    this.currentBinding = binding;
    this.callbacks.register?.(binding);
  }

  private refreshRegisteredBinding(): void {
    if (this.currentBinding === undefined || this.strategy.type === "unset") {
      return;
    }
    const next = this.createBinding(this.currentBinding.id, this.strategy);
    this.currentBinding = next;
    this.callbacks.update?.(next);
  }

  private assertScopeMutable(): void {
    if (this.strategy.type === "constant") {
      throw new InternalError(
        "Constant bindings are always singleton and do not support scope changes.",
      );
    }
  }

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
