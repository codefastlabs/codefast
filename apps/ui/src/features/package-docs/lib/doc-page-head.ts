/**
 * The `head()` of a `/docs/*` page, built from its loader data so title, description, canonical URL,
 * and structured data all describe the same document.
 */
import { DOC_KIND_BY_SLUG, docPath } from "#/features/package-docs/lib/doc-kinds";
import type { DocPageData } from "#/features/package-docs/lib/rendered-doc";
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

/** Home › Packages › the package › its kind › the page, stopping at the level the document sits on. */
function breadcrumbItems(data: DocPageData, packageName: string, kindLabel: string): Array<BreadcrumbItem> {
  const { pkg, kind, page, title } = data.doc;
  const crumbs: Array<[name: string, path: string]> = [
    ["Home", "/"],
    ["Packages", "/docs"],
    [packageName, docPath(pkg, "readme")],
  ];

  if (kind !== "readme") {
    crumbs.push([page === undefined ? title : kindLabel, docPath(pkg, kind)]);
  }

  if (page !== undefined) {
    crumbs.push([title, docPath(pkg, kind, page)]);
  }

  return crumbs.map(([name, path], index) => ({
    "@type": "ListItem",
    position: index + 1,
    name,
    item: absoluteUrl(path),
  }));
}

export function docPageHead(data: DocPageData | undefined): DocPageHead {
  if (!data) {
    return { meta: [{ title: "Documentation — Codefast Labs" }], links: [], scripts: [] };
  }

  const { doc } = data;
  const pkg = data.packages.find((candidate) => candidate.slug === doc.pkg);
  const name = pkg?.name ?? `@codefast/${doc.pkg}`;
  const path = docPath(doc.pkg, doc.kind, doc.page);
  const seo = canonicalHead(path);
  const kindLabel = DOC_KIND_BY_SLUG.get(doc.kind)?.label ?? doc.kind;
  const title = pageTitle(doc.title, name, kindLabel);
  const description = pkg?.description ?? `${doc.title} for ${name}.`;
  // Rendered by `scripts/generate-og-image.ts`; the root's site-wide image is the fallback for a package without one.
  const image = absoluteUrl(`/og/${doc.pkg}.png`);

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
        name: doc.title,
        description,
        url: absoluteUrl(path),
        image,
      }),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems(data, name, kindLabel),
      }),
    ],
  };
}
