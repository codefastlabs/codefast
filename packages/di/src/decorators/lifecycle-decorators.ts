import { CODEFAST_DI_LIFECYCLE_METADATA } from "#/metadata/metadata-keys";
import type { LifecycleMetadata } from "#/metadata/metadata-types";
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
