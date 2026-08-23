/** The container an `@inject` accessor initializer resolves from when it has no other handle. */
import type { Container } from "#/container/container";
import type { Token } from "#/core/token";
import type { Constructor, ResolveOptions } from "#/core/types";

/**
 * Path-continuing resolution the engine installs while constructing a class with `@inject` accessors.
 *
 * @remarks Resolving through this keeps an accessor's dependencies on the live resolution path, so a
 * cycle through an accessor surfaces as `CircularDependencyError` instead of unbounded recursion.
 *
 * @since 0.6.0
 */
export interface AmbientResolution {
  resolve<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value;
  resolveOptional<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined;
}

let activeContainer: Container | undefined;
let activeResolution: AmbientResolution | undefined;

/**
 * Runs a callback with the given container installed as the ambient one and returns its result.
 *
 * @since 0.3.16-canary.0
 */
export function runWithContainer<Result>(container: Container, fn: () => Result): Result {
  return runWithAmbientResolution(container, undefined, fn);
}

/**
 * Engine-internal variant of {@link runWithContainer} that also installs a path-continuing resolver.
 *
 * @since 0.6.0
 */
export function runWithAmbientResolution<Result>(
  container: Container,
  resolution: AmbientResolution | undefined,
  fn: () => Result,
): Result {
  const previousContainer = activeContainer;
  const previousResolution = activeResolution;
  activeContainer = container;
  activeResolution = resolution;
  try {
    return fn();
  } finally {
    activeContainer = previousContainer;
    activeResolution = previousResolution;
  }
}

/**
 * Returns the ambient container for the construction in flight, if one is installed.
 *
 * @since 0.3.16-canary.0
 */
export function getActiveContainer(): Container | undefined {
  return activeContainer;
}

/**
 * The path-continuing resolution for the construction in flight, when the engine installed one.
 *
 * @since 0.6.0
 */
export function getAmbientResolution(): AmbientResolution | undefined {
  return activeResolution;
}
