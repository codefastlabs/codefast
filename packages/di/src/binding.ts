import { InvalidBindingError } from "#lib/errors";
import type { RegistryKey } from "#lib/registry";
import type { Token } from "#lib/token";

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
  readonly tag?: string | symbol;
  readonly tagValue?: unknown;
};

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
  readonly resolve: <T>(key: Token<T> | Constructor<T>, hint?: ResolveHint) => T;
  readonly resolveAsync: <T>(key: Token<T> | Constructor<T>, hint?: ResolveHint) => Promise<T>;
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
) => void | Promise<void>;

export type DeactivationHandler<Value> = ActivationHandler<Value>;

type BindingBase = BindingLifecycle & {
  readonly id: BindingIdentifier;
  readonly scope: BindingScope;
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
  readonly dependencyTokens: readonly Token<unknown>[];
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
      readonly dependencyTokens: readonly Token<unknown>[];
    }
  | { readonly type: "alias"; readonly targetToken: Token<Value> };

/**
 * Fluent builder for a {@link Binding}. The registry only stores the product of {@link BindingBuilder.build}.
 */
export class BindingBuilder<Value> {
  private strategy: Strategy<Value> = { type: "unset" };
  private scope: BindingScope = "transient";
  private explicitId: BindingIdentifier | undefined;
  private bindingName: string | undefined;
  private readonly tags = new Map<string | symbol, unknown>();
  private readonly constraintPredicates: ((ctx: ConstraintContext) => boolean)[] = [];
  private onActivationHandler: ActivationHandler<unknown> | undefined;
  private onDeactivationHandler: DeactivationHandler<unknown> | undefined;

  constructor(protected readonly bindingKey: Token<Value> | Constructor<Value>) {}

  to<C extends Constructor<Value>>(ctor: C): BindingBuilder<Value> {
    this.assignStrategy({ type: "class", ctor });
    return this;
  }

  toSelf(): BindingBuilder<Value> {
    if (typeof this.bindingKey !== "function") {
      throw new InvalidBindingError(
        "toSelf() requires the binding key to be a constructor; use bind(SomeClass) or call to(Class) instead.",
      );
    }
    this.assignStrategy({ type: "class", ctor: this.bindingKey });
    return this;
  }

  toConstantValue<const ConcreteValue extends Value>(value: ConcreteValue): BindingBuilder<Value> {
    this.assignStrategy({ type: "constant", value });
    return this;
  }

  toDynamic(factory: (ctx: ResolutionContext) => Value): BindingBuilder<Value> {
    this.assignStrategy({ type: "dynamic", factory });
    return this;
  }

  toAsyncDynamic(factory: (ctx: ResolutionContext) => Promise<Value>): BindingBuilder<Value> {
    this.assignStrategy({ type: "async-dynamic", factory });
    return this;
  }

  toResolved<Deps extends readonly unknown[]>(
    factory: (...deps: Deps) => Value,
    dependencyTokens: { readonly [Index in keyof Deps]: Token<Deps[Index]> },
  ): BindingBuilder<Value> {
    this.assignStrategy({
      type: "resolved",
      factory: factory as unknown as (...args: unknown[]) => Value,
      dependencyTokens: dependencyTokens as unknown as readonly Token<unknown>[],
    });
    return this;
  }

  toAlias(targetToken: Token<Value>): BindingBuilder<Value> {
    this.assignStrategy({ type: "alias", targetToken });
    return this;
  }

  singleton(): BindingBuilder<Value> {
    this.scope = "singleton";
    return this;
  }

  transient(): BindingBuilder<Value> {
    this.scope = "transient";
    return this;
  }

  scoped(): BindingBuilder<Value> {
    this.scope = "scoped";
    return this;
  }

  onActivation(handler: ActivationHandler<Value>): BindingBuilder<Value> {
    this.onActivationHandler = handler as ActivationHandler<unknown>;
    return this;
  }

  onDeactivation(handler: DeactivationHandler<Value>): BindingBuilder<Value> {
    this.onDeactivationHandler = handler as DeactivationHandler<unknown>;
    return this;
  }

  whenNamed(name: string): BindingBuilder<Value> {
    this.bindingName = name;
    return this;
  }

  whenTagged(tag: string | symbol, tagValue: unknown): BindingBuilder<Value> {
    this.tags.set(tag, tagValue);
    return this;
  }

  when(constraint: (ctx: ConstraintContext) => boolean): BindingBuilder<Value> {
    this.constraintPredicates.push(constraint);
    return this;
  }

  id(): BindingBuilder<Value>;
  id(identifier: BindingIdentifier): BindingBuilder<Value>;
  id(identifier?: BindingIdentifier): BindingBuilder<Value> {
    if (identifier === undefined) {
      this.explicitId = this.explicitId ?? createBindingIdentifier();
    } else {
      this.explicitId = identifier;
    }
    return this;
  }

  build(): Binding<Value> {
    const strategy = this.strategy;
    if (strategy.type === "unset") {
      throw new InvalidBindingError(
        "Cannot build binding: no strategy was selected (call one of the to*(...) methods first).",
      );
    }

    const id = this.explicitId ?? createBindingIdentifier();
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

    switch (strategy.type) {
      case "constant":
        return {
          ...lifecycle,
          id,
          scope: this.scope,
          kind: "constant",
          value: strategy.value,
        };
      case "class":
        return {
          ...lifecycle,
          id,
          scope: this.scope,
          kind: "class",
          ctor: strategy.ctor,
        };
      case "dynamic":
        return {
          ...lifecycle,
          id,
          scope: this.scope,
          kind: "dynamic",
          factory: strategy.factory,
        };
      case "async-dynamic":
        return {
          ...lifecycle,
          id,
          scope: this.scope,
          kind: "async-dynamic",
          factory: strategy.factory,
        };
      case "resolved":
        return {
          ...lifecycle,
          id,
          scope: this.scope,
          kind: "resolved",
          dependencyTokens: strategy.dependencyTokens,
          factory: strategy.factory,
        };
      case "alias":
        return {
          ...lifecycle,
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

  private assignStrategy(next: Exclude<Strategy<Value>, { type: "unset" }>): void {
    if (this.strategy.type !== "unset") {
      throw new InvalidBindingError(
        "A binding strategy was already selected; only one to*(...) chain is allowed per builder.",
      );
    }
    this.strategy = next;
  }
}

/**
 * Starts a fluent binding for the given token or constructor key.
 */
export function bind<Value>(key: Token<Value>): BindingBuilder<Value>;
export function bind<Value>(key: Constructor<Value>): BindingBuilder<Value>;
export function bind<Value>(key: Token<Value> | Constructor<Value>): BindingBuilder<Value> {
  return new BindingBuilder<Value>(key);
}
