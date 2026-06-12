import { cn } from "@codefast/ui/lib/utils";

import type { ViewMode } from "#/components/showcase/types";

const VIEW_OPTIONS = [
  { value: "category", label: "Category" },
  { value: "alphabetical", label: "A–Z" },
] as const;

/** Segmented control switching the grid between grouped and A–Z layouts. */
export function ViewToggle({
  value,
  onChange,
  className,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Layout"
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-ui-border bg-ui-surface p-0.5 text-xs font-semibold",
        className,
      )}
    >
      {VIEW_OPTIONS.map(({ value: option, label }) => {
        const isActive = value === option;

        return (
          <button
            key={option}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              onChange(option);
            }}
            className={cn(
              "flex-1 rounded-full px-3 py-1 whitespace-nowrap transition-colors",
              isActive ? "bg-ui-card text-ui-fg shadow-sm" : "text-ui-muted hover:text-ui-fg",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
