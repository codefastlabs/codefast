import { noteLifecycleMethodDeclared } from "#/core/lifecycle-declarations";
import { StaticMemberDecoratorError } from "#/errors/errors";
import { LIFECYCLE_KEY } from "#/metadata/metadata-keys";
import type { MutableLifecycleMetadata } from "#/metadata/metadata-types";

type MethodDecorator = (target: unknown, context: ClassMethodDecoratorContext) => void;

/** Records the decorated method under one lifecycle phase; both decorators differ only in that phase. */
function recordLifecycleMethod(phase: "postConstruct" | "preDestroy"): MethodDecorator {
  return function (target: unknown, context: ClassMethodDecoratorContext): void {
    if (context.static) {
      throw new StaticMemberDecoratorError(phase, String(context.name));
    }
    // Lets resolution skip inspecting what a factory returned, in a process where nothing declares one.
    noteLifecycleMethodDeclared();
    const meta = context.metadata as Record<string | symbol, unknown>;
    meta[LIFECYCLE_KEY] ??= { postConstruct: [], preDestroy: [] };
    const lifecycle = meta[LIFECYCLE_KEY] as MutableLifecycleMetadata;
    const methodName = String(context.name);
    if (!lifecycle[phase].includes(methodName)) {
      lifecycle[phase].push(methodName);
    }
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function postConstruct(): MethodDecorator {
  return recordLifecycleMethod("postConstruct");
}

/**
 * @since 0.3.16-canary.0
 */
export function preDestroy(): MethodDecorator {
  return recordLifecycleMethod("preDestroy");
}
