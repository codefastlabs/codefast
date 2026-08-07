/** The container an `@inject` accessor initializer resolves from when it has no other handle. */
import type { Container } from "#/container/container";

let activeContainer: Container | undefined;

/**
 * @since 0.3.16-canary.0
 */
export function runWithContainer<Result>(container: Container, fn: () => Result): Result {
  const prev = activeContainer;
  activeContainer = container;
  try {
    return fn();
  } finally {
    activeContainer = prev;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export function getActiveContainer(): Container | undefined {
  return activeContainer;
}
