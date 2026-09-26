/**
 * The structural view every module that walks `oxc-parser`'s ESTree output reads nodes through.
 */

/**
 * An oxc ESTree node: a `type` discriminant, UTF-16 `start`/`end` offsets, and fields read by name.
 *
 * @remarks Structural on purpose: the walkers match node shapes by `type` and read the few fields
 * they need, so the parser's full node union never has to be spelled out.
 *
 * @since 0.13.0
 */
export interface OxcNode {
  readonly type: string;
  readonly start: number;
  readonly end: number;
  readonly [key: string]: unknown;
}

/**
 * Returns whether a value is an ESTree node rather than a scalar, a list or a location record.
 *
 * @since 0.13.0
 */
export function isOxcNode(value: unknown): value is OxcNode {
  return typeof value === "object" && value !== null && "type" in value && typeof value.type === "string";
}

/**
 * Returns a parsed program's top-level statements.
 *
 * @remarks Takes `parseSync(...).program` as it comes, so no caller asserts the parser's type onto
 * the structural view.
 *
 * @since 0.13.0
 */
export function programStatements(program: unknown): ReadonlyArray<OxcNode> {
  if (!isOxcNode(program) || !Array.isArray(program.body)) {
    return [];
  }
  return program.body.filter(isOxcNode);
}
