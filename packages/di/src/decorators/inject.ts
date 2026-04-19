import type { Constructor, ResolveHint } from "#/binding";
import {
  type AccessorInjectionMetadata,
  CODEFAST_DI_ACCESSOR_INJECTIONS,
  type InjectionDescriptor,
} from "#/decorators/metadata";
import { DiError } from "#/errors";
import type { Token } from "#/token";

export type InjectOptions = ResolveHint;

function normalizeTag(tag: ResolveHint["tag"] | undefined): InjectionDescriptor["tag"] | undefined {
  if (tag === undefined) {
    return undefined;
  }
  if (!Array.isArray(tag) || tag.length !== 2) {
    throw new DiError(
      `@inject tag must be a tuple [tagKey, value] with length 2; received ${String(tag)}`,
    );
  }
  const [tagName, value] = tag;
  if (typeof tagName !== "string" && typeof tagName !== "symbol") {
    throw new DiError(`@inject tag key must be a string or symbol; received ${typeof tagName}`);
  }
  return [tagName, value];
}

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

function isAccessorDecoratorContext(value: unknown): value is ClassAccessorDecoratorContext {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    (value as { kind: unknown }).kind === "accessor"
  );
}

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

export function optional<Value>(
  token: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value> {
  return toDescriptor(token, true, options);
}

export function isInjectionDescriptor(value: unknown): value is InjectionDescriptor {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return "token" in value && "optional" in value;
}
