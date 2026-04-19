// Token
export { token } from "#/token";
export type { Token, TokenValue } from "#/token";

// Container
export { Container } from "#/container";
export type { ContainerGraphJson, ContainerSnapshot } from "#/container";

// Binding — types consumers need when writing modules or typed helpers
export type {
  ActivationHandler,
  BindingBuilder,
  BindingIdentifier,
  BindingScope,
  ConstraintContext,
  Constructor,
  DeactivationHandler,
  ResolveOptions,
} from "#/binding";

// Module
export { AsyncModule, Module } from "#/module";
export type { AsyncModuleBuilder, ModuleBuilder } from "#/module";

// Decorators
export { inject, isInjectionDescriptor, optional } from "#/decorators/inject";
export type { InjectOptions } from "#/decorators/inject";
export { getAutoRegistered, injectable } from "#/decorators/injectable";
export type { InjectableDependency } from "#/decorators/injectable";
export { postConstruct, preDestroy } from "#/decorators/lifecycle-decorators";

// Errors
export {
  AsyncModuleLoadError,
  AsyncResolutionError,
  CircularDependencyError,
  DiError,
  InternalError,
  MissingMetadataError,
  NoMatchingBindingError,
  ScopeViolationError,
  TokenNotBoundError,
} from "#/errors";
export type { ScopeViolationDetails } from "#/errors";
