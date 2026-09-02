import { cn } from "@codefast/ui/lib/utils";
import { useLocation } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { OnThisPage } from "#/features/components-catalog/components/detail/on-this-page";
import { useHashScroll } from "#/features/components-catalog/hooks/use-hash-scroll";
import { DocHeader } from "#/features/package-docs/components/doc-header";
import { DocsSidebar } from "#/features/package-docs/components/docs-sidebar";
import { MarkdownBody } from "#/features/package-docs/components/markdown-body";
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
          {pkg ? <DocHeader pkg={pkg} doc={page.doc} /> : null}
          <MarkdownBody html={page.doc.html} />
        </div>

        <OnThisPage
          items={page.doc.toc}
          className="hidden xl:block [&>ul]:max-h-[calc(100vh-var(--spacing-toc)-2rem)] [&>ul]:overflow-y-auto"
        />
      </div>
    </main>
  );
}
