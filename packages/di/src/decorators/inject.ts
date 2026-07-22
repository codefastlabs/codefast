import { InternalError, MissingContainerContextError } from "#/errors";
import { INJECT_ACCESSOR_KEY } from "#/metadata/metadata-keys";
import { getActiveContainer } from "#/resolution/environment";
import { injectionSlotToResolveOptions } from "#/resolution/resolve-options";
import type { Token } from "#/token";
import type { BindingTag, Constructor } from "#/types";

// ── InjectionDescriptor ───────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface InjectOptions {
  name?: string;
  tags?: ReadonlyArray<BindingTag>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface InjectionDescriptor<Value = unknown> {
  readonly token: Token<Value> | Constructor<Value>;
  readonly optional: boolean;
  readonly multi: boolean;
  readonly name?: string;
  readonly tags?: ReadonlyArray<BindingTag>;
}

/**
 * @since 0.3.16-canary.0
 */
export type InjectableDependency<Value = unknown> = Token<Value> | Constructor<Value> | InjectionDescriptor<Value>;

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
export function normalizeToDescriptor(dependency: InjectableDependency): InjectionDescriptor {
  if (isInjectionDescriptor(dependency)) {
    return materializeInjectionDescriptor(dependency);
  }
  return { token: dependency as Token<unknown> | Constructor, optional: false, multi: false };
}

/**
 * Dual-role `inject()` values are functions: [[Function]].name must not be treated as a DI slot name.
 * Only enumerable own `name` / `tags` from `Object.defineProperties` are real injection options.
 */
function materializeInjectionDescriptor(dependency: InjectionDescriptor): InjectionDescriptor {
  if (typeof dependency !== "function") {
    return dependency;
  }
  const dualRole = dependency as InjectionDescriptor & ((...args: Array<unknown>) => unknown);
  const base: Pick<InjectionDescriptor, "token" | "optional" | "multi"> = {
    token: dualRole.token,
    optional: dualRole.optional,
    multi: dualRole.multi,
  };
  const nameDesc = Object.getOwnPropertyDescriptor(dualRole, "name");
  const tagsDesc = Object.getOwnPropertyDescriptor(dualRole, "tags");
  const explicitName = nameDesc?.enumerable === true && typeof nameDesc.value === "string" ? nameDesc.value : undefined;
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

function withOptions<DescValue>(
  base: Pick<InjectionDescriptor<DescValue>, "token" | "optional" | "multi">,
  options: InjectOptions | undefined,
): InjectionDescriptor<DescValue> {
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

function buildInjectionDescriptor<const Value>(
  token: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value> {
  return withOptions({ token, optional: false, multi: false }, options);
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
  token: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value> & ClassAccessorDecorator<unknown, Value> {
  const descriptor = buildInjectionDescriptor(token, options);

  const decoratorFn = (
    _target: ClassAccessorDecoratorTarget<unknown, Value>,
    context: ClassAccessorDecoratorContext<unknown, Value>,
  ): ClassAccessorDecoratorResult<unknown, Value> => {
    if (context.static) {
      throw new InternalError(
        "@inject() on static accessors is not supported; only instance accessors participate in runWithContainer-based property injection.",
      );
    }
    const meta = context.metadata as Record<string | symbol, unknown>;
    if (!Array.isArray(meta[INJECT_ACCESSOR_KEY])) {
      meta[INJECT_ACCESSOR_KEY] = [];
    }
    (meta[INJECT_ACCESSOR_KEY] as Array<{ key: string | symbol; descriptor: InjectionDescriptor }>).push({
      key: context.name,
      descriptor,
    });

    context.addInitializer(function (this: unknown) {
      const container = getActiveContainer();
      if (container === undefined) {
        throw new MissingContainerContextError(String(context.name));
      }
      const resolveOptions =
        options === undefined
          ? undefined
          : injectionSlotToResolveOptions({
              ...(options.name !== undefined ? { name: options.name } : {}),
              ...(options.tags !== undefined ? { tags: options.tags } : {}),
            });
      const value = descriptor.optional
        ? container.resolveOptional(token, resolveOptions)
        : container.resolve(token, resolveOptions);
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

  return decoratorFn as unknown as InjectionDescriptor<Value> & ClassAccessorDecorator<unknown, Value>;
}

// ── optional() ────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export function optional<const Value>(
  token: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value | undefined> {
  return withOptions(
    {
      token: token as Token<Value | undefined> | Constructor<Value | undefined>,
      optional: true,
      multi: false,
    },
    options,
  );
}

// ── injectAll() ───────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export function injectAll<const Value>(
  token: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Array<Value>> {
  return withOptions(
    {
      token: token as Token<Array<Value>> | Constructor<Array<Value>>,
      optional: false,
      multi: true,
    },
    options,
  );
}
