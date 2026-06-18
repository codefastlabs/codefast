import { cn } from "@codefast/ui/lib/utils";
import { ChevronDownIcon, CodeIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";

type PreviewTab = "preview" | "code";

/** Collapsed code peek — roughly four lines of `text-xs` Shiki output. */
const CODE_PEEK_MAX_HEIGHT = "max-h-28";

interface PreviewTabsProps {
  readonly preview: ReactNode;
  readonly code: ReactNode;
  /**
   * `card` — gallery `/components`: Preview / Code tabs (code loads on first open).
   * `stacked` — detail `/components/$slug`: preview always visible + collapsible code peek.
   */
  readonly variant?: "card" | "stacked";
  /** Shown on the right of the tab bar in card variant (e.g. import path). */
  readonly trailing?: ReactNode;
  /** Stacked variant only — when true, the code panel starts fully expanded. */
  readonly defaultCodeExpanded?: boolean;
  readonly className?: string;
  readonly previewClassName?: string;
  readonly codeClassName?: string;
}

/**
 * Preview + code chrome shared by the gallery and component detail pages.
 * Gallery cards switch tabs; detail examples show both with a collapsible code peek.
 */
export function PreviewTabs({
  preview,
  code,
  variant = "stacked",
  trailing,
  defaultCodeExpanded = false,
  className,
  previewClassName,
  codeClassName,
}: PreviewTabsProps) {
  if (variant === "card") {
    return (
      <PreviewTabsCard
        preview={preview}
        code={code}
        trailing={trailing}
        className={className}
        previewClassName={previewClassName}
        codeClassName={codeClassName}
      />
    );
  }

  return (
    <PreviewTabsStacked
      preview={preview}
      code={code}
      defaultCodeExpanded={defaultCodeExpanded}
      className={className}
      previewClassName={previewClassName}
      codeClassName={codeClassName}
    />
  );
}

interface PreviewTabsCardProps {
  readonly preview: ReactNode;
  readonly code: ReactNode;
  readonly trailing?: ReactNode | undefined;
  readonly className?: string | undefined;
  readonly previewClassName?: string | undefined;
  readonly codeClassName?: string | undefined;
}

/** A single tab in the card's Preview / Code segmented control. */
function PreviewTabButton({
  selected,
  controls,
  onSelect,
  onMouseEnter,
  children,
}: {
  readonly selected: boolean;
  readonly controls: string;
  readonly onSelect: () => void;
  readonly onMouseEnter?: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={controls}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      className={cn(
        // `-mb-px` overlaps the bar's hairline so the active 2px underline sits flush on it.
        "-mb-px border-b-2 px-3 py-2.5 text-xs font-medium capitalize transition-colors duration-200",
        selected ? "border-ui-fg text-ui-fg" : "border-transparent text-ui-muted hover:text-ui-fg",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Gallery card: Preview / Code segmented control.
 * Both panels stay mounted once shown (code mounts on first open), toggled with
 * `hidden` — so switching tabs never remounts the live demo or refetches the source.
 */
function PreviewTabsCard({
  preview,
  code,
  trailing,
  className,
  previewClassName,
  codeClassName,
}: PreviewTabsCardProps) {
  const [tab, setTab] = useState<PreviewTab>("preview");
  const [codeMounted, setCodeMounted] = useState(false);
  const previewPanelId = useId();
  const codePanelId = useId();

  const mountCode = (): void => {
    setCodeMounted(true);
  };

  const selectTab = (next: PreviewTab): void => {
    setTab(next);
    if (next === "code") {
      mountCode();
    }
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex min-w-0 shrink-0 items-stretch justify-between gap-2 border-b border-ui-border/60 px-3">
        <div role="tablist" aria-label="Preview and code" className="flex shrink-0 gap-1">
          <PreviewTabButton
            selected={tab === "preview"}
            controls={previewPanelId}
            onSelect={() => {
              selectTab("preview");
            }}
          >
            Preview
          </PreviewTabButton>
          <PreviewTabButton
            selected={tab === "code"}
            controls={codePanelId}
            onMouseEnter={mountCode}
            onSelect={() => {
              selectTab("code");
            }}
          >
            Code
          </PreviewTabButton>
        </div>
        {trailing}
      </div>

      <div
        id={previewPanelId}
        role="tabpanel"
        aria-label="Preview"
        hidden={tab !== "preview"}
        className={cn("min-h-0 flex-1 flex-col", tab === "preview" ? "flex" : "hidden", previewClassName)}
      >
        {preview}
      </div>
      <div
        id={codePanelId}
        role="tabpanel"
        aria-label="Code"
        hidden={tab !== "code"}
        className={cn(
          "max-h-[min(70vh,28rem)] min-h-0 flex-1 flex-col overflow-y-auto bg-ui-surface",
          tab === "code" ? "flex" : "hidden",
          codeClassName,
        )}
      >
        {codeMounted ? code : null}
      </div>
    </div>
  );
}

interface PreviewTabsStackedProps {
  readonly preview: ReactNode;
  readonly code: ReactNode;
  readonly defaultCodeExpanded?: boolean | undefined;
  readonly className?: string | undefined;
  readonly previewClassName?: string | undefined;
  readonly codeClassName?: string | undefined;
}

/** Detail example: preview always visible; code peeks below with expand/collapse. */
function PreviewTabsStacked({
  preview,
  code,
  defaultCodeExpanded = false,
  className,
  previewClassName,
  codeClassName,
}: PreviewTabsStackedProps) {
  const [codeExpanded, setCodeExpanded] = useState(defaultCodeExpanded);
  const codePanelId = useId();

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-ui-border/60", className)}>
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

        <div
          id={codePanelId}
          className={cn(
            "relative",
            !codeExpanded && cn(CODE_PEEK_MAX_HEIGHT, "overflow-hidden"),
            codeExpanded && "max-h-[min(70vh,40rem)] overflow-y-auto",
            codeClassName,
          )}
        >
          {code}
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
