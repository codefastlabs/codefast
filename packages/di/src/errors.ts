import type { Binding, BindingIdentifier, BindingScope, ResolveHint } from "#/binding";

/**
 * Formats a resolution path array into a human-readable `"A -> B -> C"` string.
 */
export function formatResolutionPath(resolutionPath: readonly string[]): string {
  return resolutionPath.length > 0 ? resolutionPath.join(" -> ") : "(empty)";
}

const SCOPE_LABELS: Record<BindingScope, string> = {
  singleton: "Singleton",
  scoped: "Scoped",
  transient: "Transient",
};

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
 * Base error for all `@codefast/di` failures.
 *
 * Every concrete subclass exposes a stable, machine-readable {@link DiError.code} property
 * (e.g. `"TOKEN_NOT_BOUND"`) so consumers can `switch` on error type without relying
 * on `instanceof` across package versions.
 */
export abstract class DiError extends Error {
  /**
   * Machine-readable error code, constant per subclass (e.g. `"TOKEN_NOT_BOUND"`).
   */
  abstract readonly code: string;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

/**
 * Raised for internal programming errors — invalid library usage or unexpected state that
 * indicates a bug in the caller or the library itself.
 *
 * Examples: double `to*()` call on a {@link BindingBuilder}, ambiguous binding resolution
 * with multiple candidates, or scope mutation on a constant binding.
 *
 * Code: `"INTERNAL_ERROR"`
 */
export class InternalError extends DiError {
  readonly code = "INTERNAL_ERROR";
}

/**
 * Raised when bindings exist for the token but none match the provided name/tag hint.
 * Distinguishes from {@link TokenNotBoundError} (no bindings at all).
 *
 * Thrown when a `{ name }` or `{ tag }` hint is specified but no registered binding satisfies it
 * (e.g. `Container.resolve`, `Container.resolveAsync`, `Container.resolveOptional`,
 * `Container.resolveAll`, `Container.resolveAllAsync`, and binding selection helpers such as
 * {@link selectBindingForRegistry}).
 *
 * Code: `"NO_MATCHING_BINDING"`
 */
export class NoMatchingBindingError extends DiError {
  readonly code = "NO_MATCHING_BINDING";
  /**
   * The `Token.name` or `Constructor.name` that was resolved.
   */
  readonly tokenName: string;
  /**
   * The name/tag hint that failed to match any binding.
   */
  readonly hint: ResolveHint;
  /**
   * Label path from the resolution root to the failing token.
   */
  readonly resolutionPath: readonly string[];

  constructor(
    tokenName: string,
    hint: ResolveHint,
    resolutionPath: readonly string[],
    options?: ErrorOptions,
  ) {
    const pathText = formatResolutionPath(resolutionPath);
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
 * Raised when no binding exists for the requested token or constructor.
 *
 * Thrown by `Container.resolve`, `Container.resolveAsync`, and during transitive
 * dependency resolution when a required token has never been registered.
 *
 * Note on optional resolution:
 * - Root-level `Container.resolveOptional` returns `undefined` when **that key** has no
 *   registry entries (it never throws this error for the root key in that case). Missing
 *   **transitive** dependencies still throw during instantiation.
 * - `ResolutionContext.resolveOptional` (used inside factories) catches this error
 *   internally to return `undefined` for missing dependencies.
 *
 * Code: `"TOKEN_NOT_BOUND"`
 */
export class TokenNotBoundError extends DiError {
  readonly code = "TOKEN_NOT_BOUND";
  /**
   * The `Token.name` or `Constructor.name` that could not be found.
   */
  readonly tokenName: string;
  /**
   * Label path from the resolution root to the missing token.
   */
  readonly resolutionPath: readonly string[];

  constructor(tokenName: string, resolutionPath: readonly string[], options?: ErrorOptions) {
    const pathText = formatResolutionPath(resolutionPath);
    super(`Token not bound: ${tokenName} (resolution path: ${pathText})`, options);
    this.tokenName = tokenName;
    this.resolutionPath = resolutionPath;
  }
}

/**
 * Raised when a token is encountered a second time on the same resolution call stack,
 * indicating a cyclic dependency (A → B → … → A).
 *
 * Also raised during module loading when `import()` forms a cycle between modules.
 *
 * Code: `"CIRCULAR_DEPENDENCY"`
 */
export class CircularDependencyError extends DiError {
  readonly code = "CIRCULAR_DEPENDENCY";
  /**
   * Full label path including the repeated token at the end.
   */
  readonly resolutionPath: readonly string[];
  /**
   * Mutable copy of {@link resolutionPath} for consumer convenience.
   */
  readonly cycle: string[];

  constructor(resolutionPath: readonly string[], options?: ErrorOptions) {
    const pathText = formatResolutionPath(resolutionPath);
    super(`Circular dependency detected: ${pathText}`, options);
    this.resolutionPath = resolutionPath;
    this.cycle = [...resolutionPath];
  }
}

/**
 * Raised when the container's {@link MetadataReader} is **configured** and reports no
 * constructor metadata for a `class` binding whose implementation has `arity > 0`.
 *
 * If `metadataReader` is `undefined`, the resolver calls `new ImplementationClass()` without
 * this check — this error is **not** thrown in that configuration.
 *
 * Fix: add `@injectable([...deps])` on the class (so `getConstructorMetadata` returns params),
 * or omit constructor parameters if you intentionally run without a reader.
 *
 * Code: `"MISSING_METADATA"`
 */
export class MissingMetadataError extends DiError {
  readonly code = "MISSING_METADATA";
  /**
   * Name of the class that is missing `@injectable()` metadata.
   */
  readonly className: string;
  /**
   * Label path from the resolution root to the class binding.
   */
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
 * Raised when the synchronous `Container.load()` is called with an {@link AsyncModule}.
 * Use `Container.loadAsync()` or `Container.fromModulesAsync()` instead.
 *
 * Code: `"ASYNC_MODULE_LOAD"`
 */
export class AsyncModuleLoadError extends DiError {
  readonly code = "ASYNC_MODULE_LOAD";
  /**
   * Name of the async module that was passed to the sync loader.
   */
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
 * Raised when synchronous `Container.resolve()` / `Container.resolveAll()` encounters an
 * async operation: an `async-dynamic` factory, a `toDynamic` factory that returns a Promise,
 * an `onActivation` handler that returns a Promise, or a `@postConstruct` method that
 * returns a Promise.
 *
 * Fix: switch to `Container.resolveAsync()` / `Container.resolveAllAsync()`.
 *
 * Code: `"ASYNC_RESOLUTION"`
 */
export class AsyncResolutionError extends DiError {
  readonly code = "ASYNC_RESOLUTION";
  /**
   * Token or class name that triggered the async path.
   */
  readonly tokenName: string;
  /**
   * Label path from the resolution root to the async binding.
   */
  readonly resolutionPath: readonly string[];
  /**
   * Human-readable description of why async resolution was required.
   */
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
 * Structured payload passed to the {@link ScopeViolationError} constructor.
 * Carries identities and scopes of both the long-lived consumer and the shorter-lived dependency.
 */
export type ScopeViolationDetails = {
  /** Binding id of the long-lived consumer (typically singleton). */
  readonly consumerBindingId: BindingIdentifier;
  /** Binding strategy kind of the consumer. */
  readonly consumerKind: Binding<unknown>["kind"];
  /** Scope of the consumer binding. */
  readonly consumerScope: BindingScope;
  /** Optional display label for consumer in error messages. */
  readonly consumerLabel?: string;
  /** Binding id of the shorter-lived dependency. */
  readonly dependencyBindingId: BindingIdentifier;
  /** Binding strategy kind of the dependency. */
  readonly dependencyKind: Binding<unknown>["kind"];
  /** Scope of the dependency binding. */
  readonly dependencyScope: BindingScope;
  /** Optional display label for dependency in error messages. */
  readonly dependencyLabel?: string;
  /** Resolution path captured at the violation point. */
  readonly resolutionPath: readonly string[];
};

/**
 * Raised for a **captive dependency**: a singleton consumer resolves (or would resolve) a
 * non-constant binding whose lifetime is `scoped` or `transient`. Constant bindings are exempt.
 *
 * - **Runtime:** each resolution step checks the parent on the materialization stack, so
 *   violations are detected along the actual construction chain.
 * - **`Container.validate()`:** {@link validateScopeRules} walks **direct** static edges from
 *   {@link listResolvedDependencies} only — it does not recursively expand the whole graph,
 *   so it may miss violations that appear only deeper in the dependency tree.
 *
 * Code: `"SCOPE_VIOLATION"`
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
    super(
      `Scope Violation: ${SCOPE_LABELS[details.consumerScope]} "${consumerLabel}" cannot depend on ${SCOPE_LABELS[details.dependencyScope]} "${dependencyLabel}" (resolution path: ${pathText})`,
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
