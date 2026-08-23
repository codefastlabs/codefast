import type { BindingScope, Constructor } from "#/core/types";
import type { InjectableDependency, ResolvedDependencyValue } from "#/injection/descriptor";
import { normalizeToDescriptor } from "#/injection/descriptor";
import { INJECTABLE_KEY } from "#/metadata/metadata-keys";
import type { ParamMetadata } from "#/metadata/metadata-types";

// ── AutoRegisterRegistry ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The collector `@injectable` registers a class into, for a container to bind later.
 *
 * @since 0.3.16-canary.0
 */
export interface AutoRegisterRegistry {
  register(target: Constructor, scope: BindingScope): void;
  entries(): ReadonlyArray<{ target: Constructor; scope: BindingScope }>;
}

/**
 * Creates an empty auto-register registry.
 *
 * @since 0.3.16-canary.0
 */
export function createAutoRegisterRegistry(): AutoRegisterRegistry {
  const registeredEntries: Array<{ target: Constructor; scope: BindingScope }> = [];
  return {
    register(target: Constructor, scope: BindingScope): void {
      registeredEntries.push({ target, scope });
    },
    entries(): ReadonlyArray<{ target: Constructor; scope: BindingScope }> {
      return registeredEntries;
    },
  };
}

// ── InjectableOptions ────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Auto-registration options `@injectable` accepts alongside its deps list.
 *
 * @since 0.3.16-canary.0
 */
export interface InjectableOptions {
  autoRegister?: AutoRegisterRegistry | undefined;
  scope?: BindingScope | undefined;
}

// ── @injectable() ────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The parameters a constructor is handed, given what its `deps` declare.
 *
 * @remarks Reuses the same reading a `toResolved` factory gets, so `injectAll` arrives as an array
 * and `optional` as possibly undefined in both places.
 */
type InjectedParameters<Deps extends ReadonlyArray<InjectableDependency>> = {
  -readonly [Index in keyof Deps]: ResolvedDependencyValue<Deps[Index]>;
};

/**
 * Declare a class injectable, and what its constructor is to be handed.
 *
 * @since 0.3.16-canary.0
 */
export function injectable(): (target: unknown, context: ClassDecoratorContext) => void;

/**
 * @remarks Declaring dependencies constrains the class: the decorator only accepts one whose
 * constructor takes exactly what `deps` resolve to, in that order — including arity, so a literal
 * deps list longer than the constructor is a compile error rather than a resolved-and-discarded
 * value. Optional trailing parameters admit every arity they declare, and a rest parameter admits
 * any list. A deps *array* — one whose length the compiler cannot know — skips the arity check,
 * which is also the deliberate spelling for declaring more dependencies than the constructor
 * takes, e.g. for the dependency graph's edges.
 *
 * @since 0.3.16-canary.0
 */
export function injectable<const Deps extends ReadonlyArray<InjectableDependency>>(
  deps: Deps,
  options?: InjectableOptions,
): <Target extends abstract new (...args: InjectedParameters<Deps>) => unknown>(
  target: Target &
    (number extends Deps["length"]
      ? unknown
      : Deps["length"] extends ConstructorParameters<Target>["length"]
        ? unknown
        : never),
  context: ClassDecoratorContext,
) => void;

/**
 * Writes the declared dependencies into the class's metadata and optionally auto-registers it.
 *
 * @since 0.6.0
 */
export function injectable(
  deps?: ReadonlyArray<InjectableDependency>,
  options?: InjectableOptions,
): (target: never, context: ClassDecoratorContext) => void {
  return function (target: never, context: ClassDecoratorContext): void {
    const parameterMetadataList: Array<ParamMetadata> = (deps ?? []).map((dependency, index) => {
      const descriptor = normalizeToDescriptor(dependency);
      const baseParameterMetadata: Pick<ParamMetadata, "index" | "token" | "optional" | "multi"> = {
        index,
        token: descriptor.token,
        optional: descriptor.optional,
        multi: descriptor.multi,
      };
      if (descriptor.name !== undefined && descriptor.tags !== undefined) {
        return { ...baseParameterMetadata, name: descriptor.name, tags: descriptor.tags };
      }
      if (descriptor.name !== undefined) {
        return { ...baseParameterMetadata, name: descriptor.name };
      }
      if (descriptor.tags !== undefined) {
        return { ...baseParameterMetadata, tags: descriptor.tags };
      }
      return baseParameterMetadata;
    });

    // Field decorators run before the class decorator — accessor @inject entries are
    // already on context.metadata by the time this runs.
    (context.metadata as Record<string | symbol, unknown>)[INJECTABLE_KEY] = {
      params: parameterMetadataList,
    };

    if (options?.autoRegister !== undefined) {
      const scope: BindingScope = options.scope ?? "transient";
      options.autoRegister.register(target as Constructor, scope);
    }
  };
}

export type { InjectableDependency };
