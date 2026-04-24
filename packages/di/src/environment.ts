export function isProductionEnvironment(): boolean {
  const processRef = globalThis.process;
  if (processRef === undefined || processRef === null) {
    return false;
  }
  return processRef.env.NODE_ENV === "production";
}
export function isDevelopmentOrTestEnvironment(): boolean {
  return !isProductionEnvironment();
}
