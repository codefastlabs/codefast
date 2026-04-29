import type { BindingScope, Constructor } from "#/types";
import type { ParamMetadata } from "#/metadata/metadata-types";
import type { InjectableDependency } from "#/decorators/inject";
import { normalizeToDescriptor } from "#/decorators/inject";
import { INJECTABLE_KEY, constructorMetadataMap } from "#/metadata/metadata-keys";

// ── AutoRegisterRegistry ──────────────────────────────────────────────────────

export interface AutoRegisterRegistry {
  register(target: Constructor, scope: BindingScope): void;
  entries(): ReadonlyArray<{ target: Constructor; scope: BindingScope }>;
}

export function createAutoRegisterRegistry(): AutoRegisterRegistry {
  const _entries: Array<{ target: Constructor; scope: BindingScope }> = [];
  return {
    register(target: Constructor, scope: BindingScope): void {
      _entries.push({ target, scope });
    },
    entries(): ReadonlyArray<{ target: Constructor; scope: BindingScope }> {
      return _entries;
    },
  };
}

// ── InjectableOptions ─────────────────────────────────────────────────────────

export interface InjectableOptions {
  autoRegister?: AutoRegisterRegistry;
  scope?: BindingScope;
}

// ── @injectable() ─────────────────────────────────────────────────────────────

export function injectable(
  deps?: readonly InjectableDependency[],
  options?: InjectableOptions,
): (target: unknown, context: ClassDecoratorContext) => void {
  return function (target: unknown, context: ClassDecoratorContext): void {
    const params: ParamMetadata[] = (deps ?? []).map((dep, index) => {
      const descriptor = normalizeToDescriptor(dep);
      const base: Pick<ParamMetadata, "index" | "token" | "optional" | "multi"> = {
        index,
        token: descriptor.token,
        optional: descriptor.optional,
        multi: descriptor.multi,
      };
      if (descriptor.name !== undefined && descriptor.tags !== undefined) {
        return { ...base, name: descriptor.name, tags: descriptor.tags };
      }
      if (descriptor.name !== undefined) {
        return { ...base, name: descriptor.name };
      }
      if (descriptor.tags !== undefined) {
        return { ...base, tags: descriptor.tags };
      }
      return base;
    });

    const constructorMeta = { params };

    // Write to WeakMap (works with both SWC and esbuild/tsx)
    constructorMetadataMap.set(target as object, constructorMeta);

    // Also write to Symbol.metadata if available (for full TC39 Stage 3 compliance)
    try {
      const meta = context.metadata as Record<string | symbol, unknown>;
      if (meta !== null && typeof meta === "object") {
        meta[INJECTABLE_KEY] = constructorMeta;
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
