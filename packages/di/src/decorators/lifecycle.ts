import { decoratorMetadataOf } from "#decorators/metadata-record";
import { PrivateLifecycleMethodError, StaticMemberDecoratorError, SymbolKeyedLifecycleError } from "#errors";
import { LIFECYCLE_KEY } from "#metadata/keys";
import type { MutableLifecycleMetadata } from "#metadata/types";

/** The only method a hook can be: the lifecycle reader calls it on the instance by its string name. */
type LifecycleMethodContext = ClassMethodDecoratorContext & {
  readonly static: false;
  readonly private: false;
  readonly name: string;
};

type LifecycleMethodDecorator = (target: unknown, context: LifecycleMethodContext) => void;

/** Records the decorated method under one lifecycle phase; both decorators differ only in that phase. */
function recordLifecycleMethod(phase: "postConstruct" | "preDestroy"): LifecycleMethodDecorator {
  // Typed wide on purpose: the checks below are what an untyped caller meets instead of the compiler.
  return function (target: unknown, context: ClassMethodDecoratorContext): void {
    if (context.static) {
      throw new StaticMemberDecoratorError(phase, String(context.name));
    }
    if (context.private) {
      throw new PrivateLifecycleMethodError(phase, String(context.name));
    }
    // The lifecycle reader keys methods by their string name, so a symbol-keyed method can never be
    // found again — fail here, where the declaration is, rather than at resolve.
    if (typeof context.name === "symbol") {
      throw new SymbolKeyedLifecycleError(phase, String(context.name));
    }
    const meta = decoratorMetadataOf(context, phase);
    // Own bucket only: `context.metadata` inherits the base class's record, and writing through an
    // inherited bucket would register this hook on the base class instead.
    if (!Object.hasOwn(meta, LIFECYCLE_KEY)) {
      meta[LIFECYCLE_KEY] = { postConstruct: [], preDestroy: [] };
    }
    const lifecycle = meta[LIFECYCLE_KEY] as MutableLifecycleMetadata;
    const methodName = String(context.name);
    if (!lifecycle[phase].includes(methodName)) {
      lifecycle[phase].push(methodName);
    }
  };
}

/**
 * Marks an instance method to run after the container constructs and wires the instance.
 *
 * @since 0.3.16-canary.0
 */
export function postConstruct(): LifecycleMethodDecorator {
  return recordLifecycleMethod("postConstruct");
}

/**
 * Marks an instance method to run when the instance's container or scope is disposed.
 *
 * @since 0.3.16-canary.0
 */
export function preDestroy(): LifecycleMethodDecorator {
  return recordLifecycleMethod("preDestroy");
}
