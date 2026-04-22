import { InternalError } from "#/errors";
import {
  CODEFAST_DI_CONSTRUCTOR_METADATA,
  CODEFAST_DI_INJECT_ACCESSOR_FACTORY,
} from "#/metadata/metadata-keys";
import type {
  ConstructorMetadata,
  InjectionDescriptor,
  ParamMetadata,
} from "#/metadata/metadata-types";
import { isInjectionDescriptor } from "#/decorators/inject";
import type { BindingScope, Constructor } from "#/binding";
import type { Token } from "#/token";

/**
 * A single entry in the `deps` array passed to `@injectable()`.
 * Can be a plain token/constructor (resolved with no hint) or an {@link InjectionDescriptor}
 * produced by `inject` / `optional` / `injectAll` when name, tag, optional, or
 * `isInjectAllBindings` semantics are needed.
 */
export type InjectableDependency =
  | Token<unknown>
  | Constructor<unknown>
  | InjectionDescriptor<unknown>;

/**
 * Global mutable registry of classes decorated with `@injectable({ autoRegister: true })`.
 * Populated at class-definition time (via `context.addInitializer`), drained by
 * {@link Container.loadAutoRegistered}. Entries accumulate for the lifetime of the process.
 */
const AUTO_REGISTER_REGISTRY: Array<{
  implementationClass: Constructor<unknown>;
  scope: BindingScope;
}> = [];

/**
 * Returns all classes decorated with `@injectable({ autoRegister: true })`.
 * Pass to {@link Container.loadAutoRegistered} or iterate manually to bind them.
 */
export function getAutoRegistered(): ReadonlyArray<{
  implementationClass: Constructor<unknown>;
  scope: BindingScope;
}> {
  return AUTO_REGISTER_REGISTRY;
}

/**
 * Normalises a single `@injectable` deps-array entry into the uniform {@link ParamMetadata}
 * shape used by the resolver's constructor-instantiation path.
 *
 * - {@link InjectionDescriptor} entries carry `optional`, `name`, `tag`, and `isInjectAllBindings` fields.
 * - Plain token / constructor entries are wrapped with `optional: false` and no hint.
 */
function toParamMetadata(dependency: InjectableDependency, index: number): ParamMetadata {
  if (isInjectionDescriptor(dependency)) {
    if (CODEFAST_DI_INJECT_ACCESSOR_FACTORY in dependency) {
      return {
        index,
        token: dependency.token,
        optional: dependency.optional,
        name: undefined,
        tag: undefined,
        isInjectAllBindings: undefined,
      };
    }
    return {
      index,
      token: dependency.token,
      optional: dependency.optional,
      name: dependency.name,
      tag: dependency.tag,
      isInjectAllBindings: dependency.isInjectAllBindings === true ? true : undefined,
    };
  }
  return {
    index,
    token: dependency,
    optional: false,
  };
}

/**
 * Stage 3 class decorator that writes constructor dependency metadata into `Symbol.metadata`.
 *
 * @param deps - Ordered list of constructor parameters; length must match the class arity.
 * @param autoRegisterOptions - Optional auto-registration flags.
 * @param autoRegisterOptions.autoRegister - When `true`, registers the class in {@link getAutoRegistered} at
 *   class-definition time so {@link Container.loadAutoRegistered} can bind it automatically.
 * @param autoRegisterOptions.scope - Scope used when auto-registering; defaults to `"transient"`.
 *
 * @example
 * ```ts
 * @injectable([Logger, inject(Config, { name: "app" })])
 * class UserService { constructor(log: Logger, cfg: AppConfig) {} }
 * ```
 */
export function injectable(
  deps: readonly InjectableDependency[] = [],
  autoRegisterOptions?: { autoRegister?: boolean; scope?: BindingScope },
): <Class extends abstract new (...args: never[]) => unknown>(
  implementationClass: Class,
  context: ClassDecoratorContext<Class>,
) => void {
  return (implementationClass, context) => {
    const ctorFn = implementationClass as unknown as { readonly length: number };
    const declaredArity = ctorFn.length;
    if (declaredArity !== deps.length) {
      throw new InternalError(
        `Class "${String(context.name ?? implementationClass.name)}" declares ${String(declaredArity)} constructor parameters but @injectable(...) received ${String(deps.length)} dependency descriptors.`,
      );
    }

    const params: readonly ParamMetadata[] = deps.map((dependency, index) =>
      toParamMetadata(dependency, index),
    );
    const payload: ConstructorMetadata = { params };
    const metadataRecord = context.metadata as Record<PropertyKey, unknown>;
    metadataRecord[CODEFAST_DI_CONSTRUCTOR_METADATA] = payload;

    if (autoRegisterOptions?.autoRegister === true) {
      const scope = autoRegisterOptions.scope ?? "transient";
      // context.addInitializer runs once per class definition (NOT per instance)
      context.addInitializer(function (this: unknown) {
        AUTO_REGISTER_REGISTRY.push({
          implementationClass: this as Constructor<unknown>,
          scope,
        });
      });
    }
  };
}
