import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

interface RailCurveProps extends ComponentProps<"svg"> {
  readonly direction: "in" | "out";
  readonly isActive: boolean;
}

/**
 * An S-curve that bridges the top-level rail (x≈0.5) and a nested rail (x≈12.5,
 * one `ms-3` deeper), so the guide line flows smoothly into a nested run and back
 * out. Rails are the 1px `border-s` on each link, and the curve stroke matches.
 */
export function RailCurve({ direction, isActive, className, ...props }: RailCurveProps) {
  const d = direction === "in" ? "M0.5 0 C0.5 7 12.5 5 12.5 12" : "M12.5 0 C12.5 7 0.5 5 0.5 12";

  return (
    <svg
      aria-hidden
      width="14"
      height="12"
      viewBox="0 0 14 12"
      fill="none"
      className={cn(
        "block transition-colors duration-200",
        isActive ? "text-ui-brand" : "text-ui-border/60",
        className,
      )}
      {...props}
    >
      <path d={d} stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
