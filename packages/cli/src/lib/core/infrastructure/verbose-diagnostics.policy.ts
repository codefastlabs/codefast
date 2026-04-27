/**
 * When true, infrastructure failures may log full stack traces (e.g. in {@link consumeCliAppError}).
 */
export function isVerboseInfraDiagnostics(): boolean {
  const raw = process.env.CODEFAST_VERBOSE;
  return raw === "1" || raw === "true";
}
