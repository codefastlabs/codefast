import { Button } from "@codefast/ui/button";
import { Link } from "@tanstack/react-router";

import { CopyButton } from "#/components/shared/copy-button";
import { SectionHeader } from "#/components/shared/section-header";
import { INSTALL_COMMAND } from "#/lib/install";

export function InstallCta() {
  return (
    <section aria-labelledby="home-install-title" className="border-t border-ui-border/60 bg-ui-surface py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="reveal-up mx-auto max-w-2xl text-center">
          <SectionHeader
            eyebrow="Get started"
            titleId="home-install-title"
            title="One command to start."
            description="Tokens, dark mode, and accessibility come pre-configured. Install the package and wire up the CSS — no config files required."
            className="mx-auto mb-10 text-center"
          />

          <div className="mb-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl border border-ui-border/60 bg-ui-card px-4 py-3 font-mono text-sm text-ui-fg transition-[border-color,box-shadow] duration-200 hover:border-ui-brand/40 hover:shadow-lg hover:shadow-ui-brand/5 sm:max-w-md">
              <code className="truncate">
                <span className="me-2 text-ui-muted select-none">$</span>
                {INSTALL_COMMAND}
              </code>
              <CopyButton
                value={INSTALL_COMMAND}
                aria-label="Copy install command"
                analyticsKind="install-command"
                analyticsName="home-hero"
                className="shrink-0"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/about">Read the docs</Link>
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
