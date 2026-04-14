import type { Dirent } from "node:fs";

/**
 * Narrow `fs.promises.readdir` overload result to `Dirent[]` when `withFileTypes: true`.
 * Accepts both historical checks (`isFile` / `isDirectory`) in one guard.
 * Returning `true` for an empty array is intentional: callers treat empty lists
 * the same regardless of the element type, so `[]` is safely accepted as `Dirent[]`.
 */
export function isDirentList(x: string[] | Dirent[]): x is Dirent[] {
  if (x.length === 0) return true;
  const first = x[0] as Dirent | string;
  return typeof first === "object" && first !== null && "isFile" in first && "isDirectory" in first;
}
