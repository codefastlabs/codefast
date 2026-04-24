import { InternalError } from "#/errors";
import type { RegistryKey } from "#/registry";
import type { Token, TokenValue } from "#/token";
declare const bindingIdentifierBrand: unique symbol;
export type BindingIdentifier = string & {
  readonly [bindingIdentifierBrand]: void;
};
export function createBindingIdentifier(): BindingIdentifier {
  return globalThis.crypto.randomUUID() as BindingIdentifier;
}
export type Constructor<Value> = abstract new (...args: never[]) => Value;
export type BindingScope = "singleton" | "transient" | "scoped";
export type ResolveHint = {
  readonly name?: string;
  readonly tag?: readonly [tag: string, value: unknown];
};
export type ResolveOptions = ResolveHint;
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
export type MaterializationFrame = ConstraintParentFrame;
export type ConstraintContext = {
  readonly resolutionPath: readonly string[];
  readonly materializationStack: readonly ConstraintParentFrame[];
  readonly parent: ConstraintParentFrame | undefined;
  readonly ancestors: readonly ConstraintParentFrame[];
  readonly currentResolveHint: ResolveHint | undefined;
};
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
  readonly resolveAll: <Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ) => Value[];
  readonly resolveAllAsync: <Value>(
    token: Token<Value> | Constructor<Value>,
    hint?: ResolveOptions,
  ) => Promise<Value[]>;
  readonly graph: ConstraintContext;
};
type BindingLifecycle = {
  readonly bindingName?: string;
  readonly tags: ReadonlyMap<string, unknown>;
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
  readonly moduleId?: string;
};
export type ConstantBinding<Value> = BindingBase & {
  readonly kind: "constant";
  readonly value: Value;
};
export type ClassBinding<Value> = BindingBase & {
  readonly kind: "class";
  readonly implementationClass: Constructor<Value>;
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
export type Binding<Value> =
  | ConstantBinding<Value>
  | ClassBinding<Value>
  | DynamicBinding<Value>
  | AsyncDynamicBinding<Value>
  | ResolvedBinding<Value>
  | AliasBinding<Value>;
type Strategy<Value> =
  | {
      readonly type: "unset";
    }
  | {
      readonly type: "constant";
      readonly value: Value;
    }
  | {
      readonly type: "class";
      readonly implementationClass: Constructor<Value>;
    }
  | {
      readonly type: "dynamic";
      readonly factory: (ctx: ResolutionContext) => Value;
    }
  | {
      readonly type: "async-dynamic";
      readonly factory: (ctx: ResolutionContext) => Promise<Value>;
    }
  | {
      readonly type: "resolved";
      readonly factory: (...args: unknown[]) => Value;
      readonly dependencyTokens: readonly (Token<unknown> | Constructor<unknown>)[];
    }
  | {
      readonly type: "alias";
      readonly targetToken: Token<Value>;
    };
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
  private committedBinding: Binding<Value> | undefined;
  private isAutoCommitQueued = false;
  private hasPendingNotification = false;
  private readonly callbacks: RegistryCallbacks<Value>;
  constructor(
    protected readonly bindingKey: Token<Value> | Constructor<Value>,
    moduleId?: string,
    callbacks?: RegistryCallbacks<Value>,
  ) {
    this.moduleId = moduleId;
    this.callbacks = callbacks ?? {};
  }
  to<C extends Constructor<Value>>(implementationClass: C): TransientBindingBuilder<Value> {
    this.registerWithStrategy({ type: "class", implementationClass });
    return this as unknown as TransientBindingBuilder<Value>;
  }
  toSelf(): TransientBindingBuilder<Value> {
    if (typeof this.bindingKey !== "function") {
      throw new InternalError(
        "toSelf() requires the binding key to be a constructor; use bind(SomeClass) or call to(Class) instead.",
      );
    }
    this.registerWithStrategy({ type: "class", implementationClass: this.bindingKey });
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
    factory: (
      ...args: {
        [Index in keyof Deps]: TokenValue<Deps[Index]>;
      }
    ) => Value,
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
  whenTagged(tag: string, tagValue: unknown): this {
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
  private registerWithStrategy(
    next: Exclude<
      Strategy<Value>,
      {
        type: "unset";
      }
    >,
  ): void {
    if (this.strategy.type !== "unset") {
      throw new InternalError(
        "A binding strategy was already selected; only one to*(...) chain is allowed per builder.",
      );
    }
    this.strategy = next;
    this.queueAutoCommit();
  }
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
  private assertScopeMutable(): void {
    if (this.strategy.type === "constant") {
      throw new InternalError(
        "Constant bindings are always singleton and do not support scope changes.",
      );
    }
  }
  private createBinding(
    id: BindingIdentifier,
    strategy: Exclude<
      Strategy<Value>,
      {
        type: "unset";
      }
    >,
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
      this.moduleId === undefined
        ? {}
        : ({ moduleId: this.moduleId } as {
            moduleId: string;
          });
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
export type SingletonBindingBuilder<Value> = BindingBuilder<Value>;
export type TransientBindingBuilder<Value> = Omit<BindingBuilder<Value>, "onDeactivation">;
export type ScopedBindingBuilder<Value> = Omit<BindingBuilder<Value>, "onDeactivation">;
export type ConstantBindingBuilder<Value> = Omit<
  SingletonBindingBuilder<Value>,
  "singleton" | "transient" | "scoped"
>;
export function bind<Value>(key: Token<Value>): BindingBuilder<Value>;
export function bind<Value>(key: Constructor<Value>): BindingBuilder<Value>;
export function bind<Value>(key: Token<Value> | Constructor<Value>): BindingBuilder<Value> {
  return new BindingBuilder<Value>(key, undefined);
}
