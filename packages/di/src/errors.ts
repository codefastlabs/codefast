import type { BindingIdentifier, BindingScope, ResolveOptions } from "#/types";

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
    super(
      `No binding found for token '${tokenName}'. Did you forget container.bind(${tokenName})?`,
    );
    this.tokenName = tokenName;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export class NoMatchingBindingError extends DiError {
  readonly code = "NO_MATCHING_BINDING";
  readonly tokenName: string;
  readonly hint: ResolveOptions;
  readonly availableSlots: Array<string>;

  constructor(tokenName: string, hint: ResolveOptions, availableSlots: Array<string>) {
    const hintStr = JSON.stringify(hint);
    const slotsStr = availableSlots.join(", ");
    super(`No binding for '${tokenName}' matching ${hintStr}. Available slots: [${slotsStr}].`);
    this.tokenName = tokenName;
    this.hint = hint;
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
  readonly tokenName: string;
  readonly asyncSourceToken: string;

  constructor(tokenName: string, asyncSourceToken: string) {
    super(
      `Token '${tokenName}' requires async resolution because '${asyncSourceToken}' in its dependency chain has an async factory. Use container.resolveAsync(${tokenName}).`,
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
 * @since 0.3.16-canary.0
 */
export class MissingContainerContextError extends DiError {
  readonly code = "MISSING_CONTAINER_CONTEXT";
  readonly targetName: string;

  constructor(targetName: string) {
    super(
      `Class '${targetName}' has @inject accessor fields but was instantiated outside a container context. Resolve it via container.resolve(${targetName}) instead.`,
    );
    this.targetName = targetName;
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
 * @since 0.3.16-canary.0
 */
export class DisposedContainerError extends DiError {
  readonly code = "DISPOSED_CONTAINER";

  constructor() {
    super("Cannot perform operations on a disposed container.");
  }
}
