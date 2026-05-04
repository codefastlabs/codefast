import process from "node:process";

/**
 * @since 0.3.16-canary.0
 */
export function isVerboseCliDiagnostics(): boolean {
  const raw = process.env.CODEFAST_VERBOSE;
  return raw === "1" || raw === "true";
}
