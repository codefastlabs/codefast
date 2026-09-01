import type { BindingTag } from "#/core/tag";
import { slotName } from "#/core/tag";
import type { BindingIdentifier, BindingScope, ResolveOptions } from "#/core/types";

/**
 * Base class for every error the library throws, each carrying a machine-readable `code`.
 *
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
 * An internal assertion failure — a library bug, never caller misuse.
 *
 * @since 0.3.16-canary.0
 */
export class InternalError extends DiError {
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
  readonly code = "TOKEN_NOT_BOUND";
  readonly tokenName: string;

  constructor(tokenName: string) {
    super(`No binding found for token '${tokenName}'. Did you forget container.bind(${tokenName})?`);
    this.tokenName = tokenName;
  }
}

// Options carry caller values a tag may hold — a bigint or a circular object must not make the
// diagnostic itself throw and mask the real error. The reserved criterion renders as `name`.
function describeResolveOptions(options: ResolveOptions): string {
  try {
    let name = options.name;
    const criteria: Array<string> = [];
    const add = (criterion: BindingTag): void => {
      if (criterion.key === slotName) {
        name ??= String(criterion.value);
      } else {
        criteria.push(`${criterion.key.name}=${String(criterion.value)}`);
      }
    };
    if (options.tag !== undefined) {
      add(options.tag);
    }
    if (options.tags !== undefined) {
      for (const criterion of options.tags) {
        add(criterion);
      }
    }
    const display: { name?: string; tags?: Array<string> } = {};
    if (name !== undefined) {
      display.name = name;
    }
    if (criteria.length > 0) {
      display.tags = criteria;
    }
    return JSON.stringify(display) ?? "undefined";
  } catch {
    return "[unserializable options]";
  }
}

/**
 * A token that has bindings, none of whose slots match the given `ResolveOptions`.
 *
 * @since 0.3.16-canary.0
 */
export class NoMatchingBindingError extends DiError {
  readonly code = "NO_MATCHING_BINDING";
  readonly tokenName: string;
  readonly options: ResolveOptions;
  readonly availableSlots: Array<string>;

  constructor(tokenName: string, options: ResolveOptions, availableSlots: Array<string>) {
    const optionsString = describeResolveOptions(options);
    const slotsStr = availableSlots.join(", ");
    super(`No binding for '${tokenName}' matching ${optionsString}. Available slots: [${slotsStr}].`);
    this.tokenName = tokenName;
    this.options = options;
    this.availableSlots = availableSlots;
  }
}

/**
 * Two or more candidate bindings that matched without the more-specific rule deciding a winner.
 *
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
 * A dependency cycle detected along the resolution path, alias chains included.
 *
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
 * A sync `resolve()` of a token whose factory — or a dependency's factory — is async.
 *
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
 * A sync `unbind()` of a binding whose `onDeactivation` handler is async.
 *
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
 * A `…TaggedAll` constraint built from a criteria list with nothing in it.
 *
 * @remarks Reported where the list is passed rather than where it fails to match, because it does
 * not fail to match — "carries all of no criteria" holds for any ancestor, so the constraint quietly
 * becomes a weaker one that still outranks an unconstrained binding.
 *
 * @since 0.6.0
 */
export class EmptyTagCriteriaError extends DiError {
  readonly code = "EMPTY_TAG_CRITERIA";
  readonly helperName: string;

  constructor(helperName: string) {
    super(
      `${helperName}() was given no criteria. An empty list matches any ancestor, which is not what the call says — pass the criteria to require, or drop the constraint if there are none.`,
    );
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
  readonly code = "UNREACHABLE_CONSTRAINT";
  readonly tokenName: string;
  readonly requiredName: string;
  readonly helperName: string;

  constructor(tokenName: string, requiredName: string, helperName: string) {
    super(
      `The binding for '${tokenName}' is constrained by ${helperName}('${requiredName}'), but no binding in this container or its ancestors declares the slot name '${requiredName}', so the constraint can never hold. Name the slot with .whenNamed('${requiredName}') on the binding it should match, or correct the name here.`,
    );
    this.tokenName = tokenName;
    this.requiredName = requiredName;
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
  readonly code = "UNREACHABLE_LIFECYCLE_HOOK";
  readonly tokenName: string;
  readonly phase: "onActivation" | "onDeactivation";

  constructor(tokenName: string, phase: "onActivation" | "onDeactivation") {
    super(
      `${phase}() is registered for '${tokenName}', which nothing is bound to in this container or its ancestors, so the hook can never run. Bind the token, or — if '${tokenName}' is a class you bound as an implementation via .to(${tokenName}) — register the hook against the token you bound instead.`,
    );
    this.tokenName = tokenName;
    this.phase = phase;
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
 * A class the container must construct but that carries no `@injectable()` metadata.
 *
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
 * A sync `load()` given a module that needs async setup.
 *
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
 * A synchronous disposal attempt on a container whose `onDeactivation` handlers may be async.
 *
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
 * A `scoped` binding resolved from a container with no child scope context.
 *
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
 * A `rebind()` of a token that has no own binding in this container.
 *
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
 * An operation attempted on a container that has already been disposed.
 *
 * @since 0.3.16-canary.0
 */
export class DisposedContainerError extends DiError {
  readonly code = "DISPOSED_CONTAINER";

  constructor() {
    super("Cannot perform operations on a disposed container.");
  }
}

/**
 * A `@postConstruct` or `onActivation` hook that returned a `Promise` on a sync resolution path.
 *
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
