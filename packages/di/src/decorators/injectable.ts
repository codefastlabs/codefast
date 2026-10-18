import type { BindingBuilder } from "#core/binding-builders";
import { SyncModule } from "#core/module";
import type { BindingScope, Constructor } from "#core/types";
import { decoratorMetadataOf } from "#decorators/metadata-record";
import type { InjectableDependency, ResolvedDependencyValue } from "#injection/descriptor";
import { normalizeToDescriptor } from "#injection/descriptor";
import { INJECTABLE_KEY } from "#metadata/keys";
import type { ParamMetadata } from "#metadata/types";

// ── AutoRegisterRegistry ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The collector `@injectable` registers a class into: a module that binds every registered class to itself.
 *
 * @remarks It loads like any `SyncModule` — deduplicated and ref-counted, and torn down by `unload()`.
 * A load binds the entries registered by then; the set one load bound is the set its unload removes.
 *
 * @since 0.3.16-canary.0
 */
export interface AutoRegisterRegistry extends SyncModule {
  register(target: Constructor, scope: BindingScope): void;
  entries(): ReadonlyArray<{ target: Constructor; scope: BindingScope }>;
}

/**
 * Creates an empty auto-register registry, loaded under `name`.
 *
 * @since 0.3.16-canary.0
 */
export function createAutoRegisterRegistry(name: string): AutoRegisterRegistry {
  const registeredEntries: Array<{ target: Constructor; scope: BindingScope }> = [];
  // A setup callback rather than declarations, so a class decorated after the registry exists still loads.
  const module = SyncModule.create(name, (builder) => {
    for (const { target, scope } of registeredEntries) {
      APPLY_BINDING_SCOPE[scope](builder.bind(target).toSelf());
    }
  });
  return {
    ...module,
    register(target: Constructor, scope: BindingScope): void {
      registeredEntries.push({ target, scope });
    },
    entries(): ReadonlyArray<{ target: Constructor; scope: BindingScope }> {
      return registeredEntries;
    },
  };
}

// A Record rather than an if-chain, so a new `BindingScope` is a compile error here instead of
// silently landing in whichever branch happened to be last.
const APPLY_BINDING_SCOPE: Record<BindingScope, (builder: BindingBuilder<unknown>) => void> = {
  singleton: (builder) => {
    builder.singleton();
  },
  scoped: (builder) => {
    builder.scoped();
  },
  transient: (builder) => {
    builder.transient();
  },
};

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
 * Declares a class injectable, and what its constructor is to be handed.
 *
 * @remarks The decorator only accepts a class whose constructor takes exactly what `deps` resolve to, in that order —
 * no deps means no required parameter, so a class (or a subclass inheriting its base's constructor) cannot be built
 * with an argument left `undefined`. A deps *array* whose length the compiler cannot know skips the arity check.
 *
 * @since 0.3.16-canary.0
 */
export function injectable<const Deps extends ReadonlyArray<InjectableDependency> = []>(
  deps?: Deps,
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
    const meta = decoratorMetadataOf(context, "injectable");
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
    meta[INJECTABLE_KEY] = {
      params: parameterMetadataList,
    };

    if (options?.autoRegister !== undefined) {
      const scope: BindingScope = options.scope ?? "transient";
      options.autoRegister.register(target, scope);
    }
  };
}

export type { InjectableDependency };
