export { bind, BindingBuilder, createBindingIdentifier } from "#/binding";
export type {
  ActivationHandler,
  AliasBinding,
  AsyncDynamicBinding,
  Binding,
  BindingIdentifier,
  BindingScope,
  ClassBinding,
  ConstantBinding,
  ConstantBindingBuilder,
  ConstraintBindingKind,
  ConstraintContext,
  ConstraintParentFrame,
  Constructor,
  DeactivationHandler,
  DynamicBinding,
  MaterializationFrame,
  ResolutionContext,
  ResolvedBinding,
  ResolveHint,
  ResolveOptions,
  SingletonBindingBuilder,
  ScopedBindingBuilder,
  TransientBindingBuilder,
} from "#/binding";

export {
  filterMatchingBindings,
  registryKeyLabel,
  selectBindingForRegistry,
  selectDefaultBindingForKey,
} from "#/binding-select";
export { whenAnyAncestorIs, whenParentIs, whenTargetTagged } from "#/constraints";

export { Container } from "#/container";
export type { ContainerGraphJson } from "#/container";
export { inject, isInjectionDescriptor, optional } from "#/decorators/inject";

export type { InjectOptions } from "#/decorators/inject";
export { getAutoRegistered, injectable } from "#/decorators/injectable";

export type { InjectableDependency } from "#/decorators/injectable";
export {
  CODEFAST_DI_ACCESSOR_INJECTIONS,
  CODEFAST_DI_CONSTRUCTOR_METADATA,
  CODEFAST_DI_LIFECYCLE_METADATA,
  decoratorMetadataObjectSymbol,
} from "#/metadata/metadata-keys";

export type {
  AccessorInjectionMetadata,
  ConstructorMetadata,
  InjectionDescriptor,
  LifecycleMetadata,
  MetadataReader,
  ParamMetadata,
} from "#/metadata/metadata-types";
export { getOrCreatePendingMap, takePendingMap } from "#/metadata/param-registry";

export { SymbolMetadataReader } from "#/metadata/symbol-metadata-reader";
export { postConstruct, preDestroy } from "#/decorators/lifecycle-decorators";
export {
  collectStaticDependencyEdges,
  injectHintLabelFromResolveHint,
  listResolvedDependencies,
} from "#/dependency-graph";

export type { ResolvedDependency, StaticDependencyEdge } from "#/dependency-graph";
export { isDevelopmentOrTestEnvironment, isProductionEnvironment } from "#/environment";

export {
  AsyncModuleLoadError,
  AsyncResolutionError,
  CircularDependencyError,
  DiError,
  MissingMetadataError,
  NoMatchingBindingError,
  ScopeViolationError,
  TokenNotBoundError,
} from "#/errors";
export type { ScopeViolationDetails } from "#/errors";

export { ContainerInspector } from "#/inspector";
export type {
  BindingActivationStatus,
  ContainerBindingSnapshot,
  ContainerInspectorContext,
  ContainerSnapshot,
  DotGraphOptions,
} from "#/inspector";

export {
  readLifecycleMetadataFromCtor,
  runActivation,
  runActivationAsync,
  runPostConstruct,
  runPostConstructAsync,
  runPreDestroy,
  runPreDestroyAsync,
} from "#/lifecycle";

export { AsyncModule, Module } from "#/module";
export type { AsyncModuleBuilder, ModuleBuilder } from "#/module";

export { BindingRegistry } from "#/registry";
export type { RegistryKey } from "#/registry";

export { DependencyResolver } from "#/resolver";

export { ScopeManager } from "#/scope";

export { validateScopeRules } from "#/scope-validation";

export { token } from "#/token";
export type { Token, TokenValue } from "#/token";
