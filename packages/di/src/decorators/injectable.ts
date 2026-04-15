import { InvalidBindingError } from "#lib/errors";
import {
  CODEFAST_DI_CONSTRUCTOR_METADATA,
  type ConstructorMetadata,
  type ParamMetadata,
} from "#lib/decorators/metadata";
import { takePendingMap } from "#lib/decorators/param-registry";

function finalizePending(pending: Map<number, ParamMetadata>): readonly ParamMetadata[] {
  const indices = [...pending.keys()].sort((a, b) => a - b);
  if (indices.length === 0) {
    return [];
  }
  const max = indices[indices.length - 1];
  const out: ParamMetadata[] = [];
  for (let parameterIndex = 0; parameterIndex <= max; parameterIndex++) {
    const meta = pending.get(parameterIndex);
    if (meta === undefined) {
      throw new InvalidBindingError(
        `Missing inject metadata for constructor parameter index ${String(parameterIndex)}.`,
      );
    }
    out.push(meta);
  }
  return out;
}

/**
 * Stage 3 class decorator: merges pending parameter registrations into `context.metadata` / `Symbol.metadata`
 * and clears the temporary WeakMap bucket for this constructor.
 */
export function injectable(): <Class extends abstract new (...args: never[]) => unknown>(
  ctor: Class,
  context: ClassDecoratorContext<Class>,
) => void {
  return (ctor, context) => {
    const pending = takePendingMap(ctor);
    const ctorFn = ctor as unknown as { readonly length: number };
    const declaredArity = ctorFn.length;
    if (declaredArity > 0 && (pending === undefined || pending.size === 0)) {
      throw new InvalidBindingError(
        `Class "${String(context.name ?? ctor.name)}" declares constructor parameters but no inject registrations were found. Call inject.param(...) / injectOptional.param(...) from a static block before @injectable() runs.`,
      );
    }

    const parameters: readonly ParamMetadata[] =
      pending === undefined || pending.size === 0 ? [] : finalizePending(pending);

    const payload: ConstructorMetadata = { parameters };
    const metadataRecord = context.metadata as Record<PropertyKey, unknown>;
    metadataRecord[CODEFAST_DI_CONSTRUCTOR_METADATA] = payload;
  };
}
