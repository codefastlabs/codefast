import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";

import { CopyButton } from "#/components/shared/copy-button";
import { SectionHeader } from "#/components/shared/section-header";

interface InstallCtaProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** The install command shown and copied. */
  readonly command: string;
  readonly titleId: string;
  readonly title: ReactNode;
  readonly description: string;
  /** Identifier for the copy, for analytics — never the command text. */
  readonly analyticsName: string;
  /** The primary action, a `Link` or anchor the button wraps. */
  readonly docsAction: ReactNode;
}

/** The closing call to action: one install command with a copy button, the docs, and the repository. */
export function InstallCta({
  command,
  titleId,
  title,
  description,
  analyticsName,
  docsAction,
  className,
  ...props
}: InstallCtaProps) {
  return (
    <section
      aria-labelledby={titleId}
      className={cn("border-t border-ui-border/60 bg-ui-surface py-24 sm:py-32", className)}
      {...props}
    >
      <div className="container mx-auto px-4">
        <div className="reveal-up mx-auto max-w-2xl text-center">
          <SectionHeader
            eyebrow="Get started"
            titleId={titleId}
            title={title}
            description={description}
            className="mx-auto mb-10 text-center"
          />

          <div className="mb-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl border border-ui-border/60 bg-ui-card px-4 py-3 font-mono text-sm text-ui-fg transition-[border-color,box-shadow] duration-200 hover:border-ui-brand/40 hover:shadow-lg hover:shadow-ui-brand/5 sm:max-w-md">
              <code className="truncate">
                <span className="me-2 text-ui-muted select-none">$</span>
                {command}
              </code>
              <CopyButton
                value={command}
                aria-label="Copy install command"
                analyticsKind="install-command"
                analyticsName={analyticsName}
                className="shrink-0"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              {docsAction}
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="https://github.com/codefastlabs/codefast" target="_blank" rel="noreferrer">
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
