import type { BindingScope, Constructor } from "#/types";
import type { ParamMetadata } from "#/metadata/metadata-types";
import type { InjectableDependency } from "#/decorators/inject";
import { normalizeToDescriptor } from "#/decorators/inject";
import { INJECTABLE_KEY, constructorMetadataMap } from "#/metadata/metadata-keys";

// ── AutoRegisterRegistry ──────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface AutoRegisterRegistry {
  register(target: Constructor, scope: BindingScope): void;
  entries(): ReadonlyArray<{ target: Constructor; scope: BindingScope }>;
}

/**
 * @since 0.3.16-canary.0
 */
export function createAutoRegisterRegistry(): AutoRegisterRegistry {
  const _registeredEntries: Array<{ target: Constructor; scope: BindingScope }> = [];
  return {
    register(target: Constructor, scope: BindingScope): void {
      _registeredEntries.push({ target, scope });
    },
    entries(): ReadonlyArray<{ target: Constructor; scope: BindingScope }> {
      return _registeredEntries;
    },
  };
}

// ── InjectableOptions ─────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface InjectableOptions {
  autoRegister?: AutoRegisterRegistry;
  scope?: BindingScope;
}

// ── @injectable() ─────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export function injectable(
  deps?: ReadonlyArray<InjectableDependency>,
  options?: InjectableOptions,
): (target: unknown, context: ClassDecoratorContext) => void {
  return function (target: unknown, context: ClassDecoratorContext): void {
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

    const constructorMetadata = { params: parameterMetadataList };

    // Write to WeakMap (works with both SWC and esbuild/tsx)
    constructorMetadataMap.set(target as object, constructorMetadata);

    // Also write to Symbol.metadata if available (for full TC39 Stage 3 compliance)
    try {
      const metadata = context.metadata as Record<string | symbol, unknown>;
      if (metadata !== null && typeof metadata === "object") {
        metadata[INJECTABLE_KEY] = constructorMetadata;
      }
    } catch {
      // Ignore if context.metadata is not writable
    }

    if (options?.autoRegister !== undefined) {
      const scope: BindingScope = options.scope ?? "transient";
      options.autoRegister.register(target as Constructor, scope);
    }
  };
}

export type { InjectableDependency };
