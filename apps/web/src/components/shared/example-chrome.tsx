import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import { ChevronDownIcon, CodeIcon, MaximizeIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useId, useState } from "react";

import { CopyButton } from "#/components/shared/copy-button";

/** Collapsed code peek — roughly four lines of `text-xs` Shiki output. */
const CODE_PEEK_MAX_HEIGHT = "max-h-28";

interface ExampleChromeProps extends ComponentProps<"div"> {
  readonly preview: ReactNode;
  readonly code: ReactNode;
  /** Raw source for the Copy button; also drives the line count in the toolbar. */
  readonly copyText?: string;
  /** Identifier tracked as `copy_code`'s `name` when `copyText` is copied — never the code itself. */
  readonly analyticsName?: string | undefined;
  /** When true, the code panel starts fully expanded. */
  readonly defaultCodeExpanded?: boolean;
  readonly previewClassName?: string;
  readonly codeClassName?: string;
}

/**
 * Detail example chrome: live preview on top, source peeking below behind an
 * expand/collapse toggle (the collapsed peek is itself the expand button). The
 * gallery deliberately does NOT use this — its cards show the live demo only.
 */
export function ExampleChrome({
  preview,
  code,
  copyText,
  analyticsName,
  defaultCodeExpanded = false,
  className,
  previewClassName,
  codeClassName,
  ...props
}: ExampleChromeProps) {
  const [codeExpanded, setCodeExpanded] = useState(defaultCodeExpanded);
  const codePanelId = useId();

  const lineCount = copyText ? copyText.trimEnd().split("\n").length : 0;

  const toggleCode = () => {
    setCodeExpanded((open) => !open);
  };

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-ui-border/60", className)} {...props}>
      <div className={previewClassName}>{preview}</div>

      <div className="border-t border-ui-border/60 bg-ui-surface">
        <div className="flex items-center gap-2 border-b border-ui-border/60 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-ui-muted">
            <CodeIcon className="size-3.5" aria-hidden />
            {lineCount > 0 ? `${String(lineCount)} lines` : "Code"}
          </span>

          <div className="ms-auto flex items-center gap-1">
            {copyText ? (
              <CopyButton value={copyText} tone="overlay" analyticsKind="usage-example" analyticsName={analyticsName} />
            ) : null}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-expanded={codeExpanded}
              aria-controls={codePanelId}
              aria-label={codeExpanded ? "Collapse code" : "Expand code"}
              onClick={toggleCode}
              className="text-ui-muted hover:text-ui-fg"
            >
              <ChevronDownIcon
                aria-hidden
                className={cn(
                  "size-4 transition-transform duration-200 motion-reduce:transition-none",
                  codeExpanded && "rotate-180",
                )}
              />
            </Button>
          </div>
        </div>

        <div className="relative">
          <div
            id={codePanelId}
            className={cn(
              "transition-[max-height] duration-300 ease-out motion-reduce:transition-none",
              codeExpanded ? "max-h-[min(70vh,40rem)] overflow-y-auto" : cn(CODE_PEEK_MAX_HEIGHT, "overflow-hidden"),
              codeClassName,
            )}
          >
            {code}
          </div>

          {/*
           * Collapsed: the whole peek is a button. The faded overlay sits above
           * the source (which keeps showing through the transparent top), and a
           * centered pill advertises the affordance.
           */}
          {!codeExpanded ? (
            <button
              type="button"
              aria-expanded={false}
              aria-controls={codePanelId}
              aria-label="Expand code"
              onClick={toggleCode}
              className="group/peek absolute inset-0 flex cursor-pointer items-end justify-center focus-visible:outline-none"
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-linear-to-t from-ui-surface via-ui-surface/85 to-transparent"
              />
              <span className="relative mb-3 flex items-center gap-1.5 rounded-full border border-ui-border/60 bg-ui-card px-3 py-1 text-xs font-medium text-ui-fg shadow-sm transition-colors duration-200 group-hover/peek:bg-ui-surface group-focus-visible/peek:ring-2 group-focus-visible/peek:ring-ui-brand">
                <MaximizeIcon className="size-3" aria-hidden />
                Expand
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
