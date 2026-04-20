import type { Constructor, ResolveHint } from "#/binding";
import { CODEFAST_DI_ACCESSOR_INJECTIONS } from "#/metadata/metadata-keys";
import type { AccessorInjectionMetadata, InjectionDescriptor } from "#/metadata/metadata-types";
import { InternalError } from "#/errors";
import type { Token } from "#/token";

/**
 * Options forwarded to the container when resolving an injected dependency.
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
 * Creates an {@link InjectionDescriptor} for use in an `@injectable(deps)` array, or as an
 * `accessor` field decorator for post-construction property injection.
 *
 * As a deps-array entry: `@injectable([inject(Logger, { name: 'file' })])`
 * As an accessor decorator: `@inject(Logger) accessor logger!: LoggerService`
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
 * Same as {@link inject} but marks the dependency as optional — resolves to `undefined` instead
 * of throwing {@link TokenNotBoundError} when no binding exists.
 */
export function optional<Value>(
  token: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value> {
  return toDescriptor(token, true, options);
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
