import path from "node:path";

export function normalizePath(pathString: string): string {
  return pathString.split(path.sep).join("/").replace(/\\/g, "/");
}
