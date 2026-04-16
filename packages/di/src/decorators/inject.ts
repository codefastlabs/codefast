import type { Constructor, ResolveHint } from "#lib/binding";
import type { InjectionDescriptor } from "#lib/decorators/metadata";
import type { Token } from "#lib/token";

export type InjectOptions = ResolveHint;

function normalizeTag(tag: ResolveHint["tag"] | undefined): InjectionDescriptor["tag"] | undefined {
  if (tag === undefined) {
    return undefined;
  }
  const [tagName, value] = tag;
  return typeof tagName === "string" ? [tagName, value] : undefined;
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

export function inject<Value>(
  token: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value> {
  return toDescriptor(token, false, options);
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
