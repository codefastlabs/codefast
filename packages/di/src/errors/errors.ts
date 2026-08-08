import type { BindingIdentifier, BindingScope, ResolveOptions } from "#/core/types";

/**
 * @since 0.3.16-canary.0
 */
export abstract class DiError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export class InternalError extends DiError {
  readonly code = "INTERNAL_ERROR";

  constructor(message: string) {
    super(message);
  }
}

/**
 * @since 0.3.16-canary.0
 */
export class TokenNotBoundError extends DiError {
  readonly code = "TOKEN_NOT_BOUND";
  readonly tokenName: string;

  constructor(tokenName: string) {
    super(`No binding found for token '${tokenName}'. Did you forget container.bind(${tokenName})?`);
    this.tokenName = tokenName;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export class NoMatchingBindingError extends DiError {
  readonly code = "NO_MATCHING_BINDING";
  readonly tokenName: string;
  readonly options: ResolveOptions;
  readonly availableSlots: Array<string>;

  constructor(tokenName: string, options: ResolveOptions, availableSlots: Array<string>) {
    const optionsString = JSON.stringify(options);
    const slotsStr = availableSlots.join(", ");
    super(`No binding for '${tokenName}' matching ${optionsString}. Available slots: [${slotsStr}].`);
    this.tokenName = tokenName;
    this.options = options;
    this.availableSlots = availableSlots;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export class AmbiguousBindingError extends DiError {
  readonly code = "AMBIGUOUS_BINDING";
  readonly tokenName: string;
  readonly candidateIds: ReadonlyArray<BindingIdentifier>;

  constructor(tokenName: string, candidateIds: ReadonlyArray<BindingIdentifier>) {
    super(
      `Multiple bindings for '${tokenName}' matched without a clear winner. Candidates: [${candidateIds.join(", ")}]. Ensure when() predicates are mutually exclusive.`,
    );
    this.tokenName = tokenName;
    this.candidateIds = candidateIds;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export class CircularDependencyError extends DiError {
  readonly code = "CIRCULAR_DEPENDENCY";
  readonly cycle: Array<string>;

  constructor(cycle: Array<string>) {
    super(`Circular dependency detected: ${cycle.join(" → ")}`);
    this.cycle = cycle;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export class AsyncResolutionError extends DiError {
  readonly code = "ASYNC_RESOLUTION";
  /** The token the caller asked for — what `resolveAsync` has to be called with. */
  readonly tokenName: string;
  /** The token whose factory is async: `tokenName` itself unless a dependency forced it. */
  readonly asyncSourceToken: string;

  constructor(tokenName: string, asyncSourceToken: string = tokenName) {
    super(
      asyncSourceToken === tokenName
        ? `Token '${tokenName}' requires async resolution because its factory is async. Use container.resolveAsync(${tokenName}).`
        : `Token '${tokenName}' requires async resolution because '${asyncSourceToken}' in its dependency chain has an async factory. Use container.resolveAsync(${tokenName}).`,
    );
    this.tokenName = tokenName;
    this.asyncSourceToken = asyncSourceToken;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export class AsyncDeactivationError extends DiError {
  readonly code = "ASYNC_DEACTIVATION";
  readonly tokenName: string;

  constructor(tokenName: string) {
    super(`Token '${tokenName}' has an async onDeactivation handler. Use unbindAsync() instead.`);
    this.tokenName = tokenName;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export interface ScopeViolationDetails {
  readonly consumerToken: string;
  readonly consumerScope: BindingScope;
  readonly dependencyToken: string;
  readonly dependencyScope: BindingScope;
  readonly path: Array<string>;
}

/**
 * @since 0.3.16-canary.0
 */
export class ScopeViolationError extends DiError {
  readonly code = "SCOPE_VIOLATION";
  readonly details: ScopeViolationDetails;

  constructor(details: ScopeViolationDetails) {
    super(
      `Scope violation: '${details.consumerToken}' (${details.consumerScope}) depends on '${details.dependencyToken}' (${details.dependencyScope}). Path: ${details.path.join(" → ")}`,
    );
    this.details = details;
  }
}

/**
 * A {@link MetadataReader} described a class with something the container cannot use.
 *
 * @remarks Separate from {@link MissingMetadataError}: absent metadata is a class the container was
 * never told about, while invalid metadata is a reader that answered wrongly. Covers both the
 * constructor answer and the lifecycle one, since only the `reason` differs.
 *
 * @since 0.6.0
 */
export class InvalidMetadataError extends DiError {
  readonly code = "INVALID_METADATA";
  readonly targetName: string;
  readonly reason: string;

  constructor(targetName: string, reason: string) {
    super(
      `MetadataReader returned invalid metadata for class '${targetName}': ${reason}. Check the reader bound to MetadataReaderToken or passed to Container.create().`,
    );
    this.targetName = targetName;
    this.reason = reason;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export class MissingMetadataError extends DiError {
  readonly code = "MISSING_METADATA";
  readonly targetName: string;

  constructor(targetName: string) {
    super(
      `Class '${targetName}' is missing @injectable() decorator. Add @injectable([...deps]) or use toDynamic()/toResolved() instead.`,
    );
    this.targetName = targetName;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export class AsyncModuleLoadError extends DiError {
  readonly code = "ASYNC_MODULE_LOAD";
  readonly moduleName: string;

  constructor(moduleName: string) {
    super(`Module '${moduleName}' is async. Use container.loadAsync() instead.`);
    this.moduleName = moduleName;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export class SyncDisposalNotSupportedError extends DiError {
  readonly code = "SYNC_DISPOSAL_NOT_SUPPORTED";

  constructor() {
    super(
      "Container cannot be disposed synchronously because onDeactivation handlers may be async. Use `await using` or call container.dispose() explicitly.",
    );
  }
}

/**
 * @since 0.3.16-canary.0
 */
export class MissingScopeContextError extends DiError {
  readonly code = "MISSING_SCOPE_CONTEXT";
  readonly tokenName: string;

  constructor(tokenName: string) {
    super(
      `Token '${tokenName}' is scoped but was resolved from a container without a child scope context. Use container.createChild() to create a scoped context.`,
    );
    this.tokenName = tokenName;
  }
}

/**
 * An `@inject` accessor initialized with no container context open.
 *
 * @remarks Carries the class and the accessor separately: a nameless class is possible (an anonymous
 * class expression has an empty `name`), and a message that claims a class it does not have is what
 * sent readers looking for a class called `clock`.
 *
 * @since 0.3.16-canary.0
 */
export class MissingContainerContextError extends DiError {
  readonly code = "MISSING_CONTAINER_CONTEXT";
  /** The class being constructed, or `undefined` when it has no readable name. */
  readonly className: string | undefined;
  readonly accessorName: string | symbol;

  constructor(className: string | undefined, accessorName: string | symbol) {
    const accessor = `@inject accessor '${String(accessorName)}'`;
    super(
      className === undefined
        ? `An ${accessor} was initialized outside a container context. Resolve its class through a container, or open a context with runWithContainer().`
        : `Class '${className}' has an ${accessor} but was constructed outside a container context. Resolve it via container.resolve(${className}), or open a context with runWithContainer().`,
    );
    this.className = className;
    this.accessorName = accessorName;
  }
}

/**
 * A fluent chain was refined before a `to*()` call gave it a binding to refine.
 *
 * @remarks The builder types make this unreachable from TypeScript — `bind()` returns
 * `BindToBuilder`, which exposes only `to*()`. It exists for JavaScript callers and for anyone who
 * casts past the types, so the misuse fails loudly instead of mutating nothing.
 *
 * @since 0.5.0-canary.8
 */
export class ChainNotRegisteredError extends DiError {
  readonly code = "CHAIN_NOT_REGISTERED";
  readonly tokenName: string;

  constructor(tokenName: string) {
    super(
      `Cannot refine the binding for token '${tokenName}' before choosing a target. Call a to*() method first — for example .to(SomeClass), .toConstantValue(value) or .toDynamic(factory).`,
    );
    this.tokenName = tokenName;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export class RebindUnboundTokenError extends DiError {
  readonly code = "REBIND_UNBOUND_TOKEN";
  readonly tokenName: string;

  constructor(tokenName: string) {
    super(
      `Cannot rebind token '${tokenName}' because it has no own binding in this container. Use container.bind(${tokenName}) to create a new binding instead.`,
    );
    this.tokenName = tokenName;
  }
}

/**
 * `toSelf()` on a token that is not a class, so there is nothing to construct.
 *
 * @since 0.5.0-canary.9
 */
export class SelfBindingRequiresClassError extends DiError {
  readonly code = "SELF_BINDING_REQUIRES_CLASS";
  readonly tokenName: string;

  constructor(tokenName: string) {
    super(
      `toSelf() needs the token to be the class it constructs, and '${tokenName}' is not a class. Use .to(SomeClass) to name the implementation, or bind the class itself with container.bind(SomeClass).toSelf().`,
    );
    this.tokenName = tokenName;
  }
}

/**
 * A decorator that acts on one instance was applied to a static member.
 *
 * @remarks Instance-only by construction: `@inject` resolves through the container active while an
 * instance is built, and `@postConstruct`/`@preDestroy` bracket one instance's lifecycle. A static
 * member belongs to the class, which no container constructs.
 *
 * @since 0.6.0
 */
export class StaticMemberDecoratorError extends DiError {
  readonly code = "STATIC_MEMBER_DECORATOR";
  readonly decoratorName: string;
  readonly memberName: string;

  constructor(decoratorName: string, memberName: string) {
    super(
      `@${decoratorName}() applies to instance members only, and '${memberName}' is static. Move it to an instance member, or read the value from the container where the static member is used.`,
    );
    this.decoratorName = decoratorName;
    this.memberName = memberName;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export class DisposedContainerError extends DiError {
  readonly code = "DISPOSED_CONTAINER";

  constructor() {
    super("Cannot perform operations on a disposed container.");
  }
}

/**
 * @since 0.3.16-canary.0
 */
export class AsyncActivationError extends DiError {
  readonly code = "ASYNC_ACTIVATION";
  readonly tokenName: string;
  readonly hookKind: "postConstruct" | "onActivation";
  readonly methodName: string | undefined;

  constructor(tokenName: string, hookKind: "postConstruct" | "onActivation", methodName?: string) {
    const detail =
      hookKind === "postConstruct"
        ? `@postConstruct method '${methodName ?? ""}' returned a Promise`
        : `onActivation for '${tokenName}' returned a Promise`;
    super(`${detail}. Use resolveAsync() instead.`);
    this.tokenName = tokenName;
    this.hookKind = hookKind;
    this.methodName = methodName;
  }
}
