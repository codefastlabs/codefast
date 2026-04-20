import type { Binding, BindingIdentifier, BindingScope, ResolveHint } from "#/binding";

/**
 * Formats a resolution path array into a human-readable `"A -> B -> C"` string.
 */
function formatResolutionPath(resolutionPath: readonly string[]): string {
  return resolutionPath.length > 0 ? resolutionPath.join(" -> ") : "(empty)";
}

/**
 * Serializes a {@link ResolveHint} to a debug string; never throws even for exotic values.
 */
function safeSerializeHint(hint: ResolveHint): string {
  if (hint === undefined) {
    return "(none)";
  }
  try {
    const parts: string[] = [];
    if (hint.name !== undefined) {
      parts.push(`name: ${String(hint.name)}`);
    }
    if (hint.tag !== undefined) {
      const [tagKey, tagValue] = hint.tag;
      parts.push(`tag: [${tagKey}, <${typeof tagValue}>]`);
    }
    return `{ ${parts.join(", ")} }`;
  } catch {
    return "(unserializable hint)";
  }
}

/**
 * Base error for all `@codefast/di` failures. Subclasses expose a stable, machine-readable `code`.
 */
export abstract class DiError extends Error {
  abstract readonly code: string;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

/**
 * Raised for internal programming errors — invalid library usage or unexpected state that
 * indicates a bug in the caller (e.g. accessing an uninitialized container, misconfigured binding).
 */
export class InternalError extends DiError {
  readonly code = "INTERNAL_ERROR";
}

/**
 * Raised when a name/tag filter matches no binding although other bindings exist for the token.
 */
export class NoMatchingBindingError extends DiError {
  readonly code = "NO_MATCHING_BINDING";
  readonly tokenName: string;
  readonly hint: ResolveHint;
  readonly resolutionPath: readonly string[];

  constructor(
    tokenName: string,
    hint: ResolveHint,
    resolutionPath: readonly string[],
    options?: ErrorOptions,
  ) {
    const pathText = resolutionPath.length > 0 ? resolutionPath.join(" -> ") : "(empty)";
    const hintText = safeSerializeHint(hint);
    super(
      `No binding matched resolve options ${hintText} for token "${tokenName}" (resolution path: ${pathText})`,
      options,
    );
    this.tokenName = tokenName;
    this.hint = hint;
    this.resolutionPath = resolutionPath;
  }
}

/**
 * Raised when resolving a value for a token that has no binding.
 */
export class TokenNotBoundError extends DiError {
  readonly code = "TOKEN_NOT_BOUND";
  readonly tokenName: string;
  readonly resolutionPath: readonly string[];

  constructor(tokenName: string, resolutionPath: readonly string[], options?: ErrorOptions) {
    const pathText = formatResolutionPath(resolutionPath);
    super(`Token not bound: ${tokenName} (resolution path: ${pathText})`, options);
    this.tokenName = tokenName;
    this.resolutionPath = resolutionPath;
  }
}

/**
 * Raised when the dependency graph contains a cycle during resolution.
 */
export class CircularDependencyError extends DiError {
  readonly code = "CIRCULAR_DEPENDENCY";
  readonly resolutionPath: readonly string[];
  readonly cycle: string[];

  constructor(resolutionPath: readonly string[], options?: ErrorOptions) {
    const pathText = formatResolutionPath(resolutionPath);
    super(`Circular dependency detected: ${pathText}`, options);
    this.resolutionPath = resolutionPath;
    this.cycle = [...resolutionPath];
  }
}

/**
 * Raised when a class binding requires `@injectable()` / `Symbol.metadata` constructor metadata but none is present.
 */
export class MissingMetadataError extends DiError {
  readonly code = "MISSING_METADATA";
  readonly className: string;
  readonly resolutionPath: readonly string[];

  constructor(className: string, resolutionPath: readonly string[], options?: ErrorOptions) {
    const pathText = formatResolutionPath(resolutionPath);
    super(
      `Missing injectable constructor metadata for class "${className}" (resolution path: ${pathText})`,
      options,
    );
    this.className = className;
    this.resolutionPath = resolutionPath;
  }
}

/**
 * Raised when `load()` is used with an async module.
 */
export class AsyncModuleLoadError extends DiError {
  readonly code = "ASYNC_MODULE_LOAD";
  readonly moduleName: string;

  constructor(moduleName: string, options?: ErrorOptions) {
    super(
      `Cannot load async module "${moduleName}" synchronously; use loadAsync() or Container.fromModulesAsync().`,
      options,
    );
    this.moduleName = moduleName;
  }
}

/**
 * Raised when `resolve()` is called on a binding chain that contains an async factory or
 * an async `onActivation` handler. Use `resolveAsync()` / `resolveAllAsync()` instead.
 */
export class AsyncResolutionError extends DiError {
  readonly code = "ASYNC_RESOLUTION";
  readonly tokenName: string;
  readonly resolutionPath: readonly string[];
  readonly reason: string;

  constructor(
    tokenName: string,
    resolutionPath: readonly string[],
    reason: string,
    options?: ErrorOptions,
  ) {
    const pathText = formatResolutionPath(resolutionPath);
    super(
      `Cannot resolve "${tokenName}" synchronously: ${reason} (resolution path: ${pathText})`,
      options,
    );
    this.tokenName = tokenName;
    this.resolutionPath = resolutionPath;
    this.reason = reason;
  }
}

/**
 * Structured payload attached to {@link ScopeViolationError}.
 */
export type ScopeViolationDetails = {
  readonly consumerBindingId: BindingIdentifier;
  readonly consumerKind: Binding<unknown>["kind"];
  readonly consumerScope: BindingScope;
  readonly consumerLabel?: string;
  readonly dependencyBindingId: BindingIdentifier;
  readonly dependencyKind: Binding<unknown>["kind"];
  readonly dependencyScope: BindingScope;
  readonly dependencyLabel?: string;
  readonly resolutionPath: readonly string[];
};

/**
 * Raised when a long-lived binding would capture a shorter-lived (scoped or transient) dependency
 * (captive dependency). Constant value dependencies are excluded.
 */
export class ScopeViolationError extends DiError {
  readonly code = "SCOPE_VIOLATION";
  readonly consumerBindingId: BindingIdentifier;
  readonly consumerKind: Binding<unknown>["kind"];
  readonly consumerScope: BindingScope;
  readonly dependencyBindingId: BindingIdentifier;
  readonly dependencyKind: Binding<unknown>["kind"];
  readonly dependencyScope: BindingScope;
  readonly resolutionPath: readonly string[];

  constructor(details: ScopeViolationDetails, options?: ErrorOptions) {
    const pathText = formatResolutionPath(details.resolutionPath);
    const consumerLabel = details.consumerLabel ?? String(details.consumerBindingId);
    const dependencyLabel = details.dependencyLabel ?? String(details.dependencyBindingId);
    const consumerScopeLabel =
      details.consumerScope.charAt(0).toUpperCase() + details.consumerScope.slice(1);
    const dependencyScopeLabel =
      details.dependencyScope.charAt(0).toUpperCase() + details.dependencyScope.slice(1);
    super(
      `Scope Violation: ${consumerScopeLabel} "${consumerLabel}" cannot depend on ${dependencyScopeLabel} "${dependencyLabel}" (resolution path: ${pathText})`,
      options,
    );
    this.consumerBindingId = details.consumerBindingId;
    this.consumerKind = details.consumerKind;
    this.consumerScope = details.consumerScope;
    this.dependencyBindingId = details.dependencyBindingId;
    this.dependencyKind = details.dependencyKind;
    this.dependencyScope = details.dependencyScope;
    this.resolutionPath = details.resolutionPath;
  }
}
