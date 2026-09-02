/**
 * The `head()` of a `/docs/*` page, built from its loader data so title, description, canonical URL,
 * and structured data all describe the same document.
 */
import { DOC_KIND_BY_SLUG, docPath } from "#/features/package-docs/lib/doc-kinds";
import type { DocPage } from "#/features/package-docs/lib/rendered-doc";
import { SITE_OG_IMAGE, absoluteUrl, canonicalHead, jsonLdScript } from "#/lib/seo";

interface DocPageHead {
  readonly meta: Array<{ title: string } | { name: string; content: string } | { property: "og:url"; content: string }>;
  readonly links: Array<{ rel: "canonical"; href: string }>;
  readonly scripts: Array<ReturnType<typeof jsonLdScript>>;
}

/**
 * The `<title>` of a doc page. A document already named after its package keeps that name once —
 * `@codefast/di` becomes `@codefast/di — Overview`, `@codefast/tracking — Spec` stays as written — and
 * any other heading gets the package name appended.
 */
export function pageTitle(docTitle: string, packageName: string, kindLabel: string): string {
  if (docTitle === packageName) {
    return `${packageName} — ${kindLabel}`;
  }

  return docTitle.includes(packageName) ? docTitle : `${docTitle} — ${packageName}`;
}

export function docPageHead(page: DocPage | undefined): DocPageHead {
  if (!page) {
    return { meta: [{ title: "Documentation — Codefast Labs" }], links: [], scripts: [] };
  }

  const pkg = page.packages.find((candidate) => candidate.slug === page.doc.pkg);
  const name = pkg?.name ?? `@codefast/${page.doc.pkg}`;
  const path = docPath(page.doc.pkg, page.doc.doc);
  const seo = canonicalHead(path);
  const title = pageTitle(page.doc.title, name, DOC_KIND_BY_SLUG.get(page.doc.doc)?.label ?? page.doc.doc);
  const description = pkg?.description ?? `${page.doc.title} for ${name}.`;

  return {
    meta: [{ title }, { name: "description", content: description }, ...seo.meta],
    links: seo.links,
    scripts: [
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: title,
        name: page.doc.title,
        description,
        url: absoluteUrl(path),
        image: SITE_OG_IMAGE,
      }),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Packages", item: absoluteUrl("/docs") },
          { "@type": "ListItem", position: 3, name, item: absoluteUrl(docPath(page.doc.pkg, "readme")) },
          ...(page.doc.doc === "readme"
            ? []
            : [{ "@type": "ListItem", position: 4, name: page.doc.title, item: absoluteUrl(path) }]),
        ],
      }),
    ],
  };
}
