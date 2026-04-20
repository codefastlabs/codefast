/**
 * `@codefast/di` — Lightweight dependency-injection primitives for TypeScript.
 *
 * Start with {@link Container.create} to build a root container, register bindings via
 * {@link Container.bind} or {@link Module}, and resolve values with {@link Container.resolve}.
 *
 * This barrel re-exports every public symbol; individual subpath exports
 * (e.g. `@codefast/di/token`, `@codefast/di/errors`) are also available for tree-shaking.
 *
 * @packageDocumentation
 */

// Token
export { token } from "#/token";
export type { Token, TokenValue } from "#/token";

// Container
export { Container } from "#/container";

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
export { inject, injectAll, isInjectionDescriptor, optional } from "#/decorators/inject";
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
