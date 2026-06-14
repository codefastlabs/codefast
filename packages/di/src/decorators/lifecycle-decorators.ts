import { InternalError } from "#/errors";
import { LIFECYCLE_KEY } from "#/metadata/metadata-keys";
import type { MutableLifecycleMetadata } from "#/metadata/metadata-types";

function appendUniqueMethod(
  metadata: MutableLifecycleMetadata,
  phase: "postConstruct" | "preDestroy",
  methodName: string,
): void {
  if (!metadata[phase].includes(methodName)) {
    metadata[phase].push(methodName);
  }
}

/**
 * @since 0.3.16-canary.0
 */
export function postConstruct(): (target: unknown, context: ClassMethodDecoratorContext) => void {
  return function (target: unknown, context: ClassMethodDecoratorContext): void {
    if (context.static) {
      throw new InternalError(
        "@postConstruct() applies to instance methods only; static methods are not invoked during instance lifecycle.",
      );
    }
    const methodName = String(context.name);
    const meta = context.metadata as Record<string | symbol, unknown>;
    if (!meta[LIFECYCLE_KEY]) {
      meta[LIFECYCLE_KEY] = { postConstruct: [], preDestroy: [] };
    }
    appendUniqueMethod(meta[LIFECYCLE_KEY] as MutableLifecycleMetadata, "postConstruct", methodName);
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function preDestroy(): (target: unknown, context: ClassMethodDecoratorContext) => void {
  return function (target: unknown, context: ClassMethodDecoratorContext): void {
    if (context.static) {
      throw new InternalError(
        "@preDestroy() applies to instance methods only; static methods are not invoked during instance teardown.",
      );
    }
    const methodName = String(context.name);
    const meta = context.metadata as Record<string | symbol, unknown>;
    if (!meta[LIFECYCLE_KEY]) {
      meta[LIFECYCLE_KEY] = { postConstruct: [], preDestroy: [] };
    }
    appendUniqueMethod(meta[LIFECYCLE_KEY] as MutableLifecycleMetadata, "preDestroy", methodName);
  };
}
