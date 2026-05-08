import type { Constructor } from "#/types";
import type { Token } from "#/token";
import { INJECT_ACCESSOR_KEY } from "#/metadata/metadata-keys";
import { MissingContainerContextError } from "#/errors";
import { getActiveContainer } from "#/environment";
import { injectableSlotToResolveOptions } from "#/resolve-options";

// ── InjectionDescriptor ───────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface InjectOptions {
  name?: string;
  tags?: ReadonlyArray<readonly [tag: string, value: unknown]>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface InjectionDescriptor<Value = unknown> {
  readonly token: Token<Value> | Constructor<Value>;
  readonly optional: boolean;
  readonly multi: boolean;
  readonly name?: string;
  readonly tags?: ReadonlyArray<readonly [string, unknown]>;
}

/**
 * @since 0.3.16-canary.0
 */
export type InjectableDependency<Value = unknown> =
  | Token<Value>
  | Constructor<Value>
  | InjectionDescriptor<Value>;

/**
 * @since 0.3.16-canary.0
 */
export function isInjectionDescriptor(value: unknown): value is InjectionDescriptor {
  if (value === null || value === undefined) {
    return false;
  }
  const type = typeof value;
  // inject() returns a function (dual-role), so must check both object and function
  if (type !== "object" && type !== "function") {
    return false;
  }
  return (
    "token" in (value as object) &&
    "optional" in (value as object) &&
    "multi" in (value as object) &&
    typeof (value as InjectionDescriptor).optional === "boolean" &&
    typeof (value as InjectionDescriptor).multi === "boolean"
  );
}

/**
 * @since 0.3.16-canary.0
 */
export function normalizeToDescriptor(dep: InjectableDependency): InjectionDescriptor {
  if (isInjectionDescriptor(dep)) {
    return materializeInjectionDescriptor(dep);
  }
  return { token: dep as Token<unknown> | Constructor, optional: false, multi: false };
}

/**
 * Dual-role `inject()` values are functions: [[Function]].name must not be treated as a DI slot name.
 * Only enumerable own `name` / `tags` from `Object.defineProperties` are real injection options.
 */
function materializeInjectionDescriptor(dep: InjectionDescriptor): InjectionDescriptor {
  if (typeof dep !== "function") {
    return dep;
  }
  const dualRole = dep as InjectionDescriptor & ((...args: Array<unknown>) => unknown);
  const base: Pick<InjectionDescriptor<unknown>, "token" | "optional" | "multi"> = {
    token: dualRole.token,
    optional: dualRole.optional,
    multi: dualRole.multi,
  };
  const nameDesc = Object.getOwnPropertyDescriptor(dualRole, "name");
  const tagsDesc = Object.getOwnPropertyDescriptor(dualRole, "tags");
  const explicitName =
    nameDesc?.enumerable === true && typeof nameDesc.value === "string"
      ? nameDesc.value
      : undefined;
  const explicitTags = tagsDesc?.enumerable === true ? tagsDesc.value : undefined;

  if (explicitName !== undefined && explicitTags !== undefined) {
    return {
      ...base,
      name: explicitName,
      tags: explicitTags as NonNullable<InjectionDescriptor["tags"]>,
    };
  }
  if (explicitName !== undefined) {
    return { ...base, name: explicitName };
  }
  if (explicitTags !== undefined) {
    return { ...base, tags: explicitTags as NonNullable<InjectionDescriptor["tags"]> };
  }
  return base;
}

function buildInjectionDescriptor<const Value>(
  t: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value> {
  const base: Pick<InjectionDescriptor<Value>, "token" | "optional" | "multi"> = {
    token: t,
    optional: false,
    multi: false,
  };
  if (options?.name !== undefined && options.tags !== undefined) {
    return { ...base, name: options.name, tags: options.tags };
  }
  if (options?.name !== undefined) {
    return { ...base, name: options.name };
  }
  if (options?.tags !== undefined) {
    return { ...base, tags: options.tags };
  }
  return base;
}

// ── inject() — dual-role ──────────────────────────────────────────────────────

type ClassAccessorDecorator<This, Value> = (
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>,
) => ClassAccessorDecoratorResult<This, Value> | void;

/**
 * @since 0.3.16-canary.0
 */
export function inject<const Value>(
  t: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value> & ClassAccessorDecorator<unknown, Value> {
  const descriptor = buildInjectionDescriptor(t, options);

  const decoratorFn = (
    _target: ClassAccessorDecoratorTarget<unknown, Value>,
    context: ClassAccessorDecoratorContext<unknown, Value>,
  ): ClassAccessorDecoratorResult<unknown, Value> => {
    const meta = context.metadata as Record<string | symbol, unknown>;
    if (!Array.isArray(meta[INJECT_ACCESSOR_KEY])) {
      meta[INJECT_ACCESSOR_KEY] = [];
    }
    (
      meta[INJECT_ACCESSOR_KEY] as Array<{ key: string | symbol; descriptor: InjectionDescriptor }>
    ).push({
      key: context.name,
      descriptor,
    });

    context.addInitializer(function (this: unknown) {
      const container = getActiveContainer();
      if (container === undefined) {
        throw new MissingContainerContextError(String(context.name));
      }
      const hint =
        options === undefined
          ? undefined
          : injectableSlotToResolveOptions({
              ...(options.name !== undefined ? { name: options.name } : {}),
              ...(options.tags !== undefined ? { tags: options.tags } : {}),
            });
      const value = descriptor.optional
        ? container.resolveOptional(t, hint)
        : container.resolve(t, hint);
      context.access.set(this, value as Value);
    });

    return {};
  };

  // Use defineProperties to handle read-only `name` property of functions
  const props: PropertyDescriptorMap = {};
  for (const key of Object.keys(descriptor) as Array<keyof typeof descriptor>) {
    props[key] = { value: descriptor[key], writable: true, enumerable: true, configurable: true };
  }
  Object.defineProperties(decoratorFn, props);

  return decoratorFn as unknown as InjectionDescriptor<Value> &
    ClassAccessorDecorator<unknown, Value>;
}

// ── optional() ────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export function optional<const Value>(
  t: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value | undefined> {
  const base: Pick<InjectionDescriptor<Value | undefined>, "token" | "optional" | "multi"> = {
    token: t as Token<Value | undefined> | Constructor<Value | undefined>,
    optional: true,
    multi: false,
  };
  if (options?.name !== undefined && options.tags !== undefined) {
    return { ...base, name: options.name, tags: options.tags };
  }
  if (options?.name !== undefined) {
    return { ...base, name: options.name };
  }
  if (options?.tags !== undefined) {
    return { ...base, tags: options.tags };
  }
  return base;
}

// ── injectAll() ───────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export function injectAll<const Value>(
  t: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Array<Value>> {
  const base: Pick<InjectionDescriptor<Array<Value>>, "token" | "optional" | "multi"> = {
    token: t as Token<Array<Value>> | Constructor<Array<Value>>,
    optional: false,
    multi: true,
  };
  if (options?.name !== undefined && options.tags !== undefined) {
    return { ...base, name: options.name, tags: options.tags };
  }
  if (options?.name !== undefined) {
    return { ...base, name: options.name };
  }
  if (options?.tags !== undefined) {
    return { ...base, tags: options.tags };
  }
  return base;
}
