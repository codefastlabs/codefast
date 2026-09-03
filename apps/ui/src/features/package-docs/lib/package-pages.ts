/**
 * The reading order of a package's documents — each kind's own page followed by the pages beneath
 * it — shared by the pager and anything else that walks the docs as one sequence.
 */
import type { DocRef } from "#/features/package-docs/lib/doc-kinds";
import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";

/** Every document of `pkg` as a flat sequence in sidebar order. */
export function packagePages(pkg: PackageSummary): ReadonlyArray<DocRef> {
  return pkg.docs.flatMap(({ doc, pages }): Array<DocRef> => [{ doc }, ...pages.map((page) => ({ doc, page }))]);
}

/** Whether two document addresses name the same page. */
export function isSameDoc(a: DocRef, b: DocRef): boolean {
  return a.doc === b.doc && a.page === b.page;
}
