import { getActiveContainer, getAmbientResolution } from "#/ambient/active-container";
/** `@inject` — the accessor-decorator channel, resolving from the ambient container. */
import type { Token } from "#/core/token";
import type { Constructor } from "#/core/types";
import { MissingContainerContextError, StaticMemberDecoratorError } from "#/errors/errors";
import type { InjectionDescriptor, InjectOptions } from "#/injection/descriptor";
import { buildInjectionDescriptor } from "#/injection/descriptor";
import { injectionSlotToResolveOptions } from "#/injection/resolve-options";
import { INJECT_ACCESSOR_KEY } from "#/metadata/metadata-keys";

/**
 * The name of the class being constructed, or `undefined` when there is none to report.
 *
 * @remarks Two ways there is none: an anonymous class expression has an empty `name`, and an
 * instance whose prototype chain answers no `constructor` has nothing to read. Narrowed rather than
 * asserted — the value arrives as `unknown` and the platform makes no promise about it.
 */
function classNameOf(instance: unknown): string | undefined {
  if (typeof instance !== "object" || instance === null) {
    return undefined;
  }
  const constructor: unknown = Reflect.get(instance, "constructor");
  if (typeof constructor !== "function" || constructor.name === "") {
    return undefined;
  }

  return constructor.name;
}

// ── inject() — dual-role ─────────────────────────────────────────────────────────────────────────────────────────────

type ClassAccessorDecorator<This, Value> = (
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>,
) => ClassAccessorDecoratorResult<This, Value> | void;

/**
 * Creates a dual-role value: an injection descriptor that also works as a class accessor decorator.
 *
 * @since 0.3.16-canary.0
 */
export function inject<Value>(
  token: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value> & ClassAccessorDecorator<unknown, Value> {
  const descriptor = buildInjectionDescriptor(token, options);
  // Derived from the descriptor, not from `options`: the descriptor is where the tag shorthand has
  // already been folded. Built once here rather than per constructed instance.
  const resolveOptions = injectionSlotToResolveOptions(descriptor);

  const decoratorFn = (
    _target: ClassAccessorDecoratorTarget<unknown, Value>,
    context: ClassAccessorDecoratorContext<unknown, Value>,
  ): ClassAccessorDecoratorResult<unknown, Value> => {
    if (context.static) {
      throw new StaticMemberDecoratorError("inject", String(context.name));
    }
    const meta = context.metadata as Record<string | symbol, unknown>;
    // Own bucket only: the metadata record inherits the base class's, and pushing into an inherited
    // array would register this accessor on the base class instead.
    if (!Object.hasOwn(meta, INJECT_ACCESSOR_KEY) || !Array.isArray(meta[INJECT_ACCESSOR_KEY])) {
      meta[INJECT_ACCESSOR_KEY] = [];
    }
    (meta[INJECT_ACCESSOR_KEY] as Array<{ key: string | symbol; descriptor: InjectionDescriptor }>).push({
      key: context.name,
      descriptor,
    });

    context.addInitializer(function (this: unknown) {
      // Prefer the engine's path-continuing resolver: it keeps this accessor's dependencies on the
      // live resolution path, so a cycle through an accessor is detected instead of recursing.
      const ambient = getAmbientResolution();
      if (ambient !== undefined) {
        const value = descriptor.optional
          ? ambient.resolveOptional(token, resolveOptions)
          : ambient.resolve(token, resolveOptions);
        context.access.set(this, value as Value);
        return;
      }
      const container = getActiveContainer();
      if (container === undefined) {
        throw new MissingContainerContextError(classNameOf(this), context.name);
      }
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

  return decoratorFn as InjectionDescriptor<Value> & ClassAccessorDecorator<unknown, Value>;
}
