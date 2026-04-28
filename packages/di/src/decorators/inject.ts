import type { Constructor, ResolveOptions } from "#/types";
import type { Token } from "#/token";
import { INJECT_ACCESSOR_KEY } from "#/metadata/metadata-keys";
import { MissingContainerContextError } from "#/errors";
import { getActiveContainer } from "#/environment";

// ── InjectionDescriptor ───────────────────────────────────────────────────────

export interface InjectOptions {
  name?: string;
  tags?: ReadonlyArray<readonly [tag: string, value: unknown]>;
}

export interface InjectionDescriptor<Value = unknown> {
  readonly token: Token<Value> | Constructor<Value>;
  readonly optional: boolean;
  readonly multi: boolean;
  readonly name?: string;
  readonly tags?: ReadonlyArray<readonly [string, unknown]>;
}

export type InjectableDependency<Value = unknown> =
  | Token<Value>
  | Constructor<Value>
  | InjectionDescriptor<Value>;

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

export function normalizeToDescriptor(dep: InjectableDependency): InjectionDescriptor {
  if (isInjectionDescriptor(dep)) {
    return dep;
  }
  return { token: dep as Token<unknown> | Constructor, optional: false, multi: false };
}

function buildInjectionDescriptor<const Value>(
  t: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value> {
  return {
    token: t,
    optional: false,
    multi: false,
    name: options?.name,
    tags: options?.tags,
  };
}

// ── inject() — dual-role ──────────────────────────────────────────────────────

type ClassAccessorDecorator<This, Value> = (
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>,
) => ClassAccessorDecoratorResult<This, Value> | void;

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
      const hint: ResolveOptions = {};
      if (options?.name !== undefined) {
        hint.name = options.name;
      }
      if (options?.tags !== undefined) {
        hint.tags = options.tags;
      }
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

export function optional<const Value>(
  t: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value | undefined> {
  return {
    token: t as Token<Value | undefined> | Constructor<Value | undefined>,
    optional: true,
    multi: false,
    name: options?.name,
    tags: options?.tags,
  };
}

// ── injectAll() ───────────────────────────────────────────────────────────────

export function injectAll<const Value>(
  t: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value[]> {
  return {
    token: t as Token<Value[]> | Constructor<Value[]>,
    optional: false,
    multi: true,
    name: options?.name,
    tags: options?.tags,
  };
}
