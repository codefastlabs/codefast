import type { ComponentProps } from "react";

import { cn } from "#/app/lib/utils";

/**
 * @since 0.3.16-canary.3
 */
export function KpiCard({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "border-bh-border bg-bh-surface-elevated shadow-bh-card hover:border-bh-border-strong hover:shadow-bh-card-hover rounded-2xl border px-[1.05rem] py-[0.85rem] backdrop-blur-lg backdrop-saturate-160 [transition:border-color_0.2s_ease,box-shadow_0.2s_ease] motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

/**
 * @since 0.3.16-canary.3
 */
export function KpiCardLabel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-bh-label mb-[0.4rem] text-[0.625rem] font-semibold tracking-[0.09em] uppercase",
        className,
      )}
      {...props}
    />
  );
}

/**
 * @since 0.3.16-canary.3
 */
export function KpiCardValue({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-[1.05rem] leading-[1.3] font-semibold tracking-[-0.028em] wrap-break-word tabular-nums",
        className,
      )}
      {...props}
    />
  );
}
