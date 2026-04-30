/**
 * When true, CLI error handling may include full stack traces (e.g. in {@link consumeCliAppError}).
 */
export function isVerboseCliDiagnostics(): boolean {
  const raw = process.env.CODEFAST_VERBOSE;
  return raw === "1" || raw === "true";
}
