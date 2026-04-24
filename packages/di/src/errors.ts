import type { Binding, BindingIdentifier, BindingScope, ResolveHint } from "#/binding";
export function formatResolutionPath(resolutionPath: readonly string[]): string {
  return resolutionPath.length > 0 ? resolutionPath.join(" -> ") : "(empty)";
}
const SCOPE_LABELS: Record<BindingScope, string> = {
  singleton: "Singleton",
  scoped: "Scoped",
  transient: "Transient",
};
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
export abstract class DiError extends Error {
  abstract readonly code: string;
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}
export class InternalError extends DiError {
  readonly code = "INTERNAL_ERROR";
}
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
  readonly consumerLabel?: string;
  readonly dependencyBindingId: BindingIdentifier;
  readonly dependencyKind: Binding<unknown>["kind"];
  readonly dependencyScope: BindingScope;
  readonly dependencyLabel?: string;
  readonly resolutionPath: readonly string[];
};
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
