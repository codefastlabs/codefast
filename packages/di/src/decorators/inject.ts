import type { Constructor, ResolveHint } from "#/binding";
import { CODEFAST_DI_ACCESSOR_INJECTIONS } from "#/metadata/metadata-keys";
import type { AccessorInjectionMetadata, InjectionDescriptor } from "#/metadata/metadata-types";
import { InternalError } from "#/errors";
import type { Token } from "#/token";

/**
 * Name/tag hint forwarded to the container when resolving an injected dependency.
 * Alias for {@link ResolveHint}; used as the second parameter of {@link inject} and {@link optional}.
 */
export type InjectOptions = ResolveHint;

/**
 * Validates and normalises the `tag` option from {@link InjectOptions}; throws {@link InternalError} on bad input.
 */
function normalizeTag(tag: ResolveHint["tag"] | undefined): InjectionDescriptor["tag"] | undefined {
  if (tag === undefined) {
    return undefined;
  }
  if (!Array.isArray(tag) || tag.length !== 2) {
    throw new InternalError(
      `@inject tag must be a tuple [tagKey, value] with length 2; received ${String(tag)}`,
    );
  }
  const [tagName, value] = tag;
  if (typeof tagName !== "string") {
    throw new InternalError(`@inject tag key must be a string; received ${typeof tagName}`);
  }
  return [tagName, value];
}

/**
 * Builds an {@link InjectionDescriptor} from a token, optional flag, and raw inject options.
 */
function toDescriptor<Value>(
  token: Token<Value> | Constructor<Value>,
  optional: boolean,
  options: InjectOptions | undefined,
): InjectionDescriptor<Value> {
  const normalizedTag = normalizeTag(options?.tag);
  if (options?.name !== undefined) {
    return { token, optional, name: options.name };
  }
  if (normalizedTag !== undefined) {
    return { token, optional, tag: normalizedTag };
  }
  return { token, optional };
}

/**
 * Type guard — returns `true` when `value` is a TC39 `ClassAccessorDecoratorContext` (accessor field).
 */
function isAccessorDecoratorContext(value: unknown): value is ClassAccessorDecoratorContext {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    (value as { kind: unknown }).kind === "accessor"
  );
}

/**
 * Dual-purpose injection helper:
 *
 * **1. As a deps-array entry** — returns an {@link InjectionDescriptor} carrying the token,
 * optional flag (`false`), and any name/tag hint. Used inside `@injectable([...deps])`.
 *
 * ```ts
 * @injectable([inject(Logger, { name: 'file' })])
 * class UserService { constructor(log: Logger) {} }
 * ```
 *
 * **2. As a Stage 3 accessor decorator** — writes accessor-injection metadata into
 * `Symbol.metadata` and returns a no-op sentinel. The container performs the actual
 * injection after construction.
 *
 * ```ts
 * @inject(Logger) accessor logger!: LoggerService;
 * ```
 *
 * @param token - The injection key (token or constructor) to resolve.
 * @param optionsOrContext - Either an {@link InjectOptions} hint or the TC39
 *   `ClassAccessorDecoratorContext` automatically supplied by the runtime.
 */
export function inject<Value>(
  token: Token<Value> | Constructor<Value>,
  optionsOrContext?: InjectOptions | ClassAccessorDecoratorContext,
): InjectionDescriptor<Value> {
  if (isAccessorDecoratorContext(optionsOrContext)) {
    const ctx = optionsOrContext;
    const metaRecord = ctx.metadata as Record<PropertyKey, unknown>;
    const key = CODEFAST_DI_ACCESSOR_INJECTIONS;
    if (!Array.isArray(metaRecord[key])) {
      metaRecord[key] = [];
    }
    (metaRecord[key] as AccessorInjectionMetadata[]).push({
      name: String(ctx.name),
      token: token as Token<unknown> | Constructor<unknown>,
      optional: false,
    });
    return undefined as unknown as InjectionDescriptor<Value>; // no-op — container does the injection post-construction
  }
  return toDescriptor(token, false, optionsOrContext as InjectOptions | undefined);
}

/**
 * Same as {@link inject} but marks the dependency as optional (`InjectionDescriptor.optional = true`).
 * During resolution, an unbound token resolves to `undefined` instead of throwing
 * {@link TokenNotBoundError}. Only usable as a deps-array entry (not as an accessor decorator).
 */
export function optional<Value>(
  token: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value> {
  return toDescriptor(token, true, options);
}

/**
 * Deps-array helper for `@injectable()`: injects **all** bindings registered for `token`
 * (same semantics as {@link Container.resolveAll} / {@link ResolutionContext.resolveAll}).
 * Use for multi-binding — constructor parameter type should be `T[]` (or a readonly array).
 *
 * Optional {@link InjectOptions.name} / `tag` narrow which bindings are collected (unusual; most
 * callers omit options and register disambiguators on each binding instead).
 */
export function injectAll<Value>(
  token: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value> {
  return { ...toDescriptor(token, false, options), isInjectAllBindings: true as const };
}

/**
 * Type-guard — returns `true` when `value` is an {@link InjectionDescriptor}.
 */
export function isInjectionDescriptor(value: unknown): value is InjectionDescriptor {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return "token" in value && "optional" in value;
}
