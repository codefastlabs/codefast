/**
 * The `head()` of a `/docs/*` page, built from its loader data so title, description, canonical URL,
 * and structured data all describe the same document.
 */
import { DOC_KIND_BY_SLUG, docPath } from "#/features/package-docs/lib/doc-kinds";
import type { DocPage } from "#/features/package-docs/lib/rendered-doc";
import { absoluteUrl, canonicalHead, jsonLdScript } from "#/lib/seo";

interface DocPageHead {
  readonly meta: Array<
    { title: string } | { name: string; content: string } | { property: "og:url" | "og:image"; content: string }
  >;
  readonly links: Array<{ rel: "canonical"; href: string }>;
  readonly scripts: Array<ReturnType<typeof jsonLdScript>>;
}

interface BreadcrumbItem {
  readonly "@type": "ListItem";
  readonly position: number;
  readonly name: string;
  readonly item: string;
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

/** Home › Packages › the package › its kind › the page, each crumb dropped when the document is the level above it. */
function breadcrumbItems(page: DocPage, packageName: string, kindLabel: string): Array<BreadcrumbItem> {
  const { pkg, doc, page: subPage, title } = page.doc;
  const crumbs: Array<[name: string, path: string]> = [
    ["Home", "/"],
    ["Packages", "/docs"],
    [packageName, docPath(pkg, "readme")],
  ];

  if (doc !== "readme") {
    crumbs.push([subPage === undefined ? title : kindLabel, docPath(pkg, doc)]);
  }

  if (subPage !== undefined) {
    crumbs.push([title, docPath(pkg, doc, subPage)]);
  }

  return crumbs.map(([name, path], index) => ({
    "@type": "ListItem",
    position: index + 1,
    name,
    item: absoluteUrl(path),
  }));
}

export function docPageHead(page: DocPage | undefined): DocPageHead {
  if (!page) {
    return { meta: [{ title: "Documentation — Codefast Labs" }], links: [], scripts: [] };
  }

  const pkg = page.packages.find((candidate) => candidate.slug === page.doc.pkg);
  const name = pkg?.name ?? `@codefast/${page.doc.pkg}`;
  const path = docPath(page.doc.pkg, page.doc.doc, page.doc.page);
  const seo = canonicalHead(path);
  const kindLabel = DOC_KIND_BY_SLUG.get(page.doc.doc)?.label ?? page.doc.doc;
  const title = pageTitle(page.doc.title, name, kindLabel);
  const description = pkg?.description ?? `${page.doc.title} for ${name}.`;
  // Rendered by `scripts/generate-og-image.ts`; the root's site-wide image is the fallback for a package without one.
  const image = absoluteUrl(`/og/${page.doc.pkg}.png`);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:image", content: image },
      { name: "twitter:image", content: image },
      ...seo.meta,
    ],
    links: seo.links,
    scripts: [
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: title,
        name: page.doc.title,
        description,
        url: absoluteUrl(path),
        image,
      }),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems(page, name, kindLabel),
      }),
    ],
  };
}
