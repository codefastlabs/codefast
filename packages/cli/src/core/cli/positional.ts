/**
 * Coerce a raw Commander positional argument to a string, or undefined when absent.
 *
 * @since 0.3.16-canary.0
 */
export function readOptionalPositionalArg(candidate: unknown): string | undefined {
  return typeof candidate === "string" ? candidate : undefined;
}
