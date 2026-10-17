/**
 * The functions that resolve from a container asynchronously, apart from `Container` so a program that never awaits a
 * resolve never bundles the async lane.
 */
import type { Container } from "#container/container";
import { containerInternals, containerResolver } from "#container/container";
import { effectiveBindingScope, NO_INSTANCE } from "#core/binding";
import type { Token } from "#core/token";
import type { Constructor, ResolveOptions } from "#core/types";
import { bindingSlotToResolveOptions } from "#injection/dependency-slot";
import { AsyncLane } from "#resolution/async-lane";
import { ROOT_BRANCH } from "#resolution/path";

// Not `async`: a foreign or disposed container becomes the rejection the caller is promised.
function laneOf(container: Container): AsyncLane {
  return AsyncLane.of(containerResolver(container));
}

/**
 * Resolves a token from a container, awaiting any async factory, `@postConstruct` or activation hook in its graph.
 *
 * @remarks Rejects with `DisposedContainerError` for a disposed container, and with a `TypeError` for an object
 * `Container.create()` did not make.
 */
export function resolveAsync<Value, Names extends string = string>(
  container: Container,
  token: Token<Value, Names> | Constructor<Value>,
  options?: NoInfer<ResolveOptions<Names>>,
): Promise<Value> {
  let lane: AsyncLane;
  try {
    lane = laneOf(container);
  } catch (containerError) {
    return Promise.reject(containerError);
  }
  if (options === undefined) {
    return lane.resolveAsyncFromRoot(token) as Promise<Value>;
  }
  return lane.resolveAsync(token, options, [], ROOT_BRANCH);
}

/**
 * Resolves a token from a container asynchronously, or `undefined` when nothing in the chain binds it.
 *
 * @remarks Rejects as `resolveAsync` does for a disposed or foreign container.
 */
export function resolveOptionalAsync<Value, Names extends string = string>(
  container: Container,
  token: Token<Value, Names> | Constructor<Value>,
  options?: NoInfer<ResolveOptions<Names>>,
): Promise<Value | undefined> {
  let lane: AsyncLane;
  try {
    lane = laneOf(container);
  } catch (containerError) {
    return Promise.reject(containerError);
  }
  return lane.resolveOptionalAsync(token, options, [], ROOT_BRANCH);
}

/**
 * Resolves every binding a request matches in a container's chain, asynchronously, in registration order.
 *
 * @remarks Rejects as `resolveAsync` does for a disposed or foreign container.
 */
export function resolveAllAsync<Value, Names extends string = string>(
  container: Container,
  token: Token<Value, Names> | Constructor<Value>,
  options?: NoInfer<ResolveOptions<Names>>,
): Promise<ReadonlyArray<Value>> {
  let lane: AsyncLane;
  try {
    lane = laneOf(container);
  } catch (containerError) {
    return Promise.reject(containerError);
  }
  if (options === undefined) {
    return lane.resolveRootCollectionAsync(token);
  }
  return lane.resolveAllAsync(token, options, [], ROOT_BRANCH);
}

/**
 * Builds every eligible singleton a container registers itself, so later sync `resolve` calls find them built.
 *
 * @remarks A singleton with a `when()` predicate is skipped, and so is a constant no activation hook would run for.
 * Each binding is warmed as itself: re-selecting by its own criteria could pick another candidate whose criteria are
 * a subset of them.
 */
export async function initializeAsync(container: Container): Promise<void> {
  const { registry, lifecycle, resolver } = containerInternals(container);
  const lane = AsyncLane.of(resolver);
  for (const binding of registry.allBindings()) {
    if (binding.kind === "alias" || binding.predicate !== undefined) {
      continue;
    }
    if (effectiveBindingScope(binding) !== "singleton" || binding.instance !== NO_INSTANCE) {
      continue;
    }
    if (
      binding.kind === "constant" &&
      binding.activationHook === undefined &&
      !lifecycle.hasActivationHandlers(binding.token)
    ) {
      continue;
    }
    await lane.warmBindingAsync(binding, bindingSlotToResolveOptions(binding.slot));
  }
}
