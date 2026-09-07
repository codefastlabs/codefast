import type { Appearance } from "@codefast/theme";
import { useAppearance } from "@codefast/theme";
import { cn } from "@codefast/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import { MonitorIcon, MoonStarIcon, SunIcon } from "lucide-react";
import type { ComponentProps } from "react";

interface AppearanceOption {
  readonly value: Appearance;
  readonly label: string;
  readonly Icon: LucideIcon;
  /** Active styles keyed off `html[data-appearance]` so the first frame is correct without a hydration flash. */
  readonly activeClassName: string;
}

const OPTIONS: ReadonlyArray<AppearanceOption> = [
  {
    value: "light",
    label: "Light",
    Icon: SunIcon,
    activeClassName: "[html[data-appearance=light]_&]:bg-ui-card [html[data-appearance=light]_&]:text-ui-fg",
  },
  {
    value: "dark",
    label: "Dark",
    Icon: MoonStarIcon,
    activeClassName: "[html[data-appearance=dark]_&]:bg-ui-card [html[data-appearance=dark]_&]:text-ui-fg",
  },
  {
    value: "automatic",
    label: "System",
    Icon: MonitorIcon,
    activeClassName: "[html[data-appearance=automatic]_&]:bg-ui-card [html[data-appearance=automatic]_&]:text-ui-fg",
  },
];

/**
 * Labeled appearance picker for roomy surfaces (the mobile menu) — the three
 * options laid out and selectable directly, versus the compact icon cycle in the header.
 */
export function AppearanceSelector({ className, ...props }: ComponentProps<"div">) {
  const { isPending, setAppearance } = useAppearance();

  return (
    <div
      className={cn("grid grid-cols-3 gap-1 rounded-lg border border-ui-border/60 bg-ui-surface p-1", className)}
      {...props}
    >
      {OPTIONS.map(({ value, label, Icon, activeClassName }) => (
        <button
          key={value}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-md px-1 py-2 text-xs font-medium whitespace-nowrap text-ui-muted transition-colors hover:text-ui-fg disabled:pointer-events-none disabled:opacity-50",
            activeClassName,
          )}
          disabled={isPending}
          type="button"
          onClick={() => {
            void setAppearance(value);
          }}
        >
          <Icon className="size-4 shrink-0" strokeWidth={1.75} />
          {label}
        </button>
      ))}
    </div>
  );
}
