/**
 * Node-style production gate using `process.env.NODE_ENV`.
 * When `process` is unavailable, this returns false (not treated as production).
 */
export function isProductionEnvironment(): boolean {
  const processRef = globalThis.process;
  if (processRef === undefined || processRef === null) {
    return false;
  }
  return processRef.env.NODE_ENV === "production";
}
