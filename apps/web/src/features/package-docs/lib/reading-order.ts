/**
 * The reading order of a package's documents — each kind's own page followed by the pages beneath it.
 */
import type { DocRef } from "#/features/package-docs/lib/doc-kinds";
import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";

/** Every document of `pkg` as one sequence in sidebar order, for the pager and the command palette. */
export function readingOrder(pkg: PackageSummary): ReadonlyArray<DocRef> {
  return pkg.docs.flatMap(({ kind, pages }): Array<DocRef> => [{ kind }, ...pages.map((page) => ({ kind, page }))]);
}

/** Whether two document addresses name the same page. */
export function isSameDoc(a: DocRef, b: DocRef): boolean {
  return a.kind === b.kind && a.page === b.page;
}
