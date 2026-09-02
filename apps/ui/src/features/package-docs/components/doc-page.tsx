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
import { DOC_KIND_BY_SLUG } from "#/features/package-docs/lib/doc-kinds";
import type { DocPage as DocPageData } from "#/features/package-docs/lib/rendered-doc";

interface DocPageProps extends Omit<ComponentProps<"main">, "children"> {
  /** The page data resolved by the `/docs/$pkg[/$doc]` route loader. */
  readonly page: DocPageData;
}

/** A package document: packages sidebar, the rendered markdown, and the "On this page" rail. */
export function DocPage({ page, className, ...props }: DocPageProps) {
  const hash = useLocation({ select: (location) => location.hash });

  useHashScroll(hash);

  const pkg = page.packages.find((candidate) => candidate.slug === page.doc.pkg);

  return (
    <main className={cn("container mx-auto px-4 py-10 pb-32", className)} {...props}>
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[220px_minmax(0,1fr)_200px]">
        <DocsSidebar packages={page.packages} activePkg={page.doc.pkg} activeDoc={page.doc.doc} />

        <div className="min-w-0">
          {pkg ? (
            <>
              <DocBreadcrumb
                pkg={pkg}
                current={page.doc.doc === "readme" ? undefined : DOC_KIND_BY_SLUG.get(page.doc.doc)?.label}
              />
              <DocTabs pkg={pkg} activeDoc={page.doc.doc} className="mb-8 lg:hidden" />
              <DocHeader pkg={pkg} doc={page.doc} />
            </>
          ) : null}
          {/* Below xl the rail is hidden, so the outline becomes a sticky jump strip like the component pages. */}
          <DetailMobileToc
            items={page.doc.toc}
            className="sticky top-header z-10 -mx-4 mb-6 border-b border-ui-border/60 xl:hidden"
          />
          <MarkdownBody html={page.doc.html} />
          {pkg ? <DocPager pkg={pkg} activeDoc={page.doc.doc} /> : null}
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-toc max-h-[calc(100vh-var(--spacing-toc)-1rem)] overflow-y-auto rounded-xl bg-ui-bg/75 p-3 backdrop-blur-lg backdrop-saturate-150">
            <OnThisPage items={page.doc.toc} />
          </div>
        </aside>
      </div>
    </main>
  );
}
