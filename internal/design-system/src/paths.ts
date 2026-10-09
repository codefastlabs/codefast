import { fileURLToPath } from "node:url";

/** Resolves a path inside this package. */
export function packagePath(relative: string): string {
  return fileURLToPath(new URL(`../${relative}`, import.meta.url));
}

/** Resolves a path from the monorepo root. */
export function repoPath(relative: string): string {
  return fileURLToPath(new URL(`../../../${relative}`, import.meta.url));
}

/** Resolves a dependency's file through Node's resolver, honouring its `exports`. */
export function modulePath(specifier: string): string {
  return fileURLToPath(import.meta.resolve(specifier));
}

/** The folder the artifact's own files are written to, laid out exactly as the artifact serves them. */
export const OUTPUT_ROOT = packagePath("dist");

/** Scratch space for generated bundle entries, kept beside the output so `dist` holds everything a run makes. */
export const WORK_ROOT = packagePath("dist/.work");

/** The `@codefast/ui` workspace package. */
export const UI_ROOT = repoPath("packages/ui");

/** The codefastlabs.com component registry: one folder per component with `meta.ts`, `doc.ts` and `demo.tsx`. */
export const REGISTRY_ROOT = repoPath("apps/web/src/registry");
