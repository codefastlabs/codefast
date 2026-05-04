import process from "node:process";

export function isVerboseCliDiagnostics(): boolean {
  const raw = process.env.CODEFAST_VERBOSE;
  return raw === "1" || raw === "true";
}
