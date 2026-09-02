import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import { ExternalLinkIcon, FileTextIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { DOC_KIND_BY_SLUG, docPath } from "#/features/package-docs/lib/doc-kinds";
import type { PackageSummary, RenderedDoc } from "#/features/package-docs/lib/rendered-doc";
import { packageNpmUrl, repoBlobUrl } from "#/features/package-docs/lib/site";

interface DocHeaderProps extends Omit<ComponentProps<"header">, "children"> {
  readonly pkg: PackageSummary;
  readonly doc: RenderedDoc;
}

/** Package name, version, and document title, with the source, npm, and Markdown-twin links. */
export function DocHeader({ pkg, doc, className, ...props }: DocHeaderProps) {
  const kind = DOC_KIND_BY_SLUG.get(doc.doc);
  const sourceUrl = repoBlobUrl(`packages/${pkg.slug}/${kind?.file ?? "README.md"}`);

  return (
    <header className={cn("mb-10 border-b border-ui-border/60 pb-8", className)} {...props}>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-ui-muted">
        {doc.title === pkg.name ? null : <span className="font-medium text-ui-fg">{pkg.name}</span>}
        <Badge variant="outline" className="border-ui-border/60 font-mono text-xs text-ui-muted">
          v{pkg.version}
        </Badge>
        {kind ? <span>· {kind.label}</span> : null}
      </div>
      <h1 className="mb-4 text-3xl leading-tight font-bold tracking-tight text-ui-fg sm:text-4xl">{doc.title}</h1>
      {doc.doc === "readme" && pkg.description ? (
        <p className="max-w-2xl text-base leading-relaxed text-ui-muted">{pkg.description}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            <ExternalLinkIcon className="size-3.5" />
            Source on GitHub
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={packageNpmUrl(pkg.name)} target="_blank" rel="noreferrer">
            <ExternalLinkIcon className="size-3.5" />
            npm
          </a>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <a href={`${docPath(pkg.slug, doc.doc)}.md`}>
            <FileTextIcon className="size-3.5" />
            View as Markdown
          </a>
        </Button>
      </div>
    </header>
  );
}
