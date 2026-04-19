import { DiError } from "#/errors";
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
export type Constructor<T> = abstract new (...args: never[]) => T;

export type BindingScope = "singleton" | "transient" | "scoped";

/**
 * Hint for disambiguating multi-bindings registered against the same token or constructor.
 */
export type ResolveHint = {
  readonly name?: string;
  readonly tag?: readonly [tag: string | symbol, value: unknown];
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
  readonly tags: ReadonlyMap<string | symbol, unknown>;
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
 */
export type ResolutionContext = {
  readonly resolve: <Value>(
    token: Token<Value> | Constructor<Value>,
    opts?: ResolveOptions,
  ) => Value;
  readonly resolveAsync: <Value>(
    token: Token<Value> | Constructor<Value>,
    opts?: ResolveOptions,
  ) => Promise<Value>;
  readonly resolveOptional: <Value>(
    token: Token<Value> | Constructor<Value>,
    opts?: ResolveOptions,
  ) => Value | undefined;
  readonly constraint: ConstraintContext;
};

type BindingLifecycle = {
  readonly bindingName?: string;
  readonly tags: ReadonlyMap<string | symbol, unknown>;
  readonly onActivation?: ActivationHandler<unknown>;
  readonly onDeactivation?: DeactivationHandler<unknown>;
  readonly constraint?: (ctx: ConstraintContext) => boolean;
};

export type ActivationHandler<Value> = (
  ctx: ResolutionContext,
  instance: Value,
) => Value | Promise<Value>;

export type DeactivationHandler<Value> = (instance: Value) => void | Promise<void>;

type BindingBase = BindingLifecycle & {
  readonly id: BindingIdentifier;
  readonly scope: BindingScope;
  /** Set when the binding was registered from {@link Module} / {@link AsyncModule} setup. */
  readonly moduleId?: string;
};

export type ConstantBinding<Value> = BindingBase & {
  readonly kind: "constant";
  readonly value: Value;
};

export type ClassBinding<Value> = BindingBase & {
  readonly kind: "class";
  readonly ctor: Constructor<Value>;
};

export type DynamicBinding<Value> = BindingBase & {
  readonly kind: "dynamic";
  readonly factory: (ctx: ResolutionContext) => Value;
};

export type AsyncDynamicBinding<Value> = BindingBase & {
  readonly kind: "async-dynamic";
  readonly factory: (ctx: ResolutionContext) => Promise<Value>;
};

export type ResolvedBinding<Value> = BindingBase & {
  readonly kind: "resolved";
  readonly dependencyTokens: readonly (Token<unknown> | Constructor<unknown>)[];
  readonly factory: (...args: unknown[]) => Value;
};

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
  | { readonly type: "class"; readonly ctor: Constructor<Value> }
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

type BindingBuilderHooks<Value> = {
  readonly register?: (binding: Binding<Value>) => void;
  readonly update?: (binding: Binding<Value>) => void;
};

export class BindingBuilder<Value> {
  private strategy: Strategy<Value> = { type: "unset" };
  private scope: BindingScope = "transient";
  private isScopeExplicit = false;
  private explicitId: BindingIdentifier | undefined;
  private bindingName: string | undefined;
  private readonly tags = new Map<string | symbol, unknown>();
  private readonly constraintPredicates: ((ctx: ConstraintContext) => boolean)[] = [];
  private onActivationHandler: ActivationHandler<unknown> | undefined;
  private onDeactivationHandler: DeactivationHandler<unknown> | undefined;
  private readonly moduleId: string | undefined;
  private currentBinding: Binding<Value> | undefined;
  private readonly hooks: BindingBuilderHooks<Value>;

  constructor(
    protected readonly bindingKey: Token<Value> | Constructor<Value>,
    moduleId?: string,
    hooks?: BindingBuilderHooks<Value>,
  ) {
    this.moduleId = moduleId;
    this.hooks = hooks ?? {};
  }

  to<C extends Constructor<Value>>(ctor: C): TransientBindingBuilder<Value> {
    this.registerWithStrategy({ type: "class", ctor });
    return this as unknown as TransientBindingBuilder<Value>;
  }

  toSelf(): TransientBindingBuilder<Value> {
    if (typeof this.bindingKey !== "function") {
      throw new DiError(
        "toSelf() requires the binding key to be a constructor; use bind(SomeClass) or call to(Class) instead.",
      );
    }
    this.registerWithStrategy({ type: "class", ctor: this.bindingKey });
    return this as unknown as TransientBindingBuilder<Value>;
  }

  toConstantValue<const ConcreteValue extends Value>(
    value: ConcreteValue,
  ): ConstantBindingBuilder<Value> {
    this.scope = "singleton";
    this.registerWithStrategy({ type: "constant", value });
    return this as unknown as ConstantBindingBuilder<Value>;
  }

  toDynamic(factory: (ctx: ResolutionContext) => Value): TransientBindingBuilder<Value> {
    this.registerWithStrategy({ type: "dynamic", factory });
    return this as unknown as TransientBindingBuilder<Value>;
  }

  toDynamicAsync(
    factory: (ctx: ResolutionContext) => Promise<Value>,
  ): TransientBindingBuilder<Value> {
    this.registerWithStrategy({ type: "async-dynamic", factory });
    return this as unknown as TransientBindingBuilder<Value>;
  }

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

  toAlias(targetToken: Token<Value>): TransientBindingBuilder<Value> {
    this.registerWithStrategy({ type: "alias", targetToken });
    return this as unknown as TransientBindingBuilder<Value>;
  }

  singleton(): SingletonBindingBuilder<Value> {
    this.assertScopeMutable();
    this.scope = "singleton";
    this.isScopeExplicit = true;
    this.refreshRegisteredBinding();
    return this as unknown as SingletonBindingBuilder<Value>;
  }

  transient(): TransientBindingBuilder<Value> {
    this.assertScopeMutable();
    this.scope = "transient";
    this.isScopeExplicit = true;
    this.refreshRegisteredBinding();
    return this as unknown as TransientBindingBuilder<Value>;
  }

  scoped(): ScopedBindingBuilder<Value> {
    this.assertScopeMutable();
    this.scope = "scoped";
    this.isScopeExplicit = true;
    this.refreshRegisteredBinding();
    return this as unknown as ScopedBindingBuilder<Value>;
  }

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

  whenNamed(name: string): this {
    this.bindingName = name;
    this.refreshRegisteredBinding();
    return this;
  }

  whenTagged(tag: string | symbol, tagValue: unknown): this {
    this.tags.set(tag, tagValue);
    this.refreshRegisteredBinding();
    return this;
  }

  when(constraint: (ctx: ConstraintContext) => boolean): this {
    this.constraintPredicates.push(constraint);
    this.refreshRegisteredBinding();
    return this;
  }

  id(): BindingIdentifier;
  id(identifier: BindingIdentifier): BindingIdentifier;
  id(identifier?: BindingIdentifier): BindingIdentifier {
    if (this.currentBinding !== undefined) {
      if (identifier !== undefined && identifier !== this.currentBinding.id) {
        throw new DiError("Cannot change binding identifier after registration.");
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
      throw new DiError(
        "A binding strategy was already selected; only one to*(...) chain is allowed per builder.",
      );
    }
    this.strategy = next;
    const bindingId = this.id();
    const binding = this.createBinding(bindingId, next);
    this.currentBinding = binding;
    this.hooks.register?.(binding);
  }

  private refreshRegisteredBinding(): void {
    if (this.currentBinding === undefined || this.strategy.type === "unset") {
      return;
    }
    const next = this.createBinding(this.currentBinding.id, this.strategy);
    this.currentBinding = next;
    this.hooks.update?.(next);
  }

  private assertScopeMutable(): void {
    if (this.strategy.type === "constant") {
      throw new DiError("Constant bindings are always singleton and do not support scope changes.");
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
          ctor: strategy.ctor,
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
