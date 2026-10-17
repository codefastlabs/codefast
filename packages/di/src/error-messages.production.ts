/** The production build's error messages: each keeps the identifiers it names, and the error's `name` and `code` say the rest. */
import type * as Full from "#error-messages";

function arrow(names: ReadonlyArray<string>): string {
  return names.join(" → ");
}

/** The production message of a `TokenNotBoundError`. */
export const tokenNotBound: typeof Full.tokenNotBound = (_tokenName, path) => arrow(path);

/** The production message of a `NoMatchingBindingError`. */
export const noMatchingBinding: typeof Full.noMatchingBinding = (_tokenName, _options, _availableSlots, path) =>
  arrow(path);

/** The production message of an `AmbiguousBindingError`. */
export const ambiguousBinding: typeof Full.ambiguousBinding = (tokenName) => tokenName;

/** The production message of a `CircularDependencyError`. */
export const circularDependency: typeof Full.circularDependency = arrow;

/** The production message of an `AsyncResolutionError`. */
export const asyncResolution: typeof Full.asyncResolution = (tokenName, asyncSourceToken) =>
  asyncSourceToken === tokenName ? tokenName : arrow([tokenName, asyncSourceToken]);

/** The production message of an `AsyncDeactivationError`. */
export const asyncDeactivation: typeof Full.asyncDeactivation = (tokenName) => tokenName;

/** The production message of a `ScopeViolationError`. */
export const scopeViolation: typeof Full.scopeViolation = (
  _consumer,
  _consumerScope,
  _dependency,
  _dependencyScope,
  path,
) => arrow(path);

/** The production message of an `EmptyTagCriteriaError`. */
export const emptyTagCriteria: typeof Full.emptyTagCriteria = (helperName) => helperName;

/** The production message of an `UnreachableConstraintError`. */
export const unreachableConstraint: typeof Full.unreachableConstraint = (tokenName, requirement) =>
  `${tokenName} ${requirement.name}`;

/** The production message of an `UnreachableLifecycleHookError`. */
export const unreachableLifecycleHook: typeof Full.unreachableLifecycleHook = (tokenName, phase) =>
  `${phase} ${tokenName}`;

/** The production message of an `InvalidMetadataError`. */
export const invalidMetadata: typeof Full.invalidMetadata = (targetName, reason) => `${targetName}: ${reason}`;

/** The production message of a `MissingMetadataError`. */
export const missingMetadata: typeof Full.missingMetadata = (targetName) => targetName;

/** The production message of an `AsyncModuleLoadError`. */
export const asyncModuleLoad: typeof Full.asyncModuleLoad = (moduleName) => moduleName;

/** The production message of a `MissingScopeContextError`. */
export const missingScopeContext: typeof Full.missingScopeContext = (tokenName) => tokenName;

/** The production message of a `MissingContainerContextError`. */
export const missingContainerContext: typeof Full.missingContainerContext = (className, accessorName) =>
  `${className ?? ""}#${String(accessorName)}`;

/** The production message of a `ChainAlreadyRegisteredError`. */
export const chainAlreadyRegistered: typeof Full.chainAlreadyRegistered = (tokenName) => tokenName;

/** The production message of a `ManyBindingSlotError`. */
export const manyBindingSlot: typeof Full.manyBindingSlot = (tokenName) => tokenName;

/** The production message of a `ChainNotRegisteredError`. */
export const chainNotRegistered: typeof Full.chainNotRegistered = (tokenName) => tokenName;

/** The production message of a `RebindUnboundTokenError`. */
export const rebindUnboundToken: typeof Full.rebindUnboundToken = (tokenName) => tokenName;

/** The production message of a `SelfBindingRequiresClassError`. */
export const selfBindingRequiresClass: typeof Full.selfBindingRequiresClass = (tokenName) => tokenName;

/** The production message of a `StaticMemberDecoratorError`. */
export const staticMemberDecorator: typeof Full.staticMemberDecorator = (decoratorName, memberName) =>
  `@${decoratorName} ${memberName}`;

/** The production message of a `SymbolKeyedLifecycleError`. */
export const symbolKeyedLifecycle: typeof Full.symbolKeyedLifecycle = (decoratorName, memberName) =>
  `@${decoratorName} ${memberName}`;

/** The production message of a `PrivateLifecycleMethodError`. */
export const privateLifecycleMethod: typeof Full.privateLifecycleMethod = (decoratorName, memberName) =>
  `@${decoratorName} ${memberName}`;

/** The production message of a `MissingDecoratorMetadataError`. */
export const missingDecoratorMetadata: typeof Full.missingDecoratorMetadata = (decoratorName) => `@${decoratorName}`;

/** The production message of an `InvalidBindingDeclarationError`. */
export const invalidBindingDeclaration: typeof Full.invalidBindingDeclaration = (tokenName, reason) =>
  `${tokenName}: ${reason}`;

/** The production message of a `DisposedContainerError`. */
export const disposedContainer: typeof Full.disposedContainer = () => "";

/** The production message of an `AsyncActivationError`. */
export const asyncActivation: typeof Full.asyncActivation = (tokenName, _hookKind, methodName) =>
  methodName === undefined ? tokenName : `${tokenName}#${methodName}`;

/** The production `reason` of an `InvalidMetadataError` raised by a shape check. */
export const invalidMetadataShape: typeof Full.invalidMetadataShape = (section, subject) => `${section} ${subject}`;

/** The production `reason` of an `InvalidMetadataError` for a missing lifecycle method. */
export const lifecycleMethodMissing: typeof Full.lifecycleMethodMissing = (methodName) => methodName;

/** The production message of the deactivation-hook `AggregateError`. */
export const deactivationHooksThrew: typeof Full.deactivationHooksThrew = (operation) => operation;

/** The production message of the module-rollback `AggregateError`. */
export const moduleRollbackThrew: typeof Full.moduleRollbackThrew = () => "";

/** The production message of the foreign-container `TypeError`. */
export const foreignContainer: typeof Full.foreignContainer = () => "";
