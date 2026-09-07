import type { Constructor } from "#/core/constructor-type";

declare const TOKEN_BRAND: unique symbol;
declare const TOKEN_NAMES_BRAND: unique symbol;

/**
 * A branded identifier carrying the value type its bindings resolve to, and the slot names they may declare.
 *
 * @remarks `Names` exists at the type level only: `whenNamed`, and `name` in `ResolveOptions` and
 * `InjectOptions`, narrow to it, so a bind site and a request site cannot drift apart silently. It
 * is covariant, so a token declaring names is still a `Token<unknown>` wherever the engine erases
 * the value type; the default `string` leaves a token that declares none unconstrained.
 *
 * @example
 * ```ts
 * const Logger = token<Logger, "console" | "file">("Logger");
 * container.bind(Logger).to(FileLogger).whenNamed("file");
 * container.resolve(Logger, { name: "file" });
 * ```
 *
 * @since 0.3.16-canary.0
 */
export interface Token<out Value, out Names extends string = string> {
  readonly name: string;
  readonly [TOKEN_BRAND]: Value;
  readonly [TOKEN_NAMES_BRAND]?: Names;
}

/**
 * The slot names a dependency key declares — `string` for a class, or a token that declares none.
 */
export type SlotNamesOf<Key> = Key extends Token<unknown, infer Names extends string> ? Names : string;

/**
 * Creates a named `Token` for the given value type, optionally declaring the slot names its bindings may use.
 *
 * @since 0.3.16-canary.0
 */
export function token<Value, Names extends string = string>(name: string): Token<Value, Names> {
  return { name } as Token<Value, Names>;
}

/**
 * Returns the display name of a token or class used as a dependency key.
 *
 * @since 0.3.16-canary.0
 */
export function tokenName(dependency: Token<unknown> | Constructor): string {
  return dependency.name;
}
