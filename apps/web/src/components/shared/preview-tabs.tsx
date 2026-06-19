import { cn } from "@codefast/ui/lib/utils";
import { ChevronDownIcon, CodeIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useId, useState } from "react";

import { CopyButton } from "#/components/shared/copy-button";

/** Collapsed code peek — roughly four lines of `text-xs` Shiki output. */
const CODE_PEEK_MAX_HEIGHT = "max-h-28";

interface PreviewTabsProps extends ComponentProps<"div"> {
  readonly preview: ReactNode;
  readonly code: ReactNode;
  /** Raw source for the Copy button; omit to hide it. */
  readonly copyText?: string;
  /** When true, the code panel starts fully expanded. */
  readonly defaultCodeExpanded?: boolean;
  readonly previewClassName?: string;
  readonly codeClassName?: string;
}

/**
 * Detail example chrome: the live preview is always visible, with the source
 * peeking below behind an expand/collapse toggle. Used for every example on a
 * component detail page (`/components/$slug`), including the single fallback
 * example synthesised for components without rich docs yet.
 *
 * The gallery (`/components`) deliberately does NOT use this — its cards show
 * the live demo only, with no code surface.
 */
export function PreviewTabs({
  preview,
  code,
  copyText,
  defaultCodeExpanded = false,
  className,
  previewClassName,
  codeClassName,
  ...props
}: PreviewTabsProps) {
  const [codeExpanded, setCodeExpanded] = useState(defaultCodeExpanded);
  const codePanelId = useId();

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-ui-border/60", className)} {...props}>
      <div className={previewClassName}>{preview}</div>

      <div className="border-t border-ui-border/60 bg-ui-surface">
        <div className="flex items-center border-b border-ui-border/60 px-3 py-2">
          <button
            type="button"
            aria-expanded={codeExpanded}
            aria-controls={codePanelId}
            onClick={() => {
              setCodeExpanded((open) => !open);
            }}
            className="flex items-center gap-1.5 rounded-md text-xs font-medium text-ui-muted transition-colors duration-200 hover:text-ui-fg"
          >
            <CodeIcon className="size-3.5" aria-hidden />
            {codeExpanded ? "Hide code" : "Show code"}
            <ChevronDownIcon
              aria-hidden
              className={cn("size-3.5 transition-transform duration-200", codeExpanded && "rotate-180")}
            />
          </button>
        </div>

        {/*
         * Non-scrolling positioned wrapper: the inner div scrolls, so an
         * absolute Copy button anchored here stays pinned to the top-right of
         * the visible panel instead of scrolling away with the source.
         */}
        <div className="relative">
          {copyText ? <CopyButton value={copyText} className="absolute inset-e-3 top-3 z-10" /> : null}
          <div
            id={codePanelId}
            className={cn(
              !codeExpanded && cn(CODE_PEEK_MAX_HEIGHT, "overflow-hidden"),
              codeExpanded && "max-h-[min(70vh,40rem)] overflow-y-auto",
              codeClassName,
            )}
          >
            {code}
          </div>
          {!codeExpanded ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-ui-surface via-ui-surface/80 to-transparent"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
