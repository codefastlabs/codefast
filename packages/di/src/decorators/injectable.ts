import { DiError } from "#/errors";
import {
  CODEFAST_DI_CONSTRUCTOR_METADATA,
  type ConstructorMetadata,
  type InjectionDescriptor,
  type ParamMetadata,
} from "#/decorators/metadata";
import { isInjectionDescriptor } from "#/decorators/inject";
import type { Constructor } from "#/binding";
import type { Token } from "#/token";

export type InjectableDependency =
  | Token<unknown>
  | Constructor<unknown>
  | InjectionDescriptor<unknown>;

function toParamMetadata(dependency: InjectableDependency, index: number): ParamMetadata {
  if (isInjectionDescriptor(dependency)) {
    return {
      index,
      token: dependency.token,
      optional: dependency.optional,
      name: dependency.name,
      tag: dependency.tag,
    };
  }
  return {
    index,
    token: dependency,
    optional: false,
  };
}

/**
 * Stage 3 class decorator: writes explicit constructor dependency metadata into `Symbol.metadata`.
 */
export function injectable(
  deps: readonly InjectableDependency[] = [],
): <Class extends abstract new (...args: never[]) => unknown>(
  ctor: Class,
  context: ClassDecoratorContext<Class>,
) => void {
  return (ctor, context) => {
    const ctorFn = ctor as unknown as { readonly length: number };
    const declaredArity = ctorFn.length;
    if (declaredArity !== deps.length) {
      throw new DiError(
        `Class "${String(context.name ?? ctor.name)}" declares ${String(declaredArity)} constructor parameters but @injectable(...) received ${String(deps.length)} dependency descriptors.`,
      );
    }

    const params: readonly ParamMetadata[] = deps.map((dependency, index) =>
      toParamMetadata(dependency, index),
    );
    const payload: ConstructorMetadata = { params };
    const metadataRecord = context.metadata as Record<PropertyKey, unknown>;
    metadataRecord[CODEFAST_DI_CONSTRUCTOR_METADATA] = payload;
  };
}
