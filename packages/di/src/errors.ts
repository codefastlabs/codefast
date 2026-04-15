import type { Binding, BindingIdentifier, BindingScope } from "#lib/binding";

function formatResolutionPath(resolutionPath: readonly string[]): string {
  return resolutionPath.length > 0 ? resolutionPath.join(" -> ") : "(empty)";
}

/**
 * Base error for all `@codefast/di` failures. Subclasses expose a stable, machine-readable `code`.
 */
export abstract class DiError extends Error {
  abstract readonly code: string;

  protected constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
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

  constructor(resolutionPath: readonly string[], options?: ErrorOptions) {
    const pathText = formatResolutionPath(resolutionPath);
    super(`Circular dependency detected: ${pathText}`, options);
    this.resolutionPath = resolutionPath;
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
 * Raised when a binding is configured incorrectly (for example calling `toSelf()` for a token key).
 */
export class InvalidBindingError extends DiError {
  readonly code = "INVALID_BINDING";

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * Raised when an asynchronous provider is resolved in a synchronous resolution path.
 */
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
 * Raised when module imports form a cycle.
 */
export class ModuleCycleError extends DiError {
  readonly code = "MODULE_IMPORT_CYCLE";
  readonly modulePath: readonly string[];

  constructor(modulePath: readonly string[], options?: ErrorOptions) {
    super(`Module import cycle: ${modulePath.join(" -> ")}`, options);
    this.modulePath = modulePath;
  }
}

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

export type ScopeViolationDetails = {
  readonly consumerBindingId: BindingIdentifier;
  readonly consumerKind: Binding<unknown>["kind"];
  readonly consumerScope: BindingScope;
  readonly dependencyBindingId: BindingIdentifier;
  readonly dependencyKind: Binding<unknown>["kind"];
  readonly dependencyScope: BindingScope;
  readonly resolutionPath: readonly string[];
};

/**
 * Raised when a singleton binding would capture a shorter-lived (scoped or transient) dependency.
 * Constant bindings are excluded: they always yield the same value reference regardless of binding scope.
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
    super(
      `Scope violation: singleton binding "${details.consumerBindingId}" (${details.consumerKind}) cannot depend on ${details.dependencyScope} binding "${details.dependencyBindingId}" (${details.dependencyKind}) (resolution path: ${pathText})`,
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
