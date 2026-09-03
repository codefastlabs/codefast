import { cn } from "@codefast/ui/lib/utils";
import { useLocation } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { DetailMobileToc } from "#/features/components-catalog/components/detail/detail-mobile-toc";
import { OnThisPage } from "#/features/components-catalog/components/detail/on-this-page";
import { useHashScroll } from "#/features/components-catalog/hooks/use-hash-scroll";
import { DocBreadcrumb } from "#/features/package-docs/components/doc-breadcrumb";
import { DocHeader } from "#/features/package-docs/components/doc-header";
import { DocPager } from "#/features/package-docs/components/doc-pager";
import { DocTabs } from "#/features/package-docs/components/doc-tabs";
import { DocsSidebar } from "#/features/package-docs/components/docs-sidebar";
import { MarkdownBody } from "#/features/package-docs/components/markdown-body";
import { DOC_KIND_BY_SLUG, docAnalyticsName } from "#/features/package-docs/lib/doc-kinds";
import type { DocPageData } from "#/features/package-docs/lib/rendered-doc";

interface DocPageProps extends Omit<ComponentProps<"main">, "children"> {
  /** The page data resolved by the `/docs/$pkg[/$doc[/$page]]` route loader. */
  readonly data: DocPageData;
}

/** A package document: packages sidebar, the rendered markdown, and the "On this page" rail. */
export function DocPage({ data, className, ...props }: DocPageProps) {
  const hash = useLocation({ select: (location) => location.hash });

  useHashScroll(hash);

  const { doc, packages } = data;
  const pkg = packages.find((candidate) => candidate.slug === doc.pkg);
  const kindLabel = DOC_KIND_BY_SLUG.get(doc.doc)?.label ?? doc.doc;

  return (
    <main className={cn("container mx-auto px-4 py-10 pb-32", className)} {...props}>
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[220px_minmax(0,1fr)_200px]">
        <DocsSidebar packages={packages} activePkg={doc.pkg} activeDoc={doc} />

        <div className="min-w-0">
          {pkg ? (
            <>
              <DocBreadcrumb
                pkg={pkg}
                trail={doc.page === undefined ? [] : [{ doc: doc.doc, label: kindLabel }]}
                current={doc.doc === "readme" ? undefined : (doc.page ?? kindLabel)}
              />
              <DocTabs pkg={pkg} activeDoc={doc} className="mb-8 lg:hidden" />
              <DocHeader pkg={pkg} doc={doc} />
            </>
          ) : null}
          {/* Below xl the rail is hidden, so the outline becomes a sticky jump strip like the component pages. */}
          <DetailMobileToc
            items={doc.toc}
            className="sticky top-header z-10 -mx-4 mb-6 border-b border-ui-border/60 xl:hidden"
          />
          <MarkdownBody html={doc.html} analyticsName={docAnalyticsName(doc.pkg, doc.doc, doc.page)} />
          {pkg ? <DocPager pkg={pkg} activeDoc={doc} /> : null}
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-toc max-h-[calc(100vh-var(--spacing-toc)-1rem)] overflow-y-auto rounded-xl bg-ui-bg/75 p-3 backdrop-blur-lg backdrop-saturate-150">
            <OnThisPage items={doc.toc} />
          </div>
        </aside>
      </div>
    </main>
  );
}
