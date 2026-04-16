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

/**
 * True when not in production: `development`, `test`, unset `NODE_ENV`, or any value other than `"production"`.
 * The container uses this to run one-time static scope validation after load/resolve so graph issues surface
 * during local work and CI tests (e.g. Vitest).
 */
export function isDevelopmentOrTestEnvironment(): boolean {
  return !isProductionEnvironment();
}
