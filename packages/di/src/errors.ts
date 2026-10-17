import type { ConstraintRequirement } from "#core/constraint-requirement";
import type { BindingIdentifier, BindingScope, ResolveOptions } from "#core/types";
import * as messages from "#error-messages";

/**
 * Base class for every error the library throws, each carrying a machine-readable `code`.
 *
 * @since 0.3.16-canary.0
 */
export abstract class DiError extends Error {
  abstract readonly code: string;
  // Each subclass names itself with a literal: a constructor lookup per throw is what a
  // polymorphic read across every error class costs, on top of the stack capture every error pays.
  abstract override readonly name: string;
}

/**
 * An internal assertion failure — a library bug, never caller misuse.
 *
 * @since 0.3.16-canary.0
 */
export class InternalError extends DiError {
  override readonly name = "InternalError";
  readonly code = "INTERNAL_ERROR";

  constructor(message: string) {
    super(message);
  }
}

/**
 * A token with no binding at all, even after walking the parent container chain.
 *
 * @since 0.3.16-canary.0
 */
export class TokenNotBoundError extends DiError {
  override readonly name = "TokenNotBoundError";
  readonly code = "TOKEN_NOT_BOUND";
  readonly tokenName: string;
  /** The token names from the outermost request down to the unbound one, which is last. */
  readonly path: ReadonlyArray<string>;

  constructor(tokenName: string, path: ReadonlyArray<string> = [tokenName]) {
    super(messages.tokenNotBound(tokenName, path));
    this.tokenName = tokenName;
    this.path = path;
  }
}

/**
 * A token that has bindings, none of whose slots match the given `ResolveOptions`.
 *
 * @since 0.3.16-canary.0
 */
export class NoMatchingBindingError extends DiError {
  override readonly name = "NoMatchingBindingError";
  readonly code = "NO_MATCHING_BINDING";
  readonly tokenName: string;
  readonly options: ResolveOptions;
  readonly availableSlots: Array<string>;
  /** The token names from the outermost request down to the unmatched one, which is last. */
  readonly path: ReadonlyArray<string>;

  constructor(
    tokenName: string,
    options: ResolveOptions,
    availableSlots: Array<string>,
    path: ReadonlyArray<string> = [tokenName],
  ) {
    super(messages.noMatchingBinding(tokenName, options, availableSlots, path));
    this.tokenName = tokenName;
    this.options = options;
    this.availableSlots = availableSlots;
    this.path = path;
  }
}

/**
 * Two or more candidate bindings that matched without the more-specific rule deciding a winner.
 *
 * @since 0.3.16-canary.0
 */
export class AmbiguousBindingError extends DiError {
  override readonly name = "AmbiguousBindingError";
  readonly code = "AMBIGUOUS_BINDING";
  readonly tokenName: string;
  readonly candidateIds: ReadonlyArray<BindingIdentifier>;

  constructor(tokenName: string, candidateIds: ReadonlyArray<BindingIdentifier>) {
    super(messages.ambiguousBinding(tokenName, candidateIds));
    this.tokenName = tokenName;
    this.candidateIds = candidateIds;
  }
}

/**
 * A dependency cycle detected along the resolution path, alias chains included.
 *
 * @since 0.3.16-canary.0
 */
export class CircularDependencyError extends DiError {
  override readonly name = "CircularDependencyError";
  readonly code = "CIRCULAR_DEPENDENCY";
  readonly cycle: Array<string>;

  constructor(cycle: Array<string>) {
    super(messages.circularDependency(cycle));
    this.cycle = cycle;
  }
}

/**
 * A sync `resolve()` of a token whose factory — or a dependency's factory — is async.
 *
 * @since 0.3.16-canary.0
 */
export class AsyncResolutionError extends DiError {
  override readonly name = "AsyncResolutionError";
  readonly code = "ASYNC_RESOLUTION";
  /** The token the caller asked for — what `resolveAsync` has to be called with. */
  readonly tokenName: string;
  /** The token whose factory is async: `tokenName` itself unless a dependency forced it. */
  readonly asyncSourceToken: string;

  constructor(tokenName: string, asyncSourceToken: string = tokenName) {
    super(messages.asyncResolution(tokenName, asyncSourceToken));
    this.tokenName = tokenName;
    this.asyncSourceToken = asyncSourceToken;
  }
}

/**
 * A sync `unbind()` of a binding whose `onDeactivation` handler is async.
 *
 * @since 0.3.16-canary.0
 */
export class AsyncDeactivationError extends DiError {
  override readonly name = "AsyncDeactivationError";
  readonly code = "ASYNC_DEACTIVATION";
  readonly tokenName: string;

  constructor(tokenName: string) {
    super(messages.asyncDeactivation(tokenName));
    this.tokenName = tokenName;
  }
}

/**
 * The tokens, scopes, and resolution path describing a captive-dependency violation.
 *
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
 * A captive dependency — a longer-lived binding depending on a shorter-lived one.
 *
 * @since 0.3.16-canary.0
 */
export class ScopeViolationError extends DiError {
  override readonly name = "ScopeViolationError";
  readonly code = "SCOPE_VIOLATION";
  readonly details: ScopeViolationDetails;

  constructor(details: ScopeViolationDetails) {
    super(
      messages.scopeViolation(
        details.consumerToken,
        details.consumerScope,
        details.dependencyToken,
        details.dependencyScope,
        details.path,
      ),
    );
    this.details = details;
  }
}

/**
 * A `…TaggedAll` constraint built from a criteria list with nothing in it.
 *
 * @remarks Reported where the list is passed rather than where it fails to match, because it does
 * not fail to match — "carries all of no criteria" holds for any ancestor, so the constraint quietly
 * becomes a weaker one that still outranks an unconstrained binding.
 *
 * @since 0.6.0
 */
export class EmptyTagCriteriaError extends DiError {
  override readonly name = "EmptyTagCriteriaError";
  readonly code = "EMPTY_TAG_CRITERIA";
  readonly helperName: string;

  constructor(helperName: string) {
    super(messages.emptyTagCriteria(helperName));
    this.helperName = helperName;
  }
}

/**
 * A constraint waiting on a slot name that nothing in the container chain declares.
 *
 * @remarks A name is a bare string, so a typo produces a constraint that is never satisfied and
 * never reported. Reported by `validate()` rather than at bind time, because the binding carrying
 * the name may be registered after the constraint is built.
 *
 * @since 0.6.0
 */
export class UnreachableConstraintError extends DiError {
  override readonly name = "UnreachableConstraintError";
  readonly code = "UNREACHABLE_CONSTRAINT";
  readonly tokenName: string;
  readonly requiredName: string;
  /** The token the name was required on, or `undefined` when the constraint named no token. */
  readonly requiredTokenName: string | undefined;
  readonly helperName: string;

  constructor(tokenName: string, requirement: ConstraintRequirement) {
    const { name, helperName, tokenName: requiredTokenName } = requirement;
    super(messages.unreachableConstraint(tokenName, requirement));
    this.tokenName = tokenName;
    this.requiredName = name;
    this.requiredTokenName = requiredTokenName;
    this.helperName = helperName;
  }
}

/**
 * A container-level lifecycle hook whose token nothing is bound to, so it can never run.
 *
 * @remarks Hooks are keyed by token identity, which makes a class that is only ever a `to()` target
 * look like a token and match nothing. Reported by `validate()` rather than at registration, because
 * binding after registering the hook is a supported order.
 *
 * @since 0.6.0
 */
export class UnreachableLifecycleHookError extends DiError {
  override readonly name = "UnreachableLifecycleHookError";
  readonly code = "UNREACHABLE_LIFECYCLE_HOOK";
  readonly tokenName: string;
  readonly phase: "onActivation" | "onDeactivation";
  /** Nothing binds the token, or — for a deactivation hook — every binding it has is transient. */
  readonly reason: "unbound" | "no-deactivatable-binding";

  constructor(
    tokenName: string,
    phase: "onActivation" | "onDeactivation",
    reason: "unbound" | "no-deactivatable-binding" = "unbound",
  ) {
    super(messages.unreachableLifecycleHook(tokenName, phase, reason));
    this.tokenName = tokenName;
    this.phase = phase;
    this.reason = reason;
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
  override readonly name = "InvalidMetadataError";
  readonly code = "INVALID_METADATA";
  readonly targetName: string;
  readonly reason: string;

  constructor(targetName: string, reason: string) {
    super(messages.invalidMetadata(targetName, reason));
    this.targetName = targetName;
    this.reason = reason;
  }
}

/**
 * A class the container must construct but that carries no `@injectable()` metadata.
 *
 * @since 0.3.16-canary.0
 */
export class MissingMetadataError extends DiError {
  override readonly name = "MissingMetadataError";
  readonly code = "MISSING_METADATA";
  readonly targetName: string;

  constructor(targetName: string, inheritedFrom?: { readonly baseName: string; readonly dependencyCount: number }) {
    super(messages.missingMetadata(targetName, inheritedFrom));
    this.targetName = targetName;
  }
}

/**
 * A sync `load()` given a module that needs async setup.
 *
 * @since 0.3.16-canary.0
 */
export class AsyncModuleLoadError extends DiError {
  override readonly name = "AsyncModuleLoadError";
  readonly code = "ASYNC_MODULE_LOAD";
  readonly moduleName: string;

  constructor(moduleName: string) {
    super(messages.asyncModuleLoad(moduleName));
    this.moduleName = moduleName;
  }
}

/**
 * A `scoped` binding resolved from a container with no child scope context.
 *
 * @since 0.3.16-canary.0
 */
export class MissingScopeContextError extends DiError {
  override readonly name = "MissingScopeContextError";
  readonly code = "MISSING_SCOPE_CONTEXT";
  readonly tokenName: string;

  constructor(tokenName: string) {
    super(messages.missingScopeContext(tokenName));
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
  override readonly name = "MissingContainerContextError";
  readonly code = "MISSING_CONTAINER_CONTEXT";
  /** The class being constructed, or `undefined` when it has no readable name. */
  readonly className: string | undefined;
  readonly accessorName: string | symbol;

  constructor(className: string | undefined, accessorName: string | symbol) {
    super(messages.missingContainerContext(className, accessorName));
    this.className = className;
    this.accessorName = accessorName;
  }
}

/**
 * A slot step or a second `to*()` on a chain that already registered its binding.
 *
 * @remarks A chain is its binding and registers exactly once, in its final shape, so its slot is
 * settled by `to*()`; a token bound twice is two `bind()` calls, the second of which displaces the
 * first under slot last-wins.
 *
 * @since 0.10.0
 */
export class ChainAlreadyRegisteredError extends DiError {
  override readonly name = "ChainAlreadyRegisteredError";
  readonly code = "CHAIN_ALREADY_REGISTERED";
  readonly tokenName: string;

  constructor(tokenName: string) {
    super(messages.chainAlreadyRegistered(tokenName));
    this.tokenName = tokenName;
  }
}

/**
 * `many()` on a binding with a named or tagged slot, or a slot constraint on a collection member.
 *
 * @remarks A collection member keeps the default slot: its membership replaces slot last-wins, and a
 * tagged member would have no index able to return every member of the tag.
 *
 * @since 0.10.0
 */
export class ManyBindingSlotError extends DiError {
  override readonly name = "ManyBindingSlotError";
  readonly code = "MANY_BINDING_SLOT";
  readonly tokenName: string;

  constructor(tokenName: string) {
    super(messages.manyBindingSlot(tokenName));
    this.tokenName = tokenName;
  }
}

/**
 * A scope, a lifecycle hook or `id()` asked of a fluent chain before a `to*()` call registered its binding.
 *
 * @remarks The builder types make this unreachable from TypeScript — `bind()` returns
 * `BindToBuilder`, which exposes only the slot steps and `to*()`. It exists for JavaScript callers and
 * for anyone who casts past the types, so the misuse fails loudly instead of mutating nothing.
 *
 * @since 0.10.0
 */
export class ChainNotRegisteredError extends DiError {
  override readonly name = "ChainNotRegisteredError";
  readonly code = "CHAIN_NOT_REGISTERED";
  readonly tokenName: string;

  constructor(tokenName: string) {
    super(messages.chainNotRegistered(tokenName));
    this.tokenName = tokenName;
  }
}

/**
 * A `rebind()` of a token that has no own binding in this container.
 *
 * @since 0.3.16-canary.0
 */
export class RebindUnboundTokenError extends DiError {
  override readonly name = "RebindUnboundTokenError";
  readonly code = "REBIND_UNBOUND_TOKEN";
  readonly tokenName: string;

  constructor(tokenName: string) {
    super(messages.rebindUnboundToken(tokenName));
    this.tokenName = tokenName;
  }
}

/**
 * `toSelf()` on a token that is not a class, so there is nothing to construct.
 *
 * @since 0.5.0-canary.9
 */
export class SelfBindingRequiresClassError extends DiError {
  override readonly name = "SelfBindingRequiresClassError";
  readonly code = "SELF_BINDING_REQUIRES_CLASS";
  readonly tokenName: string;

  constructor(tokenName: string) {
    super(messages.selfBindingRequiresClass(tokenName));
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
  override readonly name = "StaticMemberDecoratorError";
  readonly code = "STATIC_MEMBER_DECORATOR";
  readonly decoratorName: string;
  readonly memberName: string;

  constructor(decoratorName: string, memberName: string) {
    super(messages.staticMemberDecorator(decoratorName, memberName));
    this.decoratorName = decoratorName;
    this.memberName = memberName;
  }
}

/**
 * A `@postConstruct` or `@preDestroy` on a method whose key is a symbol, which the lifecycle reader cannot name.
 *
 * @remarks Reported at decoration rather than at resolve, so the error points at the declaration
 * instead of a `MetadataReader` the caller never configured.
 *
 * @since 0.11.0
 */
export class SymbolKeyedLifecycleError extends DiError {
  override readonly name = "SymbolKeyedLifecycleError";
  readonly code = "SYMBOL_KEYED_LIFECYCLE";
  readonly decoratorName: string;
  readonly memberName: string;

  constructor(decoratorName: string, memberName: string) {
    super(messages.symbolKeyedLifecycle(decoratorName, memberName));
    this.decoratorName = decoratorName;
    this.memberName = memberName;
  }
}

/**
 * A `@postConstruct` or `@preDestroy` on a private method, which the lifecycle reader cannot call by name.
 *
 * @remarks Reported at decoration rather than at resolve, so the error points at the declaration
 * instead of a `MetadataReader` the caller never configured.
 *
 * @since 0.13.0
 */
export class PrivateLifecycleMethodError extends DiError {
  override readonly name = "PrivateLifecycleMethodError";
  readonly code = "PRIVATE_LIFECYCLE_METHOD";
  readonly decoratorName: string;
  readonly memberName: string;

  constructor(decoratorName: string, memberName: string) {
    super(messages.privateLifecycleMethod(decoratorName, memberName));
    this.decoratorName = decoratorName;
    this.memberName = memberName;
  }
}

/**
 * A decorator handed no metadata object, because the runtime has no `Symbol.metadata` to key one by.
 *
 * @remarks TypeScript compiles `context.metadata` to `undefined` when `Symbol.metadata` is missing, so
 * the fix is installing it before any decorated class is defined — the key this library reads.
 *
 * @since 0.11.0
 */
export class MissingDecoratorMetadataError extends DiError {
  override readonly name = "MissingDecoratorMetadataError";
  readonly code = "MISSING_DECORATOR_METADATA";
  readonly decoratorName: string;

  constructor(decoratorName: string) {
    super(messages.missingDecoratorMetadata(decoratorName));
    this.decoratorName = decoratorName;
  }
}

/**
 * A `binding()` definition no chain could spell: no strategy, several, or a key its strategy does not allow.
 *
 * @remarks Raised where the declaration is written, for callers the compiler cannot reach, so a
 * declared module that was built can always be loaded.
 *
 * @since 0.11.0
 */
export class InvalidBindingDeclarationError extends DiError {
  override readonly name = "InvalidBindingDeclarationError";
  readonly code = "INVALID_BINDING_DECLARATION";
  readonly tokenName: string;
  readonly reason: string;

  constructor(tokenName: string, reason: string) {
    super(messages.invalidBindingDeclaration(tokenName, reason));
    this.tokenName = tokenName;
    this.reason = reason;
  }
}

/**
 * An operation attempted on a container that has already been disposed.
 *
 * @since 0.3.16-canary.0
 */
export class DisposedContainerError extends DiError {
  override readonly name = "DisposedContainerError";
  readonly code = "DISPOSED_CONTAINER";

  constructor() {
    super(messages.disposedContainer());
  }
}

/**
 * A `@postConstruct` or `onActivation` hook that returned a `Promise` on a sync resolution path.
 *
 * @since 0.3.16-canary.0
 */
export class AsyncActivationError extends DiError {
  override readonly name = "AsyncActivationError";
  readonly code = "ASYNC_ACTIVATION";
  readonly tokenName: string;
  readonly hookKind: "postConstruct" | "onActivation";
  readonly methodName: string | undefined;

  constructor(tokenName: string, hookKind: "postConstruct" | "onActivation", methodName?: string) {
    super(messages.asyncActivation(tokenName, hookKind, methodName));
    this.tokenName = tokenName;
    this.hookKind = hookKind;
    this.methodName = methodName;
  }
}
