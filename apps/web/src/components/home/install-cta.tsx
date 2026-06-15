import { Button } from "@codefast/ui/button";
import { useCopyToClipboard } from "@codefast/ui/hooks/use-copy-to-clipboard";
import { Link } from "@tanstack/react-router";
import { CheckIcon, CopyIcon } from "lucide-react";

import { SectionHeader } from "#/components/shared/section-header";
import { INSTALL_COMMAND } from "#/lib/install";

export function InstallCta() {
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  return (
    <section aria-labelledby="home-install-title" className="border-t border-ui-border/60 bg-ui-surface py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <SectionHeader
            eyebrow="Get started"
            titleId="home-install-title"
            title="One command to start."
            description="Tokens, dark mode, and accessibility come pre-configured. Install the package and wire up the CSS — no config files required."
            className="mx-auto mb-10 text-center"
          />

          <div className="mb-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl border border-ui-border/60 bg-ui-card px-4 py-3 font-mono text-sm text-ui-fg sm:max-w-md">
              <code className="truncate">
                <span className="me-2 text-ui-muted select-none">$</span>
                {INSTALL_COMMAND}
              </code>
              <button
                type="button"
                onClick={() => void copyToClipboard(INSTALL_COMMAND)}
                aria-label={isCopied ? "Copied install command" : "Copy install command"}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-ui-border/60 px-2.5 py-1.5 text-xs font-medium text-ui-muted transition-colors duration-200 hover:bg-ui-surface hover:text-ui-fg"
              >
                {isCopied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
                {isCopied ? "Copied" : "Copy"}
              </button>
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
