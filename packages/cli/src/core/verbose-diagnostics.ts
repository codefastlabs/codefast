import process from "node:process";

/**
 * Reports whether the `CODEFAST_VERBOSE` environment variable enables verbose diagnostics.
 *
 * @since 0.3.16-canary.0
 */
export function isVerboseCliDiagnostics(): boolean {
  const raw = process.env.CODEFAST_VERBOSE;
  return raw === "1" || raw === "true";
}
