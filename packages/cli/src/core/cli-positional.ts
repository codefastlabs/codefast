/** Coerce a raw Commander positional argument to a string, or undefined when absent. */
export function readOptionalPositionalArg(candidate: unknown): string | undefined {
  return typeof candidate === "string" ? candidate : undefined;
}
