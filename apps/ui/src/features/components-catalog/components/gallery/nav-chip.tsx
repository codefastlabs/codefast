import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

interface NavChipProps extends ComponentProps<"a"> {
  readonly isActive: boolean;
  readonly chipId: string;
}

/** A pill link used in the mobile jump nav, styled by active state. */
export function NavChip({ href, isActive, chipId, children, className, ...props }: NavChipProps) {
  return (
    <a
      data-chip-id={chipId}
      href={href}
      aria-current={isActive ? "location" : undefined}
      className={cn(
        "flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap no-underline transition-colors duration-200",
        isActive
          ? "border-ui-brand bg-ui-card text-ui-fg"
          : "border-ui-border/60 bg-ui-surface text-ui-muted hover:border-ui-brand hover:text-ui-fg",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}
