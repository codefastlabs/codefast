import { CODEFAST_DI_LIFECYCLE_METADATA } from "#/metadata/metadata-keys";
import type { LifecycleMetadata } from "#/metadata/metadata-types";

/**
 * Stage 3 method decorator: marks a method to be called after the class is instantiated
 * by the container and before the `onActivation` hook runs.
 *
 * Lifecycle order: `new Class(…)` → **`@postConstruct()`** → `onActivation()` → scope cache.
 *
 * Only one method per class may carry this decorator; a second application throws.
 * If the decorated method returns a `Promise` during synchronous resolution,
 * {@link AsyncResolutionError} is thrown — use `Container.resolveAsync()` instead.
 */
export function postConstruct(): (
  target: () => unknown,
  context: ClassMethodDecoratorContext,
) => void {
  return (_target, context) => {
    const metaRecord = context.metadata as Record<PropertyKey, unknown>;
    const existing =
      (metaRecord[CODEFAST_DI_LIFECYCLE_METADATA] as LifecycleMetadata | undefined) ?? {};
    if (existing.postConstruct !== undefined) {
      throw new Error(
        `@postConstruct() is already defined as "${existing.postConstruct}" on this class.`,
      );
    }
    metaRecord[CODEFAST_DI_LIFECYCLE_METADATA] = {
      ...existing,
      postConstruct: String(context.name),
    } satisfies Partial<LifecycleMetadata>;
  };
}

/**
 * Stage 3 method decorator: marks a method to be called when the container disposes or
 * unloads the owning binding.
 *
 * Lifecycle order: `onDeactivation()` → **`@preDestroy()`**.
 *
 * Only one method per class may carry this decorator; a second application throws.
 * If the decorated method returns a `Promise` during synchronous disposal,
 * an error is thrown — use `Container.disposeAsync()` instead.
 */
export function preDestroy(): (
  target: () => unknown,
  context: ClassMethodDecoratorContext,
) => void {
  return (_target, context) => {
    const metaRecord = context.metadata as Record<PropertyKey, unknown>;
    const existing =
      (metaRecord[CODEFAST_DI_LIFECYCLE_METADATA] as LifecycleMetadata | undefined) ?? {};
    if (existing.preDestroy !== undefined) {
      throw new Error(
        `@preDestroy() is already defined as "${existing.preDestroy}" on this class.`,
      );
    }
    metaRecord[CODEFAST_DI_LIFECYCLE_METADATA] = {
      ...existing,
      preDestroy: String(context.name),
    } satisfies Partial<LifecycleMetadata>;
  };
}
