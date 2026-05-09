import type { MutableLifecycleMetadata } from "#/metadata/metadata-types";
import { InternalError } from "#/errors";
import {
  LIFECYCLE_KEY,
  lifecycleByConstructorMetadataMap,
  lifecycleMetadataMap,
} from "#/metadata/metadata-keys";

function appendUniqueMethod(
  metadata: MutableLifecycleMetadata,
  phase: "postConstruct" | "preDestroy",
  methodName: string,
): void {
  if (!metadata[phase].includes(methodName)) {
    metadata[phase].push(methodName);
  }
}

function resolveConstructorFromDecoratorTarget(target: unknown): object | undefined {
  if (typeof target === "function") {
    return target as object;
  }
  if (typeof target === "object" && target !== null) {
    const ctor = (target as { constructor?: unknown }).constructor;
    if (typeof ctor === "function") {
      return ctor as object;
    }
  }
  return undefined;
}

function registerByConstructor(
  target: unknown,
  phase: "postConstruct" | "preDestroy",
  methodName: string,
): void {
  const ctor = resolveConstructorFromDecoratorTarget(target);
  if (ctor === undefined) {
    return;
  }
  const ctorExisting = lifecycleByConstructorMetadataMap.get(ctor);
  if (ctorExisting !== undefined) {
    appendUniqueMethod(ctorExisting, phase, methodName);
  } else {
    lifecycleByConstructorMetadataMap.set(ctor, {
      postConstruct: phase === "postConstruct" ? [methodName] : [],
      preDestroy: phase === "preDestroy" ? [methodName] : [],
    });
  }
}

/**
 * @since 0.3.16-canary.0
 */
export function postConstruct(): (target: unknown, context: ClassMethodDecoratorContext) => void {
  return function (target: unknown, context: ClassMethodDecoratorContext): void {
    if (context.static === true) {
      throw new InternalError(
        "@postConstruct() applies to instance methods only; static methods are not invoked during instance lifecycle.",
      );
    }
    const methodName = String(context.name);
    registerByConstructor(target, "postConstruct", methodName);
    const existing = lifecycleMetadataMap.get(context.metadata as object);

    if (existing !== undefined) {
      appendUniqueMethod(existing, "postConstruct", methodName);
    } else {
      lifecycleMetadataMap.set(context.metadata as object, {
        postConstruct: [methodName],
        preDestroy: [],
      });
    }

    context.addInitializer(function () {
      const targetOrInstance = this as object | Function;
      const ctor =
        typeof targetOrInstance === "function"
          ? (targetOrInstance as object)
          : ((targetOrInstance as { constructor: object }).constructor as object);
      const ctorExisting = lifecycleByConstructorMetadataMap.get(ctor);
      if (ctorExisting !== undefined) {
        appendUniqueMethod(ctorExisting, "postConstruct", methodName);
      } else {
        lifecycleByConstructorMetadataMap.set(ctor, {
          postConstruct: [methodName],
          preDestroy: [],
        });
      }
    });

    // Also try Symbol.metadata approach
    try {
      const meta = context.metadata as Record<string | symbol, unknown>;
      if (meta !== null && typeof meta === "object") {
        if (!meta[LIFECYCLE_KEY]) {
          meta[LIFECYCLE_KEY] = { postConstruct: [], preDestroy: [] };
        }
        const lifecycle = meta[LIFECYCLE_KEY] as MutableLifecycleMetadata;
        appendUniqueMethod(lifecycle, "postConstruct", methodName);
      }
    } catch {
      // ignore
    }
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function preDestroy(): (target: unknown, context: ClassMethodDecoratorContext) => void {
  return function (target: unknown, context: ClassMethodDecoratorContext): void {
    if (context.static === true) {
      throw new InternalError(
        "@preDestroy() applies to instance methods only; static methods are not invoked during instance teardown.",
      );
    }
    const methodName = String(context.name);
    registerByConstructor(target, "preDestroy", methodName);
    const existing = lifecycleMetadataMap.get(context.metadata as object);

    if (existing !== undefined) {
      appendUniqueMethod(existing, "preDestroy", methodName);
    } else {
      lifecycleMetadataMap.set(context.metadata as object, {
        postConstruct: [],
        preDestroy: [methodName],
      });
    }

    context.addInitializer(function () {
      const targetOrInstance = this as object | Function;
      const ctor =
        typeof targetOrInstance === "function"
          ? (targetOrInstance as object)
          : ((targetOrInstance as { constructor: object }).constructor as object);
      const ctorExisting = lifecycleByConstructorMetadataMap.get(ctor);
      if (ctorExisting !== undefined) {
        appendUniqueMethod(ctorExisting, "preDestroy", methodName);
      } else {
        lifecycleByConstructorMetadataMap.set(ctor, {
          postConstruct: [],
          preDestroy: [methodName],
        });
      }
    });

    try {
      const meta = context.metadata as Record<string | symbol, unknown>;
      if (meta !== null && typeof meta === "object") {
        if (!meta[LIFECYCLE_KEY]) {
          meta[LIFECYCLE_KEY] = { postConstruct: [], preDestroy: [] };
        }
        const lifecycle = meta[LIFECYCLE_KEY] as MutableLifecycleMetadata;
        appendUniqueMethod(lifecycle, "preDestroy", methodName);
      }
    } catch {
      // ignore
    }
  };
}
