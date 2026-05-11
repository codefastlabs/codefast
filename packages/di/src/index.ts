// Foundation types
export type {
  ActivationHandler,
  BindingIdentifier,
  BindingKind,
  BindingScope,
  ConstraintContext,
  Constructor,
  DependencyKey,
  DeactivationHandler,
  ResolutionFrame,
  ResolveOptions,
  ResolutionContext,
  TokenValue,
} from "#/types";

// Token
export { token, tokenName, isToken } from "#/token";
export type { Token } from "#/token";

// Binding builders — types only
export type {
  AliasBindingBuilder,
  BindToBuilder,
  BindingBuilder,
  ConstantBindingBuilder,
  ScopedBindingBuilder,
  SingletonBindingBuilder,
  SingletonLifecycleBuilder,
  TransientBindingBuilder,
} from "#/binding";

// Container
export { Container } from "#/container";
export type { Container as ContainerInterface, ContainerStatic } from "#/container";

export { effectiveBindingScope } from "#/binding-scope";
export { injectionSlotToResolveOptions, bindingSlotToResolveOptions } from "#/resolve-options";

// Introspection types
export type { BindingSnapshot, ContainerSnapshot } from "#/inspector";

// Graph types
export type {
  ContainerGraphJson,
  GraphEdge,
  GraphNode,
  GraphOptions,
} from "#/graph-adapters/types";

// Module
export { AsyncModule, isSyncModule, Module, SyncModule } from "#/module";
export type { AsyncModuleBuilder, ModuleBuilder } from "#/module";

// Decorators
export { inject, injectAll, isInjectionDescriptor, optional } from "#/decorators/inject";
export type { InjectionDescriptor, InjectOptions } from "#/decorators/inject";
export { injectable } from "#/decorators/injectable";
export type { InjectableDependency, InjectableOptions } from "#/decorators/injectable";
export { postConstruct, preDestroy } from "#/decorators/lifecycle-decorators";

// Auto-register
export { createAutoRegisterRegistry } from "#/decorators/injectable";
export type { AutoRegisterRegistry } from "#/decorators/injectable";

// MetadataReader
export { MetadataReaderToken } from "#/metadata/metadata-reader-token";
export type { MetadataReader, MutableLifecycleMetadata } from "#/metadata/metadata-types";

// Constraints — contextual injection predicates for .when()
export {
  whenAnyAncestorIs,
  whenAnyAncestorNamed,
  whenAnyAncestorTagged,
  whenAnyAncestorTaggedAll,
  whenNoAncestorIs,
  whenNoParentIs,
  whenParentIs,
  whenParentNamed,
  whenParentTagged,
  whenParentTaggedAll,
} from "#/constraints";

// Errors
export {
  AmbiguousBindingError,
  AsyncActivationError,
  AsyncDeactivationError,
  AsyncModuleLoadError,
  AsyncResolutionError,
  CircularDependencyError,
  DiError,
  DisposedContainerError,
  InternalError,
  MissingContainerContextError,
  MissingMetadataError,
  MissingScopeContextError,
  NoMatchingBindingError,
  RebindUnboundTokenError,
  ScopeViolationError,
  SyncDisposalNotSupportedError,
  TokenNotBoundError,
} from "#/errors";
export type { ScopeViolationDetails } from "#/errors";
