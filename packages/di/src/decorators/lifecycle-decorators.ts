import { CODEFAST_DI_LIFECYCLE_METADATA, type LifecycleMetadata } from "#/decorators/metadata";

/**
 * Stage 3 method decorator: marks a method to be called after the class is instantiated by the container.
 * Order: construct → `@postConstruct()` → `.onActivation()` → cache.
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
 * Stage 3 method decorator: marks a method to be called before the instance is destroyed by the container.
 * Order: `.onDeactivation()` → `@preDestroy()`.
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
