import { fileURLToPath } from "node:url";

/**
 * Resolves a path inside this package.
 *
 * @since 0.1.0
 */
export function packagePath(relative: string): string {
  return fileURLToPath(new URL(`../${relative}`, import.meta.url));
}

/**
 * Resolves a path from the monorepo root.
 *
 * @since 0.1.0
 */
export function repoPath(relative: string): string {
  return fileURLToPath(new URL(`../../../${relative}`, import.meta.url));
}

/**
 * Resolves a dependency's file through Node's resolver, honouring its `exports`.
 *
 * @since 0.1.0
 */
export function modulePath(specifier: string): string {
  return fileURLToPath(import.meta.resolve(specifier));
}

/**
 * The folder the artifact's own files are written to, laid out exactly as the artifact serves them.
 *
 * @since 0.1.0
 */
export const OUTPUT_ROOT = packagePath("dist");

/**
 * Scratch space for generated bundle entries, kept beside the output so `dist` holds everything a run makes.
 *
 * @since 0.1.0
 */
export const WORK_ROOT = packagePath("dist/.work");

/**
 * The `@codefast/ui` workspace package.
 *
 * @since 0.1.0
 */
export const UI_ROOT = repoPath("packages/ui");

/**
 * The codefastlabs.com component registry: one folder per component with `meta.ts`, `doc.ts` and `demo.tsx`.
 *
 * @since 0.1.0
 */
export const REGISTRY_ROOT = repoPath("apps/web/src/registry");
