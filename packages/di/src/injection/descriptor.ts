/** The one shape every declared dependency is normalised to, whatever channel declared it. */
import type { Token } from "#/core/token";
import type { BindingTag, Constructor, TokenValue } from "#/core/types";

/**
 * @since 0.3.16-canary.0
 */
export interface InjectOptions {
  name?: string;
  /**
   * Single-tag shorthand, equivalent to listing the one pair in `tags` (SPEC §3.5).
   *
   * @remarks Folded into `tags` when the descriptor is built, so nothing downstream sees two
   * spellings of one request. Giving both is a request for every pair across the two.
   */
  tag?: BindingTag;
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
 * The value a factory receives for one declared dependency.
 *
 * @remarks `optional()` and `injectAll()` fold their effect into the descriptor's own type
 * parameter, so reading it back is enough; bare tokens fall through to {@link TokenValue}.
 *
 * @since 0.5.0-canary.7
 */
export type ResolvedDependencyValue<Dependency> =
  Dependency extends InjectionDescriptor<infer Value> ? Value : TokenValue<Dependency>;

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
  // Annotated because `PropertyDescriptor.value` is `any`, and an `any` reaching the cast below
  // would make it look checked when nothing checked it.
  const explicitTags: unknown = tagsDesc?.enumerable === true ? tagsDesc.value : undefined;

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

/**
 * The one tag list a request carries, with the single-tag shorthand folded in (SPEC §3.5).
 *
 * @remarks Folding here is what keeps `tag` from reaching `InjectionDescriptor` and everything
 * derived from it, so one request never has two spellings past this point.
 */
function requestedTagsOf(options: InjectOptions | undefined): ReadonlyArray<BindingTag> | undefined {
  const shorthand = options?.tag;
  const listed = options?.tags;
  if (shorthand === undefined) {
    return listed;
  }
  return listed === undefined || listed.length === 0 ? [shorthand] : [shorthand, ...listed];
}

function withOptions<DescValue>(
  base: Pick<InjectionDescriptor<DescValue>, "token" | "optional" | "multi">,
  options: InjectOptions | undefined,
): InjectionDescriptor<DescValue> {
  const tags = requestedTagsOf(options);
  if (options?.name !== undefined && tags !== undefined) {
    return { ...base, name: options.name, tags };
  }
  if (options?.name !== undefined) {
    return { ...base, name: options.name };
  }
  if (tags !== undefined) {
    return { ...base, tags };
  }
  return base;
}

/** The descriptor half of `inject()`, shared with the accessor decorator that wraps it. */
export function buildInjectionDescriptor<const Value>(
  token: Token<Value> | Constructor<Value>,
  options?: InjectOptions,
): InjectionDescriptor<Value> {
  return withOptions({ token, optional: false, multi: false }, options);
}

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
